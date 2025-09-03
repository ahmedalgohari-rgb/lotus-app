"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantIdSchema = exports.identifyPlantSchema = exports.plantQuerySchema = exports.updatePlantSchema = exports.createPlantSchema = void 0;
const zod_1 = require("zod");
const uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
const plantNameSchema = zod_1.z.string()
    .min(1, 'Plant name is required')
    .max(100, 'Plant name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF'-]+$/, 'Plant name contains invalid characters')
    .trim();
const scientificNameSchema = zod_1.z.string()
    .min(2, 'Scientific name must be at least 2 characters')
    .max(150, 'Scientific name must not exceed 150 characters')
    .regex(/^[a-zA-Z\s.-]+$/, 'Scientific name can only contain letters, spaces, dots, and hyphens')
    .trim()
    .optional();
const healthStatusSchema = zod_1.z.enum([
    'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'
]);
const sunlightSchema = zod_1.z.enum([
    'full_sun', 'partial_sun', 'partial_shade', 'shade'
]);
const humiditySchema = zod_1.z.enum([
    'low', 'moderate', 'high'
]);
const locationSchema = zod_1.z.object({
    room: zod_1.z.string().max(50).optional(),
    position: zod_1.z.string().max(100).optional(),
    indoor: zod_1.z.boolean().default(true)
}).optional();
exports.createPlantSchema = zod_1.z.object({
    name: plantNameSchema,
    scientificName: scientificNameSchema,
    variety: zod_1.z.string().max(100).trim().optional(),
    age: zod_1.z.number().int().min(0).max(36500).optional(),
    acquisitionDate: zod_1.z.string().datetime().optional(),
    source: zod_1.z.string().max(200).trim().optional(),
    primaryImageUrl: zod_1.z.string().url().optional(),
    healthStatus: healthStatusSchema.default('GOOD'),
    healthScore: zod_1.z.number().min(0).max(100).optional(),
    wateringFrequency: zod_1.z.number().int().min(1).max(365).optional(),
    fertilizingFrequency: zod_1.z.number().int().min(1).max(365).optional(),
    sunlightRequirement: sunlightSchema.optional(),
    temperatureMin: zod_1.z.number().min(-50).max(100).optional(),
    temperatureMax: zod_1.z.number().min(-50).max(100).optional(),
    humidityRequirement: humiditySchema.optional(),
    location: locationSchema,
    identificationConfidence: zod_1.z.number().min(0).max(1).optional(),
    identificationSource: zod_1.z.string().max(50).optional()
});
exports.updatePlantSchema = zod_1.z.object({
    name: plantNameSchema.optional(),
    scientificName: scientificNameSchema,
    variety: zod_1.z.string().max(100).trim().optional(),
    age: zod_1.z.number().int().min(0).max(36500).optional(),
    acquisitionDate: zod_1.z.string().datetime().optional(),
    source: zod_1.z.string().max(200).trim().optional(),
    primaryImageUrl: zod_1.z.string().url().optional(),
    healthStatus: healthStatusSchema.optional(),
    healthScore: zod_1.z.number().min(0).max(100).optional(),
    wateringFrequency: zod_1.z.number().int().min(1).max(365).optional(),
    fertilizingFrequency: zod_1.z.number().int().min(1).max(365).optional(),
    sunlightRequirement: sunlightSchema.optional(),
    temperatureMin: zod_1.z.number().min(-50).max(100).optional(),
    temperatureMax: zod_1.z.number().min(-50).max(100).optional(),
    humidityRequirement: humiditySchema.optional(),
    location: locationSchema,
    identificationConfidence: zod_1.z.number().min(0).max(1).optional(),
    identificationSource: zod_1.z.string().max(50).optional(),
    lastWateredAt: zod_1.z.string().datetime().optional(),
    lastFertilizedAt: zod_1.z.string().datetime().optional(),
    lastPrunedAt: zod_1.z.string().datetime().optional(),
    lastRepottedAt: zod_1.z.string().datetime().optional()
});
exports.plantQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).default('1'),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).default('10'),
    sort: zod_1.z.enum(['name', 'createdAt', 'updatedAt', 'healthScore']).default('createdAt'),
    order: zod_1.z.enum(['asc', 'desc']).default('desc'),
    search: zod_1.z.string().max(100).trim().optional(),
    healthStatus: healthStatusSchema.optional(),
    needsCare: zod_1.z.string().regex(/^(true|false)$/).transform(s => s === 'true').optional()
});
exports.identifyPlantSchema = zod_1.z.object({
    description: zod_1.z.string()
        .min(10, 'Plant description must be at least 10 characters')
        .max(1000, 'Plant description must not exceed 1000 characters')
        .trim(),
    imageUrl: zod_1.z.string().url().optional(),
    location: zod_1.z.object({
        country: zod_1.z.string().max(50).default('Egypt'),
        region: zod_1.z.string().max(50).optional(),
        climate: zod_1.z.enum(['desert', 'mediterranean', 'tropical', 'temperate']).optional()
    }).optional()
});
exports.plantIdSchema = zod_1.z.object({
    id: uuidSchema
});
//# sourceMappingURL=plant.validator.js.map