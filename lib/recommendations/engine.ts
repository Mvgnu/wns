'use server';

// meta: module=recommendations.engine purpose="Personalized home experience orchestration"

import geolib from 'geolib';
import prisma from '@/lib/prisma';
import { getGroupRecommendations } from '@/lib/recommendations/group-recommendations';
import { getAffinityWeights } from '@/lib/recommendations/affinity';
import type { Prisma } from '@prisma/client';

type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    group: {
      select: {
        id: true;
        name: true;
        sport: true;
        image: true;
        city: true;
        state: true;
        country: true;
        latitude: true;
        longitude: true;
      };
    };
    location: {
      select: {
        id: true;
        name: true;
        latitude: true;
        longitude: true;
        city: true;
        state: true;
        country: true;
      };
    };
    _count: {
      select: {
        rsvps: true;
      };
    };
  };
}>;

interface AffinityContext {
  userId: string;
  weights: Map<string, number>;
}

export interface PersonalizedGroupSummary {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  memberCount: number;
  score: number;
  reasons: string[];
}

export interface PersonalizedEventSummary {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  sport: string | null;
  city: string | null;
  state: string | null;
  score: number;
  groupName: string | null;
  groupImage: string | null;
}

export interface SpotlightSportSummary {
  sport: string;
  affinityScore: number;
  source: 'affinity' | 'trending' | 'activity';
}

export interface PersonalizedHomeContent {
  mode: 'personalized' | 'trending';
  groups: PersonalizedGroupSummary[];
  events: PersonalizedEventSummary[];
  spotlightSports: SpotlightSportSummary[];
  generatedAt: string;
}

const MAX_GROUPS = 6;
const MAX_EVENTS = 6;

/**
 * meta: function=getPersonalizedHomeContent intent="Provide homepage recommendations"
 */
export async function getPersonalizedHomeContent(userId?: string): Promise<PersonalizedHomeContent> {
  if (!userId) {
    return getTrendingHomeContent();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      sports: true,
      latitude: true,
      longitude: true,
      location: true,
      state: true,
      city: true,
    },
  });

  if (!user) {
    return getTrendingHomeContent();
  }

  const affinityContext: AffinityContext = {
    userId,
    weights: await getAffinityWeights(userId),
  };

  const [groupRecommendations, eventCandidates] = await Promise.all([
    getGroupRecommendations(userId, MAX_GROUPS + 4),
    fetchCandidateEvents(userId),
  ]);

  const personalizedGroups = groupRecommendations
    .slice(0, MAX_GROUPS)
    .map((rec) => ({
      id: rec.group.id,
      name: rec.group.name,
      description: rec.group.description ?? null,
      image: rec.group.image ?? null,
      sport: rec.group.sport,
      memberCount: rec.group._count?.members ?? 0,
      score: rec.score,
      reasons: rec.reasons,
    }));

  const personalizedEvents = scoreAndSelectEvents(eventCandidates, user, affinityContext)
    .slice(0, MAX_EVENTS)
    .map((item) => ({
      id: item.event.id,
      title: item.event.title,
      startTime: item.event.startTime.toISOString(),
      endTime: item.event.endTime ? item.event.endTime.toISOString() : null,
      sport: item.sport,
      city: item.event.group?.city ?? item.event.location?.city ?? null,
      state: item.event.group?.state ?? item.event.location?.state ?? null,
      score: item.score,
      groupName: item.event.group?.name ?? null,
      groupImage: item.event.group?.image ?? null,
    }));

  const spotlightSports = buildSpotlightSports(user.sports, affinityContext.weights, personalizedEvents, personalizedGroups);

  return {
    mode: 'personalized',
    groups: personalizedGroups,
    events: personalizedEvents,
    spotlightSports,
    generatedAt: new Date().toISOString(),
  };
}

async function fetchCandidateEvents(userId: string): Promise<EventWithRelations[]> {
  return prisma.event.findMany({
    where: {
      startTime: {
        gte: new Date(),
      },
      OR: [
        { joinRestriction: 'everyone' },
        {
          joinRestriction: 'groupOnly',
          group: {
            members: {
              some: {
                id: userId,
              },
            },
          },
        },
      ],
    },
    orderBy: {
      startTime: 'asc',
    },
    take: 40,
    include: {
      group: {
        select: {
          id: true,
          name: true,
          sport: true,
          image: true,
          city: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          city: true,
          state: true,
          country: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
  });
}

function scoreAndSelectEvents(
  events: EventWithRelations[],
  user: {
    latitude: number | null;
    longitude: number | null;
    sports: string[];
    location: string | null;
    state: string | null;
    city: string | null;
  },
  affinityContext: AffinityContext
) {
  return events
    .map((event) => ({
      event,
      sport: event.group?.sport ?? null,
      score: calculateEventScore(event, user, affinityContext),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * meta: function=calculateEventScore intent="Rank events for personalization"
 */
export function calculateEventScore(
  event: EventWithRelations,
  user: {
    latitude: number | null;
    longitude: number | null;
    sports: string[];
    location: string | null;
    state: string | null;
    city: string | null;
  },
  affinityContext: AffinityContext
): number {
  let score = 10; // baseline visibility

  const sport = event.group?.sport ?? null;
  if (sport) {
    if (user.sports?.includes(sport)) {
      score += 20;
    }

    const affinityWeight = affinityContext.weights.get(sport);
    if (typeof affinityWeight === 'number') {
      score += Math.min(affinityWeight * 6, 36);
    }
  }

  const eventLocation = resolveEventCoordinates(event);
  if (eventLocation && user.latitude && user.longitude) {
    const distance = geolib.getDistance(
      { latitude: user.latitude, longitude: user.longitude },
      eventLocation
    );
    const distanceKm = distance / 1000;
    if (distanceKm <= 5) {
      score += 25;
    } else if (distanceKm <= 20) {
      score += 18;
    } else if (distanceKm <= 60) {
      score += 10;
    } else if (distanceKm <= 150) {
      score += 6;
    }
  } else if (event.group?.city && user.city && event.group.city === user.city) {
    score += 12;
  } else if (event.group?.state && user.state && event.group.state === user.state) {
    score += 6;
  }

  if (event._count?.rsvps) {
    score += Math.min(event._count.rsvps * 2, 20);
  }

  if (event.startTime.getTime() - Date.now() <= 72 * 60 * 60 * 1000) {
    score += 8; // Imminent events get a nudge
  }

  return score;
}

function resolveEventCoordinates(event: EventWithRelations) {
  if (event.location?.latitude && event.location?.longitude) {
    return { latitude: event.location.latitude, longitude: event.location.longitude };
  }

  if (event.group?.latitude && event.group?.longitude) {
    return { latitude: event.group.latitude, longitude: event.group.longitude };
  }

  return null;
}

function buildSpotlightSports(
  userSports: string[] | null | undefined,
  affinityWeights: Map<string, number>,
  events: PersonalizedEventSummary[],
  groups: PersonalizedGroupSummary[]
): SpotlightSportSummary[] {
  const affinityEntries = Array.from(affinityWeights.entries())
    .map(([sport, value]) => ({ sport, affinityScore: value, source: 'affinity' as const }))
    .sort((a, b) => b.affinityScore - a.affinityScore)
    .slice(0, 3);

  const activitySports = groups
    .concat()
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 2)
    .map((group) => ({ sport: group.sport, affinityScore: group.memberCount, source: 'activity' as const }));

  const trendingSports = events
    .slice(0, 2)
    .filter((event) => event.sport)
    .map((event) => ({ sport: event.sport!, affinityScore: event.score, source: 'trending' as const }));

  const seeds = [...affinityEntries, ...activitySports, ...trendingSports];

  if (seeds.length === 0 && userSports?.length) {
    return userSports.slice(0, 3).map((sport) => ({ sport, affinityScore: 0, source: 'affinity' as const }));
  }

  const seen = new Set<string>();
  const deduped: SpotlightSportSummary[] = [];
  for (const seed of seeds) {
    if (seed.sport && !seen.has(seed.sport)) {
      seen.add(seed.sport);
      deduped.push(seed);
    }
    if (deduped.length >= 5) {
      break;
    }
  }

  return deduped;
}

async function getTrendingHomeContent(): Promise<PersonalizedHomeContent> {
  const [groups, events] = await Promise.all([
    prisma.group.findMany({
      where: { isPrivate: false },
      orderBy: [
        { memberCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: MAX_GROUPS,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        sport: true,
        memberCount: true,
      },
    }),
    prisma.event.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: MAX_EVENTS,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            sport: true,
            image: true,
            city: true,
            state: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    }),
  ]);

  const eventSummaries: PersonalizedEventSummary[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime ? event.endTime.toISOString() : null,
    sport: event.group?.sport ?? null,
    city: event.group?.city ?? null,
    state: event.group?.state ?? null,
    score: (event._count?.rsvps ?? 0) * 2,
    groupName: event.group?.name ?? null,
    groupImage: event.group?.image ?? null,
  }));

  const spotlightSports = buildSpotlightSports(
    null,
    new Map(),
    eventSummaries,
    groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      image: group.image,
      sport: group.sport,
      memberCount: group.memberCount,
      score: group.memberCount,
      reasons: [],
    }))
  );

  return {
    mode: 'trending',
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      image: group.image,
      sport: group.sport,
      memberCount: group.memberCount,
      score: group.memberCount,
      reasons: ['Popular in the community'],
    })),
    events: eventSummaries,
    spotlightSports,
    generatedAt: new Date().toISOString(),
  };
}

