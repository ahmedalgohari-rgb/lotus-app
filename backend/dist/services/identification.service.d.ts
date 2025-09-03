export interface PlantIdentificationResult {
    success: boolean;
    data?: {
        scientific: string;
        names: {
            arabic: string;
            english: string;
        };
        confidence: number;
        care: {
            water: string;
            light: string;
            environment: string;
        };
        plantKey?: string;
    };
    error?: string;
}
export declare class IdentificationService {
    identifyPlant(description: string): PlantIdentificationResult;
    getAvailablePlants(): {
        id: string;
        scientific: string;
        names: {
            arabic: string;
            english: string;
        };
        care: {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        };
    }[];
    getPlantCare(plantKey: string): {
        scientific: string;
        names: {
            arabic: string;
            english: string;
        };
        care: {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        } | {
            water: string;
            light: string;
            environment: string;
        };
    };
    searchPlants(query: string, limit?: number): any[];
    getDatabaseStats(): {
        total: number;
        byEnvironment: {
            indoor: number;
            outdoor: number;
            both: number;
        };
    };
}
export declare const identificationService: IdentificationService;
//# sourceMappingURL=identification.service.d.ts.map