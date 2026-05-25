import { type NextFunction, type Request, type Response } from 'express';
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
export declare function signToken(config: MarketMeshConfig, payload: AuthTokenPayload, expiresIn: number): string;
export declare function verifyToken(config: MarketMeshConfig, token: string): AuthTokenPayload;
export declare function authenticate(config: MarketMeshConfig): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function getUser(store: MarketMeshStore, userId?: string): import("../types/marketmesh").User | undefined;
export declare function requireRole(roles: UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function parseDate(value: string): Date;
//# sourceMappingURL=common.d.ts.map