"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const care_service_1 = require("../services/care.service");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const getAuthUser = (req) => req.user;
const createCareLogSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID'),
    type: zod_1.z.enum(['WATERING', 'FERTILIZING', 'PRUNING', 'REPOTTING', 'OBSERVATION'], {
        errorMap: () => ({ message: 'Invalid care type' })
    }),
    notes: zod_1.z.string().max(500, 'Notes too long').optional(),
    metadata: zod_1.z.string().max(1000, 'Metadata too long').optional(),
    imageUrl: zod_1.z.string().url('Invalid image URL').optional(),
    performedAt: zod_1.z.string().datetime('Invalid date format').optional(),
});
const updateCareLogSchema = zod_1.z.object({
    type: zod_1.z.enum(['WATERING', 'FERTILIZING', 'PRUNING', 'REPOTTING', 'OBSERVATION']).optional(),
    notes: zod_1.z.string().max(500, 'Notes too long').optional(),
    metadata: zod_1.z.string().max(1000, 'Metadata too long').optional(),
    imageUrl: zod_1.z.string().url('Invalid image URL').optional(),
    performedAt: zod_1.z.string().datetime('Invalid date format').optional(),
}).partial();
const careLogParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid care log ID format'),
});
const plantIdParamsSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID format'),
});
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.body);
            req.body = result;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: error.errors,
                    },
                });
            }
            return next(error);
        }
    };
};
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.params);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid parameters',
                        details: error.errors,
                    },
                });
            }
            return next(error);
        }
    };
};
router.post('/', auth_1.authMiddleware, validateBody(createCareLogSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const careData = req.body;
        if (careData.performedAt) {
            careData.performedAt = new Date(careData.performedAt);
        }
        const careLog = await care_service_1.careService.logCareAction(userId, careData);
        res.status(201).json({
            success: true,
            message: 'Care action logged successfully',
            data: { careLog },
        });
        logger_1.logger.info(`Care action logged: ${careLog.type} for plant ${careData.plantId}`);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Plant not found') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PLANT_NOT_FOUND',
                    message: 'Plant not found',
                },
            });
        }
        next(error);
    }
});
router.get('/plant/:plantId', auth_1.authMiddleware, validateParams(plantIdParamsSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const plantId = req.params.plantId;
        const limit = parseInt(req.query.limit) || 20;
        const careHistory = await care_service_1.careService.getPlantCareHistory(plantId, userId, limit);
        res.json({
            success: true,
            data: {
                careHistory,
                count: careHistory.length,
            },
        });
        logger_1.logger.info(`Care history retrieved for plant ${plantId}: ${careHistory.length} entries`);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Plant not found') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PLANT_NOT_FOUND',
                    message: 'Plant not found',
                },
            });
        }
        next(error);
    }
});
router.get('/recent', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const limit = parseInt(req.query.limit) || 10;
        const recentActions = await care_service_1.careService.getRecentCareActions(userId, limit);
        res.json({
            success: true,
            data: {
                recentActions,
                count: recentActions.length,
            },
        });
        logger_1.logger.info(`Recent care actions retrieved for user ${userId}: ${recentActions.length} entries`);
    }
    catch (error) {
        next(error);
    }
});
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const days = parseInt(req.query.days) || 30;
        const stats = await care_service_1.careService.getCareStats(userId, days);
        res.json({
            success: true,
            data: { stats },
        });
        logger_1.logger.info(`Care stats retrieved for user ${userId}: ${stats.totalActions} actions in ${days} days`);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', auth_1.authMiddleware, validateParams(careLogParamsSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const careLogId = req.params.id;
        const careLog = await care_service_1.careService.getCareLogById(careLogId, userId);
        if (!careLog) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CARE_LOG_NOT_FOUND',
                    message: 'Care log not found',
                },
            });
        }
        res.json({
            success: true,
            data: { careLog },
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authMiddleware, validateParams(careLogParamsSchema), validateBody(updateCareLogSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const careLogId = req.params.id;
        const updates = req.body;
        if (updates.performedAt) {
            updates.performedAt = new Date(updates.performedAt);
        }
        const careLog = await care_service_1.careService.updateCareLog(careLogId, userId, updates);
        res.json({
            success: true,
            message: 'Care log updated successfully',
            data: { careLog },
        });
        logger_1.logger.info(`Care log updated: ${careLogId}`);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Care log not found') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CARE_LOG_NOT_FOUND',
                    message: 'Care log not found',
                },
            });
        }
        next(error);
    }
});
router.delete('/:id', auth_1.authMiddleware, validateParams(careLogParamsSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const careLogId = req.params.id;
        await care_service_1.careService.deleteCareLog(careLogId, userId);
        res.json({
            success: true,
            message: 'Care log deleted successfully',
        });
        logger_1.logger.info(`Care log deleted: ${careLogId}`);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Care log not found') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CARE_LOG_NOT_FOUND',
                    message: 'Care log not found',
                },
            });
        }
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=care.js.map