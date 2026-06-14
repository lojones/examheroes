import { v4 as uuidv4 } from 'uuid';
import { type MarketMeshStore, type StudyPlanTaskStatus } from '../types/marketmesh';

export class StudyPlanService {
  constructor(private readonly store: MarketMeshStore) {}

  generatePlan(buyerProfileId: string, examProgramId: string, diagnosticAttemptId: string | undefined, targetDate?: Date) {
    const attempt = diagnosticAttemptId ? this.store.diagnosticAttempts.get(diagnosticAttemptId) : undefined;
    const planId = uuidv4();
    const weakTopics = attempt ? Object.keys(attempt.topicBreakdown).filter((topic) => attempt.topicBreakdown[topic] === 0) : [];
    const fallbackTopics = Array.from(this.store.examTopics.values())
      .filter((topic) => this.store.examSections.get(topic.examSectionId)?.examProgramId === examProgramId)
      .slice(0, 3)
      .map((topic) => topic.id);
    const topicIds = weakTopics.length ? weakTopics : fallbackTopics;
    const tasks = topicIds.map((topicId, index) => {
      const task = {
        id: uuidv4(),
        studyPlanId: planId,
        title: `Review ${topicId}`,
        description: 'Complete focused practice and review notes.',
        topicId,
        dueDate: targetDate,
        status: 'PENDING' as StudyPlanTaskStatus,
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

  getPlan(id: string) {
    const plan = this.store.studyPlans.get(id);
    if (!plan) {
      return undefined;
    }
    return {
      ...plan,
      tasks: Array.from(this.store.studyPlanTasks.values()).filter((task) => task.studyPlanId === id),
    };
  }

  updateTask(planId: string, taskId: string, status: StudyPlanTaskStatus) {
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

  regeneratePlan(planId: string) {
    const plan = this.store.studyPlans.get(planId);
    if (!plan) {
      throw new Error('Study plan not found');
    }
    const retainedTasks = Array.from(this.store.studyPlanTasks.values()).filter(
      (task) => task.studyPlanId === planId && task.status !== 'COMPLETED',
    );
    plan.tasks = retainedTasks;
    plan.generatedAt = new Date();
    plan.updatedAt = new Date();
    this.store.studyPlans.set(plan.id, plan);
    return this.getPlan(planId);
  }
}
