import type { Express, Router } from 'express';
export type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};
export declare enum UserRole {
    LEARNER = "LEARNER",
    HERO = "HERO",
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR"
}
export declare enum BookingStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    DISPUTED = "DISPUTED"
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    SUSPENDED = "SUSPENDED",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
}
export type DiagnosticAttemptStatus = 'IN_PROGRESS' | 'COMPLETED';
export type StudyPlanTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type ContentUploadStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
export type TutoringSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PackagePurchaseStatus = 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED';
export type IntegrityReportStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    emailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface BuyerProfile {
    id: string;
    userId: string;
    displayName: string;
    timezone: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SellerProfile {
    id: string;
    userId: string;
    displayName: string;
    bio?: string;
    verificationStatus: VerificationStatus;
    payoutSetup: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Category {
    id: string;
    slug: string;
    name: string;
    examFamily: string;
    sections: string[];
    scoreScale: string;
    serviceTypes: string[];
    materialPolicy: string;
    prohibitsLiveExamHelp: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ServiceListing {
    id: string;
    sellerProfileId: string;
    categoryId: string;
    title: string;
    description: string;
    serviceType: string;
    priceAmount: number;
    currency: string;
    durationMinutes: number;
    isActive: boolean;
    examSlug: string;
    sections: string[];
    topics: string[];
    prerequisitesSummary?: string;
    allowedMaterialsSummary?: string;
    recordingPolicy?: string;
    homeworkPolicy?: string;
    packagePlanId?: string;
    cohortClassId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AvailabilitySlot {
    id: string;
    sellerProfileId: string;
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Booking {
    id: string;
    buyerProfileId: string;
    sellerProfileId: string;
    serviceListingId: string;
    availabilitySlotId: string;
    status: BookingStatus;
    finalPrice: number;
    platformFeePercent: number;
    platformFeeAmount: number;
    sellerPayoutAmount: number;
    payoutStatus?: string;
    notes?: string;
    packagePurchaseId?: string;
    contentUploadIds?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Conversation {
    id: string;
    bookingId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Message {
    id: string;
    conversationId: string;
    authorUserId: string;
    body: string;
    flagged: boolean;
    createdAt: Date;
}
export interface Review {
    id: string;
    bookingId: string;
    authorUserId: string;
    targetSellerProfileId: string;
    rating: number;
    body?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PlatformConfig {
    id: string;
    platformFeePercent: number;
    defaultCurrency: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    updatedAt: Date;
}
export interface StripeEvent {
    id: string;
    eventId: string;
    eventType: string;
    processed: boolean;
    processedAt?: Date;
    createdAt: Date;
}
export interface ExamProgram {
    id: string;
    slug: string;
    name: string;
    examFamily: string;
    abbreviation: string;
    governingBody: string;
    sections: string[];
    scoreScale: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExamSection {
    id: string;
    examProgramId: string;
    name: string;
    slug: string;
    description?: string;
    weight: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExamTopic {
    id: string;
    examSectionId: string;
    name: string;
    slug: string;
    description?: string;
    difficulty: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IntegrityPolicy {
    id: string;
    examProgramId: string;
    version: string;
    prohibitsLiveExamHelp: boolean;
    prohibitsBrainDumps: boolean;
    prohibitsSecureContent: boolean;
    prohibitsProctoringBypass: boolean;
    prohibitsProxyTesting: boolean;
    allowedMaterials: string[];
    requiredAttestation: boolean;
    fullPolicyText: string;
    effectiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IntegrityAttestation {
    id: string;
    userId: string;
    integrityPolicyId: string;
    attestedAt: Date;
    ipAddress?: string;
    createdAt: Date;
}
export interface HeroCredential {
    id: string;
    sellerProfileId: string;
    legalName: string;
    identityVerified: boolean;
    identityVerifiedAt?: Date;
    backgroundCheckStatus?: string;
    backgroundCheckAt?: Date;
    payoutAccountId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface HeroExamExpertise {
    id: string;
    sellerProfileId: string;
    examProgramId: string;
    verificationStatus: VerificationStatus;
    scoreEvidence?: string;
    certificationEvidence?: string;
    approvedAt?: Date;
    approvedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ScoreVerification {
    id: string;
    sellerProfileId: string;
    examProgramId: string;
    claimedScore: string;
    evidenceUrl: string;
    verificationStatus: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TeachingSample {
    id: string;
    sellerProfileId: string;
    title: string;
    description?: string;
    sampleUrl: string;
    verificationStatus: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface LearnerExamProfile {
    id: string;
    buyerProfileId: string;
    examProgramId: string;
    targetDate?: Date;
    targetScore?: number;
    currentScore?: number;
    weakTopics: string[];
    budget?: number;
    timezone: string;
    learningPreferences: JsonValue;
    integrityAttestationId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DiagnosticAssessment {
    id: string;
    examProgramId: string;
    title: string;
    description?: string;
    totalQuestions: number;
    timeLimitMinutes: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface DiagnosticAttempt {
    id: string;
    diagnosticAssessmentId: string;
    buyerProfileId: string;
    status: DiagnosticAttemptStatus;
    startedAt: Date;
    completedAt?: Date;
    totalScore?: number;
    sectionBreakdown: Record<string, number>;
    topicBreakdown: Record<string, number>;
    timingBreakdown: Record<string, number>;
    createdAt: Date;
    updatedAt: Date;
}
export interface StudyPlan {
    id: string;
    buyerProfileId: string;
    examProgramId: string;
    bookingId?: string;
    targetDate?: Date;
    generatedAt: Date;
    tasks: StudyPlanTask[];
    createdAt: Date;
    updatedAt: Date;
}
export interface StudyPlanTask {
    id: string;
    studyPlanId: string;
    title: string;
    description?: string;
    topicId?: string;
    dueDate?: Date;
    status: StudyPlanTaskStatus;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ErrorLogEntry {
    id: string;
    buyerProfileId: string;
    examProgramId: string;
    topicId?: string;
    questionDescription: string;
    errorAnalysis?: string;
    heroNotes?: string;
    createdAt: Date;
}
export interface PracticeQuestion {
    id: string;
    examProgramId: string;
    sectionId?: string;
    topicId?: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    source?: string;
    contentLicenseId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ContentLicense {
    id: string;
    name: string;
    licensor?: string;
    licenseType: string;
    allowedUses: string[];
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ContentUpload {
    id: string;
    buyerProfileId: string;
    fileName: string;
    fileHash: string;
    fileSizeBytes: number;
    mimeType: string;
    sourceDeclaration?: string;
    status: ContentUploadStatus;
    scanResult: JsonValue;
    reviewedBy?: string;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface TutoringSession {
    id: string;
    bookingId: string;
    sellerProfileId: string;
    buyerProfileId: string;
    examProgramId?: string;
    status: TutoringSessionStatus;
    joinToken: string;
    startedAt?: Date;
    completedAt?: Date;
    recordingConsent: boolean;
    recordingUrl?: string;
    heroSummary?: string;
    homeworkNotes?: string;
    studyPlanId?: string;
    policySnapshotVersion?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SessionArtifact {
    id: string;
    tutoringSessionId: string;
    uploadId?: string;
    artifactType: string;
    createdAt: Date;
}
export interface PackagePlan {
    id: string;
    sellerProfileId: string;
    title: string;
    description?: string;
    sessionCount: number;
    priceAmount: number;
    currency: string;
    expiryDays: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PackagePurchase {
    id: string;
    packagePlanId: string;
    buyerProfileId: string;
    totalSessions: number;
    usedSessions: number;
    expiresAt: Date;
    status: PackagePurchaseStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface CohortClass {
    id: string;
    serviceListingId: string;
    sellerProfileId: string;
    title: string;
    maxEnrollment: number;
    scheduledAt: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MatchRun {
    id: string;
    buyerProfileId: string;
    examProgramId: string;
    requestDescription: string;
    isLiveExamRequest: boolean;
    createdAt: Date;
}
export interface MatchCandidate {
    id: string;
    matchRunId: string;
    sellerProfileId: string;
    totalScore: number;
    topicFitScore: number;
    expertiseScore: number;
    availabilityScore: number;
    teachingStyleScore: number;
    priceScore: number;
    reviewScore: number;
    certificationScore: number;
    reliabilityScore: number;
    inclusionReasons: string[];
    exclusionReason?: string;
    createdAt: Date;
}
export interface IntegrityReport {
    id: string;
    reporterUserId: string;
    reportedUserId?: string;
    bookingId?: string;
    reportType: string;
    description: string;
    evidenceUrls: string[];
    status: IntegrityReportStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface ModerationAction {
    id: string;
    integrityReportId: string;
    moderatorUserId: string;
    action: string;
    reason: string;
    createdAt: Date;
}
export interface OutcomeSnapshot {
    id: string;
    buyerProfileId: string;
    examProgramId: string;
    reportedScore: number;
    reportedAt: Date;
    consentedToShare: boolean;
    createdAt: Date;
}
export interface MarketMeshCategoryConfig {
    slug: string;
    name: string;
    examFamily: string;
    sections: string[];
    scoreScale: string;
    serviceTypes: string[];
    materialPolicy: string;
    prohibitsLiveExamHelp: boolean;
}
export interface MarketMeshConfig {
    platformFeePercent: number;
    defaultCurrency: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    jwtSecret: string;
    categories: MarketMeshCategoryConfig[];
}
export interface BookingRequestInput {
    buyerProfileId: string;
    sellerProfileId: string;
    serviceListingId: string;
    availabilitySlotId: string;
    requestDescription?: string;
    examProgramId?: string;
    packagePurchaseId?: string;
    contentUploadIds?: string[];
}
export interface MarketMeshHooks {
    beforeSellerActivation?: (sellerProfile: SellerProfile, store: MarketMeshStore) => Promise<unknown>;
    customizeSellerOnboarding?: (sellerProfile: SellerProfile, store: MarketMeshStore) => Promise<unknown>;
    beforeBooking?: (bookingInput: BookingRequestInput, store: MarketMeshStore) => Promise<{
        allowed: boolean;
        reasons: string[];
    }>;
    onBookingCreated?: (booking: Booking, store: MarketMeshStore) => Promise<void>;
    extendBookingPayload?: (booking: Booking, store: MarketMeshStore) => Promise<unknown>;
    onPaymentCaptured?: (booking: Booking, store: MarketMeshStore) => Promise<void>;
}
export interface MarketMeshStore {
    users: Map<string, User>;
    buyerProfiles: Map<string, BuyerProfile>;
    sellerProfiles: Map<string, SellerProfile>;
    categories: Map<string, Category>;
    serviceListings: Map<string, ServiceListing>;
    availabilitySlots: Map<string, AvailabilitySlot>;
    bookings: Map<string, Booking>;
    conversations: Map<string, Conversation>;
    messages: Map<string, Message>;
    reviews: Map<string, Review>;
    stripeEvents: Map<string, StripeEvent>;
    platformConfig: PlatformConfig;
    refreshTokens: Map<string, {
        userId: string;
        expiresAt: number;
    }>;
    examPrograms: Map<string, ExamProgram>;
    examSections: Map<string, ExamSection>;
    examTopics: Map<string, ExamTopic>;
    integrityPolicies: Map<string, IntegrityPolicy>;
    integrityAttestations: Map<string, IntegrityAttestation>;
    heroCredentials: Map<string, HeroCredential>;
    heroExamExpertise: Map<string, HeroExamExpertise>;
    scoreVerifications: Map<string, ScoreVerification>;
    teachingSamples: Map<string, TeachingSample>;
    learnerExamProfiles: Map<string, LearnerExamProfile>;
    diagnosticAssessments: Map<string, DiagnosticAssessment>;
    diagnosticAttempts: Map<string, DiagnosticAttempt>;
    studyPlans: Map<string, StudyPlan>;
    studyPlanTasks: Map<string, StudyPlanTask>;
    errorLogEntries: Map<string, ErrorLogEntry>;
    practiceQuestions: Map<string, PracticeQuestion>;
    contentLicenses: Map<string, ContentLicense>;
    contentUploads: Map<string, ContentUpload>;
    tutoringSessions: Map<string, TutoringSession>;
    sessionArtifacts: Map<string, SessionArtifact>;
    packagePlans: Map<string, PackagePlan>;
    packagePurchases: Map<string, PackagePurchase>;
    cohortClasses: Map<string, CohortClass>;
    matchRuns: Map<string, MatchRun>;
    matchCandidates: Map<string, MatchCandidate>;
    integrityReports: Map<string, IntegrityReport>;
    moderationActions: Map<string, ModerationAction>;
    outcomeSnapshots: Map<string, OutcomeSnapshot>;
}
export interface MarketMeshKernelContract {
    mountOn(app: Express, basePath?: string): void;
    getRouter(): Router;
    getStore(): MarketMeshStore;
}
//# sourceMappingURL=marketmesh.d.ts.map