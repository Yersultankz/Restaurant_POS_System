import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import { MenuController } from '../controllers/menuController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { bulkMenuUpdateSchema, createMenuItemSchema, updateMenuItemSchema } from '../validators/menu.validator';

export function createMenuRoutes(prisma: PrismaClient, io: SocketServer) {
  const router = Router();
  const controller = new MenuController(prisma, io);
  const menuManagers = [authMiddleware, requireRoles(['boss', 'admin'])];

  router.get('/', controller.getMenuItems);
  router.post('/', menuManagers, validateBody(createMenuItemSchema), controller.createMenuItem);
  router.patch('/:id', menuManagers, validateBody(updateMenuItemSchema), controller.updateMenuItem);
  router.delete('/:id', menuManagers, controller.deleteMenuItem);
  router.post('/bulk', menuManagers, validateBody(bulkMenuUpdateSchema), controller.bulkUpdate);

  return router;
}
