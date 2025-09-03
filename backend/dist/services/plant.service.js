"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantService = exports.PlantService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class PlantService {
    async create(userId, plantData) {
        try {
            const plant = await prisma.plant.create({
                data: {
                    ...plantData,
                    userId,
                    location: plantData.location || JSON.stringify({
                        city: 'Cairo',
                        governorate: 'Cairo',
                        latitude: 30.0444,
                        longitude: 31.2357,
                    }),
                },
            });
            logger_1.logger.info(`Plant created successfully: ${plant.id}`);
            return plant;
        }
        catch (error) {
            logger_1.logger.error('Failed to create plant:', error);
            throw new Error('Failed to create plant');
        }
    }
    async getUserPlants(userId) {
        try {
            const plants = await prisma.plant.findMany({
                where: {
                    userId,
                    deletedAt: null
                },
                orderBy: { createdAt: 'desc' },
            });
            return plants;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch user plants:', error);
            throw new Error('Failed to fetch plants');
        }
    }
    async getPlantById(plantId, userId) {
        try {
            const plant = await prisma.plant.findFirst({
                where: {
                    id: plantId,
                    userId,
                    deletedAt: null
                },
            });
            return plant;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch plant:', error);
            throw new Error('Failed to fetch plant');
        }
    }
    async updatePlant(plantId, userId, updates) {
        try {
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
            logger_1.logger.info(`Plant updated successfully: ${plantId}`);
            return updatedPlant;
        }
        catch (error) {
            logger_1.logger.error('Failed to update plant:', error);
            throw error;
        }
    }
    async deletePlant(plantId, userId) {
        try {
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
            logger_1.logger.info(`Plant deleted successfully: ${plantId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete plant:', error);
            throw error;
        }
    }
    async getPlantStats(userId) {
        try {
            const totalPlants = await prisma.plant.count({
                where: { userId, deletedAt: null }
            });
            const indoorPlants = 0;
            const outdoorPlants = 0;
            return {
                total: totalPlants,
                indoor: indoorPlants,
                outdoor: outdoorPlants,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch plant stats:', error);
            throw new Error('Failed to fetch plant statistics');
        }
    }
}
exports.PlantService = PlantService;
exports.plantService = new PlantService();
//# sourceMappingURL=plant.service.js.map