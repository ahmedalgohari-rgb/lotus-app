"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const oauth_service_1 = require("./oauth.service");
const prisma = new client_1.PrismaClient();
class AuthService {
    ACCESS_TOKEN_EXPIRY = '15m';
    REFRESH_TOKEN_EXPIRY = '7d';
    TOKEN_VERSION = 1;
    SALT_ROUNDS = 12;
    oauthService;
    constructor() {
        this.oauthService = new oauth_service_1.OAuthService();
    }
    async register(userData) {
        const { email, password, firstName, lastName, deviceId } = userData;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, this.SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
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
        const tokens = await this.generateTokens(user.id, deviceId);
        logger_1.logger.info({
            message: 'User registered successfully',
            userId: user.id,
            email: user.email,
        });
        return { user, tokens };
    }
    async login(credentials) {
        const { email, password, deviceId } = credentials;
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                passwordHash: true,
                isEmailVerified: true,
                deletedAt: true,
            },
        });
        if (!user || user.deletedAt) {
            throw new Error('Invalid email or password');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, deviceId);
        logger_1.logger.info({
            message: 'User logged in successfully',
            userId: user.id,
            email: user.email,
            deviceId,
        });
        const { passwordHash, deletedAt, ...userResponse } = user;
        return { user: userResponse, tokens };
    }
    async refreshTokens(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
                issuer: 'lotus-app',
                audience: 'lotus-api',
            });
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });
            if (!storedToken || storedToken.revokedAt) {
                throw new Error('Invalid or revoked refresh token');
            }
            if (storedToken.expiresAt < new Date()) {
                throw new Error('Refresh token expired');
            }
            await prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revokedAt: new Date() },
            });
            const newTokens = await this.generateTokens(decoded.userId, decoded.deviceId);
            logger_1.logger.info({
                message: 'Tokens refreshed successfully',
                userId: decoded.userId,
                deviceId: decoded.deviceId,
            });
            return newTokens;
        }
        catch (error) {
            logger_1.logger.warn({
                message: 'Token refresh failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Invalid refresh token');
        }
    }
    async logout(refreshToken) {
        try {
            await prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revokedAt: new Date() },
            });
            logger_1.logger.info({
                message: 'User logged out successfully',
            });
        }
        catch (error) {
            logger_1.logger.warn({
                message: 'Logout failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Logout failed');
        }
    }
    async revokeAllTokens(userId) {
        await prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        logger_1.logger.info({
            message: 'All tokens revoked for user',
            userId,
        });
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.passwordHash) {
            throw new Error('Password not set for this account. This account uses OAuth authentication.');
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, this.SALT_ROUNDS);
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: newPasswordHash,
                    passwordChangedAt: new Date(),
                },
            }),
            prisma.refreshToken.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
        logger_1.logger.info({
            message: 'Password changed successfully',
            userId,
        });
    }
    async googleLogin(idToken, deviceId) {
        try {
            const oauthInfo = await this.oauthService.verifyGoogleToken(idToken);
            const { user, isNewUser } = await this.oauthService.findOrCreateOAuthUser(oauthInfo, deviceId);
            const tokens = await this.generateTokens(user.id, deviceId);
            logger_1.logger.info({
                message: 'Google login successful',
                userId: user.id,
                email: user.email,
                isNewUser,
            });
            return { user: { ...user, isNewUser }, tokens };
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Google login failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async appleLogin(idToken, deviceId) {
        try {
            const oauthInfo = await this.oauthService.verifyAppleToken(idToken);
            const { user, isNewUser } = await this.oauthService.findOrCreateOAuthUser(oauthInfo, deviceId);
            const tokens = await this.generateTokens(user.id, deviceId);
            logger_1.logger.info({
                message: 'Apple login successful',
                userId: user.id,
                email: user.email,
                isNewUser,
            });
            return { user: { ...user, isNewUser }, tokens };
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Apple login failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async linkOAuthProvider(userId, provider, idToken) {
        try {
            let oauthInfo;
            if (provider === 'google') {
                oauthInfo = await this.oauthService.verifyGoogleToken(idToken);
            }
            else {
                oauthInfo = await this.oauthService.verifyAppleToken(idToken);
            }
            await this.oauthService.linkOAuthProvider(userId, oauthInfo);
            logger_1.logger.info({
                message: 'OAuth provider linked successfully',
                userId,
                provider,
            });
        }
        catch (error) {
            logger_1.logger.error({
                message: 'OAuth provider linking failed',
                userId,
                provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async unlinkOAuthProvider(userId, provider) {
        await this.oauthService.unlinkOAuthProvider(userId, provider);
    }
    async getUserOAuthProviders(userId) {
        return this.oauthService.getUserOAuthProviders(userId);
    }
    async setPasswordForOAuthUser(userId, newPassword) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true, authProvider: true },
            });
            if (!user) {
                throw new Error('User not found');
            }
            if (user.passwordHash) {
                throw new Error('Password is already set for this account. Use change password instead.');
            }
            const passwordHash = await bcryptjs_1.default.hash(newPassword, this.SALT_ROUNDS);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash,
                    authProvider: user.authProvider === 'email' ? 'email' : 'multiple',
                    passwordChangedAt: new Date(),
                },
            });
            logger_1.logger.info({
                message: 'Password set for OAuth user',
                userId,
            });
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Failed to set password for OAuth user',
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async generateTokens(userId, deviceId) {
        const tokenId = crypto_1.default.randomBytes(16).toString('hex');
        const accessToken = jsonwebtoken_1.default.sign({
            userId,
            deviceId,
            tokenId,
            type: 'access',
            version: this.TOKEN_VERSION,
        }, process.env.JWT_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRY,
            issuer: 'lotus-app',
            audience: 'lotus-api',
            algorithm: 'HS256',
        });
        const refreshToken = jsonwebtoken_1.default.sign({
            userId,
            deviceId,
            tokenId,
            type: 'refresh',
            version: this.TOKEN_VERSION,
        }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY,
            issuer: 'lotus-app',
            audience: 'lotus-api',
            algorithm: 'HS256',
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                deviceId,
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: 900,
        };
    }
    async verifyToken(token, type) {
        const secret = type === 'access'
            ? process.env.JWT_SECRET
            : process.env.JWT_REFRESH_SECRET;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret, {
                issuer: 'lotus-app',
                audience: 'lotus-api',
            });
            if (decoded.type !== type) {
                throw new Error('Invalid token type');
            }
            if (decoded.version !== this.TOKEN_VERSION) {
                throw new Error('Token version mismatch');
            }
            return decoded;
        }
        catch (error) {
            logger_1.logger.warn({
                message: 'Token verification failed',
                tokenType: type,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Invalid token');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map