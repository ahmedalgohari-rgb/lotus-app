"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.careService = exports.CareService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class CareService {
    async logCareAction(userId, careData) {
        try {
            const plant = await prisma.plant.findFirst({
                where: {
                    id: careData.plantId,
                    userId,
                    deletedAt: null
                },
            });
            if (!plant) {
                throw new Error('Plant not found');
            }
            const careLog = await prisma.careLog.create({
                data: {
                    type: careData.type,
                    notes: careData.notes,
                    metadata: careData.metadata,
                    imageUrl: careData.imageUrl,
                    performedAt: careData.performedAt || new Date(),
                    userId,
                    plantId: careData.plantId,
                },
            });
            const updateData = {};
            switch (careData.type) {
                case 'WATERING':
                    updateData.lastWateredAt = careLog.performedAt;
                    break;
                case 'FERTILIZING':
                    updateData.lastFertilizedAt = careLog.performedAt;
                    break;
                case 'PRUNING':
                    updateData.lastPrunedAt = careLog.performedAt;
                    break;
                case 'REPOTTING':
                    updateData.lastRepottedAt = careLog.performedAt;
                    break;
            }
            if (Object.keys(updateData).length > 0) {
                await prisma.plant.update({
                    where: { id: careData.plantId },
                    data: updateData,
                });
            }
            logger_1.logger.info(`Care action logged successfully: ${careLog.id}`);
            return careLog;
        }
        catch (error) {
            logger_1.logger.error('Failed to log care action:', error);
            throw error;
        }
    }
    async getPlantCareHistory(plantId, userId, limit = 20) {
        try {
            const plant = await prisma.plant.findFirst({
                where: {
                    id: plantId,
                    userId,
                    deletedAt: null
                },
            });
            if (!plant) {
                throw new Error('Plant not found');
            }
            const careHistory = await prisma.careLog.findMany({
                where: { plantId, userId },
                orderBy: { performedAt: 'desc' },
                take: limit,
            });
            return careHistory;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch care history:', error);
            throw error;
        }
    }
    async getRecentCareActions(userId, limit = 10) {
        try {
            const recentActions = await prisma.careLog.findMany({
                where: { userId },
                include: {
                    plant: {
                        select: { name: true }
                    }
                },
                orderBy: { performedAt: 'desc' },
                take: limit,
            });
            return recentActions;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch recent care actions:', error);
            throw new Error('Failed to fetch recent care actions');
        }
    }
    async getCareStats(userId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const careActions = await prisma.careLog.findMany({
                where: {
                    userId,
                    performedAt: { gte: startDate }
                },
                select: { type: true }
            });
            const stats = careActions.reduce((acc, log) => {
                acc[log.type] = (acc[log.type] || 0) + 1;
                return acc;
            }, {});
            return {
                totalActions: careActions.length,
                actionBreakdown: stats,
                period: `${days} days`,
                startDate: startDate.toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch care stats:', error);
            throw new Error('Failed to fetch care statistics');
        }
    }
    async getCareLogById(careLogId, userId) {
        try {
            const careLog = await prisma.careLog.findFirst({
                where: {
                    id: careLogId,
                    userId
                },
                include: {
                    plant: {
                        select: { name: true }
                    }
                }
            });
            return careLog;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch care log:', error);
            throw new Error('Failed to fetch care log');
        }
    }
    async updateCareLog(careLogId, userId, updates) {
        try {
            const existingCareLog = await prisma.careLog.findFirst({
                where: { id: careLogId, userId },
            });
            if (!existingCareLog) {
                throw new Error('Care log not found');
            }
            const updatedCareLog = await prisma.careLog.update({
                where: { id: careLogId },
                data: {
                    type: updates.type,
                    notes: updates.notes,
                    metadata: updates.metadata,
                    imageUrl: updates.imageUrl,
                    performedAt: updates.performedAt,
                },
            });
            logger_1.logger.info(`Care log updated successfully: ${careLogId}`);
            return updatedCareLog;
        }
        catch (error) {
            logger_1.logger.error('Failed to update care log:', error);
            throw error;
        }
    }
    async deleteCareLog(careLogId, userId) {
        try {
            const existingCareLog = await prisma.careLog.findFirst({
                where: { id: careLogId, userId },
            });
            if (!existingCareLog) {
                throw new Error('Care log not found');
            }
            await prisma.careLog.delete({
                where: { id: careLogId },
            });
            logger_1.logger.info(`Care log deleted successfully: ${careLogId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete care log:', error);
            throw error;
        }
    }
}
exports.CareService = CareService;
exports.careService = new CareService();
//# sourceMappingURL=care.service.js.map