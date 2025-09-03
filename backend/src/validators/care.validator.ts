import { z } from 'zod';

// Care action types
const careTypeSchema = z.enum([
  'WATERING', 
  'FERTILIZING', 
  'PRUNING', 
  'REPOTTING', 
  'OBSERVATION',
  'PEST_TREATMENT',
  'DISEASE_TREATMENT'
]);

// Care log creation validation
export const createCareLogSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID format'),
  type: careTypeSchema,
  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .trim()
    .optional(),
  performedAt: z.string().datetime().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  metadata: z.object({
    amount: z.number().positive().optional(), // For watering (liters) or fertilizing (grams)
    duration: z.number().positive().optional(), // Duration in minutes
    temperature: z.number().min(-50).max(100).optional(),
    humidity: z.number().min(0).max(100).optional(),
    pestType: z.string().max(100).trim().optional(),
    diseaseType: z.string().max(100).trim().optional(),
    treatmentUsed: z.string().max(200).trim().optional(),
    severity: z.enum(['low', 'medium', 'high']).optional()
  }).optional()
});

// Care log update validation
export const updateCareLogSchema = z.object({
  type: careTypeSchema.optional(),
  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .trim()
    .optional(),
  performedAt: z.string().datetime().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  metadata: z.object({
    amount: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    temperature: z.number().min(-50).max(100).optional(),
    humidity: z.number().min(0).max(100).optional(),
    pestType: z.string().max(100).trim().optional(),
    diseaseType: z.string().max(100).trim().optional(),
    treatmentUsed: z.string().max(200).trim().optional(),
    severity: z.enum(['low', 'medium', 'high']).optional()
  }).optional()
});

// Care history query validation
export const careHistoryQuerySchema = z.object({
  plantId: z.string().uuid('Invalid plant ID format').optional(),
  type: careTypeSchema.optional(),
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).default('20'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sort: z.enum(['performedAt', 'type', 'createdAt']).default('performedAt'),
  order: z.enum(['asc', 'desc']).default('desc')
});

// Quick care action validation (for one-click watering, etc.)
export const quickCareSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID format'),
  type: careTypeSchema,
  notes: z.string().max(500).trim().optional(),
  amount: z.number().positive().optional()
});

// Care statistics query validation
export const careStatsQuerySchema = z.object({
  plantId: z.string().uuid('Invalid plant ID format').optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  type: careTypeSchema.optional()
});

// Bulk care logging validation
export const bulkCareLogSchema = z.object({
  plantIds: z.array(z.string().uuid('Invalid plant ID format'))
    .min(1, 'At least one plant ID is required')
    .max(50, 'Cannot log care for more than 50 plants at once'),
  type: careTypeSchema,
  notes: z.string().max(1000).trim().optional(),
  performedAt: z.string().datetime().optional(),
  metadata: z.object({
    amount: z.number().positive().optional(),
    duration: z.number().positive().optional()
  }).optional()
});

// Care reminder validation
export const careReminderSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID format'),
  type: careTypeSchema,
  frequency: z.number().int().min(1).max(365), // Days between reminders
  enabled: z.boolean().default(true),
  nextDueDate: z.string().datetime().optional(),
  customMessage: z.string().max(200).trim().optional()
});

// Care ID parameter validation
export const careLogIdSchema = z.object({
  id: z.string().uuid('Invalid care log ID format')
});

export type CreateCareLogInput = z.infer<typeof createCareLogSchema>;
export type UpdateCareLogInput = z.infer<typeof updateCareLogSchema>;
export type CareHistoryQueryInput = z.infer<typeof careHistoryQuerySchema>;
export type QuickCareInput = z.infer<typeof quickCareSchema>;
export type CareStatsQueryInput = z.infer<typeof careStatsQuerySchema>;
export type BulkCareLogInput = z.infer<typeof bulkCareLogSchema>;
export type CareReminderInput = z.infer<typeof careReminderSchema>;
export type CareLogIdInput = z.infer<typeof careLogIdSchema>;