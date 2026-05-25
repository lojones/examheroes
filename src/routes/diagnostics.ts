import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../kernel/common';
import { type ReturnTypeContext } from './shared';

export function createDiagnosticsRouter(context: ReturnTypeContext) {
  const router = Router();

  router.get('/diagnostics', (req, res) => {
    const examProgramId = String(req.query.examProgramId ?? '');
    const diagnostics = Array.from(context.store.diagnosticAssessments.values()).filter(
      (assessment) => !examProgramId || assessment.examProgramId === examProgramId,
    );
    res.json(diagnostics);
  });

  router.post('/diagnostics/:id/start', authenticate(context.config), (req: AuthenticatedRequest, res) => {
    const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!buyerProfile) {
      res.status(403).json({ error: 'Buyer profile required' });
      return;
    }
    res.status(201).json(context.services.diagnosticService.startAttempt(req.params.id, buyerProfile.id));
  });

  router.post('/diagnostics/attempts/:attemptId/submit', authenticate(context.config), (req, res) => {
    const answers = ((req.body as { answers?: unknown[] }).answers ?? []) as Array<boolean | { correct: boolean; topic?: string; section?: string; seconds?: number }>;
    res.json(context.services.diagnosticService.submitAttempt(req.params.attemptId, answers));
  });

  router.get('/diagnostics/attempts/:attemptId/recommendations', authenticate(context.config), (req, res) => {
    res.json(context.services.diagnosticService.getRecommendations(req.params.attemptId));
  });

  return router;
}
