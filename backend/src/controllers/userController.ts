import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserBusinessError, UserService } from '../services/userService';

const sendError = (res: Response, code: string, message: string, status = 400) => {
  return res.status(status).json({
    error: { code, message },
  });
};

export class UserController {
  private userService: UserService;

  constructor(prisma: PrismaClient) {
    this.userService = new UserService(prisma);
  }

  listUsers = async (_req: Request, res: Response) => {
    try {
      const users = await this.userService.listUsers();
      res.json(users);
    } catch (error) {
      this.handleError(res, error, 'FETCH_FAILED', 'Failed to fetch users');
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      this.handleError(res, error, 'CREATE_FAILED', 'Failed to create user');
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.login(req.body.id, req.body.pin);
      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'LOGIN_FAILED', 'Internal server error during login');
    }
  };

  verifyPin = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.verifyPin(req.headers.authorization, req.body.pin);
      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'UNAUTHORIZED', 'Invalid token or session', 401);
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.deleteUser(req.params.id as string);
      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'DELETE_FAILED', 'Failed to delete user');
    }
  };

  private handleError(
    res: Response,
    error: unknown,
    fallbackCode: string,
    fallbackMessage: string,
    fallbackStatus = 500,
  ) {
    if (error instanceof UserBusinessError) {
      return sendError(res, error.code, error.message, error.status);
    }

    console.error(`[UserController.${fallbackCode}]`, error);
    return sendError(res, fallbackCode, fallbackMessage, fallbackStatus);
  }
}
