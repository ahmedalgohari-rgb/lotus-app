import { z } from 'zod';

// Email validation
const emailSchema = z.string()
  .email('Invalid email format')
  .min(3, 'Email must be at least 3 characters')
  .max(254, 'Email must not exceed 254 characters')
  .toLowerCase()
  .trim();

// Password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase letter, one uppercase letter, and one number');

// User registration validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'First name can only contain letters and spaces')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'Last name can only contain letters and spaces')
    .trim(),
  language: z.enum(['en', 'ar']).optional().default('en'),
  timezone: z.string().optional().default('UTC')
});

// User login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Password reset request validation
export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

// Password reset validation
export const passwordResetSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required')
    .max(256, 'Invalid reset token'),
  password: passwordSchema
});

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

// OAuth validation
export const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1, 'ID token is required'),
  clientId: z.string().optional()
});

// Device information validation
export const deviceSchema = z.object({
  deviceId: z.string()
    .min(1, 'Device ID is required')
    .max(255, 'Device ID too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid device ID format'),
  deviceInfo: z.object({
    platform: z.enum(['ios', 'android', 'web']),
    version: z.string().optional(),
    model: z.string().optional()
  }).optional()
});

// Token refresh validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required')
    .max(512, 'Invalid refresh token format')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type DeviceInput = z.infer<typeof deviceSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;