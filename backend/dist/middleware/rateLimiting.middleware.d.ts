import { RateLimitRequestHandler } from 'express-rate-limit';
export declare const authRateLimit: RateLimitRequestHandler;
export declare const passwordResetRateLimit: RateLimitRequestHandler;
export declare const apiRateLimit: RateLimitRequestHandler;
export declare const uploadRateLimit: RateLimitRequestHandler;
export declare const authSlowDown: any;
export declare const registrationRateLimit: RateLimitRequestHandler;
export declare const globalRateLimit: RateLimitRequestHandler;
export declare const emailRateLimit: (maxAttempts?: number, windowMs?: number) => RateLimitRequestHandler;
export declare const userRateLimit: (maxAttempts?: number, windowMs?: number) => RateLimitRequestHandler;
//# sourceMappingURL=rateLimiting.middleware.d.ts.map