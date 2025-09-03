"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.deviceSchema = exports.oauthSchema = exports.changePasswordSchema = exports.passwordResetSchema = exports.passwordResetRequestSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const emailSchema = zod_1.z.string()
    .email('Invalid email format')
    .min(3, 'Email must be at least 3 characters')
    .max(254, 'Email must not exceed 254 characters')
    .toLowerCase()
    .trim();
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');
exports.registerSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: zod_1.z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'First name can only contain letters and spaces')
        .trim(),
    lastName: zod_1.z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'Last name can only contain letters and spaces')
        .trim(),
    language: zod_1.z.enum(['en', 'ar']).optional().default('en'),
    timezone: zod_1.z.string().optional().default('UTC')
});
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.passwordResetRequestSchema = zod_1.z.object({
    email: emailSchema
});
exports.passwordResetSchema = zod_1.z.object({
    token: zod_1.z.string()
        .min(1, 'Reset token is required')
        .max(256, 'Invalid reset token'),
    password: passwordSchema
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema
});
exports.oauthSchema = zod_1.z.object({
    provider: zod_1.z.enum(['google', 'apple']),
    idToken: zod_1.z.string().min(1, 'ID token is required'),
    clientId: zod_1.z.string().optional()
});
exports.deviceSchema = zod_1.z.object({
    deviceId: zod_1.z.string()
        .min(1, 'Device ID is required')
        .max(255, 'Device ID too long')
        .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid device ID format'),
    deviceInfo: zod_1.z.object({
        platform: zod_1.z.enum(['ios', 'android', 'web']),
        version: zod_1.z.string().optional(),
        model: zod_1.z.string().optional()
    }).optional()
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string()
        .min(1, 'Refresh token is required')
        .max(512, 'Invalid refresh token format')
});
//# sourceMappingURL=auth.validator.js.map