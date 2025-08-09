import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// 扩展 Request 接口
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
      startTime?: number;
    }
  }
}

/**
 * 请求追踪中间件
 * 为每个请求生成唯一的追踪ID，并记录请求开始时间
 */
export const requestTracker = (req: Request, res: Response, next: NextFunction) => {
  // 生成追踪ID
  req.traceId = uuidv4().substring(0, 8);
  req.startTime = Date.now();
  
  // 记录请求开始
  logger.info('请求开始', {
    traceId: req.traceId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    const statusCode = res.statusCode;
    
    // 根据状态码选择日志级别
    const logLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    
    logger.log(logLevel, '请求完成', {
      traceId: req.traceId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
      timestamp: new Date().toISOString()
    });

    // 性能警告
    if (duration > 3000) {
      logger.warn('慢请求警告', {
        traceId: req.traceId,
        url: req.originalUrl,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

/**
 * 错误日志增强中间件
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('请求处理错误', {
    traceId: req.traceId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    },
    timestamp: new Date().toISOString()
  });

  next(err);
};
