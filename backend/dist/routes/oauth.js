"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRoutes = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const oauth_schemas_1 = require("../schemas/oauth.schemas");
const router = (0, express_1.Router)();
exports.oauthRoutes = router;
const authService = new auth_service_1.AuthService();
const oauthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many OAuth attempts from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const manageLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many provider management attempts from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/google', oauthLimiter, async (req, res) => {
    try {
        const result = oauth_schemas_1.googleOAuthSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors,
            });
        }
        const { idToken, deviceId } = result.data;
        const { user, tokens } = await authService.googleLogin(idToken, deviceId);
        logger_1.logger.info({
            message: 'Google OAuth login successful',
            userId: user.id,
            email: user.email,
            isNewUser: user.isNewUser,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: user.isNewUser ? 'Account created successfully with Google' : 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            tokens: {
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn,
            },
            isNewUser: user.isNewUser,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Google OAuth login failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Google OAuth login failed',
        });
    }
});
router.post('/apple', oauthLimiter, async (req, res) => {
    try {
        const result = oauth_schemas_1.appleOAuthSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors,
            });
        }
        const { idToken, deviceId, clientId } = result.data;
        const { user, tokens } = await authService.appleLogin(idToken, deviceId);
        logger_1.logger.info({
            message: 'Apple OAuth login successful',
            userId: user.id,
            email: user.email,
            isNewUser: user.isNewUser,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: user.isNewUser ? 'Account created successfully with Apple ID' : 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            tokens: {
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn,
            },
            isNewUser: user.isNewUser,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Apple OAuth login failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Apple OAuth login failed',
        });
    }
});
router.post('/link', auth_1.authMiddleware, manageLimiter, async (req, res) => {
    try {
        const result = oauth_schemas_1.linkOAuthProviderSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors,
            });
        }
        const { provider, idToken } = result.data;
        const userId = req.user.id;
        await authService.linkOAuthProvider(userId, provider, idToken);
        logger_1.logger.info({
            message: 'OAuth provider linked successfully',
            userId,
            provider,
            ip: req.ip,
        });
        res.status(200).json({
            message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'OAuth provider linking failed',
            userId: req.user?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
        });
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to link OAuth provider',
        });
    }
});
router.delete('/unlink', auth_1.authMiddleware, manageLimiter, async (req, res) => {
    try {
        const result = oauth_schemas_1.unlinkOAuthProviderSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors,
            });
        }
        const { provider } = result.data;
        const userId = req.user.id;
        await authService.unlinkOAuthProvider(userId, provider);
        logger_1.logger.info({
            message: 'OAuth provider unlinked successfully',
            userId,
            provider,
            ip: req.ip,
        });
        res.status(200).json({
            message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'OAuth provider unlinking failed',
            userId: req.user?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
        });
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to unlink OAuth provider',
        });
    }
});
router.get('/providers', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const providers = await authService.getUserOAuthProviders(userId);
        res.status(200).json({
            providers,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Failed to get OAuth providers',
            userId: req.user?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            error: 'Failed to get OAuth providers',
        });
    }
});
router.post('/set-password', auth_1.authMiddleware, manageLimiter, async (req, res) => {
    try {
        const result = oauth_schemas_1.setOAuthPasswordSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors,
            });
        }
        const { password } = result.data;
        const userId = req.user.id;
        await authService.setPasswordForOAuthUser(userId, password);
        logger_1.logger.info({
            message: 'Password set for OAuth user',
            userId,
            ip: req.ip,
        });
        res.status(200).json({
            message: 'Password set successfully. You can now also sign in with email and password.',
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Failed to set password for OAuth user',
            userId: req.user?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
        });
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to set password',
        });
    }
});
//# sourceMappingURL=oauth.js.map