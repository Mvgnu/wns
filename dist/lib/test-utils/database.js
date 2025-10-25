"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDb = exports.TestDatabase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TestDatabase {
    constructor() {
        this.testUsers = [];
        this.testGroups = [];
        this.testEvents = [];
    }
    async createTestUser(data = {}) {
        const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const user = await prisma.user.create({
            data: {
                name: data.name || `Test User ${unique}`,
                email: data.email || `test_${unique}@example.com`,
            },
        });
        this.testUsers.push(user);
        return user;
    }
    async createTestGroup(data = {}) {
        var _a;
        const owner = data.ownerId ? { id: data.ownerId } : await this.createTestUser();
        const group = await prisma.group.create({
            data: Object.assign({ name: data.name || `Test Group ${Date.now()}`, isPrivate: (_a = data.isPrivate) !== null && _a !== void 0 ? _a : false, sport: 'test-sport', ownerId: owner.id, 
                // ensure owner appears as member too for membership checks
                members: { connect: [{ id: owner.id }] } }, data),
        });
        this.testGroups.push(group);
        return group;
    }
    async createTestEvent(data = {}) {
        const organizer = data.organizerId ? { id: data.organizerId } : await this.createTestUser();
        const group = data.groupId ? { id: data.groupId } : await this.createTestGroup({ ownerId: organizer.id });
        const event = await prisma.event.create({
            data: Object.assign({ title: data.title || `Test Event ${Date.now()}`, startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), organizerId: organizer.id, groupId: group.id }, data),
        });
        this.testEvents.push(event);
        return event;
    }
    async createTestGroupMember(groupId, userId) {
        // connect via status
        await prisma.groupMemberStatus.create({
            data: { groupId, userId, status: 'active', joinedAt: new Date() },
        });
        // also connect via members relation to satisfy queries using relation
        await prisma.group.update({
            where: { id: groupId },
            data: { members: { connect: { id: userId } } },
        });
    }
    async cleanup() {
        for (const event of this.testEvents) {
            try {
                await prisma.event.delete({ where: { id: event.id } });
            }
            catch (_a) { }
        }
        for (const group of this.testGroups) {
            try {
                await prisma.group.delete({ where: { id: group.id } });
            }
            catch (_b) { }
        }
        for (const user of this.testUsers) {
            try {
                await prisma.user.delete({ where: { id: user.id } });
            }
            catch (_c) { }
        }
        this.testUsers = [];
        this.testGroups = [];
        this.testEvents = [];
    }
    async reset() { await this.cleanup(); }
}
exports.TestDatabase = TestDatabase;
exports.testDb = new TestDatabase();
beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => { await exports.testDb.cleanup(); await prisma.$disconnect(); });
afterEach(async () => { await exports.testDb.cleanup(); });
