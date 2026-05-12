import { RequestHandler } from 'express';
import { AuthRequest } from './auth';

export const requireRoles = (roles: string[]): RequestHandler => {
  return (req: AuthRequest, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
};
