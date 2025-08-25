// backend/src/routes/care.ts
import express from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { careService } from '../services/care.service';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas matching our database schema and care service
const createCareLogSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID'),
  type: z.enum(['WATERING', 'FERTILIZING', 'PRUNING', 'REPOTTING', 'OBSERVATION'], {
    errorMap: () => ({ message: 'Invalid care type' })
  }),
  notes: z.string().max(500, 'Notes too long').optional(),
  metadata: z.string().max(1000, 'Metadata too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  performedAt: z.string().datetime('Invalid date format').optional(),
});

const updateCareLogSchema = z.object({
  type: z.enum(['WATERING', 'FERTILIZING', 'PRUNING', 'REPOTTING', 'OBSERVATION']).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  metadata: z.string().max(1000, 'Metadata too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  performedAt: z.string().datetime('Invalid date format').optional(),
}).partial();

const careLogParamsSchema = z.object({
  id: z.string().uuid('Invalid care log ID format'),
});

const plantIdParamsSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID format'),
});

// Validation middleware
const validateBody = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
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

// POST /api/care - Log care action
router.post('/', 
  authMiddleware, 
  validateBody(createCareLogSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const careData = req.body;
      
      // Convert datetime string to Date object if provided
      if (careData.performedAt) {
        careData.performedAt = new Date(careData.performedAt);
      }
      
      const careLog = await careService.logCareAction(userId, careData);
      
      res.status(201).json({
        success: true,
        message: 'Care action logged successfully',
        data: { careLog },
      });

      logger.info(`Care action logged: ${careLog.type} for plant ${careData.plantId}`);
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

// GET /api/care/plant/:plantId - Get care history for specific plant
router.get('/plant/:plantId', 
  authMiddleware,
  validateParams(plantIdParamsSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const plantId = req.params.plantId;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const careHistory = await careService.getPlantCareHistory(plantId, userId, limit);
      
      res.json({
        success: true,
        data: {
          careHistory,
          count: careHistory.length,
        },
      });

      logger.info(`Care history retrieved for plant ${plantId}: ${careHistory.length} entries`);
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

// GET /api/care/recent - Get recent care actions
router.get('/recent', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const recentActions = await careService.getRecentCareActions(userId, limit);
    
    res.json({
      success: true,
      data: {
        recentActions,
        count: recentActions.length,
      },
    });

    logger.info(`Recent care actions retrieved for user ${userId}: ${recentActions.length} entries`);
  } catch (error) {
    next(error);
  }
});

// GET /api/care/stats - Get care statistics
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    
    const stats = await careService.getCareStats(userId, days);
    
    res.json({
      success: true,
      data: { stats },
    });

    logger.info(`Care stats retrieved for user ${userId}: ${stats.totalActions} actions in ${days} days`);
  } catch (error) {
    next(error);
  }
});

// GET /api/care/:id - Get specific care log
router.get('/:id',
  authMiddleware,
  validateParams(careLogParamsSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const careLogId = req.params.id;
      
      const careLog = await careService.getCareLogById(careLogId, userId);
      
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
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/care/:id - Update care log
router.put('/:id',
  authMiddleware,
  validateParams(careLogParamsSchema),
  validateBody(updateCareLogSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const careLogId = req.params.id;
      const updates = req.body;
      
      // Convert datetime string to Date object if provided
      if (updates.performedAt) {
        updates.performedAt = new Date(updates.performedAt);
      }
      
      const careLog = await careService.updateCareLog(careLogId, userId, updates);
      
      res.json({
        success: true,
        message: 'Care log updated successfully',
        data: { careLog },
      });

      logger.info(`Care log updated: ${careLogId}`);
    } catch (error) {
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
  }
);

// DELETE /api/care/:id - Delete care log
router.delete('/:id',
  authMiddleware,
  validateParams(careLogParamsSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;
      const careLogId = req.params.id;
      
      await careService.deleteCareLog(careLogId, userId);
      
      res.json({
        success: true,
        message: 'Care log deleted successfully',
      });

      logger.info(`Care log deleted: ${careLogId}`);
    } catch (error) {
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
  }
);

export default router;