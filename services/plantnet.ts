import { IdentificationResult } from '../types';

const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY || '';
const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify/k-world-flora';

export interface PlantNetResponse {
  species: Array<{
    scientificNameWithoutAuthor: string;
    scientificNameAuthorship: string;
    genus: {
      scientificNameWithoutAuthor: string;
    };
    family: {
      scientificNameWithoutAuthor: string;
    };
    commonNames: Array<{
      lang: string;
      name: string;
    }>;
    score: number;
  }>;
  query: {
    project: string;
    images: Array<{
      organ: string;
    }>;
  };
  language: string;
  preferedReferential: string;
  switchToProject?: string;
  remainingIdentificationRequests: number;
}

export const plantNetService = {
  identifyPlant: async (imageUri: string): Promise<IdentificationResult | null> => {
    try {
      if (!PLANTNET_API_KEY) {
        throw new Error('PlantNet API key not configured');
      }

      const formData = new FormData();
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'plant.jpg',
      };
      formData.append('images', imageFile as any);
      formData.append('organs', 'leaf');

      const response = await fetch(`${PLANTNET_API_URL}?api-key=${PLANTNET_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`PlantNet API error: ${response.status}`);
      }

      const data: PlantNetResponse = await response.json();
      
      if (!data.species || data.species.length === 0) {
        return null;
      }

      const topResult = data.species[0];
      const commonName = topResult.commonNames?.find(name => name.lang === 'en')?.name || 
                        topResult.scientificNameWithoutAuthor;

      return {
        confidence: Math.round(topResult.score * 100),
        common_name: commonName,
        scientific_name: topResult.scientificNameWithoutAuthor,
        suggestions: [], // We'll populate this from our local database
      };
    } catch (error) {
      console.error('PlantNet identification error:', error);
      return null;
    }
  },

  // Fallback identification using mock data for development
  mockIdentify: async (imageUri: string): Promise<IdentificationResult> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResults = [
      {
        confidence: 92,
        common_name: 'Golden Pothos',
        scientific_name: 'Epipremnum aureum',
        suggestions: [],
      },
      {
        confidence: 85,
        common_name: 'Snake Plant',
        scientific_name: 'Sansevieria trifasciata',
        suggestions: [],
      },
      {
        confidence: 78,
        common_name: 'Monstera',
        scientific_name: 'Monstera deliciosa',
        suggestions: [],
      },
    ];

    // Return random result for demo
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  },
};