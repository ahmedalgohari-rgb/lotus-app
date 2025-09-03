import { CareLog } from '@prisma/client';
export interface CreateCareLogDto {
    plantId: string;
    type: 'WATERING' | 'FERTILIZING' | 'PRUNING' | 'REPOTTING' | 'OBSERVATION';
    notes?: string;
    metadata?: string;
    imageUrl?: string;
    performedAt?: Date;
}
export declare class CareService {
    logCareAction(userId: string, careData: CreateCareLogDto): Promise<CareLog>;
    getPlantCareHistory(plantId: string, userId: string, limit?: number): Promise<CareLog[]>;
    getRecentCareActions(userId: string, limit?: number): Promise<(CareLog & {
        plant: {
            name: string;
        };
    })[]>;
    getCareStats(userId: string, days?: number): Promise<{
        totalActions: number;
        actionBreakdown: Record<string, number>;
        period: string;
        startDate: string;
    }>;
    getCareLogById(careLogId: string, userId: string): Promise<CareLog | null>;
    updateCareLog(careLogId: string, userId: string, updates: Partial<CreateCareLogDto>): Promise<CareLog>;
    deleteCareLog(careLogId: string, userId: string): Promise<void>;
}
export declare const careService: CareService;
//# sourceMappingURL=care.service.d.ts.map