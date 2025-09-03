import { Plant } from '@prisma/client';
export interface CreatePlantDto {
    name: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: 'full' | 'partial' | 'shade';
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: 'low' | 'moderate' | 'high';
    location?: string;
}
export interface UpdatePlantDto {
    name?: string;
    scientificName?: string;
    variety?: string;
    acquisitionDate?: string;
    source?: string;
    wateringFrequency?: number;
    fertilizingFrequency?: number;
    sunlightRequirement?: 'full' | 'partial' | 'shade';
    temperatureMin?: number;
    temperatureMax?: number;
    humidityRequirement?: 'low' | 'moderate' | 'high';
    location?: string;
    primaryImageUrl?: string;
}
export declare class PlantService {
    create(userId: string, plantData: CreatePlantDto): Promise<Plant>;
    getUserPlants(userId: string): Promise<Plant[]>;
    getPlantById(plantId: string, userId: string): Promise<Plant | null>;
    updatePlant(plantId: string, userId: string, updates: UpdatePlantDto): Promise<Plant>;
    deletePlant(plantId: string, userId: string): Promise<void>;
    getPlantStats(userId: string): Promise<{
        total: number;
        indoor: number;
        outdoor: number;
    }>;
}
export declare const plantService: PlantService;
//# sourceMappingURL=plant.service.d.ts.map