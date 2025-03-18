'use server';

import { prisma } from './prisma';

/**
 * Server actions for data fetching - use these in client components
 * to ensure Prisma operations are kept on the server
 */

// User actions
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserCount() {
  return prisma.user.count();
}

// Group actions
export async function getGroupById(id: string) {
  return prisma.group.findUnique({
    where: { id },
  });
}

export async function getGroupCount() {
  return prisma.group.count();
}

// Location actions
export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
  });
}

export async function getLocationCount() {
  return prisma.location.count();
}

// Event actions
export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
  });
}

export async function getEventCount() {
  return prisma.event.count();
}

// For example, for client components that need to display counts:
export async function getDashboardStats() {
  const [usersCount, groupsCount, locationsCount, eventsCount] = await Promise.all([
    prisma.user.count(),
    prisma.group.count(),
    prisma.location.count(),
    prisma.event.count(),
  ]);
  
  return {
    usersCount,
    groupsCount,
    locationsCount,
    eventsCount,
  };
} 