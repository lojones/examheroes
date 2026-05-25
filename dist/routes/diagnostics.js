"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiagnosticsRouter = createDiagnosticsRouter;
const express_1 = require("express");
const common_1 = require("../kernel/common");
function createDiagnosticsRouter(context) {
    const router = (0, express_1.Router)();
    router.get('/diagnostics', (req, res) => {
        const examProgramId = String(req.query.examProgramId ?? '');
        const diagnostics = Array.from(context.store.diagnosticAssessments.values()).filter((assessment) => !examProgramId || assessment.examProgramId === examProgramId);
        res.json(diagnostics);
    });
    router.post('/diagnostics/:id/start', (0, common_1.authenticate)(context.config), (req, res) => {
        const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        res.status(201).json(context.services.diagnosticService.startAttempt(req.params.id, buyerProfile.id));
    });
    router.post('/diagnostics/attempts/:attemptId/submit', (0, common_1.authenticate)(context.config), (req, res) => {
        const answers = (req.body.answers ?? []);
        res.json(context.services.diagnosticService.submitAttempt(req.params.attemptId, answers));
    });
    router.get('/diagnostics/attempts/:attemptId/recommendations', (0, common_1.authenticate)(context.config), (req, res) => {
        res.json(context.services.diagnosticService.getRecommendations(req.params.attemptId));
    });
    return router;
}
//# sourceMappingURL=diagnostics.js.map