"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMeshKernel = void 0;
const express_1 = require("express");
const admin_1 = require("./admin");
const auth_1 = require("./auth");
const availability_1 = require("./availability");
const bookings_1 = require("./bookings");
const categories_1 = require("./categories");
const conversations_1 = require("./conversations");
const profiles_1 = require("./profiles");
const reviews_1 = require("./reviews");
const services_1 = require("./services");
const store_1 = require("./store");
class MarketMeshKernel {
    constructor({ config, hooks, store }) {
        this.context = {
            config,
            hooks,
            store: store ?? new store_1.InMemoryMarketMeshStore(config),
        };
        this.router = (0, express_1.Router)();
        this.mountRoutes();
    }
    mountRoutes() {
        this.router.use((0, auth_1.createAuthRouter)(this.context));
        this.router.use((0, profiles_1.createProfilesRouter)(this.context));
        this.router.use((0, categories_1.createCategoriesRouter)(this.context));
        this.router.use((0, services_1.createServicesRouter)(this.context));
        this.router.use((0, availability_1.createAvailabilityRouter)(this.context));
        this.router.use((0, bookings_1.createBookingsRouter)(this.context));
        this.router.use((0, conversations_1.createConversationsRouter)(this.context));
        this.router.use((0, reviews_1.createReviewsRouter)(this.context));
        this.router.use((0, admin_1.createAdminRouter)(this.context));
    }
    mountOn(app, basePath = '/') {
        app.use(basePath, this.router);
    }
    getRouter() {
        return this.router;
    }
    getStore() {
        return this.context.store;
    }
    getContext() {
        return this.context;
    }
}
exports.MarketMeshKernel = MarketMeshKernel;
//# sourceMappingURL=index.js.map