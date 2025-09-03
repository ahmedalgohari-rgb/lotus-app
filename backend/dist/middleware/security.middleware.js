"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = exports.sanitizeRequest = exports.uploadSecurity = exports.apiSecurity = exports.corsOptions = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("../utils/logger");
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            scriptSrc: [
                "'self'",
                "https://apis.google.com",
                "https://appleid.cdn-apple.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://fonts.googleapis.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "blob:"
            ],
            connectSrc: [
                "'self'",
                "https://api.plantnet.org",
                "https://api.openweathermap.org",
                "https://accounts.google.com",
                "https://appleid.apple.com",
                "https://*.supabase.co"
            ],
            frameSrc: [
                "https://accounts.google.com",
                "https://appleid.apple.com"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    dnsPrefetchControl: {
        allow: false
    },
    frameguard: {
        action: 'deny'
    },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: {
        policy: 'no-referrer'
    },
    xssFilter: true
});
exports.corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8081',
            'http://localhost:19006',
            'https://lotus-plant-care.app',
            'https://app.lotus-plant-care.com',
            'capacitor://localhost',
            'ionic://localhost',
            'file://',
        ];
        if (process.env.NODE_ENV === 'development') {
            if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
                return callback(null, true);
            }
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn({
                message: 'CORS blocked origin',
                origin,
                timestamp: new Date().toISOString()
            });
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-ID',
        'X-Client-Version',
        'User-Agent'
    ],
    exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
    ]
};
const apiSecurity = (req, res, next) => {
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(self), payment=(), usb=()');
    if (req.path.includes('/auth') || req.path.includes('/admin')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
    const suspiciousPatterns = [
        /\.\./,
        /<script/i,
        /union.*select/i,
        /javascript:/i,
        /%3Cscript/i
    ];
    const url = req.url;
    const userAgent = req.get('User-Agent') || '';
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(url) || pattern.test(userAgent)) {
            logger_1.logger.warn({
                message: 'Suspicious request detected',
                url,
                userAgent,
                ip: req.ip,
                method: req.method,
                headers: req.headers,
                pattern: pattern.toString()
            });
            break;
        }
    }
    next();
};
exports.apiSecurity = apiSecurity;
const uploadSecurity = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    if (req.file || req.files) {
        logger_1.logger.info({
            message: 'File upload detected',
            filename: req.file?.originalname || 'multiple files',
            size: req.file?.size,
            mimetype: req.file?.mimetype,
            userId: req.user?.id,
            ip: req.ip
        });
    }
    next();
};
exports.uploadSecurity = uploadSecurity;
const sanitizeRequest = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/\0/g, '');
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    };
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeRequest = sanitizeRequest;
const validateContentType = (allowedTypes = ['application/json']) => {
    return (req, res, next) => {
        if (req.method === 'GET' || req.is('multipart/form-data')) {
            return next();
        }
        const contentType = req.get('Content-Type');
        if (!contentType) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CONTENT_TYPE',
                    message: 'Content-Type header is required'
                }
            });
        }
        const isAllowed = allowedTypes.some(type => contentType.includes(type));
        if (!isAllowed) {
            logger_1.logger.warn({
                message: 'Invalid content type',
                contentType,
                allowedTypes,
                url: req.url,
                method: req.method,
                ip: req.ip
            });
            return res.status(415).json({
                success: false,
                error: {
                    code: 'INVALID_CONTENT_TYPE',
                    message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
                }
            });
        }
        next();
    };
};
exports.validateContentType = validateContentType;
//# sourceMappingURL=security.middleware.js.map