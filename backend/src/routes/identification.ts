// backend/src/routes/identification.ts
import express from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { identificationService } from '../services/identification.service';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const identifyPlantSchema = z.object({
  description: z.string()
    .min(2, 'Description too short')
    .max(200, 'Description too long'),
  
  // Optional metadata for future AI integration
  metadata: z.object({
    location: z.object({
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    }).optional(),
    environment: z.enum(['indoor', 'outdoor']).optional(),
    lightCondition: z.enum(['low', 'medium', 'bright']).optional(),
  }).optional(),
});

const searchPlantSchema = z.object({
  query: z.string()
    .min(1, 'Search query required')
    .max(100, 'Search query too long'),
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

const plantIdSchema = z.object({
  plantId: z.string()
    .min(1, 'Plant ID required')
    .max(50, 'Plant ID too long'),
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

const validateQuery = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const result = schema.parse(req.query);
      req.query = result as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

// POST /api/identify - Identify plant by description
router.post('/', 
  authMiddleware, 
  validateBody(identifyPlantSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { description, metadata } = req.body;
      const userId = req.user!.id;
      
      const result = identificationService.identifyPlant(description);
      
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

      logger.info(`Plant identification completed for user ${userId}: "${description}" -> ${result.data?.names.english}`);
      
    } catch (error) {
      logger.error('Plant identification failed:', error);
      next(error);
    }
  }
);

// GET /api/identify/database - Get available plants
router.get('/database', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const plants = identificationService.getAvailablePlants();
    
    res.json({
      success: true,
      message: 'Plant database retrieved successfully',
      data: {
        plants,
        count: plants.length,
      },
    });

    logger.info(`Plant database accessed by user ${userId}: ${plants.length} plants`);
    
  } catch (error) {
    logger.error('Failed to retrieve plant database:', error);
    next(error);
  }
});

// GET /api/identify/search - Search plants by query
router.get('/search', 
  authMiddleware,
  validateQuery(searchPlantSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { query, limit } = req.query as any;
      const userId = req.user!.id;
      
      const results = identificationService.searchPlants(query, limit || 10);
      
      res.json({
        success: true,
        message: 'Plant search completed',
        data: {
          plants: results,
          count: results.length,
          query,
        },
      });

      logger.info(`Plant search by user ${userId}: "${query}" returned ${results.length} results`);
      
    } catch (error) {
      logger.error('Plant search failed:', error);
      next(error);
    }
  }
);

// GET /api/identify/stats - Get database statistics
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const stats = identificationService.getDatabaseStats();
    
    res.json({
      success: true,
      message: 'Database statistics retrieved successfully',
      data: { stats },
    });

    logger.info(`Database stats accessed by user ${userId}`);
    
  } catch (error) {
    logger.error('Failed to retrieve database stats:', error);
    next(error);
  }
});

// GET /api/identify/care/:plantId - Get care information for specific plant
router.get('/care/:plantId', 
  authMiddleware,
  validateParams(plantIdSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { plantId } = req.params;
      const userId = req.user!.id;
      
      const plantInfo = identificationService.getPlantCare(plantId);
      
      res.json({
        success: true,
        message: 'Plant care information retrieved successfully',
        data: { 
          plant: plantInfo,
          plantId 
        },
      });

      logger.info(`Care info retrieved by user ${userId} for plant: ${plantId}`);
      
    } catch (error) {
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
      logger.error('Failed to get plant care info:', error);
      next(error);
    }
  }
);

export default router;