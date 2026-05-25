"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPracticeRouter = createPracticeRouter;
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("../kernel/common");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 1000000 } });
function createPracticeRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/practice', (0, common_1.authenticate)(context.config));
    router.post('/practice/uploads', upload.single('file'), (req, res) => {
        const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!buyerProfile || !req.file) {
            res.status(400).json({ error: 'Buyer profile and file are required' });
            return;
        }
        const uploadRecord = {
            id: (0, uuid_1.v4)(),
            buyerProfileId: buyerProfile.id,
            fileName: req.file.originalname,
            fileHash: crypto_1.default.createHash('sha256').update(req.file.buffer).digest('hex'),
            fileSizeBytes: req.file.size,
            mimeType: req.file.mimetype,
            sourceDeclaration: undefined,
            status: 'PENDING',
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
        const declaration = String(req.body.declaration ?? '');
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
    router.post('/practice/error-log', (req, res) => {
        const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        const errorLog = {
            id: (0, uuid_1.v4)(),
            buyerProfileId: buyerProfile.id,
            examProgramId: String(req.body.examProgramId ?? ''),
            topicId: req.body.topicId,
            questionDescription: String(req.body.questionDescription ?? ''),
            errorAnalysis: req.body.errorAnalysis,
            heroNotes: undefined,
            createdAt: new Date(),
        };
        context.store.errorLogEntries.set(errorLog.id, errorLog);
        res.status(201).json(errorLog);
    });
    return router;
}
//# sourceMappingURL=practice.js.map