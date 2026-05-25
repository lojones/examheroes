"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticService = void 0;
const uuid_1 = require("uuid");
class DiagnosticService {
    constructor(store) {
        this.store = store;
    }
    createAssessment(data) {
        const assessment = {
            id: (0, uuid_1.v4)(),
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
    startAttempt(assessmentId, buyerProfileId) {
        const attempt = {
            id: (0, uuid_1.v4)(),
            diagnosticAssessmentId: assessmentId,
            buyerProfileId,
            status: 'IN_PROGRESS',
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
    submitAttempt(attemptId, answers) {
        const attempt = this.store.diagnosticAttempts.get(attemptId);
        if (!attempt) {
            throw new Error('Attempt not found');
        }
        const normalized = answers.map((answer) => (typeof answer === 'boolean' ? { correct: answer } : answer));
        const correct = normalized.filter((answer) => answer.correct).length;
        attempt.status = 'COMPLETED';
        attempt.completedAt = new Date();
        attempt.totalScore = normalized.length ? (correct / normalized.length) * 100 : 0;
        attempt.sectionBreakdown = normalized.reduce((acc, answer) => {
            if (answer.section) {
                acc[answer.section] = (acc[answer.section] ?? 0) + (answer.correct ? 1 : 0);
            }
            return acc;
        }, {});
        attempt.topicBreakdown = normalized.reduce((acc, answer) => {
            if (answer.topic) {
                acc[answer.topic] = (acc[answer.topic] ?? 0) + (answer.correct ? 1 : 0);
            }
            return acc;
        }, {});
        attempt.timingBreakdown = normalized.reduce((acc, answer, index) => {
            acc[`q${index + 1}`] = answer.seconds ?? 0;
            return acc;
        }, {});
        attempt.updatedAt = new Date();
        this.store.diagnosticAttempts.set(attempt.id, attempt);
        return attempt;
    }
    getRecommendations(attemptId) {
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
exports.DiagnosticService = DiagnosticService;
//# sourceMappingURL=DiagnosticService.js.map