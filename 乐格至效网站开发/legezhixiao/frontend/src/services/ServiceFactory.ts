/**
 * 真实服务工厂
 * 统一管理所有真实服务的实例化和配置
 */

import { realAuthService } from './realAuthService';
import { realArangoDBService } from './realArangoDBService';
import { realAIService } from './realAIService';

export interface IAuthService {
  login(credentials: any): Promise<any>;
  logout(): Promise<void>;
  register(userData: any): Promise<any>;
  refreshToken(): Promise<any>;
  updatePreferences(preferences: any): Promise<any>; // 修改为与实际实现一致
}

export interface IDatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  createUser(userData: any): Promise<any>;
  getUserById(id: string): Promise<any>;
  updateUser(id: string, userData: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
  createProject(projectData: any): Promise<any>;
  getProjectById(id: string): Promise<any>;
  updateProject(id: string, projectData: any): Promise<any>;
  deleteProject(id: string): Promise<boolean>;
  getUserProjects(userId: string): Promise<any[]>;
}

export interface IAIService {
  generateText(prompt: string, options?: any): Promise<string>;
  generateOutline(prompt: string, options?: any): Promise<any>;
  analyzeCharacter(characterData: any): Promise<any>;
  generateDialogue(context: any): Promise<string>;
  improveText(text: string, options?: any): Promise<string>;
}

/**
 * 真实服务工厂类
 */
class ServiceFactory {
  private static instance: ServiceFactory;
  
  private constructor() {}
  
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }
  
  /**
   * 获取认证服务
   */
  public getAuthService(): IAuthService {
    console.log('🔐 使用真实认证服务');
    return realAuthService;
  }
  
  /**
   * 获取数据库服务
   */
  public getDatabaseService(): IDatabaseService {
    console.log('🗄️ 使用真实数据库服务');
    return realArangoDBService;
  }
  
  /**
   * 获取AI服务
   */
  public getAIService(): IAIService {
    console.log('🤖 使用真实AI服务');
    return realAIService;
  }
}

// 导出单例实例
export const serviceFactory = ServiceFactory.getInstance();

// 导出服务实例（向后兼容）
export const authService = serviceFactory.getAuthService();
export const databaseService = serviceFactory.getDatabaseService();
export const aiService = serviceFactory.getAIService();
