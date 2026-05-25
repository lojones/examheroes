import { type MarketMeshStore, type StudyPlanTaskStatus } from '../types/marketmesh';
export declare class StudyPlanService {
    private readonly store;
    constructor(store: MarketMeshStore);
    generatePlan(buyerProfileId: string, examProgramId: string, diagnosticAttemptId: string | undefined, targetDate?: Date): {
        id: string;
        buyerProfileId: string;
        examProgramId: string;
        bookingId: undefined;
        targetDate: Date | undefined;
        generatedAt: Date;
        tasks: {
            id: string;
            studyPlanId: string;
            title: string;
            description: string;
            topicId: string;
            dueDate: Date | undefined;
            status: StudyPlanTaskStatus;
            priority: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    };
    getPlan(id: string): {
        tasks: import("../types/marketmesh").StudyPlanTask[];
        id: string;
        buyerProfileId: string;
        examProgramId: string;
        bookingId?: string;
        targetDate?: Date;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    } | undefined;
    updateTask(planId: string, taskId: string, status: StudyPlanTaskStatus): import("../types/marketmesh").StudyPlanTask;
    regeneratePlan(planId: string): {
        tasks: import("../types/marketmesh").StudyPlanTask[];
        id: string;
        buyerProfileId: string;
        examProgramId: string;
        bookingId?: string;
        targetDate?: Date;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    } | undefined;
}
//# sourceMappingURL=StudyPlanService.d.ts.map