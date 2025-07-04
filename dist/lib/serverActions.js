"use strict";
'use server';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
const prisma_1 = __importDefault(require("./prisma"));
/**
 * Server actions for data fetching - use these in client components
 * to ensure Prisma operations are kept on the server
 */
// User actions
async function getUserById(id) {
    return prisma_1.default.user.findUnique({
        where: { id },
    });
}
async function getUserCount() {
    return prisma_1.default.user.count();
}
// Group actions
async function getGroupById(id) {
    return prisma_1.default.group.findUnique({
        where: { id },
    });
}
async function getGroupCount() {
    return prisma_1.default.group.count();
}
// Location actions
async function getLocationById(id) {
    return prisma_1.default.location.findUnique({
        where: { id },
    });
}
async function getLocationCount() {
    return prisma_1.default.location.count();
}
// Event actions
async function getEventById(id) {
    return prisma_1.default.event.findUnique({
        where: { id },
    });
}
async function getEventCount() {
    return prisma_1.default.event.count();
}
// For example, for client components that need to display counts:
async function getDashboardStats() {
    const [usersCount, groupsCount, locationsCount, eventsCount] = await Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.group.count(),
        prisma_1.default.location.count(),
        prisma_1.default.event.count(),
    ]);
    return {
        usersCount,
        groupsCount,
        locationsCount,
        eventsCount,
    };
}
