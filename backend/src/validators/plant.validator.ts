import { z } from 'zod';

// UUID validation
const uuidSchema = z.string().uuid('Invalid UUID format');

// Plant name validation (supports Arabic and English)
const plantNameSchema = z.string()
  .min(1, 'Plant name is required')
  .max(100, 'Plant name must not exceed 100 characters')
  .regex(/^[a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF'-]+$/, 
    'Plant name contains invalid characters')
  .trim();

// Scientific name validation
const scientificNameSchema = z.string()
  .min(2, 'Scientific name must be at least 2 characters')
  .max(150, 'Scientific name must not exceed 150 characters')
  .regex(/^[a-zA-Z\s.-]+$/, 'Scientific name can only contain letters, spaces, dots, and hyphens')
  .trim()
  .optional();

// Health status validation
const healthStatusSchema = z.enum([
  'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'
]);

// Sunlight requirement validation
const sunlightSchema = z.enum([
  'full_sun', 'partial_sun', 'partial_shade', 'shade'
]);

// Humidity requirement validation
const humiditySchema = z.enum([
  'low', 'moderate', 'high'
]);

// Location validation
const locationSchema = z.object({
  room: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  indoor: z.boolean().default(true)
}).optional();

// Plant creation validation
export const createPlantSchema = z.object({
  name: plantNameSchema,
  scientificName: scientificNameSchema,
  variety: z.string().max(100).trim().optional(),
  age: z.number().int().min(0).max(36500).optional(), // Max ~100 years in days
  acquisitionDate: z.string().datetime().optional(),
  source: z.string().max(200).trim().optional(),
  primaryImageUrl: z.string().url().optional(),
  healthStatus: healthStatusSchema.default('GOOD'),
  healthScore: z.number().min(0).max(100).optional(),
  wateringFrequency: z.number().int().min(1).max(365).optional(),
  fertilizingFrequency: z.number().int().min(1).max(365).optional(),
  sunlightRequirement: sunlightSchema.optional(),
  temperatureMin: z.number().min(-50).max(100).optional(),
  temperatureMax: z.number().min(-50).max(100).optional(),
  humidityRequirement: humiditySchema.optional(),
  location: locationSchema,
  identificationConfidence: z.number().min(0).max(1).optional(),
  identificationSource: z.string().max(50).optional()
});

// Plant update validation (all fields optional except some constraints)
export const updatePlantSchema = z.object({
  name: plantNameSchema.optional(),
  scientificName: scientificNameSchema,
  variety: z.string().max(100).trim().optional(),
  age: z.number().int().min(0).max(36500).optional(),
  acquisitionDate: z.string().datetime().optional(),
  source: z.string().max(200).trim().optional(),
  primaryImageUrl: z.string().url().optional(),
  healthStatus: healthStatusSchema.optional(),
  healthScore: z.number().min(0).max(100).optional(),
  wateringFrequency: z.number().int().min(1).max(365).optional(),
  fertilizingFrequency: z.number().int().min(1).max(365).optional(),
  sunlightRequirement: sunlightSchema.optional(),
  temperatureMin: z.number().min(-50).max(100).optional(),
  temperatureMax: z.number().min(-50).max(100).optional(),
  humidityRequirement: humiditySchema.optional(),
  location: locationSchema,
  identificationConfidence: z.number().min(0).max(1).optional(),
  identificationSource: z.string().max(50).optional(),
  lastWateredAt: z.string().datetime().optional(),
  lastFertilizedAt: z.string().datetime().optional(),
  lastPrunedAt: z.string().datetime().optional(),
  lastRepottedAt: z.string().datetime().optional()
});

// Plant query parameters validation
export const plantQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).default('10'),
  sort: z.enum(['name', 'createdAt', 'updatedAt', 'healthScore']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).trim().optional(),
  healthStatus: healthStatusSchema.optional(),
  needsCare: z.string().regex(/^(true|false)$/).transform(s => s === 'true').optional()
});

// Plant identification validation
export const identifyPlantSchema = z.object({
  description: z.string()
    .min(10, 'Plant description must be at least 10 characters')
    .max(1000, 'Plant description must not exceed 1000 characters')
    .trim(),
  imageUrl: z.string().url().optional(),
  location: z.object({
    country: z.string().max(50).default('Egypt'),
    region: z.string().max(50).optional(),
    climate: z.enum(['desert', 'mediterranean', 'tropical', 'temperate']).optional()
  }).optional()
});

// Plant ID parameter validation
export const plantIdSchema = z.object({
  id: uuidSchema
});

export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;
export type PlantQueryInput = z.infer<typeof plantQuerySchema>;
export type IdentifyPlantInput = z.infer<typeof identifyPlantSchema>;
export type PlantIdInput = z.infer<typeof plantIdSchema>;