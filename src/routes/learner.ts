import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, parseDate, type AuthenticatedRequest } from '../kernel/common';
import { type JsonValue } from '../types/marketmesh';
import { type ReturnTypeContext } from './shared';

export function createLearnerRouter(context: ReturnTypeContext) {
  const router = Router();
  router.post('/exams/:examProgramId/learner-profile', authenticate(context.config), (req: AuthenticatedRequest, res) => {
    const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!buyerProfile) {
      res.status(403).json({ error: 'Buyer profile required' });
      return;
    }
    const body = req.body as {
      targetDate?: string;
      targetScore?: number;
      currentScore?: number;
      weakTopics?: string[];
      budget?: number;
      timezone?: string;
      learningPreferences?: Record<string, unknown>;
      integrityAttestationId?: string;
    };
    const existing = Array.from(context.store.learnerExamProfiles.values()).find(
      (profile) => profile.buyerProfileId === buyerProfile.id && profile.examProgramId === req.params.examProgramId,
    );
    const learnerProfile = {
      id: existing?.id ?? uuidv4(),
      buyerProfileId: buyerProfile.id,
      examProgramId: req.params.examProgramId,
      targetDate: body.targetDate ? parseDate(body.targetDate) : existing?.targetDate,
      targetScore: body.targetScore ?? existing?.targetScore,
      currentScore: body.currentScore ?? existing?.currentScore,
      weakTopics: body.weakTopics ?? existing?.weakTopics ?? [],
      budget: body.budget ?? existing?.budget,
      timezone: body.timezone ?? existing?.timezone ?? 'UTC',
      learningPreferences: (body.learningPreferences ?? existing?.learningPreferences ?? {}) as JsonValue,
      integrityAttestationId: body.integrityAttestationId ?? existing?.integrityAttestationId,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    context.store.learnerExamProfiles.set(learnerProfile.id, learnerProfile);
    res.status(existing ? 200 : 201).json(learnerProfile);
  });
  return router;
}
