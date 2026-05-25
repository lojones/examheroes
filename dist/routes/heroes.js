"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHeroesRouter = createHeroesRouter;
const express_1 = require("express");
const common_1 = require("../kernel/common");
function createHeroesRouter(context) {
    const router = (0, express_1.Router)();
    router.get('/heroes/onboarding/me', (0, common_1.authenticate)(context.config), (req, res) => {
        const sellerProfile = Array.from(context.store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!sellerProfile) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }
        const expertise = Array.from(context.store.heroExamExpertise.values()).filter((item) => item.sellerProfileId === sellerProfile.id);
        const credential = Array.from(context.store.heroCredentials.values()).find((item) => item.sellerProfileId === sellerProfile.id);
        res.json({
            sellerProfile,
            credentialSubmitted: Boolean(credential),
            expertiseClaims: expertise,
            canPublish: expertise.some((item) => context.services.heroVerificationService.canPublishService(sellerProfile.id, context.store.examPrograms.get(item.examProgramId)?.slug ?? '')),
        });
    });
    return router;
}
//# sourceMappingURL=heroes.js.map