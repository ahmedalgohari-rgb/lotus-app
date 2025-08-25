// backend/src/services/plant.service.ts
import { PrismaClient, Plant, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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
  location?: string; // JSON string for location data
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

export class PlantService {
  // Create new plant
  async create(userId: string, plantData: CreatePlantDto): Promise<Plant> {
    try {
      const plant = await prisma.plant.create({
        data: {
          ...plantData,
          userId,
          // Set default location to Cairo if not provided
          location: plantData.location || JSON.stringify({
            city: 'Cairo',
            governorate: 'Cairo',
            latitude: 30.0444,
            longitude: 31.2357,
          }),
        },
      });

      logger.info(`Plant created successfully: ${plant.id}`);
      return plant;
    } catch (error) {
      logger.error('Failed to create plant:', error);
      throw new Error('Failed to create plant');
    }
  }

  // Get all plants for a user
  async getUserPlants(userId: string): Promise<Plant[]> {
    try {
      const plants = await prisma.plant.findMany({
        where: { 
          userId,
          deletedAt: null // Only get non-deleted plants
        },
        orderBy: { createdAt: 'desc' },
      });

      return plants;
    } catch (error) {
      logger.error('Failed to fetch user plants:', error);
      throw new Error('Failed to fetch plants');
    }
  }

  // Get single plant by ID
  async getPlantById(plantId: string, userId: string): Promise<Plant | null> {
    try {
      const plant = await prisma.plant.findFirst({
        where: { 
          id: plantId, 
          userId,
          deletedAt: null 
        },
      });

      return plant;
    } catch (error) {
      logger.error('Failed to fetch plant:', error);
      throw new Error('Failed to fetch plant');
    }
  }

  // Update plant
  async updatePlant(plantId: string, userId: string, updates: UpdatePlantDto): Promise<Plant> {
    try {
      // Check if plant exists and belongs to user
      const existingPlant = await this.getPlantById(plantId, userId);
      if (!existingPlant) {
        throw new Error('Plant not found');
      }

      const updatedPlant = await prisma.plant.update({
        where: { id: plantId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      logger.info(`Plant updated successfully: ${plantId}`);
      return updatedPlant;
    } catch (error) {
      logger.error('Failed to update plant:', error);
      throw error;
    }
  }

  // Soft delete plant
  async deletePlant(plantId: string, userId: string): Promise<void> {
    try {
      // Check if plant exists and belongs to user
      const existingPlant = await this.getPlantById(plantId, userId);
      if (!existingPlant) {
        throw new Error('Plant not found');
      }

      await prisma.plant.update({
        where: { id: plantId },
        data: { 
          deletedAt: new Date() 
        },
      });

      logger.info(`Plant deleted successfully: ${plantId}`);
    } catch (error) {
      logger.error('Failed to delete plant:', error);
      throw error;
    }
  }

  // Get plant statistics
  async getPlantStats(userId: string) {
    try {
      const totalPlants = await prisma.plant.count({
        where: { userId, deletedAt: null }
      });

      const indoorPlants = await prisma.plant.count({
        where: { userId, environment: 'indoor', deletedAt: null }
      });

      const outdoorPlants = await prisma.plant.count({
        where: { userId, environment: 'outdoor', deletedAt: null }
      });

      return {
        total: totalPlants,
        indoor: indoorPlants,
        outdoor: outdoorPlants,
      };
    } catch (error) {
      logger.error('Failed to fetch plant stats:', error);
      throw new Error('Failed to fetch plant statistics');
    }
  }
}

export const plantService = new PlantService();