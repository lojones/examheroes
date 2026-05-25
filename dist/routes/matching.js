"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchingRouter = createMatchingRouter;
const express_1 = require("express");
const common_1 = require("../kernel/common");
function createMatchingRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/matching', (0, common_1.authenticate)(context.config));
    router.get('/matching/search', (req, res) => {
        const examProgramId = String(req.query.examProgramId ?? '');
        const run = context.services.matchingService.createMatchRun(String(req.query.buyerProfileId ?? ''), examProgramId, {
            requestDescription: String(req.query.requestDescription ?? ''),
            budget: req.query.budget ? Number(req.query.budget) : undefined,
            topics: typeof req.query.topics === 'string' ? req.query.topics.split(',') : [],
        });
        res.json(run.candidates);
    });
    router.post('/matching/runs', (req, res) => {
        const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        const body = req.body;
        const result = context.services.matchingService.createMatchRun(buyerProfile.id, String(body.examProgramId ?? ''), body.request ?? {});
        res.status(201).json(result);
    });
    router.get('/matching/runs/:id', (req, res) => {
        res.json(context.services.matchingService.getMatchResults(req.params.id));
    });
    return router;
}
//# sourceMappingURL=matching.js.map