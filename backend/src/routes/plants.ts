// backend/src/routes/plants.ts
import express from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { plantService } from '../services/plant.service';
import { createPlantSchema, updatePlantSchema, plantParamsSchema } from '../schemas/plant.schemas';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateBody = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

const validateParams = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

// GET /api/plants - Get all user plants
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const plants = await plantService.getUserPlants(userId);
    
    res.json({
      success: true,
      data: {
        plants,
        count: plants.length,
      },
    });

    logger.info(`User ${userId} fetched ${plants.length} plants`);
  } catch (error) {
    next(error);
  }
});

// POST /api/plants - Create new plant
router.post('/', 
  authMiddleware, 
  validateBody(createPlantSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const plantData = req.body;
      
      const plant = await plantService.create(userId, plantData);
      
      res.status(201).json({
        success: true,
        message: 'Plant added successfully',
        data: { plant },
      });

      logger.info(`User ${userId} created plant: ${plant.id}`);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/plants/:id - Get specific plant
router.get('/:id',
  authMiddleware,
  validateParams(plantParamsSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const plantId = req.params.id;
      
      const plant = await plantService.getPlantById(plantId, userId);
      
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
        data: { plant },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/plants/:id - Update plant
router.put('/:id',
  authMiddleware,
  validateParams(plantParamsSchema),
  validateBody(updatePlantSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const plantId = req.params.id;
      const updates = req.body;
      
      const plant = await plantService.updatePlant(plantId, userId, updates);
      
      res.json({
        success: true,
        message: 'Plant updated successfully',
        data: { plant },
      });

      logger.info(`User ${userId} updated plant: ${plantId}`);
    } catch (error) {
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
  }
);

// DELETE /api/plants/:id - Delete plant
router.delete('/:id',
  authMiddleware,
  validateParams(plantParamsSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const plantId = req.params.id;
      
      await plantService.deletePlant(plantId, userId);
      
      res.json({
        success: true,
        message: 'Plant deleted successfully',
      });

      logger.info(`User ${userId} deleted plant: ${plantId}`);
    } catch (error) {
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
  }
);

// GET /api/plants/stats - Get plant statistics
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const stats = await plantService.getPlantStats(userId);
    
    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
});

export default router;