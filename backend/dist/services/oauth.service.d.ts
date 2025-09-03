interface OAuthUserInfo {
    providerId: string;
    email: string;
    emailVerified: boolean;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    locale?: string;
    provider: 'google' | 'apple';
    providerData: any;
}
export declare class OAuthService {
    private googleClient;
    constructor();
    verifyGoogleToken(idToken: string, audience?: string): Promise<OAuthUserInfo>;
    verifyAppleToken(idToken: string, clientId?: string): Promise<OAuthUserInfo>;
    findOrCreateOAuthUser(oauthInfo: OAuthUserInfo, deviceId: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
            isNewUser: boolean;
        };
        isNewUser: boolean;
    }>;
    linkOAuthProvider(userId: string, oauthInfo: OAuthUserInfo): Promise<void>;
    unlinkOAuthProvider(userId: string, provider: 'google' | 'apple'): Promise<void>;
    getUserOAuthProviders(userId: string): Promise<Array<{
        provider: string;
        email: string;
        createdAt: Date;
    }>>;
}
export {};
//# sourceMappingURL=oauth.service.d.ts.map