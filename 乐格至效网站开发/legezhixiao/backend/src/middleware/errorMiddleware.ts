import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('错误处理中间件捕获到错误:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message
    });
  }

  // Sequelize 错误处理
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: '数据验证失败',
      details: (error as any).errors.map((e: any) => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: '资源冲突',
      details: (error as any).errors.map((e: any) => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // 默认错误响应
  return res.status(500).json({
    error: '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
};
