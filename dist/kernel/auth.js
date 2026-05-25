"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRouter = createAuthRouter;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const common_1 = require("./common");
function createAuthRouter({ config, hooks, store }) {
    const router = (0, express_1.Router)();
    const accessTtl = config.accessTokenTtlSeconds ?? 900;
    const refreshTtl = config.refreshTokenTtlSeconds ?? 604800;
    router.post('/auth/register', async (req, res) => {
        const { email, password, asBuyer, asSeller, displayName, timezone, bio, phone, avatarUrl } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        if (store.findUserByEmail(email)) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        const now = store.now();
        const roles = [];
        if (asBuyer !== false) {
            roles.push('BUYER');
        }
        if (asSeller) {
            roles.push('SELLER');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const user = {
            id: store.id(),
            email,
            passwordHash: await bcryptjs_1.default.hash(password, salt),
            salt,
            phone,
            avatarUrl,
            isAdmin: false,
            roles,
            createdAt: now,
            updatedAt: now,
        };
        store.users.set(user.id, user);
        let buyerProfile;
        let sellerProfile;
        let onboarding;
        if (roles.includes('BUYER')) {
            buyerProfile = {
                id: store.id(),
                userId: user.id,
                preferences: {
                    displayName: displayName ?? email.split('@')[0],
                    timezone: timezone ?? 'UTC',
                },
            };
            store.buyerProfiles.set(buyerProfile.id, buyerProfile);
        }
        if (roles.includes('SELLER')) {
            sellerProfile = {
                id: store.id(),
                userId: user.id,
                bio,
                verificationStatus: 'PENDING',
                stripeConnectAccountId: undefined,
                averageRating: 0,
                reviewCount: 0,
                location: timezone ? { timezone } : undefined,
                radiusKm: 0,
                isOnline: false,
            };
            store.sellerProfiles.set(sellerProfile.id, sellerProfile);
            onboarding = await hooks.customizeSellerOnboarding?.(sellerProfile.id);
        }
        const accessToken = (0, common_1.signToken)(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'access' }, accessTtl);
        const refreshToken = (0, common_1.signToken)(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'refresh' }, refreshTtl);
        res.status(201).json({
            user: { ...user, passwordHash: undefined, salt: undefined },
            buyerProfile,
            sellerProfile,
            onboarding,
            accessToken,
            refreshToken,
        });
    });
    router.post('/auth/login', async (req, res) => {
        const { email, password } = req.body;
        const user = email ? store.findUserByEmail(email) : undefined;
        if (!user || !password || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const accessToken = (0, common_1.signToken)(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'access' }, accessTtl);
        const refreshToken = (0, common_1.signToken)(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'refresh' }, refreshTtl);
        res.json({ accessToken, refreshToken });
    });
    router.post('/auth/refresh', (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
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
            const accessToken = (0, common_1.signToken)(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'access' }, accessTtl);
            res.json({ accessToken });
        }
        catch {
            res.status(401).json({ error: 'Invalid refresh token' });
        }
    });
    return router;
}
//# sourceMappingURL=auth.js.map