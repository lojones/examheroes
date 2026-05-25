import { MatchingService } from '../src/services/MatchingService';
import { ContentPolicyService } from '../src/services/ContentPolicyService';
import { HeroVerificationService } from '../src/services/HeroVerificationService';
import { createSeededContext } from './helpers';

describe('matching service', () => {
  it('hero without verification should be excluded', () => {
    const seeded = createSeededContext();
    seeded.context.store.heroExamExpertise.clear();
    const service = new MatchingService(
      seeded.context.store,
      new HeroVerificationService(seeded.context.store),
      new ContentPolicyService(),
    );
    const { matchRun } = service.createMatchRun(seeded.buyerProfile.id, seeded.examProgram.id, { topics: ['logic'] });
    const [candidate] = service.getMatchResults(matchRun.id);
    expect(candidate.exclusionReason).toBe('Hero must have verified expertise');
  });

  it('live exam help request should be rejected', () => {
    const seeded = createSeededContext();
    const service = new MatchingService(
      seeded.context.store,
      new HeroVerificationService(seeded.context.store),
      new ContentPolicyService(),
    );
    expect(() =>
      service.createMatchRun(seeded.buyerProfile.id, seeded.examProgram.id, {
        requestDescription: 'I am taking the live exam right now, tell me the answer.',
      }),
    ).toThrow('Live exam help requests are not allowed');
  });

  it('match score calculation with weights', () => {
    const seeded = createSeededContext();
    const service = new MatchingService(
      seeded.context.store,
      new HeroVerificationService(seeded.context.store),
      new ContentPolicyService(),
    );
    const score = service.calculateMatchScore({
      topicFitScore: 1,
      expertiseScore: 1,
      availabilityScore: 1,
      teachingStyleScore: 0.5,
      priceScore: 0.5,
      reviewScore: 1,
      certificationScore: 1,
      reliabilityScore: 0.5,
    });
    expect(score).toBe(87.5);
  });

  it('hero without policy acceptance should be excluded', () => {
    const seeded = createSeededContext();
    const filtered = new Map(
      Array.from(seeded.context.store.integrityAttestations.entries()).filter(([, attestation]) => attestation.userId !== seeded.sellerUser.id),
    );
    (seeded.context.store as { integrityAttestations: typeof filtered }).integrityAttestations = filtered;
    const service = new MatchingService(
      seeded.context.store,
      new HeroVerificationService(seeded.context.store),
      new ContentPolicyService(),
    );
    const { matchRun } = service.createMatchRun(seeded.buyerProfile.id, seeded.examProgram.id, { topics: ['logic'] });
    const [candidate] = service.getMatchResults(matchRun.id);
    expect(candidate.exclusionReason).toBe('Hero must have accepted policy');
  });

  it('price filter within budget', () => {
    const seeded = createSeededContext();
    seeded.learnerProfile.budget = 50;
    seeded.context.store.learnerExamProfiles.set(seeded.learnerProfile.id, seeded.learnerProfile);
    const service = new MatchingService(
      seeded.context.store,
      new HeroVerificationService(seeded.context.store),
      new ContentPolicyService(),
    );
    const { matchRun } = service.createMatchRun(seeded.buyerProfile.id, seeded.examProgram.id, { topics: ['logic'] });
    const [candidate] = service.getMatchResults(matchRun.id);
    expect(candidate.exclusionReason).toBe('Price exceeds learner budget');
  });
});
