// backend/src/services/care.service.ts
import { PrismaClient, CareLog, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateCareLogDto {
  plantId: string;
  type: 'WATERING' | 'FERTILIZING' | 'PRUNING' | 'REPOTTING' | 'OBSERVATION';
  notes?: string;
  metadata?: string; // JSON string for additional data
  imageUrl?: string;
  performedAt?: Date;
}

export class CareService {
  // Log care action
  async logCareAction(userId: string, careData: CreateCareLogDto): Promise<CareLog> {
    try {
      // Verify plant belongs to user
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

      // Update plant's last care dates based on care type
      const updateData: any = {};
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

      logger.info(`Care action logged successfully: ${careLog.id}`);
      return careLog;
    } catch (error) {
      logger.error('Failed to log care action:', error);
      throw error;
    }
  }

  // Get care history for a plant
  async getPlantCareHistory(plantId: string, userId: string, limit: number = 20): Promise<CareLog[]> {
    try {
      // Verify plant belongs to user
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
    } catch (error) {
      logger.error('Failed to fetch care history:', error);
      throw error;
    }
  }

  // Get recent care actions for all user plants
  async getRecentCareActions(userId: string, limit: number = 10): Promise<(CareLog & { plant: { name: string } })[]> {
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
    } catch (error) {
      logger.error('Failed to fetch recent care actions:', error);
      throw new Error('Failed to fetch recent care actions');
    }
  }

  // Get care statistics
  async getCareStats(userId: string, days: number = 30) {
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
      }, {} as Record<string, number>);

      return {
        totalActions: careActions.length,
        actionBreakdown: stats,
        period: `${days} days`,
        startDate: startDate.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to fetch care stats:', error);
      throw new Error('Failed to fetch care statistics');
    }
  }

  // Get care log by ID (for specific user)
  async getCareLogById(careLogId: string, userId: string): Promise<CareLog | null> {
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
    } catch (error) {
      logger.error('Failed to fetch care log:', error);
      throw new Error('Failed to fetch care log');
    }
  }

  // Update care log
  async updateCareLog(careLogId: string, userId: string, updates: Partial<CreateCareLogDto>): Promise<CareLog> {
    try {
      // Verify care log belongs to user
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

      logger.info(`Care log updated successfully: ${careLogId}`);
      return updatedCareLog;
    } catch (error) {
      logger.error('Failed to update care log:', error);
      throw error;
    }
  }

  // Delete care log
  async deleteCareLog(careLogId: string, userId: string): Promise<void> {
    try {
      // Verify care log belongs to user
      const existingCareLog = await prisma.careLog.findFirst({
        where: { id: careLogId, userId },
      });

      if (!existingCareLog) {
        throw new Error('Care log not found');
      }

      await prisma.careLog.delete({
        where: { id: careLogId },
      });

      logger.info(`Care log deleted successfully: ${careLogId}`);
    } catch (error) {
      logger.error('Failed to delete care log:', error);
      throw error;
    }
  }
}

export const careService = new CareService();