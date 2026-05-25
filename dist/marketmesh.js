"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExamHeroesContext = createExamHeroesContext;
exports.createMarketMeshKernel = createMarketMeshKernel;
const crypto_1 = require("crypto");
const kernel_1 = require("./kernel");
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
const config = {
    platformFeePercent: 18,
    defaultCurrency: 'USD',
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 604800,
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    categories: ['LSAT', 'MCAT', 'GRE', 'GMAT', 'SAT', 'ACT', 'Bar Exam', 'CPA', 'CFA', 'NCLEX', 'AWS Certification', 'CompTIA'],
};
const examDefinitions = {
    lsat: {
        examFamily: 'law',
        abbreviation: 'LSAT',
        governingBody: 'LSAC',
        sections: ['Logical Reasoning', 'Analytical Reasoning', 'Reading Comprehension'],
        scoreScale: '120-180',
    },
    mcat: {
        examFamily: 'medical',
        abbreviation: 'MCAT',
        governingBody: 'AAMC',
        sections: ['CPBS', 'CARS', 'BBFL', 'PSBB'],
        scoreScale: '472-528',
    },
    gre: {
        examFamily: 'graduate',
        abbreviation: 'GRE',
        governingBody: 'ETS',
        sections: ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing'],
        scoreScale: '260-340',
    },
    gmat: {
        examFamily: 'business',
        abbreviation: 'GMAT',
        governingBody: 'GMAC',
        sections: ['Verbal', 'Quantitative', 'Integrated Reasoning', 'Analytical Writing'],
        scoreScale: '200-800',
    },
    sat: {
        examFamily: 'college',
        abbreviation: 'SAT',
        governingBody: 'College Board',
        sections: ['Evidence-Based Reading and Writing', 'Math'],
        scoreScale: '400-1600',
    },
    act: {
        examFamily: 'college',
        abbreviation: 'ACT',
        governingBody: 'ACT',
        sections: ['English', 'Mathematics', 'Reading', 'Science'],
        scoreScale: '1-36',
    },
    'bar-exam': {
        examFamily: 'law',
        abbreviation: 'Bar Exam',
        governingBody: 'NCBE',
        sections: ['MBE', 'MEE', 'MPT'],
        scoreScale: 'state-specific',
    },
    cpa: {
        examFamily: 'accounting',
        abbreviation: 'CPA',
        governingBody: 'AICPA',
        sections: ['FAR', 'AUD', 'REG', 'BEC'],
        scoreScale: '0-99',
    },
    cfa: {
        examFamily: 'finance',
        abbreviation: 'CFA',
        governingBody: 'CFA Institute',
        sections: ['Level I', 'Level II', 'Level III'],
        scoreScale: 'pass/fail',
    },
    nclex: {
        examFamily: 'nursing',
        abbreviation: 'NCLEX',
        governingBody: 'NCSBN',
        sections: ['Patient Care', 'Safety', 'Health Promotion', 'Psychosocial'],
        scoreScale: 'pass/fail',
    },
    'aws-certification': {
        examFamily: 'cloud',
        abbreviation: 'AWS',
        governingBody: 'Amazon Web Services',
        sections: ['Cloud Concepts', 'Security', 'Technology', 'Billing'],
        scoreScale: '100-1000',
    },
    comptia: {
        examFamily: 'it-certification',
        abbreviation: 'CompTIA',
        governingBody: 'CompTIA',
        sections: ['A+', 'Network+', 'Security+', 'CySA+'],
        scoreScale: '100-900',
    },
};
function slugify(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function titleCase(slug) {
    return slug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
function seedExamData(kernel) {
    const store = kernel.store;
    for (const category of store.categories.values()) {
        const metadata = examDefinitions[category.slug] ?? {
            examFamily: 'general',
            abbreviation: category.name,
            governingBody: `${category.name} Board`,
            sections: ['Fundamentals', 'Strategy', 'Practice'],
            scoreScale: 'varies',
        };
        const now = store.now();
        const examProgram = {
            id: store.id(),
            slug: category.slug,
            name: category.name,
            examFamily: metadata.examFamily,
            abbreviation: metadata.abbreviation,
            governingBody: metadata.governingBody,
            sections: metadata.sections,
            scoreScale: metadata.scoreScale,
            description: `${category.name} preparation program.`,
            createdAt: now,
            updatedAt: now,
        };
        store.examPrograms.set(examProgram.id, examProgram);
        metadata.sections.forEach((sectionName, index) => {
            const section = {
                id: store.id(),
                examProgramId: examProgram.id,
                name: sectionName,
                slug: `${category.slug}-${slugify(sectionName)}`,
                description: `${sectionName} coverage for ${category.name}.`,
                weight: Number((1 / metadata.sections.length).toFixed(2)),
                createdAt: now,
                updatedAt: now,
            };
            store.examSections.set(section.id, section);
            ['fundamentals', 'timing', 'advanced'].forEach((topicSuffix, topicIndex) => {
                const topic = {
                    id: store.id(),
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
            const policyId = store.id();
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
        const assessmentId = store.id();
        store.diagnosticAssessments.set(assessmentId, {
            id: assessmentId,
            examProgramId: examProgram.id,
            title: `${category.name} baseline diagnostic`,
            description: `Initial skill check for ${category.name}`,
            totalQuestions: 20,
            timeLimitMinutes: 35,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }
}
function createExamHeroesContext() {
    let kernel;
    let services;
    const hooks = {
        beforeSellerActivation: async (sellerId) => {
            const sellerProfile = kernel.store.sellerProfiles.get(sellerId);
            if (!sellerProfile) {
                throw new Error('Seller profile not found');
            }
            if (sellerProfile.verificationStatus === 'REJECTED') {
                throw new Error('Seller onboarding is blocked for this profile');
            }
        },
        onBookingCreated: async (booking) => {
            const store = kernel.store;
            const existingConversation = Array.from(store.conversations.values()).find((conversation) => conversation.bookingId === booking.id);
            if (!existingConversation) {
                const now = store.now();
                const conversationId = store.id();
                store.conversations.set(conversationId, {
                    id: conversationId,
                    bookingId: booking.id,
                    createdAt: now,
                });
            }
            const existingSession = Array.from(store.tutoringSessions.values()).find((session) => session.bookingId === booking.id);
            if (!existingSession) {
                const service = booking.serviceId ? store.services.get(booking.serviceId) : undefined;
                const category = store.categories.get(service?.categoryId ?? booking.categoryId);
                const examProgram = Array.from(store.examPrograms.values()).find((item) => item.slug === category?.slug);
                const currentPolicy = examProgram
                    ? Array.from(store.integrityPolicies.values())
                        .filter((policy) => policy.examProgramId === examProgram.id)
                        .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0]
                    : undefined;
                const now = store.now();
                const sessionId = store.id();
                store.tutoringSessions.set(sessionId, {
                    id: sessionId,
                    bookingId: booking.id,
                    sellerProfileId: booking.sellerId,
                    buyerProfileId: booking.buyerId,
                    examProgramId: examProgram?.id,
                    status: 'SCHEDULED',
                    joinToken: (0, crypto_1.randomUUID)(),
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
            services.notificationService.notifyBookingCreated(booking);
        },
        extendBookingPayload: async (booking) => {
            const store = kernel.store;
            const service = booking.serviceId ? store.services.get(booking.serviceId) : undefined;
            const category = store.categories.get(service?.categoryId ?? booking.categoryId);
            const conversation = Array.from(store.conversations.values()).find((item) => item.bookingId === booking.id);
            const session = Array.from(store.tutoringSessions.values()).find((item) => item.bookingId === booking.id);
            return {
                examSlug: category?.slug,
                service: service ? { id: service.id, title: service.title, categoryId: service.categoryId } : undefined,
                category: category ? { slug: category.slug, name: category.name } : undefined,
                conversationId: conversation?.id,
                sessionStatus: session?.status,
            };
        },
        onPaymentCaptured: async (booking) => {
            services.notificationService.notifyPaymentCaptured(booking);
        },
        customizeSellerOnboarding: async (sellerId) => ({
            sellerId,
            steps: ['profile', 'identity', 'exam-expertise', 'attestation', 'payouts'],
        }),
    };
    kernel = new kernel_1.MarketMeshKernel({ config, hooks });
    seedExamData(kernel);
    const store = kernel.store;
    const contentPolicyService = new ContentPolicyService_1.ContentPolicyService();
    const heroVerificationService = new HeroVerificationService_1.HeroVerificationService(store);
    const integrityModerationService = new IntegrityModerationService_1.IntegrityModerationService(store, contentPolicyService);
    const notificationService = new NotificationService_1.NotificationService(store);
    const paymentAdapter = new PaymentAdapter_1.PaymentAdapter(store, process.env.STRIPE_WEBHOOK_SECRET ?? 'webhook-secret');
    const examTaxonomyService = new ExamTaxonomyService_1.ExamTaxonomyService(store);
    const diagnosticService = new DiagnosticService_1.DiagnosticService(store);
    const studyPlanService = new StudyPlanService_1.StudyPlanService(store);
    const matchingService = new MatchingService_1.MatchingService(store, heroVerificationService, contentPolicyService);
    services = {
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