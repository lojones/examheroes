import { ContentPolicyService } from './ContentPolicyService';
import { type BookingRequestInput, type MarketMeshStore } from '../types/marketmesh';
export declare class IntegrityModerationService {
    private readonly store;
    private readonly contentPolicyService;
    constructor(store: MarketMeshStore, contentPolicyService: ContentPolicyService);
    createReport(data: {
        reporterUserId: string;
        reportedUserId?: string;
        bookingId?: string;
        reportType: string;
        description: string;
        evidenceUrls?: string[];
    }): {
        id: string;
        reporterUserId: string;
        reportedUserId: string | undefined;
        bookingId: string | undefined;
        reportType: string;
        description: string;
        evidenceUrls: string[];
        status: "OPEN";
        createdAt: Date;
        updatedAt: Date;
    };
    reviewReport(reportId: string, action: string, moderatorId: string, reason: string): {
        report: import("../types/marketmesh").IntegrityReport;
        moderationAction: {
            id: string;
            integrityReportId: string;
            moderatorUserId: string;
            action: string;
            reason: string;
            createdAt: Date;
        };
    };
    blockLiveExamHelp(text: string, examSlug: string): {
        allowed: boolean;
        reasons: string[];
    };
    canBookingProceed(bookingData: BookingRequestInput): {
        allowed: boolean;
        reasons: string[];
    };
}
//# sourceMappingURL=IntegrityModerationService.d.ts.map