import { z } from 'zod';

// Base OAuth request schema
const baseOAuthSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

// Google OAuth login schema
export const googleOAuthSchema = baseOAuthSchema.extend({
  idToken: z.string().min(1, 'Google ID token is required'),
});

// Apple OAuth login schema  
export const appleOAuthSchema = baseOAuthSchema.extend({
  idToken: z.string().min(1, 'Apple ID token is required'),
  clientId: z.string().optional(), // Optional, will use default from env
});

// Link OAuth provider schema
export const linkOAuthProviderSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1, 'ID token is required'),
});

// Unlink OAuth provider schema
export const unlinkOAuthProviderSchema = z.object({
  provider: z.enum(['google', 'apple']),
});

// Set password for OAuth user schema
export const setOAuthPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Progressive authentication - verify existing provider
export const verifyProviderSchema = z.object({
  provider: z.enum(['email', 'google', 'apple']),
  credential: z.string().min(1, 'Credential is required'),
  // For email: this would be password
  // For OAuth: this would be the ID token
});

// Progressive authentication - get available auth methods
export const getAuthMethodsSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export type GoogleOAuthRequest = z.infer<typeof googleOAuthSchema>;
export type AppleOAuthRequest = z.infer<typeof appleOAuthSchema>;
export type LinkOAuthProviderRequest = z.infer<typeof linkOAuthProviderSchema>;
export type UnlinkOAuthProviderRequest = z.infer<typeof unlinkOAuthProviderSchema>;
export type SetOAuthPasswordRequest = z.infer<typeof setOAuthPasswordSchema>;
export type VerifyProviderRequest = z.infer<typeof verifyProviderSchema>;
export type GetAuthMethodsRequest = z.infer<typeof getAuthMethodsSchema>;