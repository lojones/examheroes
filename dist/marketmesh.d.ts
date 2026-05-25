import { MarketMeshKernel } from './kernel';
import { ContentPolicyService } from './services/ContentPolicyService';
import { DiagnosticService } from './services/DiagnosticService';
import { ExamTaxonomyService } from './services/ExamTaxonomyService';
import { HeroVerificationService } from './services/HeroVerificationService';
import { IntegrityModerationService } from './services/IntegrityModerationService';
import { MatchingService } from './services/MatchingService';
import { NotificationService } from './services/NotificationService';
import { PaymentAdapter } from './services/PaymentAdapter';
import { StudyPlanService } from './services/StudyPlanService';
import type { MarketMeshConfig, MarketMeshHooks } from './types/marketmesh';
export interface ExamHeroesServices {
    contentPolicyService: ContentPolicyService;
    heroVerificationService: HeroVerificationService;
    integrityModerationService: IntegrityModerationService;
    matchingService: MatchingService;
    diagnosticService: DiagnosticService;
    studyPlanService: StudyPlanService;
    paymentAdapter: PaymentAdapter;
    examTaxonomyService: ExamTaxonomyService;
    notificationService: NotificationService;
}
export declare function createExamHeroesContext(): {
    config: MarketMeshConfig;
    hooks: MarketMeshHooks;
    store: import("./kernel/store").InMemoryMarketMeshStore;
    kernel: MarketMeshKernel;
    services: ExamHeroesServices;
};
export declare function createMarketMeshKernel(): MarketMeshKernel;
//# sourceMappingURL=marketmesh.d.ts.map