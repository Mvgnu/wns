"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = getUserById;
exports.getUserCount = getUserCount;
exports.getGroupById = getGroupById;
exports.getGroupCount = getGroupCount;
exports.getLocationById = getLocationById;
exports.getLocationCount = getLocationCount;
exports.getEventById = getEventById;
exports.getEventCount = getEventCount;
exports.getDashboardStats = getDashboardStats;
const prisma_1 = require("./prisma");
/**
 * Server actions for data fetching - use these in client components
 * to ensure Prisma operations are kept on the server
 */
// User actions
async function getUserById(id) {
    return prisma_1.prisma.user.findUnique({
        where: { id },
    });
}
async function getUserCount() {
    return prisma_1.prisma.user.count();
}
// Group actions
async function getGroupById(id) {
    return prisma_1.prisma.group.findUnique({
        where: { id },
    });
}
async function getGroupCount() {
    return prisma_1.prisma.group.count();
}
// Location actions
async function getLocationById(id) {
    return prisma_1.prisma.location.findUnique({
        where: { id },
    });
}
async function getLocationCount() {
    return prisma_1.prisma.location.count();
}
// Event actions
async function getEventById(id) {
    return prisma_1.prisma.event.findUnique({
        where: { id },
    });
}
async function getEventCount() {
    return prisma_1.prisma.event.count();
}
// For example, for client components that need to display counts:
async function getDashboardStats() {
    const [usersCount, groupsCount, locationsCount, eventsCount] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.group.count(),
        prisma_1.prisma.location.count(),
        prisma_1.prisma.event.count(),
    ]);
    return {
        usersCount,
        groupsCount,
        locationsCount,
        eventsCount,
    };
}
