import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createExamHeroesContext } from '../src/marketmesh';
import { signToken } from '../src/kernel/common';
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
    salt: 'salt',
    isAdmin: false,
    roles: ['BUYER'] as Array<'BUYER' | 'SELLER' | 'ADMIN'>,
    createdAt: now,
    updatedAt: now,
  };
  const sellerUser = {
    id: uuidv4(),
    email: 'hero@example.com',
    passwordHash: 'hash',
    salt: 'salt',
    isAdmin: false,
    roles: ['SELLER'] as Array<'BUYER' | 'SELLER' | 'ADMIN'>,
    createdAt: now,
    updatedAt: now,
  };
  context.store.users.set(buyerUser.id, buyerUser);
  context.store.users.set(sellerUser.id, sellerUser);

  const buyerProfile = {
    id: uuidv4(),
    userId: buyerUser.id,
    preferences: { displayName: 'Buyer', timezone: 'UTC', bio: 'Learner' },
  };
  const sellerProfile = {
    id: uuidv4(),
    userId: sellerUser.id,
    bio: 'structured coaching and calm style',
    verificationStatus: 'VERIFIED' as const,
    stripeConnectAccountId: 'acct_123',
    averageRating: 4.8,
    reviewCount: 5,
    location: { timezone: 'UTC' },
    radiusKm: 25,
    isOnline: true,
  };
  context.store.buyerProfiles.set(buyerProfile.id, buyerProfile);
  context.store.sellerProfiles.set(sellerProfile.id, sellerProfile);

  const serviceListing = {
    id: uuidv4(),
    sellerId: sellerProfile.id,
    categoryId: category.id,
    title: 'LSAT Logic Games',
    description: 'Targeted LSAT coaching',
    price: 120,
    currency: 'USD',
    pricingType: 'FIXED' as const,
    durationMinutes: 60,
    locationType: 'REMOTE' as const,
    location: { examSlug: examProgram.slug, sections: ['Analytical Reasoning'], topics: ['timing', 'logic'] },
    mediaUrls: [],
    isActive: true,
    createdAt: now,
  };
  const availabilitySlot = {
    id: uuidv4(),
    sellerId: sellerProfile.id,
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    isBooked: false,
    recurringRule: undefined,
  };
  context.store.services.set(serviceListing.id, serviceListing);
  context.store.availabilitySlots.set(availabilitySlot.id, availabilitySlot);

  const expertise = {
    id: uuidv4(),
    sellerProfileId: sellerProfile.id,
    examProgramId: examProgram.id,
    verificationStatus: 'VERIFIED' as const,
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
  const buyerAttestationId = uuidv4();
  context.store.integrityAttestations.set(buyerAttestationId, {
    id: buyerAttestationId,
    userId: buyerUser.id,
    integrityPolicyId: currentPolicy.id,
    attestedAt: now,
    ipAddress: '127.0.0.1',
    createdAt: now,
  });
  const sellerAttestationId = uuidv4();
  context.store.integrityAttestations.set(sellerAttestationId, {
    id: sellerAttestationId,
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
  app.use('/api/v1', seeded.context.kernel.getRouter());
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
    { sub: seeded.buyerUser.id, email: seeded.buyerUser.email, roles: seeded.buyerUser.roles, isAdmin: seeded.buyerUser.isAdmin, type: 'access' },
    seeded.context.config.accessTokenTtlSeconds ?? 900,
  );
  return { ...seeded, server, baseUrl: `http://127.0.0.1:${address.port}`, buyerAccessToken };
}
