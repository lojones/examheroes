"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMeshKernel = void 0;
const express_1 = __importStar(require("express"));
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
function slugify(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function seedPlatformDefaults(config, store) {
    const now = store.now();
    const entries = {
        platformFeePercent: config.platformFeePercent,
        defaultCurrency: config.defaultCurrency,
        accessTokenTtlSeconds: config.accessTokenTtlSeconds ?? 900,
        refreshTokenTtlSeconds: config.refreshTokenTtlSeconds ?? 604800,
    };
    for (const [key, value] of Object.entries(entries)) {
        store.platformConfig.set(key, {
            id: key,
            key,
            value,
            updatedAt: now,
        });
    }
    for (const categoryName of config.categories) {
        const slug = slugify(categoryName);
        if (store.findCategoryBySlug(slug)) {
            continue;
        }
        const category = {
            id: store.id(),
            slug,
            name: categoryName,
            description: `${categoryName} services`,
            metadataSchema: undefined,
            isActive: true,
        };
        store.categories.set(category.id, category);
    }
}
function createModule(routerFactories, context) {
    const router = (0, express_1.Router)();
    for (const factory of routerFactories) {
        router.use(factory(context));
    }
    return { router };
}
class MarketMeshKernel {
    constructor(options) {
        this.store = new store_1.InMemoryMarketMeshStore();
        this.context = {
            config: options.config,
            hooks: options.hooks ?? {},
            store: this.store,
        };
        seedPlatformDefaults(options.config, this.store);
        this.auth = createModule([auth_1.createAuthRouter], this.context);
        this.platform = createModule([profiles_1.createProfilesRouter, categories_1.createCategoriesRouter, admin_1.createAdminRouter], this.context);
        this.marketplace = createModule([services_1.createServicesRouter, availability_1.createAvailabilityRouter, conversations_1.createConversationsRouter, reviews_1.createReviewsRouter], this.context);
        this.bookings = createModule([bookings_1.createBookingsRouter], this.context);
        this.payments = createModule([], this.context);
        this.router = (0, express_1.Router)();
        this.router.use(this.auth.router);
        this.router.use(this.platform.router);
        this.router.use(this.marketplace.router);
        this.router.use(this.bookings.router);
        this.router.use(this.payments.router);
    }
    getRouter() {
        return this.router;
    }
    createApp(prefix = '/api/v1') {
        const app = (0, express_1.default)();
        app.use(prefix, this.getRouter());
        return app;
    }
}
exports.MarketMeshKernel = MarketMeshKernel;
//# sourceMappingURL=index.js.map