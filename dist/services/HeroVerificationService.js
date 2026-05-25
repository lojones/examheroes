"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroVerificationService = void 0;
const uuid_1 = require("uuid");
const marketmesh_1 = require("../types/marketmesh");
class HeroVerificationService {
    constructor(store) {
        this.store = store;
    }
    submitCredential(sellerProfileId, data) {
        const existing = Array.from(this.store.heroCredentials.values()).find((item) => item.sellerProfileId === sellerProfileId);
        const now = new Date();
        const credential = {
            id: existing?.id ?? (0, uuid_1.v4)(),
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
    submitExamExpertise(sellerProfileId, examProgramId, evidence) {
        const existing = Array.from(this.store.heroExamExpertise.values()).find((item) => item.sellerProfileId === sellerProfileId && item.examProgramId === examProgramId);
        const now = new Date();
        const expertise = {
            id: existing?.id ?? (0, uuid_1.v4)(),
            sellerProfileId,
            examProgramId,
            verificationStatus: marketmesh_1.VerificationStatus.PENDING,
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
    approveHero(sellerProfileId, adminId) {
        const seller = this.store.sellerProfiles.get(sellerProfileId);
        if (!seller) {
            throw new Error('Seller not found');
        }
        seller.verificationStatus = marketmesh_1.VerificationStatus.APPROVED;
        seller.updatedAt = new Date();
        this.store.sellerProfiles.set(seller.id, seller);
        for (const expertise of this.store.heroExamExpertise.values()) {
            if (expertise.sellerProfileId === sellerProfileId) {
                expertise.verificationStatus = marketmesh_1.VerificationStatus.VERIFIED;
                expertise.approvedAt = new Date();
                expertise.approvedBy = adminId;
                expertise.updatedAt = new Date();
                this.store.heroExamExpertise.set(expertise.id, expertise);
            }
        }
        return seller;
    }
    suspendHero(sellerProfileId, adminId, reason) {
        const seller = this.store.sellerProfiles.get(sellerProfileId);
        if (!seller) {
            throw new Error('Seller not found');
        }
        seller.verificationStatus = marketmesh_1.VerificationStatus.SUSPENDED;
        seller.bio = [seller.bio, `Suspended by ${adminId}: ${reason}`].filter(Boolean).join(' | ');
        seller.updatedAt = new Date();
        this.store.sellerProfiles.set(seller.id, seller);
        return seller;
    }
    isHeroVerifiedForExam(sellerProfileId, examProgramId) {
        const seller = this.store.sellerProfiles.get(sellerProfileId);
        if (!seller || seller.verificationStatus !== marketmesh_1.VerificationStatus.APPROVED) {
            return false;
        }
        return Array.from(this.store.heroExamExpertise.values()).some((item) => item.sellerProfileId === sellerProfileId && item.examProgramId === examProgramId && item.verificationStatus === marketmesh_1.VerificationStatus.VERIFIED);
    }
    hasAcceptedPolicy(userId, examSlug) {
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
        return Array.from(this.store.integrityAttestations.values()).some((attestation) => attestation.userId === userId && attestation.integrityPolicyId === currentPolicy.id);
    }
    canPublishService(sellerProfileId, examSlug) {
        const seller = this.store.sellerProfiles.get(sellerProfileId);
        const examProgram = Array.from(this.store.examPrograms.values()).find((exam) => exam.slug === examSlug);
        if (!seller || !examProgram) {
            return false;
        }
        return this.isHeroVerifiedForExam(sellerProfileId, examProgram.id) && this.hasAcceptedPolicy(seller.userId, examSlug);
    }
}
exports.HeroVerificationService = HeroVerificationService;
//# sourceMappingURL=HeroVerificationService.js.map