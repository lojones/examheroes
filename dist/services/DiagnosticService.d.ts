import { type MarketMeshStore } from '../types/marketmesh';
export declare class DiagnosticService {
    private readonly store;
    constructor(store: MarketMeshStore);
    createAssessment(data: {
        examProgramId: string;
        title: string;
        description?: string;
        totalQuestions: number;
        timeLimitMinutes: number;
    }): {
        id: string;
        examProgramId: string;
        title: string;
        description: string | undefined;
        totalQuestions: number;
        timeLimitMinutes: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    startAttempt(assessmentId: string, buyerProfileId: string): {
        id: string;
        diagnosticAssessmentId: string;
        buyerProfileId: string;
        status: "IN_PROGRESS";
        startedAt: Date;
        completedAt: undefined;
        totalScore: undefined;
        sectionBreakdown: {};
        topicBreakdown: {};
        timingBreakdown: {};
        createdAt: Date;
        updatedAt: Date;
    };
    submitAttempt(attemptId: string, answers: Array<boolean | {
        correct: boolean;
        topic?: string;
        section?: string;
        seconds?: number;
    }>): import("../types/marketmesh").DiagnosticAttempt;
    getRecommendations(attemptId: string): {
        attemptId: string;
        weakTopics: string[];
        recommendedActions: string[];
    };
}
//# sourceMappingURL=DiagnosticService.d.ts.map