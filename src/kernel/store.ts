import { randomUUID } from 'crypto';
import type {
  AvailabilitySlot,
  Booking,
  BuyerProfile,
  Category,
  CohortClass,
  ContentLicense,
  ContentUpload,
  Conversation,
  DiagnosticAssessment,
  DiagnosticAttempt,
  ErrorLogEntry,
  ExamProgram,
  ExamSection,
  ExamTopic,
  HeroCredential,
  HeroExamExpertise,
  IntegrityAttestation,
  IntegrityPolicy,
  IntegrityReport,
  LearnerExamProfile,
  MarketMeshStore,
  MatchCandidate,
  MatchRun,
  Message,
  ModerationAction,
  Notification,
  OutcomeSnapshot,
  PackagePlan,
  PackagePurchase,
  PlatformConfigEntry,
  PracticeQuestion,
  Review,
  Role,
  ScoreVerification,
  SellerProfile,
  ServiceListing,
  SessionArtifact,
  StripeEventRecord,
  StudyPlan,
  StudyPlanTask,
  TeachingSample,
  TutoringSession,
  User,
} from '../types/marketmesh';

export class InMemoryMarketMeshStore implements MarketMeshStore {
  public readonly users = new Map<string, User>();
  public readonly buyerProfiles = new Map<string, BuyerProfile>();
  public readonly sellerProfiles = new Map<string, SellerProfile>();
  public readonly categories = new Map<string, Category>();
  public readonly services = new Map<string, ServiceListing>();
  public readonly availabilitySlots = new Map<string, AvailabilitySlot>();
  public readonly bookings = new Map<string, Booking>();
  public readonly reviews = new Map<string, Review>();
  public readonly conversations = new Map<string, Conversation>();
  public readonly messages = new Map<string, Message>();
  public readonly notifications = new Map<string, Notification>();
  public readonly platformConfig = new Map<string, PlatformConfigEntry>();
  public readonly stripeEvents = new Map<string, StripeEventRecord>();
  public readonly examPrograms = new Map<string, ExamProgram>();
  public readonly examSections = new Map<string, ExamSection>();
  public readonly examTopics = new Map<string, ExamTopic>();
  public readonly integrityPolicies = new Map<string, IntegrityPolicy>();
  public readonly integrityAttestations = new Map<string, IntegrityAttestation>();
  public readonly heroCredentials = new Map<string, HeroCredential>();
  public readonly heroExamExpertise = new Map<string, HeroExamExpertise>();
  public readonly scoreVerifications = new Map<string, ScoreVerification>();
  public readonly teachingSamples = new Map<string, TeachingSample>();
  public readonly learnerExamProfiles = new Map<string, LearnerExamProfile>();
  public readonly diagnosticAssessments = new Map<string, DiagnosticAssessment>();
  public readonly diagnosticAttempts = new Map<string, DiagnosticAttempt>();
  public readonly studyPlans = new Map<string, StudyPlan>();
  public readonly studyPlanTasks = new Map<string, StudyPlanTask>();
  public readonly errorLogEntries = new Map<string, ErrorLogEntry>();
  public readonly practiceQuestions = new Map<string, PracticeQuestion>();
  public readonly contentLicenses = new Map<string, ContentLicense>();
  public readonly contentUploads = new Map<string, ContentUpload>();
  public readonly tutoringSessions = new Map<string, TutoringSession>();
  public readonly sessionArtifacts = new Map<string, SessionArtifact>();
  public readonly packagePlans = new Map<string, PackagePlan>();
  public readonly packagePurchases = new Map<string, PackagePurchase>();
  public readonly cohortClasses = new Map<string, CohortClass>();
  public readonly matchRuns = new Map<string, MatchRun>();
  public readonly matchCandidates = new Map<string, MatchCandidate>();
  public readonly integrityReports = new Map<string, IntegrityReport>();
  public readonly moderationActions = new Map<string, ModerationAction>();
  public readonly outcomeSnapshots = new Map<string, OutcomeSnapshot>();

  public id(): string {
    return randomUUID();
  }

  public now(): Date {
    return new Date();
  }

  public findUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === normalized);
  }

  public findBuyerProfileByUserId(userId: string): BuyerProfile | undefined {
    return Array.from(this.buyerProfiles.values()).find((profile) => profile.userId === userId);
  }

  public findSellerProfileByUserId(userId: string): SellerProfile | undefined {
    return Array.from(this.sellerProfiles.values()).find((profile) => profile.userId === userId);
  }

  public findCategoryBySlug(slug: string): Category | undefined {
    return Array.from(this.categories.values()).find((category) => category.slug === slug);
  }

  public ensureUserRole(userId: string, role: Role): void {
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
