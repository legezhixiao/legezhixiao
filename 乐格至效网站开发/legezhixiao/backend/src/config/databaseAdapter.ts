/**
 * 数据库适配器
 * 使用ArangoDB作为主要数据库
 */

import { logger } from '../utils/logger';
import { ArangoDBService, createArangoDBService, ArangoDBConfig } from '../services/arangoDBService';
import { initializeModels } from '../models/index_simple';

class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private arangoDBService: ArangoDBService | null = null;
  private isConnected: boolean = false;
  private _models: any = null;

  private constructor() {}

  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  /**
   * 初始化数据库连接
   * 使用ArangoDB作为唯一数据库
   */
  public async initialize(): Promise<void> {
    try {
      // ArangoDB配置
      const arangoConfig: ArangoDBConfig = {
        host: process.env.ARANGO_HOST || 'localhost',
        port: parseInt(process.env.ARANGO_PORT || '8529'),
        username: process.env.ARANGO_USERNAME || 'root',
        password: process.env.ARANGO_PASSWORD || '',
        database: process.env.ARANGO_DATABASE || 'legezhixiao'
      };

      // 初始化ArangoDB连接
      this.arangoDBService = createArangoDBService(arangoConfig);
      await this.arangoDBService.connect();
      
      this.isConnected = true;
      logger.info('✅ ArangoDB数据库连接成功');

      logger.info('✅ 数据库适配器初始化成功');

    } catch (error) {
      logger.error('❌ 数据库初始化失败，使用模拟模式:', error);
      this.isConnected = false;
      // 不抛出错误，继续以模拟模式运行
      logger.info('⚠️ 后端将以模拟模式运行（无数据库连接）');
    }
  }

  /**
   * 获取ArangoDB服务实例
   */
  public getArangoDBService(): ArangoDBService | null {
    return this.arangoDBService;
  }

  /**
   * 获取Sequelize实例（兼容性）
   */
  public getSequelize(): any {
    // 返回null，不再使用Sequelize
    return null;
  }

  /**
   * 获取所有模型 - 向后兼容
   */
  public get models() {
    if (!this._models) {
      this._models = initializeModels(null as any);
    }
    return this._models;
  }

  /**
   * 检查连接状态
   */
  public isArangoDBConnected(): boolean {
    return this.isConnected && this.arangoDBService !== null;
  }

  /**
   * 获取连接状态
   */
  public getConnectionStatus() {
    return {
      arangodb: this.arangoDBService ? 'connected' : 'disconnected',
      status: this.isConnected ? 'connected' : 'disconnected'
    };
  }

  /**
   * 断开连接
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.arangoDBService) {
        await this.arangoDBService.disconnect();
        this.arangoDBService = null;
      }

      this.isConnected = false;
      logger.info('数据库连接已断开');
    } catch (error) {
      logger.error('断开数据库连接时发生错误:', error);
    }
  }
}

// 导出类和单例实例
export { DatabaseAdapter };
export const databaseAdapter = DatabaseAdapter.getInstance();

// 保持向后兼容性的导出
export const databaseConfig = databaseAdapter;
export default databaseAdapter;
