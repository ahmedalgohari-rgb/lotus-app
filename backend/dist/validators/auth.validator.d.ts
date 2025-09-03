import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<["en", "ar"]>>>;
    timezone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    firstName?: string;
    lastName?: string;
    timezone?: string;
    language?: "ar" | "en";
    password?: string;
}, {
    email?: string;
    firstName?: string;
    lastName?: string;
    timezone?: string;
    language?: "ar" | "en";
    password?: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export declare const passwordResetSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token?: string;
    password?: string;
}, {
    token?: string;
    password?: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword?: string;
    newPassword?: string;
}, {
    currentPassword?: string;
    newPassword?: string;
}>;
export declare const oauthSchema: z.ZodObject<{
    provider: z.ZodEnum<["google", "apple"]>;
    idToken: z.ZodString;
    clientId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    clientId?: string;
    provider?: "google" | "apple";
    idToken?: string;
}, {
    clientId?: string;
    provider?: "google" | "apple";
    idToken?: string;
}>;
export declare const deviceSchema: z.ZodObject<{
    deviceId: z.ZodString;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        platform: z.ZodEnum<["ios", "android", "web"]>;
        version: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        version?: string;
        platform?: "ios" | "android" | "web";
        model?: string;
    }, {
        version?: string;
        platform?: "ios" | "android" | "web";
        model?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    deviceId?: string;
    deviceInfo?: {
        version?: string;
        platform?: "ios" | "android" | "web";
        model?: string;
    };
}, {
    deviceId?: string;
    deviceInfo?: {
        version?: string;
        platform?: "ios" | "android" | "web";
        model?: string;
    };
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string;
}, {
    refreshToken?: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type DeviceInput = z.infer<typeof deviceSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
//# sourceMappingURL=auth.validator.d.ts.map