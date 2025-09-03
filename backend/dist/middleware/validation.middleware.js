"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRequestId = exports.validateIP = exports.validateFileUpload = exports.sanitizeString = exports.validateMultiple = exports.validate = exports.ValidationError = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
class ValidationError extends Error {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    errors;
    constructor(message, errors) {
        super(message);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            let dataToValidate;
            switch (target) {
                case 'body':
                    dataToValidate = req.body;
                    break;
                case 'params':
                    dataToValidate = req.params;
                    break;
                case 'query':
                    dataToValidate = req.query;
                    break;
                case 'headers':
                    dataToValidate = req.headers;
                    break;
                default:
                    dataToValidate = req.body;
            }
            const validatedData = schema.parse(dataToValidate);
            switch (target) {
                case 'body':
                    req.body = validatedData;
                    break;
                case 'params':
                    req.params = validatedData;
                    break;
                case 'query':
                    req.query = validatedData;
                    break;
                case 'headers':
                    req.headers = validatedData;
                    break;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                    received: err.received
                }));
                logger_1.logger.warn({
                    message: 'Validation failed',
                    target,
                    errors: validationErrors,
                    url: req.url,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                const validationError = new ValidationError('Input validation failed', validationErrors);
                return next(validationError);
            }
            next(error);
        }
    };
};
exports.validate = validate;
const validateMultiple = (validations) => {
    return (req, res, next) => {
        const errors = [];
        for (const validation of validations) {
            try {
                let dataToValidate;
                switch (validation.target) {
                    case 'body':
                        dataToValidate = req.body;
                        break;
                    case 'params':
                        dataToValidate = req.params;
                        break;
                    case 'query':
                        dataToValidate = req.query;
                        break;
                    case 'headers':
                        dataToValidate = req.headers;
                        break;
                }
                const validatedData = validation.schema.parse(dataToValidate);
                switch (validation.target) {
                    case 'body':
                        req.body = validatedData;
                        break;
                    case 'params':
                        req.params = validatedData;
                        break;
                    case 'query':
                        req.query = validatedData;
                        break;
                    case 'headers':
                        req.headers = validatedData;
                        break;
                }
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    const validationErrors = error.errors.map(err => ({
                        target: validation.target,
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                        received: err.received
                    }));
                    errors.push(...validationErrors);
                }
            }
        }
        if (errors.length > 0) {
            logger_1.logger.warn({
                message: 'Multiple validation failed',
                errors,
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const validationError = new ValidationError('Input validation failed', errors);
            return next(validationError);
        }
        next();
    };
};
exports.validateMultiple = validateMultiple;
const sanitizeString = (str) => {
    return str
        .trim()
        .replace(/[<>]/g, '')
        .replace(/[\x00-\x1F\x7F]/g, '');
};
exports.sanitizeString = sanitizeString;
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
        const file = req.file;
        if (!file) {
            return next();
        }
        if (!allowedTypes.includes(file.mimetype)) {
            const error = new ValidationError('Invalid file type', [{
                    field: 'file',
                    message: `File type must be one of: ${allowedTypes.join(', ')}`,
                    received: file.mimetype
                }]);
            return next(error);
        }
        if (file.size > maxSize) {
            const error = new ValidationError('File too large', [{
                    field: 'file',
                    message: `File size must not exceed ${maxSize / 1024 / 1024}MB`,
                    received: `${(file.size / 1024 / 1024).toFixed(2)}MB`
                }]);
            return next(error);
        }
        next();
    };
};
exports.validateFileUpload = validateFileUpload;
const validateIP = (req, res, next) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    if (!ip || !userAgent) {
        logger_1.logger.warn({
            message: 'Request missing IP or User-Agent',
            ip,
            userAgent,
            url: req.url,
            method: req.method
        });
    }
    next();
};
exports.validateIP = validateIP;
const addRequestId = (req, res, next) => {
    const requestId = req.get('X-Request-ID') ||
        `lotus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
};
exports.addRequestId = addRequestId;
//# sourceMappingURL=validation.middleware.js.map