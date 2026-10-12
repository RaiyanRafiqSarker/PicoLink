import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested path '${req.originalUrl}' does not exist on this server.`,
  });
}

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[Unhandled Server Error]', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
