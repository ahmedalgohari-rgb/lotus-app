"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.authRoutes = router;
const authService = new auth_service_1.AuthService();
const getAuthUser = (req) => req.user;
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (req.body && req.body.email) || req.ip;
    },
    skipSuccessfulRequests: true,
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character'),
    firstName: zod_1.z.string().min(1, 'First name required').max(50).optional(),
    lastName: zod_1.z.string().min(1, 'Last name required').max(50).optional(),
    deviceId: zod_1.z.string().uuid('Invalid device ID'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
    deviceId: zod_1.z.string().uuid('Invalid device ID'),
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'New password must contain uppercase, lowercase, number, and special character'),
});
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: error.errors.map(err => ({
                            field: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, deviceId } = req.body;
        const result = await authService.register({
            email,
            password,
            firstName,
            lastName,
            deviceId,
        });
        logger_1.logger.info({
            message: 'User registration successful',
            userId: result.user.id,
            email: result.user.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.status(201).json({
            message: 'Registration successful',
            user: result.user,
            tokens: result.tokens,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Registration failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({
                error: {
                    code: 'USER_ALREADY_EXISTS',
                    message: 'A user with this email address already exists',
                },
            });
            return;
        }
        next(error);
    }
});
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password, deviceId } = req.body;
        const result = await authService.login({
            email,
            password,
            deviceId,
        });
        logger_1.logger.info({
            message: 'User login successful',
            userId: result.user.id,
            email: result.user.email,
            deviceId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.json({
            message: 'Login successful',
            user: result.user,
            tokens: result.tokens,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Login failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        if (error instanceof Error && error.message.includes('Invalid email or password')) {
            res.status(401).json({
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                },
            });
            return;
        }
        next(error);
    }
});
router.post('/refresh', validate(refreshSchema), async (req, res, _next) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshTokens(refreshToken);
        logger_1.logger.info({
            message: 'Token refresh successful',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.json({
            message: 'Token refreshed successfully',
            tokens,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Token refresh failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.status(401).json({
            error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token',
            },
        });
    }
});
router.post('/logout', validate(refreshSchema), async (req, res, _next) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);
        logger_1.logger.info({
            message: 'User logout successful',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.json({
            message: 'Logout successful',
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Logout failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.json({
            message: 'Logout successful',
        });
    }
});
router.get('/me', auth_1.authMiddleware, (async (req, res, next) => {
    try {
        const user = getAuthUser(req);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/change-password', auth_1.authMiddleware, validate(changePasswordSchema), (async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = getAuthUser(req).id;
        await authService.changePassword(userId, currentPassword, newPassword);
        logger_1.logger.info({
            message: 'Password change successful',
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.json({
            message: 'Password changed successfully. Please login again.',
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Password change failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: getAuthUser(req).id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        if (error instanceof Error && error.message.includes('Current password is incorrect')) {
            res.status(400).json({
                error: {
                    code: 'INVALID_CURRENT_PASSWORD',
                    message: 'Current password is incorrect',
                },
            });
            return;
        }
        next(error);
    }
}));
router.post('/revoke-all-tokens', auth_1.authMiddleware, (async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        await authService.revokeAllTokens(userId);
        logger_1.logger.info({
            message: 'All tokens revoked',
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        res.json({
            message: 'All tokens revoked successfully. Please login again.',
        });
    }
    catch (error) {
        next(error);
    }
}));
//# sourceMappingURL=auth.js.map