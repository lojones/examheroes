import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { signToken, verifyToken } from './common';
import { type KernelContext } from './index';
import { UserRole, VerificationStatus } from '../types/marketmesh';

export function createAuthRouter({ config, hooks, store }: KernelContext) {
  const router = Router();

  router.post('/auth/register', async (req, res) => {
    const { email, password, asBuyer, asSeller, displayName, timezone } = req.body as {
      email?: string;
      password?: string;
      asBuyer?: boolean;
      asSeller?: boolean;
      displayName?: string;
      timezone?: string;
    };

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
    const role = asSeller ? UserRole.HERO : UserRole.LEARNER;
    const user = {
      id: uuidv4(),
      email,
      passwordHash: await bcrypt.hash(password, 10),
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
        id: uuidv4(),
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
        id: uuidv4(),
        userId: user.id,
        displayName: displayName ?? email.split('@')[0],
        bio: undefined,
        verificationStatus: VerificationStatus.PENDING,
        payoutSetup: false,
        createdAt: now,
        updatedAt: now,
      };
      store.sellerProfiles.set(sellerProfile.id, sellerProfile);
      await hooks.customizeSellerOnboarding?.(sellerProfile, store);
    }

    const accessToken = signToken(config, { sub: user.id, role: user.role, email: user.email, type: 'access' }, config.accessTokenTtl);
    const refreshToken = signToken(config, { sub: user.id, role: user.role, email: user.email, type: 'refresh' }, config.refreshTokenTtl);
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
    const { email, password } = req.body as { email?: string; password?: string };
    const user = Array.from(store.users.values()).find((item) => item.email.toLowerCase() === email?.toLowerCase());
    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = signToken(config, { sub: user.id, role: user.role, email: user.email, type: 'access' }, config.accessTokenTtl);
    const refreshToken = signToken(config, { sub: user.id, role: user.role, email: user.email, type: 'refresh' }, config.refreshTokenTtl);
    store.refreshTokens.set(refreshToken, { userId: user.id, expiresAt: Date.now() + config.refreshTokenTtl * 1000 });
    res.json({ accessToken, refreshToken });
  });

  router.post('/auth/refresh', (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken || !store.refreshTokens.has(refreshToken)) {
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
      const accessToken = signToken(config, { sub: user.id, role: user.role, email: user.email, type: 'access' }, config.accessTokenTtl);
      res.json({ accessToken });
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  });

  return router;
}
