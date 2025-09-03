"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateLimit = exports.emailRateLimit = exports.globalRateLimit = exports.registrationRateLimit = exports.authSlowDown = exports.uploadRateLimit = exports.apiRateLimit = exports.passwordResetRateLimit = exports.authRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const logger_1 = require("../utils/logger");
const generateKey = (req) => {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userAgentHash = Buffer.from(userAgent.substring(0, 50)).toString('base64').substring(0, 10);
    return `${ip}:${userAgentHash}`;
};
const rateLimitHandler = (req, res) => {
    const key = generateKey(req);
    logger_1.logger.warn({
        message: 'Rate limit exceeded',
        key,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    res.status(429).json({
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: res.getHeader('Retry-After')
        }
    });
};
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts. Please try again in 15 minutes.'
        }
    }
});
exports.passwordResetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    message: {
        success: false,
        error: {
            code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
            message: 'Too many password reset attempts. Please try again in 1 hour.'
        }
    }
});
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    message: {
        success: false,
        error: {
            code: 'API_RATE_LIMIT_EXCEEDED',
            message: 'Too many API requests. Please try again later.'
        }
    }
});
exports.uploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 50,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    message: {
        success: false,
        error: {
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
            message: 'Too many file uploads. Please try again later.'
        }
    }
});
exports.authSlowDown = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 2,
    delayMs: 500,
    maxDelayMs: 20000,
    keyGenerator: generateKey
});
exports.registrationRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    message: {
        success: false,
        error: {
            code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
            message: 'Too many registration attempts. Please try again in 1 hour.'
        }
    }
});
exports.globalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    message: {
        success: false,
        error: {
            code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
            message: 'Server is experiencing high traffic. Please try again later.'
        }
    }
});
const emailRateLimit = (maxAttempts = 5, windowMs = 60 * 60 * 1000) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxAttempts,
        keyGenerator: (req) => {
            const email = req.body?.email || req.query?.email || 'unknown';
            return `email:${email.toLowerCase()}`;
        },
        handler: rateLimitHandler,
        message: {
            success: false,
            error: {
                code: 'EMAIL_RATE_LIMIT_EXCEEDED',
                message: 'Too many requests for this email address. Please try again later.'
            }
        }
    });
};
exports.emailRateLimit = emailRateLimit;
const userRateLimit = (maxAttempts = 200, windowMs = 15 * 60 * 1000) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxAttempts,
        keyGenerator: (req) => {
            const userId = req.user?.id || generateKey(req);
            return `user:${userId}`;
        },
        handler: rateLimitHandler,
        message: {
            success: false,
            error: {
                code: 'USER_RATE_LIMIT_EXCEEDED',
                message: 'Too many requests from your account. Please try again later.'
            }
        }
    });
};
exports.userRateLimit = userRateLimit;
//# sourceMappingURL=rateLimiting.middleware.js.map