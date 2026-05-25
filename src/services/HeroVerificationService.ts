import { v4 as uuidv4 } from 'uuid';
import { type MarketMeshStore, VerificationStatus } from '../types/marketmesh';

export class HeroVerificationService {
  constructor(private readonly store: MarketMeshStore) {}

  submitCredential(sellerProfileId: string, data: { legalName: string; payoutAccountId?: string }) {
    const existing = Array.from(this.store.heroCredentials.values()).find((item) => item.sellerProfileId === sellerProfileId);
    const now = new Date();
    const credential = {
      id: existing?.id ?? uuidv4(),
      sellerProfileId,
      legalName: data.legalName,
      identityVerified: Boolean(data.legalName),
      identityVerifiedAt: data.legalName ? now : undefined,
      backgroundCheckStatus: 'PENDING',
      backgroundCheckAt: undefined,
      payoutAccountId: data.payoutAccountId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.store.heroCredentials.set(credential.id, credential);
    return credential;
  }

  submitExamExpertise(sellerProfileId: string, examProgramId: string, evidence: { scoreEvidence?: string; certificationEvidence?: string }) {
    const existing = Array.from(this.store.heroExamExpertise.values()).find(
      (item) => item.sellerProfileId === sellerProfileId && item.examProgramId === examProgramId,
    );
    const now = new Date();
    const expertise = {
      id: existing?.id ?? uuidv4(),
      sellerProfileId,
      examProgramId,
      verificationStatus: VerificationStatus.PENDING,
      scoreEvidence: evidence.scoreEvidence,
      certificationEvidence: evidence.certificationEvidence,
      approvedAt: existing?.approvedAt,
      approvedBy: existing?.approvedBy,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.store.heroExamExpertise.set(expertise.id, expertise);
    return expertise;
  }

  approveHero(sellerProfileId: string, adminId: string) {
    const seller = this.store.sellerProfiles.get(sellerProfileId);
    if (!seller) {
      throw new Error('Seller not found');
    }
    seller.verificationStatus = VerificationStatus.APPROVED;
    seller.updatedAt = new Date();
    this.store.sellerProfiles.set(seller.id, seller);
    for (const expertise of this.store.heroExamExpertise.values()) {
      if (expertise.sellerProfileId === sellerProfileId) {
        expertise.verificationStatus = VerificationStatus.VERIFIED;
        expertise.approvedAt = new Date();
        expertise.approvedBy = adminId;
        expertise.updatedAt = new Date();
        this.store.heroExamExpertise.set(expertise.id, expertise);
      }
    }
    return seller;
  }

  suspendHero(sellerProfileId: string, adminId: string, reason: string) {
    const seller = this.store.sellerProfiles.get(sellerProfileId);
    if (!seller) {
      throw new Error('Seller not found');
    }
    seller.verificationStatus = VerificationStatus.SUSPENDED;
    seller.bio = [seller.bio, `Suspended by ${adminId}: ${reason}`].filter(Boolean).join(' | ');
    seller.updatedAt = new Date();
    this.store.sellerProfiles.set(seller.id, seller);
    return seller;
  }

  isHeroVerifiedForExam(sellerProfileId: string, examProgramId: string): boolean {
    const seller = this.store.sellerProfiles.get(sellerProfileId);
    if (!seller || seller.verificationStatus !== VerificationStatus.APPROVED) {
      return false;
    }
    return Array.from(this.store.heroExamExpertise.values()).some(
      (item) => item.sellerProfileId === sellerProfileId && item.examProgramId === examProgramId && item.verificationStatus === VerificationStatus.VERIFIED,
    );
  }

  hasAcceptedPolicy(userId: string, examSlug: string): boolean {
    const examProgram = Array.from(this.store.examPrograms.values()).find((exam) => exam.slug === examSlug);
    if (!examProgram) {
      return false;
    }
    const currentPolicy = Array.from(this.store.integrityPolicies.values())
      .filter((policy) => policy.examProgramId === examProgram.id)
      .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0];
    if (!currentPolicy) {
      return false;
    }
    return Array.from(this.store.integrityAttestations.values()).some(
      (attestation) => attestation.userId === userId && attestation.integrityPolicyId === currentPolicy.id,
    );
  }

  canPublishService(sellerProfileId: string, examSlug: string): boolean {
    const seller = this.store.sellerProfiles.get(sellerProfileId);
    const examProgram = Array.from(this.store.examPrograms.values()).find((exam) => exam.slug === examSlug);
    if (!seller || !examProgram) {
      return false;
    }
    return this.isHeroVerifiedForExam(sellerProfileId, examProgram.id) && this.hasAcceptedPolicy(seller.userId, examSlug);
  }
}
