'use server';

// meta: module=recommendations.affinity purpose="Shared affinity persistence helpers"

import prisma from '@/lib/prisma';

export async function getAffinityWeights(userId: string): Promise<Map<string, number>> {
  const records = await prisma.userSportAffinity.findMany({
    where: { userId },
  });

  return new Map(records.map((record) => [record.sport, record.affinityScore]));
}

/**
 * meta: function=recordSportAffinity intent="Persist sport weighting adjustments"
 */
export async function recordSportAffinity(
  userId: string,
  sport: string,
  delta: number,
  interactionDate: Date = new Date()
) {
  await prisma.userSportAffinity.upsert({
    where: {
      userId_sport: {
        userId,
        sport,
      },
    },
    create: {
      userId,
      sport,
      affinityScore: delta,
      lastInteraction: interactionDate,
    },
    update: {
      affinityScore: {
        increment: delta,
      },
      lastInteraction: interactionDate,
    },
  });
}
