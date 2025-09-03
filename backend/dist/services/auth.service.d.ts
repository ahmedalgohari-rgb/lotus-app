import { JWTPayload } from '../middleware/auth';
export declare class AuthService {
    private readonly ACCESS_TOKEN_EXPIRY;
    private readonly REFRESH_TOKEN_EXPIRY;
    private readonly TOKEN_VERSION;
    private readonly SALT_ROUNDS;
    private oauthService;
    constructor();
    register(userData: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        deviceId: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    login(credentials: {
        email: string;
        password: string;
        deviceId: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(refreshToken: string): Promise<void>;
    revokeAllTokens(userId: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    googleLogin(idToken: string, deviceId: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
            isNewUser: boolean;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    appleLogin(idToken: string, deviceId: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
            isNewUser: boolean;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    linkOAuthProvider(userId: string, provider: 'google' | 'apple', idToken: string): Promise<void>;
    unlinkOAuthProvider(userId: string, provider: 'google' | 'apple'): Promise<void>;
    getUserOAuthProviders(userId: string): Promise<Array<{
        provider: string;
        email: string;
        createdAt: Date;
    }>>;
    setPasswordForOAuthUser(userId: string, newPassword: string): Promise<void>;
    private generateTokens;
    verifyToken(token: string, type: 'access' | 'refresh'): Promise<JWTPayload>;
}
//# sourceMappingURL=auth.service.d.ts.map