"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressiveAuthRoutes = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const auth_service_1 = require("../services/auth.service");
const oauth_schemas_1 = require("../schemas/oauth.schemas");
const router = (0, express_1.Router)();
exports.progressiveAuthRoutes = router;
const prisma = new client_1.PrismaClient();
const authService = new auth_service_1.AuthService();
const progressiveLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: 'Too many authentication method requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/methods', progressiveLimiter, async (req, res) => {
    try {
        const result = oauth_schemas_1.getAuthMethodsSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors,
            });
        }
        const { email } = result.data;
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                authProvider: true,
                providerVerified: true,
                isEmailVerified: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                deletedAt: true,
                oauthProviders: {
                    select: {
                        provider: true,
                        createdAt: true,
                    },
                },
            },
        });
        const baseResponse = {
            email,
            userExists: !!user && !user.deletedAt,
            methods: [],
            userInfo: null,
        };
        if (!user || user.deletedAt) {
            baseResponse.methods = [
                { type: 'email', available: false },
                { type: 'google', available: false },
                { type: 'apple', available: false },
            ];
            return res.status(200).json(baseResponse);
        }
        const methods = [];
        if (user.passwordHash) {
            methods.push({
                type: 'email',
                available: true,
                verified: user.isEmailVerified,
            });
        }
        const oauthProviders = user.oauthProviders || [];
        const googleProvider = oauthProviders.find(p => p.provider === 'google');
        const appleProvider = oauthProviders.find(p => p.provider === 'apple');
        methods.push({
            type: 'google',
            available: !!googleProvider,
            verified: true,
            addedAt: googleProvider?.createdAt?.toISOString(),
        });
        methods.push({
            type: 'apple',
            available: !!appleProvider,
            verified: true,
            addedAt: appleProvider?.createdAt?.toISOString(),
        });
        baseResponse.userInfo = {
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            primaryAuthProvider: user.authProvider,
        };
        baseResponse.methods = methods;
        logger_1.logger.info({
            message: 'Authentication methods retrieved',
            email,
            methodCount: methods.filter(m => m.available).length,
            ip: req.ip,
        });
        res.status(200).json(baseResponse);
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Failed to get authentication methods',
            email: req.body.email,
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
        });
        res.status(200).json({
            email: req.body.email,
            userExists: false,
            methods: [
                { type: 'email', available: false },
                { type: 'google', available: false },
                { type: 'apple', available: false },
            ],
            userInfo: null,
        });
    }
});
router.post('/verify-provider', progressiveLimiter, async (req, res) => {
    try {
        const result = oauth_schemas_1.verifyProviderSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors,
            });
        }
        const { provider, credential } = result.data;
        let verificationResult = {
            provider,
            valid: false,
            userInfo: null,
            requiresDeviceId: true,
        };
        try {
            if (provider === 'google') {
                const oauthInfo = await authService['oauthService'].verifyGoogleToken(credential);
                verificationResult = {
                    provider: 'google',
                    valid: true,
                    userInfo: {
                        email: oauthInfo.email,
                        firstName: oauthInfo.firstName,
                        lastName: oauthInfo.lastName,
                        avatarUrl: oauthInfo.avatarUrl,
                    },
                    requiresDeviceId: true,
                };
            }
            else if (provider === 'apple') {
                const oauthInfo = await authService['oauthService'].verifyAppleToken(credential);
                verificationResult = {
                    provider: 'apple',
                    valid: true,
                    userInfo: {
                        email: oauthInfo.email,
                        firstName: oauthInfo.firstName,
                        lastName: oauthInfo.lastName,
                    },
                    requiresDeviceId: true,
                };
            }
            else if (provider === 'email') {
                verificationResult = {
                    provider: 'email',
                    valid: credential.length >= 8,
                    userInfo: null,
                    requiresDeviceId: true,
                };
            }
        }
        catch (error) {
            logger_1.logger.warn({
                message: 'Provider verification failed',
                provider,
                error: error instanceof Error ? error.message : 'Unknown error',
                ip: req.ip,
            });
        }
        logger_1.logger.info({
            message: 'Provider verification attempted',
            provider,
            valid: verificationResult.valid,
            ip: req.ip,
        });
        res.status(200).json(verificationResult);
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Provider verification error',
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
        });
        res.status(400).json({
            error: 'Provider verification failed',
        });
    }
});
router.post('/check-email', progressiveLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                error: 'Valid email is required',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
            });
        }
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                deletedAt: true,
                authProvider: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
            },
        });
        const exists = !!user && !user.deletedAt;
        logger_1.logger.info({
            message: 'Email existence check',
            email,
            exists,
            ip: req.ip,
        });
        res.status(200).json({
            email,
            exists,
            userInfo: exists ? {
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
                authProvider: user.authProvider,
            } : null,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Email check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
        });
        res.status(200).json({
            email: req.body.email,
            exists: false,
            userInfo: null,
        });
    }
});
router.get('/oauth-config', (req, res) => {
    try {
        res.status(200).json({
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
            },
            apple: {
                clientId: process.env.APPLE_CLIENT_ID || '',
                enabled: !!(process.env.APPLE_CLIENT_ID),
            },
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Failed to get OAuth config',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            error: 'Failed to get OAuth configuration',
        });
    }
});
//# sourceMappingURL=progressive-auth.js.map