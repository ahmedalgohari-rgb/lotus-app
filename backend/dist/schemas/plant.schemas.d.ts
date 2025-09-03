import { z } from 'zod';
export declare const createPlantSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    scientificName: z.ZodOptional<z.ZodString>;
    variety: z.ZodOptional<z.ZodString>;
    acquisitionDate: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    wateringFrequency: z.ZodOptional<z.ZodNumber>;
    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full", "partial", "shade"]>>;
    temperatureMin: z.ZodOptional<z.ZodNumber>;
    temperatureMax: z.ZodOptional<z.ZodNumber>;
    humidityRequirement: z.ZodOptional<z.ZodEnum<["low", "moderate", "high"]>>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}>, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}>;
export declare const updatePlantSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    scientificName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    variety: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    acquisitionDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    wateringFrequency: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    fertilizingFrequency: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    sunlightRequirement: z.ZodOptional<z.ZodOptional<z.ZodEnum<["full", "partial", "shade"]>>>;
    temperatureMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    temperatureMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    humidityRequirement: z.ZodOptional<z.ZodOptional<z.ZodEnum<["low", "moderate", "high"]>>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}>, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}, {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "full" | "partial" | "shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: string;
}>;
export declare const plantParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const plantQuerySchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    offset: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    search: z.ZodOptional<z.ZodString>;
    healthStatus: z.ZodOptional<z.ZodEnum<["GOOD", "NEEDS_ATTENTION", "POOR", "CRITICAL"]>>;
}, "strip", z.ZodTypeAny, {
    search?: string;
    healthStatus?: "GOOD" | "NEEDS_ATTENTION" | "POOR" | "CRITICAL";
    limit?: number;
    offset?: number;
}, {
    search?: string;
    healthStatus?: "GOOD" | "NEEDS_ATTENTION" | "POOR" | "CRITICAL";
    limit?: string;
    offset?: string;
}>;
export type CreatePlantData = z.infer<typeof createPlantSchema>;
export type UpdatePlantData = z.infer<typeof updatePlantSchema>;
export type PlantQuery = z.infer<typeof plantQuerySchema>;
export type PlantIdParam = z.infer<typeof plantParamsSchema>;
//# sourceMappingURL=plant.schemas.d.ts.map