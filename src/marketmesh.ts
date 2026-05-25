import { v4 as uuidv4 } from 'uuid';
import { MarketMeshKernel } from './kernel';
import { InMemoryMarketMeshStore } from './kernel/store';
import { IntegrityPolicies } from './policies/IntegrityPolicies';
import { ContentPolicyService } from './services/ContentPolicyService';
import { DiagnosticService } from './services/DiagnosticService';
import { ExamTaxonomyService } from './services/ExamTaxonomyService';
import { HeroVerificationService } from './services/HeroVerificationService';
import { IntegrityModerationService } from './services/IntegrityModerationService';
import { MatchingService } from './services/MatchingService';
import { NotificationService } from './services/NotificationService';
import { PaymentAdapter } from './services/PaymentAdapter';
import { StudyPlanService } from './services/StudyPlanService';
import {
  type Category,
  type ExamProgram,
  type ExamSection,
  type ExamTopic,
  type MarketMeshConfig,
  type MarketMeshHooks,
  VerificationStatus,
} from './types/marketmesh';

const config: MarketMeshConfig = {
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

export interface ExamHeroesServices {
  contentPolicyService: ContentPolicyService;
  heroVerificationService: HeroVerificationService;
  integrityModerationService: IntegrityModerationService;
  matchingService: MatchingService;
  diagnosticService: DiagnosticService;
  studyPlanService: StudyPlanService;
  paymentAdapter: PaymentAdapter;
  examTaxonomyService: ExamTaxonomyService;
  notificationService: NotificationService;
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function seedStore(store: InMemoryMarketMeshStore): void {
  for (const categoryConfig of config.categories) {
    const now = new Date();
    const category: Category = {
      id: uuidv4(),
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

    const examProgram: ExamProgram = {
      id: uuidv4(),
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
      const section: ExamSection = {
        id: uuidv4(),
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
        const topic: ExamTopic = {
          id: uuidv4(),
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

    const policyTemplate = IntegrityPolicies[category.slug];
    if (policyTemplate) {
      const policyId = uuidv4();
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
      id: uuidv4(),
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

export function createExamHeroesContext() {
  const store = new InMemoryMarketMeshStore(config);
  seedStore(store);

  const contentPolicyService = new ContentPolicyService();
  const heroVerificationService = new HeroVerificationService(store);
  const integrityModerationService = new IntegrityModerationService(store, contentPolicyService);
  const notificationService = new NotificationService(store);
  const paymentAdapter = new PaymentAdapter(store, process.env.STRIPE_WEBHOOK_SECRET || 'webhook-secret');
  const examTaxonomyService = new ExamTaxonomyService(store);
  const diagnosticService = new DiagnosticService(store);
  const studyPlanService = new StudyPlanService(store);
  const matchingService = new MatchingService(store, heroVerificationService, contentPolicyService);

  const hooks: MarketMeshHooks = {
    beforeSellerActivation: async (sellerProfile) => ({
      allowed: sellerProfile.verificationStatus !== VerificationStatus.SUSPENDED,
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
        const conversationId = uuidv4();
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
        const sessionId = uuidv4();
        seededStore.tutoringSessions.set(sessionId, {
          id: sessionId,
          bookingId: booking.id,
          sellerProfileId: booking.sellerProfileId,
          buyerProfileId: booking.buyerProfileId,
          examProgramId: examProgram?.id,
          status: 'SCHEDULED',
          joinToken: uuidv4(),
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

  const kernel = new MarketMeshKernel({ config, hooks, store });

  const services: ExamHeroesServices = {
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

export function createMarketMeshKernel() {
  return createExamHeroesContext().kernel;
}
