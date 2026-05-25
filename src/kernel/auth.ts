import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { signToken, verifyToken } from './common';
import { type KernelContext } from './index';
import type { Role } from '../types/marketmesh';

export function createAuthRouter({ config, hooks, store }: KernelContext) {
  const router = Router();
  const accessTtl = config.accessTokenTtlSeconds ?? 900;
  const refreshTtl = config.refreshTokenTtlSeconds ?? 604800;

  router.post('/auth/register', async (req, res) => {
    const { email, password, asBuyer, asSeller, displayName, timezone, bio, phone, avatarUrl } = req.body as {
      email?: string;
      password?: string;
      asBuyer?: boolean;
      asSeller?: boolean;
      displayName?: string;
      timezone?: string;
      bio?: string;
      phone?: string;
      avatarUrl?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (store.findUserByEmail(email)) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const now = store.now();
    const roles: Role[] = [];
    if (asBuyer !== false) {
      roles.push('BUYER');
    }
    if (asSeller) {
      roles.push('SELLER');
    }

    const salt = await bcrypt.genSalt(10);
    const user = {
      id: store.id(),
      email,
      passwordHash: await bcrypt.hash(password, salt),
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
        verificationStatus: 'PENDING' as const,
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

    const accessToken = signToken(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'access' }, accessTtl);
    const refreshToken = signToken(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'refresh' }, refreshTtl);

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
    const { email, password } = req.body as { email?: string; password?: string };
    const user = email ? store.findUserByEmail(email) : undefined;
    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = signToken(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'access' }, accessTtl);
    const refreshToken = signToken(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'refresh' }, refreshTtl);
    res.json({ accessToken, refreshToken });
  });

  router.post('/auth/refresh', (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    try {
      const payload = verifyToken(config, refreshToken);
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      const user = store.users.get(payload.sub);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const accessToken = signToken(config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'access' }, accessTtl);
      res.json({ accessToken });
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  });

  return router;
}
