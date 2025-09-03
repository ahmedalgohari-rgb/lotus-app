import { z } from 'zod';
export declare const createCareLogSchema: z.ZodObject<{
    plantId: z.ZodString;
    type: z.ZodEnum<["WATERING", "FERTILIZING", "PRUNING", "REPOTTING", "OBSERVATION", "PEST_TREATMENT", "DISEASE_TREATMENT"]>;
    notes: z.ZodOptional<z.ZodString>;
    performedAt: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        amount: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        humidity: z.ZodOptional<z.ZodNumber>;
        pestType: z.ZodOptional<z.ZodString>;
        diseaseType: z.ZodOptional<z.ZodString>;
        treatmentUsed: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    }, "strip", z.ZodTypeAny, {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    }, {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    plantId?: string;
    metadata?: {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    };
    imageUrl?: string;
    performedAt?: string;
}, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    plantId?: string;
    metadata?: {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    };
    imageUrl?: string;
    performedAt?: string;
}>;
export declare const updateCareLogSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["WATERING", "FERTILIZING", "PRUNING", "REPOTTING", "OBSERVATION", "PEST_TREATMENT", "DISEASE_TREATMENT"]>>;
    notes: z.ZodOptional<z.ZodString>;
    performedAt: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        amount: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        humidity: z.ZodOptional<z.ZodNumber>;
        pestType: z.ZodOptional<z.ZodString>;
        diseaseType: z.ZodOptional<z.ZodString>;
        treatmentUsed: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    }, "strip", z.ZodTypeAny, {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    }, {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    metadata?: {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    };
    imageUrl?: string;
    performedAt?: string;
}, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    metadata?: {
        severity?: "low" | "high" | "medium";
        amount?: number;
        duration?: number;
        temperature?: number;
        humidity?: number;
        pestType?: string;
        diseaseType?: string;
        treatmentUsed?: string;
    };
    imageUrl?: string;
    performedAt?: string;
}>;
export declare const careHistoryQuerySchema: z.ZodObject<{
    plantId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["WATERING", "FERTILIZING", "PRUNING", "REPOTTING", "OBSERVATION", "PEST_TREATMENT", "DISEASE_TREATMENT"]>>;
    page: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodEnum<["performedAt", "type", "createdAt"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    plantId?: string;
    limit?: number;
    sort?: "createdAt" | "type" | "performedAt";
    page?: number;
    startDate?: string;
    endDate?: string;
    order?: "asc" | "desc";
}, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    plantId?: string;
    limit?: string;
    sort?: "createdAt" | "type" | "performedAt";
    page?: string;
    startDate?: string;
    endDate?: string;
    order?: "asc" | "desc";
}>;
export declare const quickCareSchema: z.ZodObject<{
    plantId: z.ZodString;
    type: z.ZodEnum<["WATERING", "FERTILIZING", "PRUNING", "REPOTTING", "OBSERVATION", "PEST_TREATMENT", "DISEASE_TREATMENT"]>;
    notes: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    plantId?: string;
    amount?: number;
}, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    plantId?: string;
    amount?: number;
}>;
export declare const careStatsQuerySchema: z.ZodObject<{
    plantId: z.ZodOptional<z.ZodString>;
    period: z.ZodDefault<z.ZodEnum<["week", "month", "quarter", "year"]>>;
    type: z.ZodOptional<z.ZodEnum<["WATERING", "FERTILIZING", "PRUNING", "REPOTTING", "OBSERVATION", "PEST_TREATMENT", "DISEASE_TREATMENT"]>>;
}, "strip", z.ZodTypeAny, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    plantId?: string;
    period?: "year" | "week" | "month" | "quarter";
}, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    plantId?: string;
    period?: "year" | "week" | "month" | "quarter";
}>;
export declare const bulkCareLogSchema: z.ZodObject<{
    plantIds: z.ZodArray<z.ZodString, "many">;
    type: z.ZodEnum<["WATERING", "FERTILIZING", "PRUNING", "REPOTTING", "OBSERVATION", "PEST_TREATMENT", "DISEASE_TREATMENT"]>;
    notes: z.ZodOptional<z.ZodString>;
    performedAt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        amount: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        duration?: number;
    }, {
        amount?: number;
        duration?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    metadata?: {
        amount?: number;
        duration?: number;
    };
    performedAt?: string;
    plantIds?: string[];
}, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    notes?: string;
    metadata?: {
        amount?: number;
        duration?: number;
    };
    performedAt?: string;
    plantIds?: string[];
}>;
export declare const careReminderSchema: z.ZodObject<{
    plantId: z.ZodString;
    type: z.ZodEnum<["WATERING", "FERTILIZING", "PRUNING", "REPOTTING", "OBSERVATION", "PEST_TREATMENT", "DISEASE_TREATMENT"]>;
    frequency: z.ZodNumber;
    enabled: z.ZodDefault<z.ZodBoolean>;
    nextDueDate: z.ZodOptional<z.ZodString>;
    customMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    plantId?: string;
    enabled?: boolean;
    frequency?: number;
    nextDueDate?: string;
    customMessage?: string;
}, {
    type?: "WATERING" | "FERTILIZING" | "PRUNING" | "REPOTTING" | "OBSERVATION" | "PEST_TREATMENT" | "DISEASE_TREATMENT";
    plantId?: string;
    enabled?: boolean;
    frequency?: number;
    nextDueDate?: string;
    customMessage?: string;
}>;
export declare const careLogIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export type CreateCareLogInput = z.infer<typeof createCareLogSchema>;
export type UpdateCareLogInput = z.infer<typeof updateCareLogSchema>;
export type CareHistoryQueryInput = z.infer<typeof careHistoryQuerySchema>;
export type QuickCareInput = z.infer<typeof quickCareSchema>;
export type CareStatsQueryInput = z.infer<typeof careStatsQuerySchema>;
export type BulkCareLogInput = z.infer<typeof bulkCareLogSchema>;
export type CareReminderInput = z.infer<typeof careReminderSchema>;
export type CareLogIdInput = z.infer<typeof careLogIdSchema>;
//# sourceMappingURL=care.validator.d.ts.map