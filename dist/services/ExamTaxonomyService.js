"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamTaxonomyService = void 0;
class ExamTaxonomyService {
    constructor(store) {
        this.store = store;
    }
    getAllExams() {
        return Array.from(this.store.examPrograms.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    getExamBySlug(slug) {
        const exam = Array.from(this.store.examPrograms.values()).find((item) => item.slug === slug);
        if (!exam) {
            return undefined;
        }
        const sections = Array.from(this.store.examSections.values()).filter((section) => section.examProgramId === exam.id);
        const topics = Array.from(this.store.examTopics.values()).filter((topic) => sections.some((section) => section.id === topic.examSectionId));
        return { ...exam, sectionDetails: sections, topics };
    }
    getTopics(examSlug) {
        const exam = this.getExamBySlug(examSlug);
        return exam?.topics ?? [];
    }
    getPolicy(examSlug) {
        const exam = Array.from(this.store.examPrograms.values()).find((item) => item.slug === examSlug);
        if (!exam) {
            return undefined;
        }
        return Array.from(this.store.integrityPolicies.values())
            .filter((policy) => policy.examProgramId === exam.id)
            .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0];
    }
    searchTopics(examSlug, query) {
        const lower = query.toLowerCase();
        return this.getTopics(examSlug).filter((topic) => topic.name.toLowerCase().includes(lower) || topic.slug.toLowerCase().includes(lower));
    }
}
exports.ExamTaxonomyService = ExamTaxonomyService;
//# sourceMappingURL=ExamTaxonomyService.js.map