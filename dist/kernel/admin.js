"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRouter = createAdminRouter;
const express_1 = require("express");
const common_1 = require("./common");
function createAdminRouter({ config, store }) {
    const router = (0, express_1.Router)();
    router.use('/admin', (0, common_1.authenticate)(config), (0, common_1.requireRole)(['ADMIN']));
    router.get('/admin/analytics', (_req, res) => {
        res.json({
            users: store.users.size,
            buyers: store.buyerProfiles.size,
            sellers: store.sellerProfiles.size,
            listings: store.services.size,
            bookings: store.bookings.size,
            reviews: store.reviews.size,
            openReports: Array.from(store.integrityReports.values()).filter((report) => report.status === 'OPEN').length,
        });
    });
    return router;
}
//# sourceMappingURL=admin.js.map