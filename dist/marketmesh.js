"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExamHeroesContext = createExamHeroesContext;
exports.createMarketMeshKernel = createMarketMeshKernel;
const uuid_1 = require("uuid");
const kernel_1 = require("./kernel");
const store_1 = require("./kernel/store");
const IntegrityPolicies_1 = require("./policies/IntegrityPolicies");
const ContentPolicyService_1 = require("./services/ContentPolicyService");
const DiagnosticService_1 = require("./services/DiagnosticService");
const ExamTaxonomyService_1 = require("./services/ExamTaxonomyService");
const HeroVerificationService_1 = require("./services/HeroVerificationService");
const IntegrityModerationService_1 = require("./services/IntegrityModerationService");
const MatchingService_1 = require("./services/MatchingService");
const NotificationService_1 = require("./services/NotificationService");
const PaymentAdapter_1 = require("./services/PaymentAdapter");
const StudyPlanService_1 = require("./services/StudyPlanService");
const marketmesh_1 = require("./types/marketmesh");
const config = {
    platformFeePercent: 18,
    defaultCurrency: 'USD',
    accessTokenTtl: 900,
    refreshTokenTtl: 604800,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    categories: [
        { slug: 'lsat', name: 'LSAT', examFamily: 'law', sections: ['Logical Reasoning', 'Analytical Reasoning', 'Reading Comprehension'], scoreScale: '120-180', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'mcat', name: 'MCAT', examFamily: 'medical', sections: ['CPBS', 'CARS', 'BBFL', 'PSBB'], scoreScale: '472-528', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'gre', name: 'GRE', examFamily: 'graduate', sections: ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing'], scoreScale: '260-340', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'gmat', name: 'GMAT', examFamily: 'business', sections: ['Verbal', 'Quantitative', 'Integrated Reasoning', 'Analytical Writing'], scoreScale: '200-800', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'sat', name: 'SAT', examFamily: 'college', sections: ['Evidence-Based Reading and Writing', 'Math'], scoreScale: '400-1600', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'act', name: 'ACT', examFamily: 'college', sections: ['English', 'Mathematics', 'Reading', 'Science'], scoreScale: '1-36', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'bar-exam', name: 'Bar Exam', examFamily: 'law', sections: ['MBE', 'MEE', 'MPT'], scoreScale: 'state-specific', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'cpa', name: 'CPA', examFamily: 'accounting', sections: ['FAR', 'AUD', 'REG', 'BEC'], scoreScale: '0-99', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'cfa', name: 'CFA', examFamily: 'finance', sections: ['Level I', 'Level II', 'Level III'], scoreScale: 'pass/fail', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'nclex', name: 'NCLEX', examFamily: 'nursing', sections: ['Patient Care', 'Safety', 'Health Promotion', 'Psychosocial'], scoreScale: 'pass/fail', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'aws-certification', name: 'AWS Certification', examFamily: 'cloud', sections: ['Cloud Concepts', 'Security', 'Technology', 'Billing'], scoreScale: '100-1000', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
        { slug: 'comptia', name: 'CompTIA', examFamily: 'it-certification', sections: ['A+', 'Network+', 'Security+', 'CySA+'], scoreScale: '100-900', serviceTypes: ['concept', 'diagnostic', 'strategy', 'mock', 'package'], materialPolicy: 'original,licensed,public', prohibitsLiveExamHelp: true },
    ],
};
function titleCase(slug) {
    return slug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
function seedStore(store) {
    for (const categoryConfig of config.categories) {
        const now = new Date();
        const category = {
            id: (0, uuid_1.v4)(),
            slug: categoryConfig.slug,
            name: categoryConfig.name,
            examFamily: categoryConfig.examFamily,
            sections: categoryConfig.sections,
            scoreScale: categoryConfig.scoreScale,
            serviceTypes: categoryConfig.serviceTypes,
            materialPolicy: categoryConfig.materialPolicy,
            prohibitsLiveExamHelp: categoryConfig.prohibitsLiveExamHelp,
            createdAt: now,
            updatedAt: now,
        };
        store.categories.set(category.id, category);
        const examProgram = {
            id: (0, uuid_1.v4)(),
            slug: category.slug,
            name: category.name,
            examFamily: category.examFamily,
            abbreviation: category.name,
            governingBody: `${category.name} Board`,
            sections: category.sections,
            scoreScale: category.scoreScale,
            description: `${category.name} preparation program.`,
            createdAt: now,
            updatedAt: now,
        };
        store.examPrograms.set(examProgram.id, examProgram);
        category.sections.forEach((sectionName, index) => {
            const section = {
                id: (0, uuid_1.v4)(),
                examProgramId: examProgram.id,
                name: sectionName,
                slug: `${category.slug}-${sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                description: `${sectionName} coverage for ${category.name}.`,
                weight: Number((1 / category.sections.length).toFixed(2)),
                createdAt: now,
                updatedAt: now,
            };
            store.examSections.set(section.id, section);
            ['fundamentals', 'timing', 'advanced'].forEach((topicSuffix, topicIndex) => {
                const topic = {
                    id: (0, uuid_1.v4)(),
                    examSectionId: section.id,
                    name: `${titleCase(topicSuffix)} ${index + 1}.${topicIndex + 1}`,
                    slug: `${section.slug}-${topicSuffix}`,
                    description: `${topicSuffix} practice for ${sectionName}`,
                    difficulty: topicIndex === 0 ? 'easy' : topicIndex === 1 ? 'medium' : 'hard',
                    createdAt: now,
                    updatedAt: now,
                };
                store.examTopics.set(topic.id, topic);
            });
        });
        const policyTemplate = IntegrityPolicies_1.IntegrityPolicies[category.slug];
        if (policyTemplate) {
            const policyId = (0, uuid_1.v4)();
            store.integrityPolicies.set(policyId, {
                id: policyId,
                examProgramId: examProgram.id,
                version: policyTemplate.version,
                prohibitsLiveExamHelp: policyTemplate.prohibitsLiveExamHelp,
                prohibitsBrainDumps: policyTemplate.prohibitsBrainDumps,
                prohibitsSecureContent: policyTemplate.prohibitsSecureContent,
                prohibitsProctoringBypass: policyTemplate.prohibitsProctoringBypass,
                prohibitsProxyTesting: policyTemplate.prohibitsProxyTesting,
                allowedMaterials: policyTemplate.allowedMaterials,
                requiredAttestation: true,
                fullPolicyText: policyTemplate.fullPolicyText,
                effectiveAt: now,
                createdAt: now,
                updatedAt: now,
            });
        }
        const assessment = {
            id: (0, uuid_1.v4)(),
            examProgramId: examProgram.id,
            title: `${category.name} baseline diagnostic`,
            description: `Initial skill check for ${category.name}`,
            totalQuestions: 20,
            timeLimitMinutes: 35,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };
        store.diagnosticAssessments.set(assessment.id, assessment);
    }
}
function createExamHeroesContext() {
    const store = new store_1.InMemoryMarketMeshStore(config);
    seedStore(store);
    const contentPolicyService = new ContentPolicyService_1.ContentPolicyService();
    const heroVerificationService = new HeroVerificationService_1.HeroVerificationService(store);
    const integrityModerationService = new IntegrityModerationService_1.IntegrityModerationService(store, contentPolicyService);
    const notificationService = new NotificationService_1.NotificationService(store);
    const paymentAdapter = new PaymentAdapter_1.PaymentAdapter(store, process.env.STRIPE_WEBHOOK_SECRET || 'webhook-secret');
    const examTaxonomyService = new ExamTaxonomyService_1.ExamTaxonomyService(store);
    const diagnosticService = new DiagnosticService_1.DiagnosticService(store);
    const studyPlanService = new StudyPlanService_1.StudyPlanService(store);
    const matchingService = new MatchingService_1.MatchingService(store, heroVerificationService, contentPolicyService);
    const hooks = {
        beforeSellerActivation: async (sellerProfile) => ({
            allowed: sellerProfile.verificationStatus !== marketmesh_1.VerificationStatus.SUSPENDED,
            verificationStatus: sellerProfile.verificationStatus,
        }),
        customizeSellerOnboarding: async (sellerProfile) => ({
            sellerProfileId: sellerProfile.id,
            checklist: ['Submit identity documents', 'Submit expertise evidence', 'Accept integrity policy'],
        }),
        beforeBooking: async (bookingInput) => integrityModerationService.canBookingProceed(bookingInput),
        onBookingCreated: async (booking, seededStore) => {
            const existingConversation = Array.from(seededStore.conversations.values()).find((conversation) => conversation.bookingId === booking.id);
            if (!existingConversation) {
                const now = new Date();
                const conversationId = (0, uuid_1.v4)();
                seededStore.conversations.set(conversationId, {
                    id: conversationId,
                    bookingId: booking.id,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            const existingSession = Array.from(seededStore.tutoringSessions.values()).find((session) => session.bookingId === booking.id);
            if (!existingSession) {
                const service = seededStore.serviceListings.get(booking.serviceListingId);
                const examProgram = Array.from(seededStore.examPrograms.values()).find((item) => item.slug === service?.examSlug);
                const currentPolicy = examProgram
                    ? Array.from(seededStore.integrityPolicies.values())
                        .filter((policy) => policy.examProgramId === examProgram.id)
                        .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0]
                    : undefined;
                const now = new Date();
                const sessionId = (0, uuid_1.v4)();
                seededStore.tutoringSessions.set(sessionId, {
                    id: sessionId,
                    bookingId: booking.id,
                    sellerProfileId: booking.sellerProfileId,
                    buyerProfileId: booking.buyerProfileId,
                    examProgramId: examProgram?.id,
                    status: 'SCHEDULED',
                    joinToken: (0, uuid_1.v4)(),
                    startedAt: undefined,
                    completedAt: undefined,
                    recordingConsent: false,
                    recordingUrl: undefined,
                    heroSummary: undefined,
                    homeworkNotes: undefined,
                    studyPlanId: undefined,
                    policySnapshotVersion: currentPolicy?.version,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            notificationService.notifyBookingCreated(booking);
        },
        extendBookingPayload: async (booking, seededStore) => {
            const service = seededStore.serviceListings.get(booking.serviceListingId);
            const category = service ? seededStore.categories.get(service.categoryId) : undefined;
            const conversation = Array.from(seededStore.conversations.values()).find((item) => item.bookingId === booking.id);
            return {
                id: booking.id,
                status: booking.status,
                finalPrice: booking.finalPrice,
                createdAt: booking.createdAt,
                sellerProfileId: booking.sellerProfileId,
                buyerProfileId: booking.buyerProfileId,
                service: service ? { id: service.id, title: service.title, examSlug: service.examSlug } : undefined,
                category: category ? { slug: category.slug, name: category.name } : undefined,
                conversationId: conversation?.id,
            };
        },
        onPaymentCaptured: async (booking) => {
            notificationService.notifyPaymentCaptured(booking);
        },
    };
    const kernel = new kernel_1.MarketMeshKernel({ config, hooks, store });
    const services = {
        contentPolicyService,
        heroVerificationService,
        integrityModerationService,
        matchingService,
        diagnosticService,
        studyPlanService,
        paymentAdapter,
        examTaxonomyService,
        notificationService,
    };
    return { config, hooks, store, kernel, services };
}
function createMarketMeshKernel() {
    return createExamHeroesContext().kernel;
}
//# sourceMappingURL=marketmesh.js.map