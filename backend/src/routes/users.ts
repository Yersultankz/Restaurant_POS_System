import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createUserSchema, loginSchema, verifyPinSchema } from '../validators/auth.validator';

export function createUserRoutes(prisma: PrismaClient) {
  const router = Router();
  const controller = new UserController(prisma);

  router.get('/', controller.listUsers);
  router.post('/', authMiddleware, requireRoles(['boss', 'admin']), validateBody(createUserSchema), controller.createUser);
  router.post('/login', validateBody(loginSchema), controller.login);
  router.post('/verify-pin', validateBody(verifyPinSchema), controller.verifyPin);
  router.delete('/:id', authMiddleware, requireRoles(['boss', 'admin']), controller.deleteUser);

  return router;
}
