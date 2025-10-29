'use server';

import { prisma } from '@/lib/prisma';
import { ensureReferralCode } from '@/lib/growth/referrals';
import { Achievement } from '@prisma/client';

// feature: onboarding-growth
// intent: orchestrate onboarding lifecycle persistence, ensuring preferences,
//         referral readiness, and milestone awards stay in sync for new members.

type InterestInput = {
  sport: string;
  intensity?: string;
  tags?: string[];
};

type AvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  availabilityType?: string;
};

type LocationInput = {
  locationName?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  travelRadius?: number;
  discoveryGoals?: string[];
};

export type OnboardingState = {
  userId: string;
  status: string;
  currentStep: string | null;
  referralCode: string;
  interests: InterestInput[];
  availability: AvailabilityInput[];
  discoveryGoals: string[];
  travelRadius: number | null;
  completedSteps: string[];
  location: {
    locationName: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  };
};

const STEP_SEQUENCE = ['interests', 'location', 'availability', 'complete'] as const;

function mergeCompletedSteps(existing: string[], step: string) {
  if (existing.includes(step)) {
    return existing;
  }
  return [...existing, step];
}

async function ensureOnboardingResponse(userId: string) {
  return prisma.userOnboardingResponse.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      completedSteps: [],
      discoveryGoals: [],
    },
  });
}

function inferNextStep(state: { status: string; currentStep: string | null; completedSteps: string[] }) {
  if (state.status === 'completed') {
    return 'complete';
  }

  for (const step of STEP_SEQUENCE) {
    if (!state.completedSteps.includes(step) && step !== 'complete') {
      return step;
    }
  }
  return 'complete';
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const [user, interests, availability, response] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingStatus: true,
        onboardingStep: true,
        preferredRadius: true,
        locationName: true,
        city: true,
        state: true,
        country: true,
      },
    }),
    prisma.userInterest.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        sport: true,
        intensity: true,
        tags: true,
      },
    }),
    prisma.userAvailability.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        availabilityType: true,
      },
    }),
    prisma.userOnboardingResponse.findUnique({
      where: { userId },
    }),
  ]);

  if (!user) {
    throw new Error('User not found for onboarding state.');
  }

  const referralCode = await ensureReferralCode(userId);
  const completedSteps = response?.completedSteps ?? [];
  const currentStep = inferNextStep({
    status: user.onboardingStatus,
    currentStep: user.onboardingStep,
    completedSteps,
  });

  return {
    userId,
    status: user.onboardingStatus,
    currentStep,
    referralCode,
    interests,
    availability,
    discoveryGoals: response?.discoveryGoals ?? [],
    travelRadius: response?.travelRadius ?? user.preferredRadius ?? null,
    completedSteps,
    location: {
      locationName: user.locationName ?? null,
      city: user.city ?? null,
      state: user.state ?? null,
      country: user.country ?? null,
    },
  };
}

export async function saveInterests(userId: string, payload: InterestInput[]) {
  await ensureOnboardingResponse(userId);

  await prisma.$transaction(async tx => {
    await tx.userInterest.deleteMany({ where: { userId } });
    if (payload.length > 0) {
      await tx.userInterest.createMany({
        data: payload.map(item => ({
          userId,
          sport: item.sport,
          intensity: item.intensity ?? null,
          tags: item.tags ?? [],
        })),
      });
    }

    const response = await tx.userOnboardingResponse.findUnique({ where: { userId } });
    const updatedSteps = mergeCompletedSteps(response?.completedSteps ?? [], 'interests');
    await tx.userOnboardingResponse.update({
      where: { userId },
      data: {
        completedSteps: updatedSteps,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        sports: payload.map(item => item.sport),
        onboardingStep: inferNextStep({
          status: 'pending',
          currentStep: 'interests',
          completedSteps: updatedSteps,
        }),
      },
    });
  });
}

export async function saveLocationPreferences(userId: string, payload: LocationInput) {
  await ensureOnboardingResponse(userId);

  await prisma.$transaction(async tx => {
    const response = await tx.userOnboardingResponse.findUnique({ where: { userId } });
    const updatedSteps = mergeCompletedSteps(response?.completedSteps ?? [], 'location');

    await tx.user.update({
      where: { id: userId },
      data: {
        locationName: payload.locationName ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        country: payload.country ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        preferredRadius: payload.travelRadius ?? null,
        onboardingStep: inferNextStep({
          status: 'pending',
          currentStep: 'location',
          completedSteps: updatedSteps,
        }),
      },
    });

    await tx.userOnboardingResponse.update({
      where: { userId },
      data: {
        travelRadius: payload.travelRadius ?? null,
        discoveryGoals: payload.discoveryGoals ?? [],
        completedSteps: updatedSteps,
      },
    });
  });
}

export async function saveAvailability(userId: string, slots: AvailabilityInput[]) {
  await ensureOnboardingResponse(userId);

  await prisma.$transaction(async tx => {
    await tx.userAvailability.deleteMany({ where: { userId } });
    if (slots.length > 0) {
      await tx.userAvailability.createMany({
        data: slots.map(slot => ({
          userId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          availabilityType: slot.availabilityType ?? null,
        })),
      });
    }

    const response = await tx.userOnboardingResponse.findUnique({ where: { userId } });
    const updatedSteps = mergeCompletedSteps(response?.completedSteps ?? [], 'availability');

    await tx.userOnboardingResponse.update({
      where: { userId },
      data: {
        availabilityPreference: slots.length > 0 ? slots[0].availabilityType ?? null : null,
        completedSteps: updatedSteps,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        onboardingStep: inferNextStep({
          status: 'pending',
          currentStep: 'availability',
          completedSteps: updatedSteps,
        }),
      },
    });
  });
}

const COMPLETION_ACHIEVEMENT: Pick<Achievement, 'slug' | 'title' | 'description' | 'icon'> = {
  slug: 'onboarding-trailblazer',
  title: 'Trailblazer',
  description: 'Completed the WNS onboarding journey and unlocked personalized recommendations.',
  icon: '✨',
};

async function ensureCompletionAchievement() {
  const achievement = await prisma.achievement.upsert({
    where: { slug: COMPLETION_ACHIEVEMENT.slug },
    update: {
      title: COMPLETION_ACHIEVEMENT.title,
      description: COMPLETION_ACHIEVEMENT.description,
      icon: COMPLETION_ACHIEVEMENT.icon,
    },
    create: {
      ...COMPLETION_ACHIEVEMENT,
    },
  });

  return achievement;
}

export async function completeOnboarding(userId: string) {
  await ensureOnboardingResponse(userId);

  const achievement = await ensureCompletionAchievement();

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: 'completed',
        onboardingCompletedAt: new Date(),
        onboardingStep: 'complete',
      },
    });

    const existing = await tx.userOnboardingResponse.findUnique({
      where: { userId },
      select: { completedSteps: true },
    });

    const allSteps = Array.from(
      new Set([...(existing?.completedSteps ?? []), 'interests', 'location', 'availability', 'complete'])
    );

    await tx.userOnboardingResponse.update({
      where: { userId },
      data: {
        completedSteps: allSteps,
      },
    });

    await tx.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
      update: {},
      create: {
        userId,
        achievementId: achievement.id,
        source: 'onboarding',
      },
    });
  });

  await ensureReferralCode(userId);
}
