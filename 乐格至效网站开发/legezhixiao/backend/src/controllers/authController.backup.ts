import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { databaseConfig } from '../config/databaseAdapter';
import { 
  LoginRequest, 
  RegisterRequest, 
  ApiResponse, 
  AuthTokens, 
  JWTPayload,
  AppError,
  AuthRequest,
  UserRole,
  SubscriptionTier
} from '../types';
import { dataService } from '../services/dataService';
import { logger } from '../utils/logger';

export class AuthController {
  // 用户注册
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, password, confirmPassword }: RegisterRequest = req.body;

      // 验证输入
      if (!username || !email || !password || !confirmPassword) {
        throw new AppError('请填写所有必需字段', 400);
      }

      if (password !== confirmPassword) {
        throw new AppError('密码确认不匹配', 400);
      }

      if (password.length < 6) {
        throw new AppError('密码至少需要6个字符', 400);
      }

      // 检查用户是否已存在
      const existingUserByEmail = await dataService.query(
        'FOR user IN users FILTER user.email == @email LIMIT 1 RETURN user',
        { email }
      );
      
      const existingUserByUsername = await dataService.query(
        'FOR user IN users FILTER user.username == @username LIMIT 1 RETURN user',
        { username }
      );

      if (existingUserByEmail.length > 0 || existingUserByUsername.length > 0) {
        throw new AppError('邮箱或用户名已存在', 409);
      }

      // 加密密码
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 创建用户
      const userData = {
        username,
        email,
        password: hashedPassword,
        displayName: req.body.displayName || username,
        role: 'user' as UserRole,
        avatar: null,
        preferences: {
          theme: 'dark',
          language: 'zh-CN',
          autoSave: true,
          notifications: true
        },
        stats: {
          totalWords: 0,
          totalSessions: 0,
          totalProjects: 0,
          longestStreak: 0,
          currentStreak: 0
        },
        isEmailVerified: false,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const user = await dataService.create('users', userData);

      // 生成令牌
      const tokens = this.generateTokens(user);

      logger.info(`用户注册成功: ${user.email}`);

      const response: ApiResponse = {
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            subscription: user.subscription,
            profile: user.profile,
            preferences: user.preferences,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          },
          tokens
        }
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  // 用户登录
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, rememberMe }: LoginRequest = req.body;

      // 验证输入
      if (!email || !password) {
        throw new AppError('请提供邮箱和密码', 400);
      }

      // 获取模型
      const models = databaseConfig.models;
      if (!models) {
        throw new AppError('数据库连接错误', 500);
      }

      // 查找用户（包含密码）
      const user = await models.User.scope('withPassword').findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw new AppError('邮箱或密码错误', 401);
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError('邮箱或密码错误', 401);
      }

      // 检查用户是否激活
      if (!user.isActive) {
        throw new AppError('账户已被禁用', 403);
      }

      // 更新最后登录时间
      await user.update({ lastLoginAt: new Date() });

      // 生成令牌
      const tokens = this.generateTokens(user, rememberMe);

      logger.info(`用户登录成功: ${user.email}`);

      const response: ApiResponse = {
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            subscription: user.subscription,
            profile: user.profile,
            preferences: user.preferences,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
          },
          tokens
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 用户登出
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 这里可以添加令牌黑名单逻辑
      // 目前只是返回成功响应
      
      const response: ApiResponse = {
        success: true,
        message: '登出成功'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 刷新令牌
  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('刷新令牌是必需的', 400);
      }

      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as JWTPayload;

      // 获取模型
      const models = databaseConfig.models;
      if (!models) {
        throw new AppError('数据库连接错误', 500);
      }

      // 查找用户
      const user = await models.User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('用户不存在或已被禁用', 404);
      }

      // 生成新令牌
      const tokens = this.generateTokens(user);

      const response: ApiResponse = {
        success: true,
        message: '令牌刷新成功',
        data: { tokens }
      };

      res.json(response);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError('无效的刷新令牌', 401));
      } else {
        next(error);
      }
    }
  };

  // 忘记密码
  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('邮箱是必需的', 400);
      }

      // 获取模型
      const models = databaseConfig.models;
      if (!models) {
        throw new AppError('数据库连接错误', 500);
      }

      const user = await models.User.findOne({
        where: { email: email.toLowerCase() }
      });

      // 无论用户是否存在，都返回成功消息（安全考虑）
      const response: ApiResponse = {
        success: true,
        message: '如果邮箱存在，重置链接已发送'
      };

      if (user) {
        const resetToken = user.generateResetToken();
        await user.save();

        // 这里应该发送邮件
        logger.info(`密码重置令牌生成: ${user.email}, 令牌: ${resetToken}`);
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 重置密码
  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      if (!password || !confirmPassword) {
        throw new AppError('请提供密码和确认密码', 400);
      }

      if (password !== confirmPassword) {
        throw new AppError('密码确认不匹配', 400);
      }

      if (password.length < 6) {
        throw new AppError('密码至少需要6个字符', 400);
      }

      // 获取模型
      const models = databaseConfig.models;
      if (!models) {
        throw new AppError('数据库连接错误', 500);
      }

      // 查找具有有效重置令牌的用户
      const allUsers = await models.User.findAll();
      const user = allUsers.find((u: any) => 
        u.resetPasswordToken === token && 
        u.resetPasswordExpires && 
        new Date(u.resetPasswordExpires) > new Date()
      );

      if (!user) {
        throw new AppError('重置令牌无效或已过期', 400);
      }

      // 更新密码
      user.password = password;
      user.clearResetToken();
      await user.save();

      logger.info(`密码重置成功: ${user.email}`);

      const response: ApiResponse = {
        success: true,
        message: '密码重置成功'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 验证邮箱
  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;

      // 这里应该验证邮箱验证令牌
      // 目前只是返回成功响应

      const response: ApiResponse = {
        success: true,
        message: '邮箱验证成功'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 验证令牌
  public verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new AppError('令牌是必需的', 401);
      }

      // 验证令牌
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // 获取模型
      const models = databaseConfig.models;
      if (!models) {
        throw new AppError('数据库连接错误', 500);
      }

      const user = await models.User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('用户不存在或已被禁用', 404);
      }

      const response: ApiResponse = {
        success: true,
        message: '令牌有效',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            subscription: user.subscription,
            profile: user.profile,
            preferences: user.preferences,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
          }
        }
      };

      res.json(response);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError('无效的令牌', 401));
      } else {
        next(error);
      }
    }
  };

  // 生成JWT令牌
  private generateTokens(user: any, rememberMe: boolean = false): AuthTokens {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT密钥未配置', 500);
    }

    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      subscription: user.subscription
    };

    const accessTokenExpiry = rememberMe ? '30d' : process.env.JWT_EXPIRE || '7d';
    const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '30d';

    const accessToken = jwt.sign(payload as object, jwtSecret, {
      expiresIn: accessTokenExpiry
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload as object, jwtSecret, {
      expiresIn: refreshTokenExpiry
    } as jwt.SignOptions);

    return {
      accessToken,
      refreshToken
    };
  }
}

export default AuthController;
