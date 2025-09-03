"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const identification_service_1 = require("../services/identification.service");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const getAuthUser = (req) => req.user;
const identifyPlantSchema = zod_1.z.object({
    description: zod_1.z.string()
        .min(2, 'Description too short')
        .max(200, 'Description too long'),
    metadata: zod_1.z.object({
        location: zod_1.z.object({
            latitude: zod_1.z.number().min(-90).max(90).optional(),
            longitude: zod_1.z.number().min(-180).max(180).optional(),
        }).optional(),
        environment: zod_1.z.enum(['indoor', 'outdoor']).optional(),
        lightCondition: zod_1.z.enum(['low', 'medium', 'bright']).optional(),
    }).optional(),
});
const searchPlantSchema = zod_1.z.object({
    query: zod_1.z.string()
        .min(1, 'Search query required')
        .max(100, 'Search query too long'),
    limit: zod_1.z.number().int().min(1).max(50).default(10).optional(),
});
const plantIdSchema = zod_1.z.object({
    plantId: zod_1.z.string()
        .min(1, 'Plant ID required')
        .max(50, 'Plant ID too long'),
});
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.body);
            req.body = result;
            next();
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
            next(error);
        }
    };
};
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.params);
            next();
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
            next(error);
        }
    };
};
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.query);
            req.query = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid query parameters',
                        details: error.errors,
                    },
                });
            }
            next(error);
        }
    };
};
router.post('/', auth_1.authMiddleware, validateBody(identifyPlantSchema), async (req, res, next) => {
    try {
        const { description, metadata } = req.body;
        const userId = getAuthUser(req).id;
        const result = identification_service_1.identificationService.identifyPlant(description);
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 'IDENTIFICATION_ERROR',
                    message: result.error || 'Failed to identify plant',
                },
            });
        }
        res.json({
            success: true,
            message: 'Plant identification completed',
            data: {
                identification: result.data,
                metadata: {
                    searchTerm: description,
                    timestamp: new Date().toISOString(),
                    userId,
                    ...metadata,
                },
            },
        });
        logger_1.logger.info(`Plant identification completed for user ${userId}: "${description}" -> ${result.data?.names.english}`);
    }
    catch (error) {
        logger_1.logger.error('Plant identification failed:', error);
        next(error);
    }
});
router.get('/database', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const plants = identification_service_1.identificationService.getAvailablePlants();
        res.json({
            success: true,
            message: 'Plant database retrieved successfully',
            data: {
                plants,
                count: plants.length,
            },
        });
        logger_1.logger.info(`Plant database accessed by user ${userId}: ${plants.length} plants`);
    }
    catch (error) {
        logger_1.logger.error('Failed to retrieve plant database:', error);
        next(error);
    }
});
router.get('/search', auth_1.authMiddleware, validateQuery(searchPlantSchema), async (req, res, next) => {
    try {
        const { query, limit } = req.query;
        const userId = getAuthUser(req).id;
        const results = identification_service_1.identificationService.searchPlants(query, limit || 10);
        res.json({
            success: true,
            message: 'Plant search completed',
            data: {
                plants: results,
                count: results.length,
                query,
            },
        });
        logger_1.logger.info(`Plant search by user ${userId}: "${query}" returned ${results.length} results`);
    }
    catch (error) {
        logger_1.logger.error('Plant search failed:', error);
        next(error);
    }
});
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const stats = identification_service_1.identificationService.getDatabaseStats();
        res.json({
            success: true,
            message: 'Database statistics retrieved successfully',
            data: { stats },
        });
        logger_1.logger.info(`Database stats accessed by user ${userId}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to retrieve database stats:', error);
        next(error);
    }
});
router.get('/care/:plantId', auth_1.authMiddleware, validateParams(plantIdSchema), async (req, res, next) => {
    try {
        const { plantId } = req.params;
        const userId = getAuthUser(req).id;
        const plantInfo = identification_service_1.identificationService.getPlantCare(plantId);
        res.json({
            success: true,
            message: 'Plant care information retrieved successfully',
            data: {
                plant: plantInfo,
                plantId
            },
        });
        logger_1.logger.info(`Care info retrieved by user ${userId} for plant: ${plantId}`);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Plant not found in database') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PLANT_NOT_FOUND',
                    message: 'Plant not found in database',
                    plantId: req.params.plantId,
                },
            });
        }
        logger_1.logger.error('Failed to get plant care info:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=identification.js.map