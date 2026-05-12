import { RequestHandler } from 'express';

export type ValidationSchema<T> = {
  parse: (value: unknown) => T;
};

export const validateBody = <T>(schema: ValidationSchema<T>): RequestHandler => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid request body';
      console.warn('[Validation Error]', message, req.body);
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
      });
    }
  };
};
