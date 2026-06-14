import { v4 as uuidv4 } from 'uuid';
import { type MarketMeshStore } from '../types/marketmesh';

export class DiagnosticService {
  constructor(private readonly store: MarketMeshStore) {}

  createAssessment(data: { examProgramId: string; title: string; description?: string; totalQuestions: number; timeLimitMinutes: number }) {
    const assessment = {
      id: uuidv4(),
      examProgramId: data.examProgramId,
      title: data.title,
      description: data.description,
      totalQuestions: data.totalQuestions,
      timeLimitMinutes: data.timeLimitMinutes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.diagnosticAssessments.set(assessment.id, assessment);
    return assessment;
  }

  startAttempt(assessmentId: string, buyerProfileId: string) {
    const attempt = {
      id: uuidv4(),
      diagnosticAssessmentId: assessmentId,
      buyerProfileId,
      status: 'IN_PROGRESS' as const,
      startedAt: new Date(),
      completedAt: undefined,
      totalScore: undefined,
      sectionBreakdown: {},
      topicBreakdown: {},
      timingBreakdown: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.diagnosticAttempts.set(attempt.id, attempt);
    return attempt;
  }

  submitAttempt(attemptId: string, answers: Array<boolean | { correct: boolean; topic?: string; section?: string; seconds?: number }>) {
    const attempt = this.store.diagnosticAttempts.get(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const normalized = answers.map((answer) => (typeof answer === 'boolean' ? { correct: answer } : answer));
    const correct = normalized.filter((answer) => answer.correct).length;
    attempt.status = 'COMPLETED';
    attempt.completedAt = new Date();
    attempt.totalScore = normalized.length ? (correct / normalized.length) * 100 : 0;
    attempt.sectionBreakdown = normalized.reduce<Record<string, number>>((acc, answer) => {
      if (answer.section) {
        acc[answer.section] = (acc[answer.section] ?? 0) + (answer.correct ? 1 : 0);
      }
      return acc;
    }, {});
    attempt.topicBreakdown = normalized.reduce<Record<string, number>>((acc, answer) => {
      if (answer.topic) {
        acc[answer.topic] = (acc[answer.topic] ?? 0) + (answer.correct ? 1 : 0);
      }
      return acc;
    }, {});
    attempt.timingBreakdown = normalized.reduce<Record<string, number>>((acc, answer, index) => {
      acc[`q${index + 1}`] = answer.seconds ?? 0;
      return acc;
    }, {});
    attempt.updatedAt = new Date();
    this.store.diagnosticAttempts.set(attempt.id, attempt);
    return attempt;
  }

  getRecommendations(attemptId: string) {
    const attempt = this.store.diagnosticAttempts.get(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }
    const weakTopics = Object.entries(attempt.topicBreakdown)
      .filter(([, score]) => score === 0)
      .map(([topic]) => topic);
    return {
      attemptId,
      weakTopics,
      recommendedActions: weakTopics.length ? ['Book a concept session', 'Generate a study plan'] : ['Schedule a mock session'],
    };
  }
}
