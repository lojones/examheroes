import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createExamHeroesContext } from '../src/marketmesh';
import { signToken } from '../src/kernel/common';
import { UserRole, VerificationStatus } from '../src/types/marketmesh';
import { createPackagesRouter } from '../src/routes/packages';

export function createSeededContext() {
  const context = createExamHeroesContext();
  const examProgram = Array.from(context.store.examPrograms.values()).find((program) => program.slug === 'lsat');
  const category = Array.from(context.store.categories.values()).find((item) => item.slug === 'lsat');
  if (!examProgram || !category) {
    throw new Error('Seeded LSAT exam data missing');
  }

  const now = new Date();
  const buyerUser = {
    id: uuidv4(),
    email: 'buyer@example.com',
    passwordHash: 'hash',
    role: UserRole.LEARNER,
    emailVerified: true,
    mfaEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
  const sellerUser = {
    id: uuidv4(),
    email: 'hero@example.com',
    passwordHash: 'hash',
    role: UserRole.HERO,
    emailVerified: true,
    mfaEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
  context.store.users.set(buyerUser.id, buyerUser);
  context.store.users.set(sellerUser.id, sellerUser);

  const buyerProfile = {
    id: uuidv4(),
    userId: buyerUser.id,
    displayName: 'Buyer',
    timezone: 'UTC',
    bio: 'Learner',
    createdAt: now,
    updatedAt: now,
  };
  const sellerProfile = {
    id: uuidv4(),
    userId: sellerUser.id,
    displayName: 'Hero',
    bio: 'structured coaching and calm style',
    verificationStatus: VerificationStatus.APPROVED,
    payoutSetup: true,
    createdAt: now,
    updatedAt: now,
  };
  context.store.buyerProfiles.set(buyerProfile.id, buyerProfile);
  context.store.sellerProfiles.set(sellerProfile.id, sellerProfile);

  const serviceListing = {
    id: uuidv4(),
    sellerProfileId: sellerProfile.id,
    categoryId: category.id,
    title: 'LSAT Logic Games',
    description: 'Targeted LSAT coaching',
    serviceType: 'concept',
    priceAmount: 120,
    currency: 'USD',
    durationMinutes: 60,
    isActive: true,
    examSlug: examProgram.slug,
    sections: ['Analytical Reasoning'],
    topics: ['timing', 'logic'],
    prerequisitesSummary: undefined,
    allowedMaterialsSummary: 'original notes only',
    recordingPolicy: 'optional',
    homeworkPolicy: 'included',
    packagePlanId: undefined,
    cohortClassId: undefined,
    createdAt: now,
    updatedAt: now,
  };
  const availabilitySlot = {
    id: uuidv4(),
    sellerProfileId: sellerProfile.id,
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };
  context.store.serviceListings.set(serviceListing.id, serviceListing);
  context.store.availabilitySlots.set(availabilitySlot.id, availabilitySlot);

  const expertise = {
    id: uuidv4(),
    sellerProfileId: sellerProfile.id,
    examProgramId: examProgram.id,
    verificationStatus: VerificationStatus.VERIFIED,
    scoreEvidence: '180',
    certificationEvidence: 'approved',
    approvedAt: now,
    approvedBy: 'admin',
    createdAt: now,
    updatedAt: now,
  };
  context.store.heroExamExpertise.set(expertise.id, expertise);

  const currentPolicy = Array.from(context.store.integrityPolicies.values()).find((policy) => policy.examProgramId === examProgram.id);
  if (!currentPolicy) {
    throw new Error('Current policy missing');
  }
  context.store.integrityAttestations.set(uuidv4(), {
    id: uuidv4(),
    userId: buyerUser.id,
    integrityPolicyId: currentPolicy.id,
    attestedAt: now,
    ipAddress: '127.0.0.1',
    createdAt: now,
  });
  context.store.integrityAttestations.set(uuidv4(), {
    id: uuidv4(),
    userId: sellerUser.id,
    integrityPolicyId: currentPolicy.id,
    attestedAt: now,
    ipAddress: '127.0.0.1',
    createdAt: now,
  });

  const learnerProfile = {
    id: uuidv4(),
    buyerProfileId: buyerProfile.id,
    examProgramId: examProgram.id,
    targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    targetScore: 170,
    currentScore: 158,
    weakTopics: ['logic'],
    budget: 150,
    timezone: 'UTC',
    learningPreferences: { teachingStyle: 'structured' },
    integrityAttestationId: currentPolicy.id,
    createdAt: now,
    updatedAt: now,
  };
  context.store.learnerExamProfiles.set(learnerProfile.id, learnerProfile);

  return { context, examProgram, category, buyerUser, sellerUser, buyerProfile, sellerProfile, serviceListing, availabilitySlot, currentPolicy, learnerProfile };
}

export async function startBookingServer() {
  const seeded = createSeededContext();
  const app = express();
  app.use(express.json());
  seeded.context.kernel.mountOn(app, '/api/v1');
  app.use('/api/v1', createPackagesRouter(seeded.context));
  const server = await new Promise<import('http').Server>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server');
  }
  const buyerAccessToken = signToken(
    seeded.context.config,
    { sub: seeded.buyerUser.id, role: UserRole.LEARNER, email: seeded.buyerUser.email, type: 'access' },
    seeded.context.config.accessTokenTtl,
  );
  return { ...seeded, server, baseUrl: `http://127.0.0.1:${address.port}`, buyerAccessToken };
}
