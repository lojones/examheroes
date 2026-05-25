"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLearnerRouter = createLearnerRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("../kernel/common");
function createLearnerRouter(context) {
    const router = (0, express_1.Router)();
    router.post('/exams/:examProgramId/learner-profile', (0, common_1.authenticate)(context.config), (req, res) => {
        const buyerProfile = Array.from(context.store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        const body = req.body;
        const existing = Array.from(context.store.learnerExamProfiles.values()).find((profile) => profile.buyerProfileId === buyerProfile.id && profile.examProgramId === req.params.examProgramId);
        const learnerProfile = {
            id: existing?.id ?? (0, uuid_1.v4)(),
            buyerProfileId: buyerProfile.id,
            examProgramId: req.params.examProgramId,
            targetDate: body.targetDate ? (0, common_1.parseDate)(body.targetDate) : existing?.targetDate,
            targetScore: body.targetScore ?? existing?.targetScore,
            currentScore: body.currentScore ?? existing?.currentScore,
            weakTopics: body.weakTopics ?? existing?.weakTopics ?? [],
            budget: body.budget ?? existing?.budget,
            timezone: body.timezone ?? existing?.timezone ?? 'UTC',
            learningPreferences: body.learningPreferences ?? existing?.learningPreferences ?? {},
            integrityAttestationId: body.integrityAttestationId ?? existing?.integrityAttestationId,
            createdAt: existing?.createdAt ?? new Date(),
            updatedAt: new Date(),
        };
        context.store.learnerExamProfiles.set(learnerProfile.id, learnerProfile);
        res.status(existing ? 200 : 201).json(learnerProfile);
    });
    return router;
}
//# sourceMappingURL=learner.js.map