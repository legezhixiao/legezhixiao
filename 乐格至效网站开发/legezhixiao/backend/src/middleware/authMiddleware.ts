import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import jwt from 'jsonwebtoken';
import { databaseConfig } from '../config/database';
import { logger } from '../utils/logger';

// 用户接口
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

// 扩展 Request 类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// 认证中间件
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      throw new AppError('未提供认证令牌', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!process.env.JWT_SECRET) {
      logger.error('环境变量 JWT_SECRET 未设置');
      throw new AppError('服务器配置错误', 500);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        id: string;
        username: string;
        email: string;
        role: string;
      };

      const { User } = databaseConfig.models!;
      const user = await User.findByPk(decoded.id);

      if (!user) {
        throw new AppError('用户不存在', 401);
      }

      // 添加用户信息到请求对象
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('无效的认证令牌', 401);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('认证失败:', error);
      res.status(500).json({ error: '认证过程中发生错误' });
    }
  }
};

// 角色验证中间件
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.role) {
        throw new AppError('未认证的访问', 401);
      }

      if (typeof user.role !== 'string' || !roles.includes(user.role)) {
        throw new AppError('权限不足', 403);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        logger.error('权限验证失败:', error);
        res.status(500).json({ error: '权限验证过程中发生错误' });
      }
    }
  };
};
