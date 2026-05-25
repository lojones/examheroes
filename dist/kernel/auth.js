"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRouter = createAuthRouter;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("./common");
const marketmesh_1 = require("../types/marketmesh");
function createAuthRouter({ config, hooks, store }) {
    const router = (0, express_1.Router)();
    router.post('/auth/register', async (req, res) => {
        const { email, password, asBuyer, asSeller, displayName, timezone } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const existing = Array.from(store.users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        const now = new Date();
        const role = asSeller ? marketmesh_1.UserRole.HERO : marketmesh_1.UserRole.LEARNER;
        const user = {
            id: (0, uuid_1.v4)(),
            email,
            passwordHash: await bcryptjs_1.default.hash(password, 10),
            role,
            emailVerified: false,
            mfaEnabled: false,
            createdAt: now,
            updatedAt: now,
        };
        store.users.set(user.id, user);
        let buyerProfile;
        let sellerProfile;
        if (asBuyer) {
            buyerProfile = {
                id: (0, uuid_1.v4)(),
                userId: user.id,
                displayName: displayName ?? email.split('@')[0],
                timezone: timezone ?? 'UTC',
                bio: undefined,
                createdAt: now,
                updatedAt: now,
            };
            store.buyerProfiles.set(buyerProfile.id, buyerProfile);
        }
        if (asSeller) {
            sellerProfile = {
                id: (0, uuid_1.v4)(),
                userId: user.id,
                displayName: displayName ?? email.split('@')[0],
                bio: undefined,
                verificationStatus: marketmesh_1.VerificationStatus.PENDING,
                payoutSetup: false,
                createdAt: now,
                updatedAt: now,
            };
            store.sellerProfiles.set(sellerProfile.id, sellerProfile);
            await hooks.customizeSellerOnboarding?.(sellerProfile, store);
        }
        const accessToken = (0, common_1.signToken)(config, { sub: user.id, role: user.role, email: user.email, type: 'access' }, config.accessTokenTtl);
        const refreshToken = (0, common_1.signToken)(config, { sub: user.id, role: user.role, email: user.email, type: 'refresh' }, config.refreshTokenTtl);
        store.refreshTokens.set(refreshToken, { userId: user.id, expiresAt: Date.now() + config.refreshTokenTtl * 1000 });
        res.status(201).json({
            user: { ...user, passwordHash: undefined },
            buyerProfile,
            sellerProfile,
            accessToken,
            refreshToken,
        });
    });
    router.post('/auth/login', async (req, res) => {
        const { email, password } = req.body;
        const user = Array.from(store.users.values()).find((item) => item.email.toLowerCase() === email?.toLowerCase());
        if (!user || !password || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const accessToken = (0, common_1.signToken)(config, { sub: user.id, role: user.role, email: user.email, type: 'access' }, config.accessTokenTtl);
        const refreshToken = (0, common_1.signToken)(config, { sub: user.id, role: user.role, email: user.email, type: 'refresh' }, config.refreshTokenTtl);
        store.refreshTokens.set(refreshToken, { userId: user.id, expiresAt: Date.now() + config.refreshTokenTtl * 1000 });
        res.json({ accessToken, refreshToken });
    });
    router.post('/auth/refresh', (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken || !store.refreshTokens.has(refreshToken)) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        try {
            const payload = (0, common_1.verifyToken)(config, refreshToken);
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            const user = store.users.get(payload.sub);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const accessToken = (0, common_1.signToken)(config, { sub: user.id, role: user.role, email: user.email, type: 'access' }, config.accessTokenTtl);
            res.json({ accessToken });
        }
        catch {
            res.status(401).json({ error: 'Invalid refresh token' });
        }
    });
    return router;
}
//# sourceMappingURL=auth.js.map