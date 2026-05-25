import { ContentPolicyService } from './ContentPolicyService';
import { HeroVerificationService } from './HeroVerificationService';
import { type MarketMeshStore } from '../types/marketmesh';
export interface MatchRequest {
    topics?: string[];
    sections?: string[];
    teachingStyle?: string;
    budget?: number;
    requestDescription?: string;
}
export declare class MatchingService {
    private readonly store;
    private readonly heroVerificationService;
    private readonly contentPolicyService;
    constructor(store: MarketMeshStore, heroVerificationService: HeroVerificationService, contentPolicyService: ContentPolicyService);
    createMatchRun(buyerProfileId: string, examProgramId: string, request: MatchRequest): {
        matchRun: {
            id: string;
            buyerProfileId: string;
            examProgramId: string;
            requestDescription: string;
            isLiveExamRequest: boolean;
            createdAt: Date;
        };
        candidates: {
            inclusionReasons: string[];
            exclusionReason: string;
            createdAt: Date;
            topicFitScore: number;
            expertiseScore: number;
            availabilityScore: number;
            teachingStyleScore: number;
            priceScore: number;
            reviewScore: number;
            certificationScore: number;
            reliabilityScore: number;
            id: string;
            matchRunId: string;
            sellerProfileId: string;
            totalScore: number;
        }[];
    };
    getMatchResults(matchRunId: string): import("../types/marketmesh").MatchCandidate[];
    calculateMatchScore(candidate: {
        topicFitScore: number;
        expertiseScore: number;
        availabilityScore: number;
        teachingStyleScore: number;
        priceScore: number;
        reviewScore: number;
        certificationScore: number;
        reliabilityScore: number;
    }): number;
    private calculateTopicFit;
    private calculateReliability;
}
//# sourceMappingURL=MatchingService.d.ts.map