"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyPlanService = void 0;
const uuid_1 = require("uuid");
class StudyPlanService {
    constructor(store) {
        this.store = store;
    }
    generatePlan(buyerProfileId, examProgramId, diagnosticAttemptId, targetDate) {
        const attempt = diagnosticAttemptId ? this.store.diagnosticAttempts.get(diagnosticAttemptId) : undefined;
        const planId = (0, uuid_1.v4)();
        const weakTopics = attempt ? Object.keys(attempt.topicBreakdown).filter((topic) => attempt.topicBreakdown[topic] === 0) : [];
        const fallbackTopics = Array.from(this.store.examTopics.values())
            .filter((topic) => this.store.examSections.get(topic.examSectionId)?.examProgramId === examProgramId)
            .slice(0, 3)
            .map((topic) => topic.id);
        const topicIds = weakTopics.length ? weakTopics : fallbackTopics;
        const tasks = topicIds.map((topicId, index) => {
            const task = {
                id: (0, uuid_1.v4)(),
                studyPlanId: planId,
                title: `Review ${topicId}`,
                description: 'Complete focused practice and review notes.',
                topicId,
                dueDate: targetDate,
                status: 'PENDING',
                priority: index + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.store.studyPlanTasks.set(task.id, task);
            return task;
        });
        const plan = {
            id: planId,
            buyerProfileId,
            examProgramId,
            bookingId: undefined,
            targetDate,
            generatedAt: new Date(),
            tasks,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.store.studyPlans.set(plan.id, plan);
        return plan;
    }
    getPlan(id) {
        const plan = this.store.studyPlans.get(id);
        if (!plan) {
            return undefined;
        }
        return {
            ...plan,
            tasks: Array.from(this.store.studyPlanTasks.values()).filter((task) => task.studyPlanId === id),
        };
    }
    updateTask(planId, taskId, status) {
        const plan = this.store.studyPlans.get(planId);
        const task = this.store.studyPlanTasks.get(taskId);
        if (!plan || !task || task.studyPlanId !== planId) {
            throw new Error('Study plan task not found');
        }
        task.status = status;
        task.updatedAt = new Date();
        this.store.studyPlanTasks.set(task.id, task);
        return task;
    }
    regeneratePlan(planId) {
        const plan = this.store.studyPlans.get(planId);
        if (!plan) {
            throw new Error('Study plan not found');
        }
        const retainedTasks = Array.from(this.store.studyPlanTasks.values()).filter((task) => task.studyPlanId === planId && task.status !== 'COMPLETED');
        plan.tasks = retainedTasks;
        plan.generatedAt = new Date();
        plan.updatedAt = new Date();
        this.store.studyPlans.set(plan.id, plan);
        return this.getPlan(planId);
    }
}
exports.StudyPlanService = StudyPlanService;
//# sourceMappingURL=StudyPlanService.js.map