"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthMethodsSchema = exports.verifyProviderSchema = exports.setOAuthPasswordSchema = exports.unlinkOAuthProviderSchema = exports.linkOAuthProviderSchema = exports.appleOAuthSchema = exports.googleOAuthSchema = void 0;
const zod_1 = require("zod");
const baseOAuthSchema = zod_1.z.object({
    deviceId: zod_1.z.string().min(1, 'Device ID is required'),
});
exports.googleOAuthSchema = baseOAuthSchema.extend({
    idToken: zod_1.z.string().min(1, 'Google ID token is required'),
});
exports.appleOAuthSchema = baseOAuthSchema.extend({
    idToken: zod_1.z.string().min(1, 'Apple ID token is required'),
    clientId: zod_1.z.string().optional(),
});
exports.linkOAuthProviderSchema = zod_1.z.object({
    provider: zod_1.z.enum(['google', 'apple']),
    idToken: zod_1.z.string().min(1, 'ID token is required'),
});
exports.unlinkOAuthProviderSchema = zod_1.z.object({
    provider: zod_1.z.enum(['google', 'apple']),
});
exports.setOAuthPasswordSchema = zod_1.z.object({
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
exports.verifyProviderSchema = zod_1.z.object({
    provider: zod_1.z.enum(['email', 'google', 'apple']),
    credential: zod_1.z.string().min(1, 'Credential is required'),
});
exports.getAuthMethodsSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email is required'),
});
//# sourceMappingURL=oauth.schemas.js.map