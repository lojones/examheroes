import { v4 as uuidv4 } from 'uuid';
import { ContentPolicyService } from '../src/services/ContentPolicyService';
import { IntegrityModerationService } from '../src/services/IntegrityModerationService';
import { HeroVerificationService } from '../src/services/HeroVerificationService';
import { createSeededContext } from './helpers';

describe('integrity services', () => {
  it('ContentPolicyService.isLiveExamHelpRequest should block live exam help text', () => {
    const service = new ContentPolicyService();
    expect(service.isLiveExamHelpRequest('I am currently taking the LSAT live exam, send me the answer now.')).toBe(true);
  });

  it('ContentPolicyService.scanText should flag MCAT confidential content keywords', () => {
    const service = new ContentPolicyService();
    const scan = service.scanText('Do you have the AAMC confidential secure passage from today?', 'mcat');
    expect(scan.flagged).toBe(true);
    expect(scan.reasons.join(' ')).toContain('aamc confidential');
  });

  it('ContentPolicyService.scanText should flag LSAT brain dump keywords', () => {
    const service = new ContentPolicyService();
    const scan = service.scanText('Please share a recent LSAT questions brain dump.', 'lsat');
    expect(scan.flagged).toBe(true);
    expect(scan.reasons.join(' ')).toContain('brain dump');
  });

  it('IntegrityModerationService.blockLiveExamHelp should block live exam help', () => {
    const { context } = createSeededContext();
    const moderation = new IntegrityModerationService(context.store, new ContentPolicyService());
    const result = moderation.blockLiveExamHelp('I am in the exam right now, answer this for me.', 'lsat');
    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('IntegrityModerationService.canBookingProceed should fail if learner has not attested', () => {
    const seeded = createSeededContext();
    seeded.context.store.integrityAttestations = new Map(
      Array.from(seeded.context.store.integrityAttestations.entries()).filter(([, attestation]) => attestation.userId !== seeded.buyerUser.id),
    );
    const moderation = new IntegrityModerationService(seeded.context.store, new ContentPolicyService());
    const result = moderation.canBookingProceed({
      buyerProfileId: seeded.buyerProfile.id,
      sellerProfileId: seeded.sellerProfile.id,
      serviceListingId: seeded.serviceListing.id,
      availabilitySlotId: seeded.availabilitySlot.id,
      requestDescription: 'Need help improving logic games accuracy',
      examProgramId: seeded.examProgram.id,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain('Learner has not attested to the current integrity policy');
  });

  it('policy version re-attestation check should require newest version', () => {
    const seeded = createSeededContext();
    const verification = new HeroVerificationService(seeded.context.store);
    expect(verification.hasAcceptedPolicy(seeded.buyerUser.id, 'lsat')).toBe(true);
    const now = new Date();
    const newerPolicy = {
      id: uuidv4(),
      examProgramId: seeded.examProgram.id,
      version: '2025.2',
      prohibitsLiveExamHelp: true,
      prohibitsBrainDumps: true,
      prohibitsSecureContent: true,
      prohibitsProctoringBypass: true,
      prohibitsProxyTesting: true,
      allowedMaterials: ['original-notes'],
      requiredAttestation: true,
      fullPolicyText: 'Updated policy',
      effectiveAt: new Date(now.getTime() + 1_000),
      createdAt: now,
      updatedAt: now,
    };
    seeded.context.store.integrityPolicies.set(newerPolicy.id, newerPolicy);
    expect(verification.hasAcceptedPolicy(seeded.buyerUser.id, 'lsat')).toBe(false);
  });
});
