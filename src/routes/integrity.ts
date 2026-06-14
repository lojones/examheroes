import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, type AuthenticatedRequest } from '../kernel/common';
import { type ReturnTypeContext } from './shared';

export function createIntegrityRouter(context: ReturnTypeContext) {
  const router = Router();
  router.use('/integrity', authenticate(context.config));

  router.post('/integrity/attestations', (req: AuthenticatedRequest, res) => {
    const examProgramId = String((req.body as { examProgramId?: string }).examProgramId ?? '');
    const policy = Array.from(context.store.integrityPolicies.values())
      .filter((item) => item.examProgramId === examProgramId)
      .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0];
    if (!policy) {
      res.status(404).json({ error: 'Integrity policy not found' });
      return;
    }
    const attestation = {
      id: uuidv4(),
      userId: req.user!.sub,
      integrityPolicyId: policy.id,
      attestedAt: new Date(),
      ipAddress: req.ip,
      createdAt: new Date(),
    };
    context.store.integrityAttestations.set(attestation.id, attestation);
    res.status(201).json(attestation);
  });

  router.post('/integrity/reports', (req: AuthenticatedRequest, res) => {
    const report = context.services.integrityModerationService.createReport({
      reporterUserId: req.user!.sub,
      reportedUserId: (req.body as { reportedUserId?: string }).reportedUserId,
      bookingId: (req.body as { bookingId?: string }).bookingId,
      reportType: String((req.body as { reportType?: string }).reportType ?? 'general'),
      description: String((req.body as { description?: string }).description ?? ''),
      evidenceUrls: ((req.body as { evidenceUrls?: string[] }).evidenceUrls ?? []) as string[],
    });
    res.status(201).json(report);
  });

  return router;
}
