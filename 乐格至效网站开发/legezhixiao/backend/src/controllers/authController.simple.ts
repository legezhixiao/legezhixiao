import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
            displayName: user.displayName,
            role: user.role,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          },
          ...tokens
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
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        throw new AppError('请填写邮箱和密码', 400);
      }

      // 查找用户
      const users = await dataService.query(
        'FOR user IN users FILTER user.email == @email LIMIT 1 RETURN user',
        { email }
      );

      if (users.length === 0) {
        throw new AppError('邮箱或密码错误', 401);
      }

      const user = users[0];

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('邮箱或密码错误', 401);
      }

      // 更新最后登录时间
      await dataService.update('users', user._key, {
        lastLoginAt: new Date().toISOString()
      });

      // 生成令牌
      const tokens = this.generateTokens(user);

      logger.info(`用户登录成功: ${user.email}`);

      const response: ApiResponse = {
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified
          },
          ...tokens
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 生成JWT令牌
  private generateTokens(user: any): AuthTokens {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const payload = {
      userId: user.id || user._key,
      email: user.email,
      role: user.role || 'user'
    };

    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken
    };
  }

  // 令牌验证
  public verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response: ApiResponse = {
        success: true,
        message: '令牌有效',
        data: {
          user: req.user
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 临时空方法，避免编译错误
  public logout = async (req: Request, res: Response) => {
    res.json({ success: true, message: '退出登录成功' });
  };

  public refreshToken = async (req: Request, res: Response) => {
    res.json({ success: true, message: '刷新令牌功能待实现' });
  };

  public forgotPassword = async (req: Request, res: Response) => {
    res.json({ success: true, message: '忘记密码功能待实现' });
  };

  public resetPassword = async (req: Request, res: Response) => {
    res.json({ success: true, message: '重置密码功能待实现' });
  };

  public verifyEmail = async (req: Request, res: Response) => {
    res.json({ success: true, message: '邮箱验证功能待实现' });
  };
}

const authController = new AuthController();
export default authController;
