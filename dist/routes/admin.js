"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminHostRouter = createAdminHostRouter;
const express_1 = require("express");
const common_1 = require("../kernel/common");
function createAdminHostRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/admin', (0, common_1.authenticate)(context.config), (0, common_1.requireRole)(['ADMIN']));
    router.post('/admin/hero-review/:sellerProfileId/approve', (req, res) => {
        res.json(context.services.heroVerificationService.approveHero(req.params.sellerProfileId, req.user.sub));
    });
    router.post('/admin/hero-review/:sellerProfileId/suspend', (req, res) => {
        res.json(context.services.heroVerificationService.suspendHero(req.params.sellerProfileId, req.user.sub, String(req.body.reason ?? 'No reason provided')));
    });
    router.get('/admin/moderation/reports', (_req, res) => {
        res.json(Array.from(context.store.integrityReports.values()));
    });
    router.post('/admin/moderation/reports/:id/action', (req, res) => {
        res.json(context.services.integrityModerationService.reviewReport(req.params.id, String(req.body.action ?? 'resolve'), req.user.sub, String(req.body.reason ?? 'Reviewed')));
    });
    return router;
}
//# sourceMappingURL=admin.js.map