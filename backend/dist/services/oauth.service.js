"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const apple_signin_auth_1 = __importDefault(require("apple-signin-auth"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class OAuthService {
    googleClient;
    constructor() {
        this.googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    }
    async verifyGoogleToken(idToken, audience) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: audience || process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Invalid Google token payload');
            }
            logger_1.logger.info({
                message: 'Google token verified successfully',
                providerId: payload.sub,
                email: payload.email,
            });
            return {
                providerId: payload.sub,
                email: payload.email,
                emailVerified: payload.email_verified || false,
                firstName: payload.given_name,
                lastName: payload.family_name,
                avatarUrl: payload.picture,
                locale: payload.locale,
                provider: 'google',
                providerData: payload,
            };
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Google token verification failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Invalid Google token');
        }
    }
    async verifyAppleToken(idToken, clientId = process.env.APPLE_CLIENT_ID) {
        try {
            const payload = await apple_signin_auth_1.default.verifyIdToken(idToken, {
                audience: clientId,
                nonce: 'nonce',
                ignoreExpiration: false,
            });
            if (!payload) {
                throw new Error('Invalid Apple token payload');
            }
            logger_1.logger.info({
                message: 'Apple token verified successfully',
                providerId: payload.sub,
                email: payload.email,
            });
            return {
                providerId: payload.sub,
                email: payload.email || '',
                emailVerified: payload.email_verified || false,
                provider: 'apple',
                providerData: payload,
            };
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Apple token verification failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Invalid Apple token');
        }
    }
    async findOrCreateOAuthUser(oauthInfo, deviceId) {
        try {
            let existingProvider = await prisma.oAuthProvider.findUnique({
                where: {
                    provider_providerId: {
                        provider: oauthInfo.provider,
                        providerId: oauthInfo.providerId,
                    },
                },
                include: { user: true },
            });
            if (existingProvider && existingProvider.user && !existingProvider.user.deletedAt) {
                await prisma.oAuthProvider.update({
                    where: { id: existingProvider.id },
                    data: {
                        email: oauthInfo.email,
                        providerData: JSON.stringify(oauthInfo.providerData),
                        updatedAt: new Date(),
                    },
                });
                const updatedUser = await prisma.user.update({
                    where: { id: existingProvider.user.id },
                    data: { lastLoginAt: new Date() },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                });
                return { user: { ...updatedUser, isNewUser: false }, isNewUser: false };
            }
            let existingUser = await prisma.user.findUnique({
                where: { email: oauthInfo.email },
                include: { oauthProviders: true },
            });
            if (existingUser && !existingUser.deletedAt) {
                await prisma.oAuthProvider.create({
                    data: {
                        userId: existingUser.id,
                        provider: oauthInfo.provider,
                        providerId: oauthInfo.providerId,
                        email: oauthInfo.email,
                        providerData: JSON.stringify(oauthInfo.providerData),
                    },
                });
                const authProvider = existingUser.oauthProviders.length > 0 ? 'multiple' : oauthInfo.provider;
                const updatedUser = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        authProvider,
                        providerVerified: oauthInfo.emailVerified,
                        lastLoginAt: new Date(),
                        firstName: existingUser.firstName || oauthInfo.firstName,
                        lastName: existingUser.lastName || oauthInfo.lastName,
                        avatarUrl: existingUser.avatarUrl || oauthInfo.avatarUrl,
                        isEmailVerified: existingUser.isEmailVerified || oauthInfo.emailVerified,
                    },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                });
                return { user: { ...updatedUser, isNewUser: false }, isNewUser: false };
            }
            const newUser = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: oauthInfo.email,
                        firstName: oauthInfo.firstName,
                        lastName: oauthInfo.lastName,
                        avatarUrl: oauthInfo.avatarUrl,
                        authProvider: oauthInfo.provider,
                        providerVerified: oauthInfo.emailVerified,
                        isEmailVerified: oauthInfo.emailVerified,
                        emailVerifiedAt: oauthInfo.emailVerified ? new Date() : null,
                        language: oauthInfo.locale?.startsWith('ar') ? 'ar' : 'en',
                        lastLoginAt: new Date(),
                    },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                });
                await tx.oAuthProvider.create({
                    data: {
                        userId: user.id,
                        provider: oauthInfo.provider,
                        providerId: oauthInfo.providerId,
                        email: oauthInfo.email,
                        providerData: JSON.stringify(oauthInfo.providerData),
                    },
                });
                return user;
            });
            logger_1.logger.info({
                message: 'New OAuth user created successfully',
                userId: newUser.id,
                provider: oauthInfo.provider,
                email: oauthInfo.email,
            });
            return { user: { ...newUser, isNewUser: true }, isNewUser: true };
        }
        catch (error) {
            logger_1.logger.error({
                message: 'OAuth user creation failed',
                provider: oauthInfo.provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to create OAuth user');
        }
    }
    async linkOAuthProvider(userId, oauthInfo) {
        try {
            const existingProvider = await prisma.oAuthProvider.findUnique({
                where: {
                    provider_providerId: {
                        provider: oauthInfo.provider,
                        providerId: oauthInfo.providerId,
                    },
                },
            });
            if (existingProvider) {
                if (existingProvider.userId === userId) {
                    throw new Error(`${oauthInfo.provider} account is already linked to your account`);
                }
                else {
                    throw new Error(`This ${oauthInfo.provider} account is already linked to another user`);
                }
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { oauthProviders: true },
            });
            if (!user) {
                throw new Error('User not found');
            }
            if (user.email !== oauthInfo.email) {
                throw new Error('OAuth provider email does not match your account email');
            }
            await prisma.$transaction(async (tx) => {
                await tx.oAuthProvider.create({
                    data: {
                        userId,
                        provider: oauthInfo.provider,
                        providerId: oauthInfo.providerId,
                        email: oauthInfo.email,
                        providerData: JSON.stringify(oauthInfo.providerData),
                    },
                });
                const authProvider = user.oauthProviders.length > 0 ? 'multiple' : oauthInfo.provider;
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        authProvider,
                        providerVerified: oauthInfo.emailVerified,
                        avatarUrl: user.avatarUrl || oauthInfo.avatarUrl,
                        isEmailVerified: user.isEmailVerified || oauthInfo.emailVerified,
                    },
                });
            });
            logger_1.logger.info({
                message: 'OAuth provider linked successfully',
                userId,
                provider: oauthInfo.provider,
                email: oauthInfo.email,
            });
        }
        catch (error) {
            logger_1.logger.error({
                message: 'OAuth provider linking failed',
                userId,
                provider: oauthInfo.provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async unlinkOAuthProvider(userId, provider) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { oauthProviders: true },
            });
            if (!user) {
                throw new Error('User not found');
            }
            const otherProviders = user.oauthProviders.filter(p => p.provider !== provider);
            if (!user.passwordHash && otherProviders.length === 0) {
                throw new Error('Cannot unlink the only authentication method. Please set a password first.');
            }
            await prisma.$transaction(async (tx) => {
                await tx.oAuthProvider.deleteMany({
                    where: {
                        userId,
                        provider,
                    },
                });
                let newAuthProvider = 'email';
                if (user.passwordHash && otherProviders.length > 0) {
                    newAuthProvider = 'multiple';
                }
                else if (otherProviders.length === 1) {
                    newAuthProvider = otherProviders[0].provider;
                }
                else if (otherProviders.length > 1) {
                    newAuthProvider = 'multiple';
                }
                await tx.user.update({
                    where: { id: userId },
                    data: { authProvider: newAuthProvider },
                });
            });
            logger_1.logger.info({
                message: 'OAuth provider unlinked successfully',
                userId,
                provider,
            });
        }
        catch (error) {
            logger_1.logger.error({
                message: 'OAuth provider unlinking failed',
                userId,
                provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getUserOAuthProviders(userId) {
        try {
            const providers = await prisma.oAuthProvider.findMany({
                where: { userId },
                select: {
                    provider: true,
                    email: true,
                    createdAt: true,
                },
            });
            return providers;
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Failed to get user OAuth providers',
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to get OAuth providers');
        }
    }
}
exports.OAuthService = OAuthService;
//# sourceMappingURL=oauth.service.js.map