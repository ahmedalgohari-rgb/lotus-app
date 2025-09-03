"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.performanceMonitor = exports.securityLogger = exports.authLogger = exports.errorLogger = exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const perf_hooks_1 = require("perf_hooks");
const requestLogger = (req, res, next) => {
    const startTime = perf_hooks_1.performance.now();
    req.startTime = startTime;
    const requestId = req.get('X-Request-ID') ||
        `lotus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    const requestLog = {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date().toISOString()
    };
    if (req.path.includes('/auth') || req.path.includes('/admin')) {
        logger_1.logger.info({
            ...requestLog,
            message: 'Sensitive endpoint accessed',
            path: req.path
        });
    }
    const originalSend = res.send;
    res.send = function (body) {
        const endTime = perf_hooks_1.performance.now();
        const responseTime = Math.round(endTime - startTime);
        const completeLog = {
            ...requestLog,
            statusCode: res.statusCode,
            responseTime,
            contentLength: Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body || '', 'utf8'),
            userId: req.user?.id
        };
        if (res.statusCode >= 500) {
            logger_1.logger.error({
                ...completeLog,
                message: 'Server error response'
            });
        }
        else if (res.statusCode >= 400) {
            logger_1.logger.warn({
                ...completeLog,
                message: 'Client error response'
            });
        }
        else {
            logger_1.logger.info({
                ...completeLog,
                message: 'Request completed'
            });
        }
        if (responseTime > 5000) {
            logger_1.logger.warn({
                ...completeLog,
                message: 'Slow request detected',
                threshold: '5000ms'
            });
        }
        return originalSend.call(this, body);
    };
    next();
};
exports.requestLogger = requestLogger;
const errorLogger = (error, req, res, next) => {
    const endTime = perf_hooks_1.performance.now();
    const responseTime = req.startTime ? Math.round(endTime - req.startTime) : 0;
    const errorLog = {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: error.statusCode || 500
        },
        responseTime,
        timestamp: new Date().toISOString()
    };
    if (error.statusCode && error.statusCode < 500) {
        logger_1.logger.warn({
            ...errorLog,
            message: 'Client error occurred'
        });
    }
    else {
        logger_1.logger.error({
            ...errorLog,
            message: 'Server error occurred'
        });
    }
    next(error);
};
exports.errorLogger = errorLogger;
const authLogger = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        const isSuccess = res.statusCode < 400;
        const email = req.body?.email || 'unknown';
        const provider = req.body?.provider || 'email';
        const authLog = {
            requestId: req.get('X-Request-ID'),
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            email,
            provider,
            success: isSuccess,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
        };
        if (isSuccess) {
            logger_1.logger.info({
                ...authLog,
                message: 'Authentication successful'
            });
        }
        else {
            logger_1.logger.warn({
                ...authLog,
                message: 'Authentication failed',
                attempt: 'failed'
            });
        }
        return originalSend.call(this, body);
    };
    next();
};
exports.authLogger = authLogger;
exports.securityLogger = {
    suspiciousActivity: (req, reason, details) => {
        logger_1.logger.warn({
            message: 'Suspicious activity detected',
            reason,
            details,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            userId: req.user?.id,
            timestamp: new Date().toISOString(),
            severity: 'medium'
        });
    },
    authorizationFailure: (req, resource, action) => {
        logger_1.logger.warn({
            message: 'Authorization failure',
            resource,
            action,
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            timestamp: new Date().toISOString(),
            severity: 'high'
        });
    },
    dataAccess: (req, resource, action) => {
        logger_1.logger.info({
            message: 'Data access',
            resource,
            action,
            userId: req.user?.id,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
    },
    adminAction: (req, action, target) => {
        logger_1.logger.info({
            message: 'Admin action performed',
            action,
            target,
            adminUserId: req.user?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            severity: 'high'
        });
    }
};
const performanceMonitor = (req, res, next) => {
    const startTime = perf_hooks_1.performance.now();
    req.startTime = startTime;
    const originalSend = res.send;
    res.send = function (body) {
        const endTime = perf_hooks_1.performance.now();
        const responseTime = Math.round(endTime - startTime);
        const performanceLog = {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            responseTime,
            statusCode: res.statusCode,
            contentLength: Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body || '', 'utf8'),
            timestamp: new Date().toISOString()
        };
        if (responseTime > 10000) {
            logger_1.logger.error({
                ...performanceLog,
                message: 'Critical performance issue',
                severity: 'critical'
            });
        }
        else if (responseTime > 5000) {
            logger_1.logger.warn({
                ...performanceLog,
                message: 'Performance issue detected',
                severity: 'medium'
            });
        }
        return originalSend.call(this, body);
    };
    next();
};
exports.performanceMonitor = performanceMonitor;
exports.auditLogger = {
    userAction: (userId, action, details, performedBy) => {
        logger_1.logger.info({
            message: 'User action audit',
            userId,
            action,
            details,
            performedBy: performedBy || userId,
            timestamp: new Date().toISOString(),
            category: 'user_management'
        });
    },
    dataModification: (userId, resource, action, resourceId, changes) => {
        logger_1.logger.info({
            message: 'Data modification audit',
            userId,
            resource,
            action,
            resourceId,
            changes,
            timestamp: new Date().toISOString(),
            category: 'data_modification'
        });
    },
    securityEvent: (event, details, severity = 'medium') => {
        logger_1.logger.warn({
            message: 'Security event audit',
            event,
            details,
            severity,
            timestamp: new Date().toISOString(),
            category: 'security'
        });
    }
};
//# sourceMappingURL=logging.middleware.js.map