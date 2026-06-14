import crypto from 'crypto';
import multer from 'multer';
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, type AuthenticatedRequest } from '../kernel/common';
import { type ReturnTypeContext } from './shared';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1_000_000 } });

export function createPracticeRouter(context: ReturnTypeContext) {
  const router = Router();
  router.use('/practice', authenticate(context.config));

  router.post('/practice/uploads', upload.single('file'), (req: AuthenticatedRequest, res) => {
    const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!buyerProfile || !req.file) {
      res.status(400).json({ error: 'Buyer profile and file are required' });
      return;
    }
    const uploadRecord = {
      id: uuidv4(),
      buyerProfileId: buyerProfile.id,
      fileName: req.file.originalname,
      fileHash: crypto.createHash('sha256').update(req.file.buffer).digest('hex'),
      fileSizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      sourceDeclaration: undefined,
      status: 'PENDING' as const,
      scanResult: { uploaded: true },
      reviewedBy: undefined,
      reviewedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    context.store.contentUploads.set(uploadRecord.id, uploadRecord);
    res.status(201).json(uploadRecord);
  });

  router.post('/practice/uploads/:id/declare-source', (req, res) => {
    const record = context.store.contentUploads.get(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }
    const declaration = String((req.body as { declaration?: string }).declaration ?? '');
    record.sourceDeclaration = declaration;
    record.status = context.services.contentPolicyService.validateSourceDeclaration(declaration) ? 'APPROVED' : 'FLAGGED';
    record.scanResult = { declarationAccepted: record.status === 'APPROVED' };
    record.updatedAt = new Date();
    context.store.contentUploads.set(record.id, record);
    res.json(record);
  });

  router.get('/practice/uploads/:id/status', (req, res) => {
    const record = context.store.contentUploads.get(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }
    res.json({ id: record.id, status: record.status, scanResult: record.scanResult });
  });

  router.post('/practice/error-log', (req: AuthenticatedRequest, res) => {
    const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!buyerProfile) {
      res.status(403).json({ error: 'Buyer profile required' });
      return;
    }
    const errorLog = {
      id: uuidv4(),
      buyerProfileId: buyerProfile.id,
      examProgramId: String((req.body as { examProgramId?: string }).examProgramId ?? ''),
      topicId: (req.body as { topicId?: string }).topicId,
      questionDescription: String((req.body as { questionDescription?: string }).questionDescription ?? ''),
      errorAnalysis: (req.body as { errorAnalysis?: string }).errorAnalysis,
      heroNotes: undefined,
      createdAt: new Date(),
    };
    context.store.errorLogEntries.set(errorLog.id, errorLog);
    res.status(201).json(errorLog);
  });

  return router;
}
