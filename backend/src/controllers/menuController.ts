import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import { MenuBusinessError, MenuService } from '../services/menuService';

const sendError = (res: Response, code: string, message: string, status = 400) => {
  return res.status(status).json({
    error: { code, message },
  });
};

export class MenuController {
  private menuService: MenuService;

  constructor(prisma: PrismaClient, private io: SocketServer) {
    this.menuService = new MenuService(prisma);
  }

  getMenuItems = async (req: Request, res: Response) => {
    try {
      const items = await this.menuService.getMenuItems(req.query.category as string | undefined);
      res.json(items);
    } catch (error) {
      this.handleError(res, error, 'FETCH_FAILED', 'Failed to fetch menu items');
    }
  };

  createMenuItem = async (req: Request, res: Response) => {
    try {
      const item = await this.menuService.createMenuItem(req.body);
      this.emitMenuUpdated();
      res.status(201).json(item);
    } catch (error) {
      this.handleError(res, error, 'CREATE_FAILED', 'Failed to create menu item');
    }
  };

  updateMenuItem = async (req: Request, res: Response) => {
    try {
      const item = await this.menuService.updateMenuItem(req.params.id as string, req.body);
      this.emitMenuUpdated();
      res.json(item);
    } catch (error) {
      this.handleError(res, error, 'UPDATE_FAILED', 'Failed to update menu item');
    }
  };

  deleteMenuItem = async (req: Request, res: Response) => {
    try {
      const result = await this.menuService.deleteMenuItem(req.params.id as string);
      this.emitMenuUpdated();
      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'DELETE_FAILED', 'Failed to delete menu item');
    }
  };

  bulkUpdate = async (req: Request, res: Response) => {
    try {
      const result = await this.menuService.bulkUpdate(req.body);
      this.emitMenuUpdated();
      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'BULK_UPDATE_FAILED', 'Failed to perform bulk update');
    }
  };

  private emitMenuUpdated() {
    this.io.emit('menu:updated');
  }

  private handleError(res: Response, error: unknown, fallbackCode: string, fallbackMessage: string) {
    if (error instanceof MenuBusinessError) {
      return sendError(res, error.code, error.message, error.status);
    }

    console.error(`[MenuController.${fallbackCode}]`, error);
    return sendError(res, fallbackCode, fallbackMessage, 500);
  }
}
