/**
 * ArangoDB 用户模型
 * 提供用户相关的数据操作
 */

import bcrypt from 'bcryptjs';
import { dataService } from '../services/dataService';
import { logger } from '../utils/logger';
import { UserRole, SubscriptionTier } from '../types';

export interface UserAttributes {
  _key?: string;
  _id?: string;
  _rev?: string;
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  subscription?: SubscriptionTier;
  profile?: any;
  preferences?: any;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserArangoDB {
  private static collection = 'users';

  /**
   * 创建用户
   */
  static async create(userData: Partial<UserAttributes>): Promise<UserAttributes> {
    try {
      // 哈希密码
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      // 设置默认值
      const now = new Date();
      const user = {
        ...userData,
        role: userData.role || UserRole.USER,
        subscription: userData.subscription || SubscriptionTier.FREE,
        profile: userData.profile || {},
        preferences: userData.preferences || {},
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        emailVerified: userData.emailVerified || false,
        createdAt: userData.createdAt || now,
        updatedAt: userData.updatedAt || now
      };

      const result = await dataService.create(this.collection, user);
      logger.info(`用户创建成功: ${result._key}`);
      return result;
    } catch (error) {
      logger.error('创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 根据邮箱或用户名查找用户
   */
  static async findByEmailOrUsername(identifier: string): Promise<UserAttributes | null> {
    try {
      const query = `
        FOR user IN ${this.collection}
        FILTER user.email == @identifier || user.username == @identifier
        RETURN user
      `;
      
      const result = await dataService.query(query, { identifier: identifier.toLowerCase() });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('查找用户失败:', error);
      return null;
    }
  }

  /**
   * 根据ID查找用户
   */
  static async findById(id: string): Promise<UserAttributes | null> {
    try {
      return await dataService.findById(this.collection, id);
    } catch (error) {
      logger.error('根据ID查找用户失败:', error);
      return null;
    }
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<UserAttributes | null> {
    try {
      const query = `
        FOR user IN ${this.collection}
        FILTER user.email == @email
        RETURN user
      `;
      
      const result = await dataService.query(query, { email: email.toLowerCase() });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('根据邮箱查找用户失败:', error);
      return null;
    }
  }

  /**
   * 验证密码
   */
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('密码验证失败:', error);
      return false;
    }
  }

  /**
   * 更新用户
   */
  static async update(id: string, updateData: Partial<UserAttributes>): Promise<UserAttributes | null> {
    try {
      // 如果更新密码，需要哈希
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

      updateData.updatedAt = new Date();
      return await dataService.update(this.collection, id, updateData);
    } catch (error) {
      logger.error('更新用户失败:', error);
      return null;
    }
  }

  /**
   * 删除用户
   */
  static async delete(id: string): Promise<boolean> {
    try {
      return await dataService.delete(this.collection, id);
    } catch (error) {
      logger.error('删除用户失败:', error);
      return false;
    }
  }

  /**
   * 获取所有活跃用户
   */
  static async findActiveUsers(): Promise<UserAttributes[]> {
    try {
      const query = `
        FOR user IN ${this.collection}
        FILTER user.isActive == true
        RETURN user
      `;
      
      return await dataService.query(query);
    } catch (error) {
      logger.error('查找活跃用户失败:', error);
      return [];
    }
  }

  /**
   * 生成重置密码令牌
   */
  static generateResetToken(): { token: string, expires: Date } {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
    
    return { token, expires };
  }

  /**
   * 根据重置令牌查找用户
   */
  static async findByResetToken(token: string): Promise<UserAttributes | null> {
    try {
      const query = `
        FOR user IN ${this.collection}
        FILTER user.resetPasswordToken == @token 
        AND user.resetPasswordExpires > @now
        RETURN user
      `;
      
      const result = await dataService.query(query, { 
        token, 
        now: new Date() 
      });
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('根据重置令牌查找用户失败:', error);
      return null;
    }
  }
}

export default UserArangoDB;
