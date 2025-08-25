// backend/src/schemas/plant.schemas.ts
import { z } from 'zod';

// Base plant data validation matching database schema
export const createPlantSchema = z.object({
  name: z.string()
    .min(1, 'Plant name is required')
    .max(100, 'Plant name too long'),
  
  scientificName: z.string()
    .max(100, 'Scientific name too long')
    .optional(),
  
  variety: z.string()
    .max(100, 'Variety name too long')
    .optional(),
  
  acquisitionDate: z.string()
    .datetime('Invalid date format')
    .optional(),
  
  source: z.string()
    .max(200, 'Source description too long')
    .optional(),
  
  wateringFrequency: z.number()
    .int()
    .min(1, 'Watering frequency must be at least 1 day')
    .max(365, 'Watering frequency too high')
    .optional(),
  
  fertilizingFrequency: z.number()
    .int()
    .min(1, 'Fertilizing frequency must be at least 1 day')
    .max(365, 'Fertilizing frequency too high')
    .optional(),
  
  sunlightRequirement: z.enum(['full', 'partial', 'shade'], {
    errorMap: () => ({ message: 'Sunlight requirement must be full, partial, or shade' })
  }).optional(),
  
  temperatureMin: z.number()
    .min(-50, 'Temperature too low')
    .max(100, 'Temperature too high')
    .optional(),
  
  temperatureMax: z.number()
    .min(-50, 'Temperature too low')
    .max(100, 'Temperature too high')
    .optional(),
  
  humidityRequirement: z.enum(['low', 'moderate', 'high'], {
    errorMap: () => ({ message: 'Humidity requirement must be low, moderate, or high' })
  }).optional(),
  
  location: z.string()
    .max(500, 'Location data too long')
    .optional(),
}).refine(
  (data) => {
    if (data.temperatureMin !== undefined && data.temperatureMax !== undefined) {
      return data.temperatureMin <= data.temperatureMax;
    }
    return true;
  },
  {
    message: 'Minimum temperature must be less than or equal to maximum temperature',
    path: ['temperatureMin'],
  }
);

export const updatePlantSchema = createPlantSchema.partial().refine(
  (data) => {
    if (data.temperatureMin !== undefined && data.temperatureMax !== undefined) {
      return data.temperatureMin <= data.temperatureMax;
    }
    return true;
  },
  {
    message: 'Minimum temperature must be less than or equal to maximum temperature',
    path: ['temperatureMin'],
  }
);

export const plantParamsSchema = z.object({
  id: z.string()
    .uuid('Invalid plant ID format'),
});

export const plantQuerySchema = z.object({
  limit: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional(),
  
  offset: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional(),
  
  search: z.string()
    .max(100)
    .optional(),
  
  healthStatus: z.enum(['GOOD', 'NEEDS_ATTENTION', 'POOR', 'CRITICAL'])
    .optional(),
});

// Export types for TypeScript
export type CreatePlantData = z.infer<typeof createPlantSchema>;
export type UpdatePlantData = z.infer<typeof updatePlantSchema>;
export type PlantQuery = z.infer<typeof plantQuerySchema>;
export type PlantIdParam = z.infer<typeof plantParamsSchema>;