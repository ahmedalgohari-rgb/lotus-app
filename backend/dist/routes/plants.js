"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const plant_service_1 = require("../services/plant.service");
const plant_schemas_1 = require("../schemas/plant.schemas");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const getAuthUser = (req) => req.user;
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
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
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const plants = await plant_service_1.plantService.getUserPlants(userId);
        res.json({
            success: true,
            data: {
                plants,
                count: plants.length,
            },
        });
        logger_1.logger.info(`User ${userId} fetched ${plants.length} plants`);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authMiddleware, validateBody(plant_schemas_1.createPlantSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const plantData = req.body;
        const plant = await plant_service_1.plantService.create(userId, plantData);
        res.status(201).json({
            success: true,
            message: 'Plant added successfully',
            data: { plant },
        });
        logger_1.logger.info(`User ${userId} created plant: ${plant.id}`);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', auth_1.authMiddleware, validateParams(plant_schemas_1.plantParamsSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const plantId = req.params.id;
        const plant = await plant_service_1.plantService.getPlantById(plantId, userId);
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PLANT_NOT_FOUND',
                    message: 'Plant not found',
                },
            });
        }
        res.json({
            success: true,
            message: "Plant retrieved successfully",
            data: { plant },
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authMiddleware, validateParams(plant_schemas_1.plantParamsSchema), validateBody(plant_schemas_1.updatePlantSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const plantId = req.params.id;
        const updates = req.body;
        const plant = await plant_service_1.plantService.updatePlant(plantId, userId, updates);
        res.json({
            success: true,
            message: 'Plant updated successfully',
            data: { plant },
        });
        logger_1.logger.info(`User ${userId} updated plant: ${plantId}`);
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
router.delete('/:id', auth_1.authMiddleware, validateParams(plant_schemas_1.plantParamsSchema), async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const plantId = req.params.id;
        await plant_service_1.plantService.deletePlant(plantId, userId);
        res.json({
            success: true,
            message: 'Plant deleted successfully',
        });
        logger_1.logger.info(`User ${userId} deleted plant: ${plantId}`);
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
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = getAuthUser(req).id;
        const stats = await plant_service_1.plantService.getPlantStats(userId);
        res.json({
            success: true,
            data: { stats },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=plants.js.map