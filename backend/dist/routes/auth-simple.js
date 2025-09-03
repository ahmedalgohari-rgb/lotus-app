"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.get('/health', (_req, res) => {
    res.json({
        message: 'Authentication service is running',
        timestamp: new Date().toISOString(),
    });
});
router.post('/register', (_req, res) => {
    res.status(200).json({
        message: 'Registration endpoint - implementation in progress',
        status: 'success',
    });
});
router.post('/login', (_req, res) => {
    res.status(200).json({
        message: 'Login endpoint - implementation in progress',
        status: 'success',
    });
});
//# sourceMappingURL=auth-simple.js.map