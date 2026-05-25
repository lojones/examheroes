import { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { type MarketMeshConfig, type MarketMeshStore, UserRole } from '../types/marketmesh';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function signToken(config: MarketMeshConfig, payload: AuthTokenPayload, expiresIn: number): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(config: MarketMeshConfig, token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}

export function authenticate(config: MarketMeshConfig) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      req.user = verifyToken(config, header.slice(7));
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function getUser(store: MarketMeshStore, userId?: string) {
  if (!userId) {
    return undefined;
  }

  return store.users.get(userId);
}

export function requireRole(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}

export function parseDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date');
  }
  return parsed;
}
