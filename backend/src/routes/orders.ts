import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { OrderController } from '../controllers/orderController';
import { validateBody } from '../middleware/validate.middleware';
import {
  addOrderItemsSchema,
  createOrderSchema,
  recordPaymentSchema,
  updateOrderItemStatusSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator';

export function createOrderRoutes(prisma: PrismaClient, io: Server) {
  const router = Router();
  const controller = new OrderController(prisma, io);

  // GET /api/orders - Get all orders
  router.get('/', controller.getAllOrders);

  // POST /api/orders - Create new order
  router.post('/', validateBody(createOrderSchema), controller.createOrder);

  // POST /api/orders/:id/items - Add items to an existing order
  router.post('/:id/items', validateBody(addOrderItemsSchema), controller.addOrderItems);

  // DELETE /api/orders/:id/items/:itemId - Remove one item from an existing order
  router.delete('/:id/items/:itemId', controller.deleteOrderItem);

  // PATCH /api/orders/:id/status - Update order status (State Machine protected)
  router.patch('/:id/status', validateBody(updateOrderStatusSchema), controller.updateStatus);

  // POST /api/orders/:id/pay - Record payment
  router.post('/:id/pay', validateBody(recordPaymentSchema), controller.recordPayment);

  // PATCH /api/orders/:id/items/:itemId/status - Update individual item status
  router.patch('/:id/items/:itemId/status', validateBody(updateOrderItemStatusSchema), controller.updateItemStatus);

  return router;
}
