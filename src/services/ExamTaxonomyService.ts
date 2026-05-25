import { type MarketMeshStore } from '../types/marketmesh';

export class ExamTaxonomyService {
  constructor(private readonly store: MarketMeshStore) {}

  getAllExams() {
    return Array.from(this.store.examPrograms.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getExamBySlug(slug: string) {
    const exam = Array.from(this.store.examPrograms.values()).find((item) => item.slug === slug);
    if (!exam) {
      return undefined;
    }
    const sections = Array.from(this.store.examSections.values()).filter((section) => section.examProgramId === exam.id);
    const topics = Array.from(this.store.examTopics.values()).filter((topic) => sections.some((section) => section.id === topic.examSectionId));
    return { ...exam, sectionDetails: sections, topics };
  }

  getTopics(examSlug: string) {
    const exam = this.getExamBySlug(examSlug);
    return exam?.topics ?? [];
  }

  getPolicy(examSlug: string) {
    const exam = Array.from(this.store.examPrograms.values()).find((item) => item.slug === examSlug);
    if (!exam) {
      return undefined;
    }
    return Array.from(this.store.integrityPolicies.values())
      .filter((policy) => policy.examProgramId === exam.id)
      .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0];
  }

  searchTopics(examSlug: string, query: string) {
    const lower = query.toLowerCase();
    return this.getTopics(examSlug).filter(
      (topic) => topic.name.toLowerCase().includes(lower) || topic.slug.toLowerCase().includes(lower),
    );
  }
}
