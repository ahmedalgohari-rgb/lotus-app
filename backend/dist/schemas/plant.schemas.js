"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantQuerySchema = exports.plantParamsSchema = exports.updatePlantSchema = exports.createPlantSchema = void 0;
const zod_1 = require("zod");
exports.createPlantSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, 'Plant name is required')
        .max(100, 'Plant name too long'),
    scientificName: zod_1.z.string()
        .max(100, 'Scientific name too long')
        .optional(),
    variety: zod_1.z.string()
        .max(100, 'Variety name too long')
        .optional(),
    acquisitionDate: zod_1.z.string()
        .datetime('Invalid date format')
        .optional(),
    source: zod_1.z.string()
        .max(200, 'Source description too long')
        .optional(),
    wateringFrequency: zod_1.z.number()
        .int()
        .min(1, 'Watering frequency must be at least 1 day')
        .max(365, 'Watering frequency too high')
        .optional(),
    fertilizingFrequency: zod_1.z.number()
        .int()
        .min(1, 'Fertilizing frequency must be at least 1 day')
        .max(365, 'Fertilizing frequency too high')
        .optional(),
    sunlightRequirement: zod_1.z.enum(['full', 'partial', 'shade'], {
        errorMap: () => ({ message: 'Sunlight requirement must be full, partial, or shade' })
    }).optional(),
    temperatureMin: zod_1.z.number()
        .min(-50, 'Temperature too low')
        .max(100, 'Temperature too high')
        .optional(),
    temperatureMax: zod_1.z.number()
        .min(-50, 'Temperature too low')
        .max(100, 'Temperature too high')
        .optional(),
    humidityRequirement: zod_1.z.enum(['low', 'moderate', 'high'], {
        errorMap: () => ({ message: 'Humidity requirement must be low, moderate, or high' })
    }).optional(),
    location: zod_1.z.string()
        .max(500, 'Location data too long')
        .optional(),
}).refine((data) => {
    if (data.temperatureMin !== undefined && data.temperatureMax !== undefined) {
        return data.temperatureMin <= data.temperatureMax;
    }
    return true;
}, {
    message: 'Minimum temperature must be less than or equal to maximum temperature',
    path: ['temperatureMin'],
});
const baseUpdatePlantSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, 'Plant name is required')
        .max(100, 'Plant name too long').optional(),
    scientificName: zod_1.z.string()
        .max(100, 'Scientific name too long')
        .optional(),
    variety: zod_1.z.string()
        .max(100, 'Variety name too long')
        .optional(),
    acquisitionDate: zod_1.z.string()
        .datetime('Invalid date format')
        .optional(),
    source: zod_1.z.string()
        .max(200, 'Source description too long')
        .optional(),
    wateringFrequency: zod_1.z.number()
        .int()
        .min(1, 'Watering frequency must be at least 1 day')
        .max(365, 'Watering frequency too high')
        .optional(),
    fertilizingFrequency: zod_1.z.number()
        .int()
        .min(1, 'Fertilizing frequency must be at least 1 day')
        .max(365, 'Fertilizing frequency too high')
        .optional(),
    sunlightRequirement: zod_1.z.enum(['full', 'partial', 'shade'], {
        errorMap: () => ({ message: 'Sunlight requirement must be full, partial, or shade' })
    }).optional(),
    temperatureMin: zod_1.z.number()
        .min(-50, 'Temperature too low')
        .max(100, 'Temperature too high')
        .optional(),
    temperatureMax: zod_1.z.number()
        .min(-50, 'Temperature too low')
        .max(100, 'Temperature too high')
        .optional(),
    humidityRequirement: zod_1.z.enum(['low', 'moderate', 'high'], {
        errorMap: () => ({ message: 'Humidity requirement must be low, moderate, or high' })
    }).optional(),
    location: zod_1.z.string()
        .max(500, 'Location data too long')
        .optional(),
}).partial();
exports.updatePlantSchema = baseUpdatePlantSchema.refine((data) => {
    if (data.temperatureMin !== undefined && data.temperatureMax !== undefined) {
        return data.temperatureMin <= data.temperatureMax;
    }
    return true;
}, {
    message: 'Minimum temperature must be less than or equal to maximum temperature',
    path: ['temperatureMin'],
});
exports.plantParamsSchema = zod_1.z.object({
    id: zod_1.z.string()
        .uuid('Invalid plant ID format'),
});
exports.plantQuerySchema = zod_1.z.object({
    limit: zod_1.z.string()
        .regex(/^\d+$/)
        .transform(Number)
        .optional(),
    offset: zod_1.z.string()
        .regex(/^\d+$/)
        .transform(Number)
        .optional(),
    search: zod_1.z.string()
        .max(100)
        .optional(),
    healthStatus: zod_1.z.enum(['GOOD', 'NEEDS_ATTENTION', 'POOR', 'CRITICAL'])
        .optional(),
});
//# sourceMappingURL=plant.schemas.js.map