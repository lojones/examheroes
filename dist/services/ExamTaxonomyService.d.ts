import { type MarketMeshStore } from '../types/marketmesh';
export declare class ExamTaxonomyService {
    private readonly store;
    constructor(store: MarketMeshStore);
    getAllExams(): import("../types/marketmesh").ExamProgram[];
    getExamBySlug(slug: string): {
        sectionDetails: import("../types/marketmesh").ExamSection[];
        topics: import("../types/marketmesh").ExamTopic[];
        id: string;
        slug: string;
        name: string;
        examFamily: string;
        abbreviation: string;
        governingBody: string;
        sections: string[];
        scoreScale: string;
        description?: string;
        createdAt: Date;
        updatedAt: Date;
    } | undefined;
    getTopics(examSlug: string): import("../types/marketmesh").ExamTopic[];
    getPolicy(examSlug: string): import("../types/marketmesh").IntegrityPolicy | undefined;
    searchTopics(examSlug: string, query: string): import("../types/marketmesh").ExamTopic[];
}
//# sourceMappingURL=ExamTaxonomyService.d.ts.map