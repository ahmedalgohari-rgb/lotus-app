import { z } from 'zod';
export declare const createPlantSchema: z.ZodObject<{
    name: z.ZodString;
    scientificName: z.ZodOptional<z.ZodString>;
    variety: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    acquisitionDate: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    primaryImageUrl: z.ZodOptional<z.ZodString>;
    healthStatus: z.ZodDefault<z.ZodEnum<["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"]>>;
    healthScore: z.ZodOptional<z.ZodNumber>;
    wateringFrequency: z.ZodOptional<z.ZodNumber>;
    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full_sun", "partial_sun", "partial_shade", "shade"]>>;
    temperatureMin: z.ZodOptional<z.ZodNumber>;
    temperatureMax: z.ZodOptional<z.ZodNumber>;
    humidityRequirement: z.ZodOptional<z.ZodEnum<["low", "moderate", "high"]>>;
    location: z.ZodOptional<z.ZodObject<{
        room: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        indoor: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        indoor?: boolean;
        room?: string;
        position?: string;
    }, {
        indoor?: boolean;
        room?: string;
        position?: string;
    }>>;
    identificationConfidence: z.ZodOptional<z.ZodNumber>;
    identificationSource: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    scientificName?: string;
    variety?: string;
    age?: number;
    acquisitionDate?: string;
    source?: string;
    primaryImageUrl?: string;
    healthStatus?: "GOOD" | "POOR" | "CRITICAL" | "EXCELLENT" | "FAIR";
    healthScore?: number;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "shade" | "full_sun" | "partial_sun" | "partial_shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: {
        indoor?: boolean;
        room?: string;
        position?: string;
    };
    identificationConfidence?: number;
    identificationSource?: string;
}, {
    name?: string;
    scientificName?: string;
    variety?: string;
    age?: number;
    acquisitionDate?: string;
    source?: string;
    primaryImageUrl?: string;
    healthStatus?: "GOOD" | "POOR" | "CRITICAL" | "EXCELLENT" | "FAIR";
    healthScore?: number;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "shade" | "full_sun" | "partial_sun" | "partial_shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    location?: {
        indoor?: boolean;
        room?: string;
        position?: string;
    };
    identificationConfidence?: number;
    identificationSource?: string;
}>;
export declare const updatePlantSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    scientificName: z.ZodOptional<z.ZodString>;
    variety: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    acquisitionDate: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    primaryImageUrl: z.ZodOptional<z.ZodString>;
    healthStatus: z.ZodOptional<z.ZodEnum<["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"]>>;
    healthScore: z.ZodOptional<z.ZodNumber>;
    wateringFrequency: z.ZodOptional<z.ZodNumber>;
    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full_sun", "partial_sun", "partial_shade", "shade"]>>;
    temperatureMin: z.ZodOptional<z.ZodNumber>;
    temperatureMax: z.ZodOptional<z.ZodNumber>;
    humidityRequirement: z.ZodOptional<z.ZodEnum<["low", "moderate", "high"]>>;
    location: z.ZodOptional<z.ZodObject<{
        room: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        indoor: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        indoor?: boolean;
        room?: string;
        position?: string;
    }, {
        indoor?: boolean;
        room?: string;
        position?: string;
    }>>;
    identificationConfidence: z.ZodOptional<z.ZodNumber>;
    identificationSource: z.ZodOptional<z.ZodString>;
    lastWateredAt: z.ZodOptional<z.ZodString>;
    lastFertilizedAt: z.ZodOptional<z.ZodString>;
    lastPrunedAt: z.ZodOptional<z.ZodString>;
    lastRepottedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    scientificName?: string;
    variety?: string;
    age?: number;
    acquisitionDate?: string;
    source?: string;
    primaryImageUrl?: string;
    healthStatus?: "GOOD" | "POOR" | "CRITICAL" | "EXCELLENT" | "FAIR";
    healthScore?: number;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "shade" | "full_sun" | "partial_sun" | "partial_shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    lastWateredAt?: string;
    lastFertilizedAt?: string;
    lastPrunedAt?: string;
    lastRepottedAt?: string;
    location?: {
        indoor?: boolean;
        room?: string;
        position?: string;
    };
    identificationConfidence?: number;
    identificationSource?: string;
}, {
    name?: string;
    scientificName?: string;
    variety?: string;
    age?: number;
    acquisitionDate?: string;
    source?: string;
    primaryImageUrl?: string;
    healthStatus?: "GOOD" | "POOR" | "CRITICAL" | "EXCELLENT" | "FAIR";
    healthScore?: number;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: "shade" | "full_sun" | "partial_sun" | "partial_shade";
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: "low" | "moderate" | "high";
    lastWateredAt?: string;
    lastFertilizedAt?: string;
    lastPrunedAt?: string;
    lastRepottedAt?: string;
    location?: {
        indoor?: boolean;
        room?: string;
        position?: string;
    };
    identificationConfidence?: number;
    identificationSource?: string;
}>;
export declare const plantQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    sort: z.ZodDefault<z.ZodEnum<["name", "createdAt", "updatedAt", "healthScore"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    search: z.ZodOptional<z.ZodString>;
    healthStatus: z.ZodOptional<z.ZodEnum<["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"]>>;
    needsCare: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    search?: string;
    healthStatus?: "GOOD" | "POOR" | "CRITICAL" | "EXCELLENT" | "FAIR";
    limit?: number;
    sort?: "createdAt" | "updatedAt" | "name" | "healthScore";
    page?: number;
    order?: "asc" | "desc";
    needsCare?: boolean;
}, {
    search?: string;
    healthStatus?: "GOOD" | "POOR" | "CRITICAL" | "EXCELLENT" | "FAIR";
    limit?: string;
    sort?: "createdAt" | "updatedAt" | "name" | "healthScore";
    page?: string;
    order?: "asc" | "desc";
    needsCare?: string;
}>;
export declare const identifyPlantSchema: z.ZodObject<{
    description: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        country: z.ZodDefault<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        climate: z.ZodOptional<z.ZodEnum<["desert", "mediterranean", "tropical", "temperate"]>>;
    }, "strip", z.ZodTypeAny, {
        country?: string;
        region?: string;
        climate?: "desert" | "mediterranean" | "tropical" | "temperate";
    }, {
        country?: string;
        region?: string;
        climate?: "desert" | "mediterranean" | "tropical" | "temperate";
    }>>;
}, "strip", z.ZodTypeAny, {
    location?: {
        country?: string;
        region?: string;
        climate?: "desert" | "mediterranean" | "tropical" | "temperate";
    };
    imageUrl?: string;
    description?: string;
}, {
    location?: {
        country?: string;
        region?: string;
        climate?: "desert" | "mediterranean" | "tropical" | "temperate";
    };
    imageUrl?: string;
    description?: string;
}>;
export declare const plantIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;
export type PlantQueryInput = z.infer<typeof plantQuerySchema>;
export type IdentifyPlantInput = z.infer<typeof identifyPlantSchema>;
export type PlantIdInput = z.infer<typeof plantIdSchema>;
//# sourceMappingURL=plant.validator.d.ts.map