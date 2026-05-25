import { type MarketMeshStore, VerificationStatus } from '../types/marketmesh';
export declare class HeroVerificationService {
    private readonly store;
    constructor(store: MarketMeshStore);
    submitCredential(sellerProfileId: string, data: {
        legalName: string;
        payoutAccountId?: string;
    }): {
        id: string;
        sellerProfileId: string;
        legalName: string;
        identityVerified: boolean;
        identityVerifiedAt: Date | undefined;
        backgroundCheckStatus: string;
        backgroundCheckAt: undefined;
        payoutAccountId: string | undefined;
        createdAt: Date;
        updatedAt: Date;
    };
    submitExamExpertise(sellerProfileId: string, examProgramId: string, evidence: {
        scoreEvidence?: string;
        certificationEvidence?: string;
    }): {
        id: string;
        sellerProfileId: string;
        examProgramId: string;
        verificationStatus: VerificationStatus;
        scoreEvidence: string | undefined;
        certificationEvidence: string | undefined;
        approvedAt: Date | undefined;
        approvedBy: string | undefined;
        createdAt: Date;
        updatedAt: Date;
    };
    approveHero(sellerProfileId: string, adminId: string): import("../types/marketmesh").SellerProfile;
    suspendHero(sellerProfileId: string, adminId: string, reason: string): import("../types/marketmesh").SellerProfile;
    isHeroVerifiedForExam(sellerProfileId: string, examProgramId: string): boolean;
    hasAcceptedPolicy(userId: string, examSlug: string): boolean;
    canPublishService(sellerProfileId: string, examSlug: string): boolean;
}
//# sourceMappingURL=HeroVerificationService.d.ts.map