import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor(prisma: PrismaClient) {
    this.analyticsService = new AnalyticsService(prisma);
  }

  getDashboardMetrics = async (_req: Request, res: Response) => {
    try {
      const metrics = await this.analyticsService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('[AnalyticsController.getDashboardMetrics]', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  };

  getRevenueTrend = async (_req: Request, res: Response) => {
    try {
      const trend = await this.analyticsService.getRevenueTrend();
      res.json(trend);
    } catch (error) {
      console.error('[AnalyticsController.getRevenueTrend]', error);
      res.status(500).json({ error: 'Failed to fetch revenue trend' });
    }
  };
}
