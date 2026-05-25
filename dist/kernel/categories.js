"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategoriesRouter = createCategoriesRouter;
const express_1 = require("express");
function createCategoriesRouter({ store }) {
    const router = (0, express_1.Router)();
    router.get('/categories', (_req, res) => {
        res.json(Array.from(store.categories.values()));
    });
    router.get('/categories/:slug', (req, res) => {
        const category = Array.from(store.categories.values()).find((item) => item.slug === req.params.slug);
        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        res.json(category);
    });
    return router;
}
//# sourceMappingURL=categories.js.map