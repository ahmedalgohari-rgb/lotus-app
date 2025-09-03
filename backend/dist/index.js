"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./routes/auth");
const oauth_1 = require("./routes/oauth");
const progressive_auth_1 = require("./routes/progressive-auth");
const plants_1 = __importDefault(require("./routes/plants"));
const care_1 = __importDefault(require("./routes/care"));
const identification_1 = __importDefault(require("./routes/identification"));
const error_1 = require("./middleware/error");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://lotus-app.com', 'https://www.lotus-app.com']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(generalLimiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, compression_1.default)());
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: (message) => {
                logger_1.logger.info(message.trim());
            },
        },
    }));
}
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/auth', progressive_auth_1.progressiveAuthRoutes);
app.use('/api/oauth', oauth_1.oauthRoutes);
app.use('/api/plants', plants_1.default);
app.use('/api/care', care_1.default);
app.use('/api/identify', identification_1.default);
app.use('*', (_req, res) => {
    res.status(404).json({
        error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: 'The requested endpoint does not exist',
            path: _req.originalUrl,
        },
    });
});
app.use(error_1.errorHandler);
const server = app.listen(PORT, () => {
    logger_1.logger.info(`🌿 Lotus API server is running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${process.env.NODE_ENV}`);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map