"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.careLogIdSchema = exports.careReminderSchema = exports.bulkCareLogSchema = exports.careStatsQuerySchema = exports.quickCareSchema = exports.careHistoryQuerySchema = exports.updateCareLogSchema = exports.createCareLogSchema = void 0;
const zod_1 = require("zod");
const careTypeSchema = zod_1.z.enum([
    'WATERING',
    'FERTILIZING',
    'PRUNING',
    'REPOTTING',
    'OBSERVATION',
    'PEST_TREATMENT',
    'DISEASE_TREATMENT'
]);
exports.createCareLogSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID format'),
    type: careTypeSchema,
    notes: zod_1.z.string()
        .max(1000, 'Notes must not exceed 1000 characters')
        .trim()
        .optional(),
    performedAt: zod_1.z.string().datetime().optional(),
    imageUrl: zod_1.z.string().url('Invalid image URL').optional(),
    metadata: zod_1.z.object({
        amount: zod_1.z.number().positive().optional(),
        duration: zod_1.z.number().positive().optional(),
        temperature: zod_1.z.number().min(-50).max(100).optional(),
        humidity: zod_1.z.number().min(0).max(100).optional(),
        pestType: zod_1.z.string().max(100).trim().optional(),
        diseaseType: zod_1.z.string().max(100).trim().optional(),
        treatmentUsed: zod_1.z.string().max(200).trim().optional(),
        severity: zod_1.z.enum(['low', 'medium', 'high']).optional()
    }).optional()
});
exports.updateCareLogSchema = zod_1.z.object({
    type: careTypeSchema.optional(),
    notes: zod_1.z.string()
        .max(1000, 'Notes must not exceed 1000 characters')
        .trim()
        .optional(),
    performedAt: zod_1.z.string().datetime().optional(),
    imageUrl: zod_1.z.string().url('Invalid image URL').optional(),
    metadata: zod_1.z.object({
        amount: zod_1.z.number().positive().optional(),
        duration: zod_1.z.number().positive().optional(),
        temperature: zod_1.z.number().min(-50).max(100).optional(),
        humidity: zod_1.z.number().min(0).max(100).optional(),
        pestType: zod_1.z.string().max(100).trim().optional(),
        diseaseType: zod_1.z.string().max(100).trim().optional(),
        treatmentUsed: zod_1.z.string().max(200).trim().optional(),
        severity: zod_1.z.enum(['low', 'medium', 'high']).optional()
    }).optional()
});
exports.careHistoryQuerySchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID format').optional(),
    type: careTypeSchema.optional(),
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).default('1'),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).default('20'),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    sort: zod_1.z.enum(['performedAt', 'type', 'createdAt']).default('performedAt'),
    order: zod_1.z.enum(['asc', 'desc']).default('desc')
});
exports.quickCareSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID format'),
    type: careTypeSchema,
    notes: zod_1.z.string().max(500).trim().optional(),
    amount: zod_1.z.number().positive().optional()
});
exports.careStatsQuerySchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID format').optional(),
    period: zod_1.z.enum(['week', 'month', 'quarter', 'year']).default('month'),
    type: careTypeSchema.optional()
});
exports.bulkCareLogSchema = zod_1.z.object({
    plantIds: zod_1.z.array(zod_1.z.string().uuid('Invalid plant ID format'))
        .min(1, 'At least one plant ID is required')
        .max(50, 'Cannot log care for more than 50 plants at once'),
    type: careTypeSchema,
    notes: zod_1.z.string().max(1000).trim().optional(),
    performedAt: zod_1.z.string().datetime().optional(),
    metadata: zod_1.z.object({
        amount: zod_1.z.number().positive().optional(),
        duration: zod_1.z.number().positive().optional()
    }).optional()
});
exports.careReminderSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID format'),
    type: careTypeSchema,
    frequency: zod_1.z.number().int().min(1).max(365),
    enabled: zod_1.z.boolean().default(true),
    nextDueDate: zod_1.z.string().datetime().optional(),
    customMessage: zod_1.z.string().max(200).trim().optional()
});
exports.careLogIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid care log ID format')
});
//# sourceMappingURL=care.validator.js.map