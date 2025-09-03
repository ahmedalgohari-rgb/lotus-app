import { z } from 'zod';
export declare const googleOAuthSchema: z.ZodObject<{
    deviceId: z.ZodString;
} & {
    idToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    deviceId?: string;
    idToken?: string;
}, {
    deviceId?: string;
    idToken?: string;
}>;
export declare const appleOAuthSchema: z.ZodObject<{
    deviceId: z.ZodString;
} & {
    idToken: z.ZodString;
    clientId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    deviceId?: string;
    clientId?: string;
    idToken?: string;
}, {
    deviceId?: string;
    clientId?: string;
    idToken?: string;
}>;
export declare const linkOAuthProviderSchema: z.ZodObject<{
    provider: z.ZodEnum<["google", "apple"]>;
    idToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    provider?: "google" | "apple";
    idToken?: string;
}, {
    provider?: "google" | "apple";
    idToken?: string;
}>;
export declare const unlinkOAuthProviderSchema: z.ZodObject<{
    provider: z.ZodEnum<["google", "apple"]>;
}, "strip", z.ZodTypeAny, {
    provider?: "google" | "apple";
}, {
    provider?: "google" | "apple";
}>;
export declare const setOAuthPasswordSchema: z.ZodEffects<z.ZodObject<{
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password?: string;
    confirmPassword?: string;
}, {
    password?: string;
    confirmPassword?: string;
}>, {
    password?: string;
    confirmPassword?: string;
}, {
    password?: string;
    confirmPassword?: string;
}>;
export declare const verifyProviderSchema: z.ZodObject<{
    provider: z.ZodEnum<["email", "google", "apple"]>;
    credential: z.ZodString;
}, "strip", z.ZodTypeAny, {
    provider?: "email" | "google" | "apple";
    credential?: string;
}, {
    provider?: "email" | "google" | "apple";
    credential?: string;
}>;
export declare const getAuthMethodsSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export type GoogleOAuthRequest = z.infer<typeof googleOAuthSchema>;
export type AppleOAuthRequest = z.infer<typeof appleOAuthSchema>;
export type LinkOAuthProviderRequest = z.infer<typeof linkOAuthProviderSchema>;
export type UnlinkOAuthProviderRequest = z.infer<typeof unlinkOAuthProviderSchema>;
export type SetOAuthPasswordRequest = z.infer<typeof setOAuthPasswordSchema>;
export type VerifyProviderRequest = z.infer<typeof verifyProviderSchema>;
export type GetAuthMethodsRequest = z.infer<typeof getAuthMethodsSchema>;
//# sourceMappingURL=oauth.schemas.d.ts.map