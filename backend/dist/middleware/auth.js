"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnership = exports.requireRole = exports.optionalAuthMiddleware = exports.authMiddleware = exports.AuthorizationError = exports.AuthenticationError = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class AuthenticationError extends Error {
    statusCode = 401;
    code = 'AUTHENTICATION_ERROR';
    constructor(message = 'Authentication failed') {
        super(message);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    statusCode = 403;
    code = 'AUTHORIZATION_ERROR';
    constructor(message = 'Access denied') {
        super(message);
    }
}
exports.AuthorizationError = AuthorizationError;
const authMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('Missing or invalid authorization header');
        }
        const token = authHeader.substring(7);
        if (!token) {
            throw new AuthenticationError('No token provided');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
            issuer: 'lotus-app',
            audience: 'lotus-api',
        });
        if (decoded.type !== 'access') {
            throw new AuthenticationError('Invalid token type');
        }
        if (decoded.version !== 1) {
            throw new AuthenticationError('Token version mismatch');
        }
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
                deletedAt: null,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isEmailVerified: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            throw new AuthenticationError('User not found');
        }
        if (!user.isEmailVerified && process.env.ENFORCE_EMAIL_VERIFICATION !== 'false') {
            logger_1.logger.warn({
                message: 'Unverified email access attempt',
                userId: user.id,
                email: user.email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            throw new AuthenticationError('Email verification required. Please check your email and verify your account.');
        }
        const refreshToken = await prisma.refreshToken.findFirst({
            where: {
                userId: decoded.userId,
                deviceId: decoded.deviceId,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!refreshToken) {
            throw new AuthenticationError('Session expired');
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            deviceId: decoded.deviceId,
            tokenId: decoded.tokenId,
        };
        logger_1.logger.info({
            message: 'User authenticated',
            userId: user.id,
            email: user.email,
            deviceId: decoded.deviceId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.logger.warn({
                message: 'JWT verification failed',
                error: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            return next(new AuthenticationError('Invalid token'));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.logger.warn({
                message: 'JWT token expired',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            return next(new AuthenticationError('Token expired'));
        }
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    return (0, exports.authMiddleware)(req, res, next);
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AuthenticationError('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn({
                message: 'Insufficient permissions',
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                path: req.path,
            });
            return next(new AuthorizationError('Insufficient permissions'));
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireOwnership = (resourceIdParam = 'id') => {
    return async (req, _res, next) => {
        try {
            if (!req.user) {
                return next(new AuthenticationError('Authentication required'));
            }
            const resourceId = req.params[resourceIdParam];
            const userId = req.user.id;
            const userRole = req.user.role;
            if (userRole === 'ADMIN') {
                return next();
            }
            let isOwner = false;
            if (req.route.path.includes('/plants')) {
                const plant = await prisma.plant.findUnique({
                    where: { id: resourceId },
                    select: { userId: true },
                });
                isOwner = !!(plant && plant.userId === userId);
            }
            else if (req.route.path.includes('/care-logs')) {
                const careLog = await prisma.careLog.findUnique({
                    where: { id: resourceId },
                    select: { userId: true },
                });
                isOwner = !!(careLog && careLog.userId === userId);
            }
            else {
                isOwner = resourceId === userId;
            }
            if (!isOwner) {
                logger_1.logger.warn({
                    message: 'Access denied to resource',
                    userId,
                    resourceId,
                    resourceType: req.route.path,
                });
                return next(new AuthorizationError('Access denied to this resource'));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnership = requireOwnership;
//# sourceMappingURL=auth.js.map