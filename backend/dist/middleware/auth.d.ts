import { Request, Response, NextFunction } from 'express';
export interface JWTPayload {
    userId: string;
    deviceId: string;
    tokenId: string;
    type: 'access' | 'refresh';
    version: number;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        deviceId: string;
        tokenId: string;
    };
}
export declare class AuthenticationError extends Error {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare class AuthorizationError extends Error {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare const authMiddleware: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: string[]) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
export declare const requireOwnership: (resourceIdParam?: string) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map