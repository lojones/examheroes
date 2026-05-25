"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMarketMeshStore = void 0;
const crypto_1 = require("crypto");
class InMemoryMarketMeshStore {
    constructor() {
        this.users = new Map();
        this.buyerProfiles = new Map();
        this.sellerProfiles = new Map();
        this.categories = new Map();
        this.services = new Map();
        this.availabilitySlots = new Map();
        this.bookings = new Map();
        this.reviews = new Map();
        this.conversations = new Map();
        this.messages = new Map();
        this.notifications = new Map();
        this.platformConfig = new Map();
        this.stripeEvents = new Map();
        this.examPrograms = new Map();
        this.examSections = new Map();
        this.examTopics = new Map();
        this.integrityPolicies = new Map();
        this.integrityAttestations = new Map();
        this.heroCredentials = new Map();
        this.heroExamExpertise = new Map();
        this.scoreVerifications = new Map();
        this.teachingSamples = new Map();
        this.learnerExamProfiles = new Map();
        this.diagnosticAssessments = new Map();
        this.diagnosticAttempts = new Map();
        this.studyPlans = new Map();
        this.studyPlanTasks = new Map();
        this.errorLogEntries = new Map();
        this.practiceQuestions = new Map();
        this.contentLicenses = new Map();
        this.contentUploads = new Map();
        this.tutoringSessions = new Map();
        this.sessionArtifacts = new Map();
        this.packagePlans = new Map();
        this.packagePurchases = new Map();
        this.cohortClasses = new Map();
        this.matchRuns = new Map();
        this.matchCandidates = new Map();
        this.integrityReports = new Map();
        this.moderationActions = new Map();
        this.outcomeSnapshots = new Map();
    }
    id() {
        return (0, crypto_1.randomUUID)();
    }
    now() {
        return new Date();
    }
    findUserByEmail(email) {
        const normalized = email.trim().toLowerCase();
        return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === normalized);
    }
    findBuyerProfileByUserId(userId) {
        return Array.from(this.buyerProfiles.values()).find((profile) => profile.userId === userId);
    }
    findSellerProfileByUserId(userId) {
        return Array.from(this.sellerProfiles.values()).find((profile) => profile.userId === userId);
    }
    findCategoryBySlug(slug) {
        return Array.from(this.categories.values()).find((category) => category.slug === slug);
    }
    ensureUserRole(userId, role) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.roles.includes(role)) {
            user.roles = [...user.roles, role];
            user.updatedAt = this.now();
            this.users.set(user.id, user);
        }
    }
}
exports.InMemoryMarketMeshStore = InMemoryMarketMeshStore;
//# sourceMappingURL=store.js.map