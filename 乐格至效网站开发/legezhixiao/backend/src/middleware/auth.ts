import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { logger } from '../utils/logger';

// 扩展 Request 接口以包含 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
      };
    }
  }
}

// JWT 认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: '访问令牌缺失' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    // 验证 token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.email.split('@')[0], // 从邮箱提取用户名
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: '访问令牌已过期' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: '无效的访问令牌' });
    } else {
      logger.error('认证中间件错误:', error);
      res.status(500).json({ error: '认证失败' });
    }
  }
};

// 导出别名
export const auth = authenticateToken;

// 可选的认证中间件（允许匿名访问）
export const optionalAuthentication = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.email.split('@')[0], // 从邮箱提取用户名
      role: decoded.role
    };

    next();
  } catch (error) {
    // 如果认证失败，仍然继续处理请求（匿名访问）
    next();
  }
};

// 角色授权中间件
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: '需要认证' });
      return;
    }

    if (!req.user?.role || !roles.includes(req.user.role)) {
      res.status(403).json({ error: '权限不足' });
      return;
    }

    next();
  };
};

// 检查是否为项目所有者的中间件
export const requireProjectOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '需要认证' });
      return;
    }

    const { projectId } = req.params;
    if (!projectId) {
      res.status(400).json({ error: '项目ID缺失' });
      return;
    }

    // 这里需要检查项目所有权，暂时跳过实现
    // 在实际使用时，应该查询数据库验证用户是否拥有该项目
    
    next();
  } catch (error) {
    logger.error('项目所有权验证错误:', error);
    res.status(500).json({ error: '权限验证失败' });
  }
};
