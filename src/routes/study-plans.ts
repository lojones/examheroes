import { Router } from 'express';
import { authenticate, parseDate, type AuthenticatedRequest } from '../kernel/common';
import { type ReturnTypeContext } from './shared';
import { type StudyPlanTaskStatus } from '../types/marketmesh';

export function createStudyPlansRouter(context: ReturnTypeContext) {
  const router = Router();
  router.use('/study-plans', authenticate(context.config));

  router.post('/study-plans', (req: AuthenticatedRequest, res) => {
    const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!buyerProfile) {
      res.status(403).json({ error: 'Buyer profile required' });
      return;
    }
    const body = req.body as { examProgramId?: string; diagnosticAttemptId?: string; targetDate?: string };
    res.status(201).json(
      context.services.studyPlanService.generatePlan(
        buyerProfile.id,
        String(body.examProgramId ?? ''),
        body.diagnosticAttemptId,
        body.targetDate ? parseDate(body.targetDate) : undefined,
      ),
    );
  });

  router.get('/study-plans/:id', (_req, res) => {
    const plan = context.services.studyPlanService.getPlan(_req.params.id);
    if (!plan) {
      res.status(404).json({ error: 'Study plan not found' });
      return;
    }
    res.json(plan);
  });

  router.patch('/study-plans/:id/tasks/:taskId', (req, res) => {
    res.json(context.services.studyPlanService.updateTask(req.params.id, req.params.taskId, (req.body as { status: StudyPlanTaskStatus }).status));
  });

  router.post('/study-plans/:id/regenerate', (req, res) => {
    res.json(context.services.studyPlanService.regeneratePlan(req.params.id));
  });

  return router;
}
