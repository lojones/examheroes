"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStudyPlansRouter = createStudyPlansRouter;
const express_1 = require("express");
const common_1 = require("../kernel/common");
function createStudyPlansRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/study-plans', (0, common_1.authenticate)(context.config));
    router.post('/study-plans', (req, res) => {
        const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        const body = req.body;
        res.status(201).json(context.services.studyPlanService.generatePlan(buyerProfile.id, String(body.examProgramId ?? ''), body.diagnosticAttemptId, body.targetDate ? (0, common_1.parseDate)(body.targetDate) : undefined));
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
        res.json(context.services.studyPlanService.updateTask(req.params.id, req.params.taskId, req.body.status));
    });
    router.post('/study-plans/:id/regenerate', (req, res) => {
        res.json(context.services.studyPlanService.regeneratePlan(req.params.id));
    });
    return router;
}
//# sourceMappingURL=study-plans.js.map