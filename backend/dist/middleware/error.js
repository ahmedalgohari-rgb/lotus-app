"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    logger_1.logger.error({
        error: err.message,
        stack: err.stack,
        statusCode,
        code,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : err.message;
    res.status(statusCode).json({
        error: {
            code,
            message,
            timestamp: new Date().toISOString(),
            path: req.path,
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map