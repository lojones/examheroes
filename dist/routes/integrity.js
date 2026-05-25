"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntegrityRouter = createIntegrityRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("../kernel/common");
function createIntegrityRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/integrity', (0, common_1.authenticate)(context.config));
    router.post('/integrity/attestations', (req, res) => {
        const examProgramId = String(req.body.examProgramId ?? '');
        const policy = Array.from(context.store.integrityPolicies.values())
            .filter((item) => item.examProgramId === examProgramId)
            .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0];
        if (!policy) {
            res.status(404).json({ error: 'Integrity policy not found' });
            return;
        }
        const attestation = {
            id: (0, uuid_1.v4)(),
            userId: req.user.sub,
            integrityPolicyId: policy.id,
            attestedAt: new Date(),
            ipAddress: req.ip,
            createdAt: new Date(),
        };
        context.store.integrityAttestations.set(attestation.id, attestation);
        res.status(201).json(attestation);
    });
    router.post('/integrity/reports', (req, res) => {
        const report = context.services.integrityModerationService.createReport({
            reporterUserId: req.user.sub,
            reportedUserId: req.body.reportedUserId,
            bookingId: req.body.bookingId,
            reportType: String(req.body.reportType ?? 'general'),
            description: String(req.body.description ?? ''),
            evidenceUrls: (req.body.evidenceUrls ?? []),
        });
        res.status(201).json(report);
    });
    return router;
}
//# sourceMappingURL=integrity.js.map