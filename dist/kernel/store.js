"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMarketMeshStore = void 0;
const uuid_1 = require("uuid");
class InMemoryMarketMeshStore {
    constructor(config) {
        this.users = new Map();
        this.buyerProfiles = new Map();
        this.sellerProfiles = new Map();
        this.categories = new Map();
        this.serviceListings = new Map();
        this.availabilitySlots = new Map();
        this.bookings = new Map();
        this.conversations = new Map();
        this.messages = new Map();
        this.reviews = new Map();
        this.stripeEvents = new Map();
        this.refreshTokens = new Map();
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
        this.platformConfig = {
            id: (0, uuid_1.v4)(),
            platformFeePercent: config.platformFeePercent,
            defaultCurrency: config.defaultCurrency,
            accessTokenTtl: config.accessTokenTtl,
            refreshTokenTtl: config.refreshTokenTtl,
            updatedAt: new Date(),
        };
    }
}
exports.InMemoryMarketMeshStore = InMemoryMarketMeshStore;
//# sourceMappingURL=store.js.map