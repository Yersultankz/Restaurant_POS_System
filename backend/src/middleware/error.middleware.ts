import { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('[UnhandledError]', error);

  if (res.headersSent) return;

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    },
  });
};
