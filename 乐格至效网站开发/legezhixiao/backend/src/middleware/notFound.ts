import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const message = `找不到路径 ${req.originalUrl}`;
  const error = new AppError(message, 404);
  next(error);
};

export default notFound;
