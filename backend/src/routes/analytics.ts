import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsController } from '../controllers/analyticsController';

export function createAnalyticsRoutes(prisma: PrismaClient) {
  const router = Router();
  const controller = new AnalyticsController(prisma);

  router.get('/dashboard-metrics', controller.getDashboardMetrics);
  router.get('/revenue-trend', controller.getRevenueTrend);

  return router;
}
