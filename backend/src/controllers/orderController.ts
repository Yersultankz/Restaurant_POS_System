import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { BusinessError, OrderService, OrderStatus } from '../services/orderService';

const sendError = (res: Response, code: string, message: string, status = 400) => {
  return res.status(status).json({
    error: { code, message },
  });
};

export class OrderController {
  private orderService: OrderService;

  constructor(prisma: PrismaClient, private io: Server) {
    this.orderService = new OrderService(prisma);
  }

  getAllOrders = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const orders = await this.orderService.getOrders(limit, offset);

      res.json(orders);
    } catch (error) {
      console.error('[OrderController.getAllOrders]', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch orders';
      res.status(400).json({
        error: { code: 'FETCH_FAILED', message }
      });
    }
  };

  createOrder = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.createOrder(req.body);

      this.io.emit('sync_orders', order);
      res.status(201).json(order);
    } catch (error) {
      console.error('[OrderController.createOrder]', error);
      this.handleError(res, error, 'CREATE_FAILED', 'Failed to create order');
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.updateStatus(
        req.params.id as string,
        req.body.status as OrderStatus,
        req.body.version,
      );

      this.io.emit('sync_orders');
      res.json(order);
    } catch (error) {
      this.handleError(res, error, 'UPDATE_FAILED', 'Failed to update status');
    }
  };

  recordPayment = async (req: Request, res: Response) => {
    try {
      const result = await this.orderService.recordPayment(req.params.id as string, req.body);

      this.io.emit('sync_orders');
      this.io.to('analytics').emit('analytics:update');
      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'PAYMENT_FAILED', 'Failed to record payment');
    }
  };

  addOrderItems = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.addOrderItems(req.params.id as string, req.body.items);

      this.io.emit('sync_orders');
      res.json(order);
    } catch (error) {
      this.handleError(res, error, 'ADD_ITEMS_FAILED', 'Failed to add order items');
    }
  };

  deleteOrderItem = async (req: Request, res: Response) => {
    try {
      const orderItem = await this.orderService.deleteOrderItem(req.params.id as string, req.params.itemId as string);

      this.io.emit('sync_orders');
      res.json(orderItem);
    } catch (error) {
      this.handleError(res, error, 'DELETE_ITEM_FAILED', 'Failed to delete order item');
    }
  };

  updateItemStatus = async (req: Request, res: Response) => {
    try {
      const orderItem = await this.orderService.updateItemStatus(
        req.params.id as string,
        req.params.itemId as string,
        req.body.status,
      );

      this.io.emit('sync_orders');
      res.json(orderItem);
    } catch (error) {
      this.handleError(res, error, 'UPDATE_ITEM_FAILED', 'Failed to update item status');
    }
  };

  private handleError(res: Response, error: unknown, fallbackCode: string, fallbackMessage: string) {
    if (error instanceof BusinessError) {
      return sendError(res, error.code, error.message, error.status);
    }

    return sendError(res, fallbackCode, fallbackMessage, 500);
  }
}
