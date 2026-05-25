import { v4 as uuidv4 } from 'uuid';
import {
  type MarketMeshConfig,
  type MarketMeshStore,
  type PlatformConfig,
} from '../types/marketmesh';

export class InMemoryMarketMeshStore implements MarketMeshStore {
  users = new Map();
  buyerProfiles = new Map();
  sellerProfiles = new Map();
  categories = new Map();
  serviceListings = new Map();
  availabilitySlots = new Map();
  bookings = new Map();
  conversations = new Map();
  messages = new Map();
  reviews = new Map();
  stripeEvents = new Map();
  refreshTokens = new Map();
  examPrograms = new Map();
  examSections = new Map();
  examTopics = new Map();
  integrityPolicies = new Map();
  integrityAttestations = new Map();
  heroCredentials = new Map();
  heroExamExpertise = new Map();
  scoreVerifications = new Map();
  teachingSamples = new Map();
  learnerExamProfiles = new Map();
  diagnosticAssessments = new Map();
  diagnosticAttempts = new Map();
  studyPlans = new Map();
  studyPlanTasks = new Map();
  errorLogEntries = new Map();
  practiceQuestions = new Map();
  contentLicenses = new Map();
  contentUploads = new Map();
  tutoringSessions = new Map();
  sessionArtifacts = new Map();
  packagePlans = new Map();
  packagePurchases = new Map();
  cohortClasses = new Map();
  matchRuns = new Map();
  matchCandidates = new Map();
  integrityReports = new Map();
  moderationActions = new Map();
  outcomeSnapshots = new Map();
  platformConfig: PlatformConfig;

  constructor(config: MarketMeshConfig) {
    this.platformConfig = {
      id: uuidv4(),
      platformFeePercent: config.platformFeePercent,
      defaultCurrency: config.defaultCurrency,
      accessTokenTtl: config.accessTokenTtl,
      refreshTokenTtl: config.refreshTokenTtl,
      updatedAt: new Date(),
    };
  }
}
