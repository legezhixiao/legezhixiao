import { Database, aql } from 'arangojs';
import { logger } from '../utils/logger';

export interface ArangoDBConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export class ArangoDBService {
  private db: Database;
  private isConnected: boolean = false;

  constructor(config: ArangoDBConfig) {
    const url = `http://${config.host}:${config.port}`;
    
    const dbConfig: any = {
      url,
      databaseName: config.database
    };
    
    // 只有在有用户名和密码时才添加认证
    if (config.username && config.password) {
      dbConfig.auth = {
        username: config.username,
        password: config.password
      };
    }
    
    this.db = new Database(dbConfig);
  }

  async connect(): Promise<void> {
    try {
      logger.info('正在连接到 ArangoDB...');
      
      // 测试连接
      await this.db.version();
      this.isConnected = true;
      
      logger.info('ArangoDB 连接成功');
      
      // 初始化集合
      await this.initializeCollections();
      
    } catch (error) {
      this.isConnected = false;
      logger.error('ArangoDB 连接失败:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        this.db.close();
        this.isConnected = false;
        logger.info('ArangoDB 连接已关闭');
      }
    } catch (error) {
      logger.error('关闭 ArangoDB 连接时出错:', error);
      throw error;
    }
  }

  private async initializeCollections(): Promise<void> {
    try {
      logger.info('初始化 ArangoDB 集合...');

      // 创建用户集合
      const userCollection = this.db.collection('users');
      if (!await userCollection.exists()) {
        await userCollection.create();
        
        // 创建唯一索引
        await userCollection.ensureIndex({
          type: 'persistent',
          fields: ['username'],
          unique: true
        } as any);
        
        await userCollection.ensureIndex({
          type: 'persistent',
          fields: ['email'],
          unique: true
        } as any);
        
        logger.info('用户集合创建成功');
      }

      // 创建用户会话集合
      const sessionCollection = this.db.collection('user_sessions');
      if (!await sessionCollection.exists()) {
        await sessionCollection.create();
        
        // 创建过期时间索引
        await sessionCollection.ensureIndex({
          type: 'ttl',
          fields: ['expiresAt'],
          expireAfter: 0
        } as any);
        
        logger.info('用户会话集合创建成功');
      }

      // 创建小说集合
      const novelCollection = this.db.collection('novels');
      if (!await novelCollection.exists()) {
        await novelCollection.create();
        
        // 创建索引
        await novelCollection.ensureIndex({
          type: 'persistent',
          fields: ['authorId']
        } as any);
        
        await novelCollection.ensureIndex({
          type: 'inverted',
          fields: ['title', 'description']
        } as any);
        
        logger.info('小说集合创建成功');
      }

      // 创建章节集合
      const chapterCollection = this.db.collection('chapters');
      if (!await chapterCollection.exists()) {
        await chapterCollection.create();
        
        // 创建索引
        await chapterCollection.ensureIndex({
          type: 'persistent',
          fields: ['novelId']
        } as any);
        
        await chapterCollection.ensureIndex({
          type: 'persistent',
          fields: ['chapterNumber']
        } as any);
        
        logger.info('章节集合创建成功');
      }

      // 创建AI代理配置集合
      const agentConfigCollection = this.db.collection('agent_configs');
      if (!await agentConfigCollection.exists()) {
        await agentConfigCollection.create();
        
        await agentConfigCollection.ensureIndex({
          type: 'persistent',
          fields: ['userId']
        } as any);
        
        logger.info('AI代理配置集合创建成功');
      }

      logger.info('所有集合初始化完成');
      
    } catch (error) {
      logger.error('初始化集合时出错:', error);
      throw error;
    }
  }

  // 通用查询方法
  async query(aqlQuery: string, bindVars?: any): Promise<any> {
    try {
      if (!this.isConnected) {
        throw new Error('数据库未连接');
      }
      
      const cursor = await this.db.query(aqlQuery, bindVars);
      return await cursor.all();
      
    } catch (error) {
      logger.error('查询执行失败:', error);
      throw error;
    }
  }

  // 获取集合
  getCollection(name: string) {
    return this.db.collection(name);
  }

  // 检查连接状态
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; version?: string; error?: string }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: '数据库未连接' };
      }
      
      const version = await this.db.version();
      return { 
        status: 'connected', 
        version: version.version 
      };
      
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }

  // AQL 模板标记函数
  aql(strings: TemplateStringsArray, ...values: any[]): any {
    return aql(strings, ...values);
  }

  // 文档操作方法
  async createDocument(collectionName: string, data: any): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.save(data);
      return result;
    } catch (error) {
      logger.error(`创建文档失败 (${collectionName}):`, error);
      throw error;
    }
  }

  async getDocument(collectionName: string, key: string): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.document(key);
      return result;
    } catch (error) {
      logger.error(`获取文档失败 (${collectionName}/${key}):`, error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, key: string, data: any): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.update(key, data);
      return result;
    } catch (error) {
      logger.error(`更新文档失败 (${collectionName}/${key}):`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, key: string): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.remove(key);
      return result;
    } catch (error) {
      logger.error(`删除文档失败 (${collectionName}/${key}):`, error);
      throw error;
    }
  }

  async queryDocuments(aqlQuery: string, bindVars?: any): Promise<any[]> {
    try {
      const result = await this.query(aqlQuery, bindVars);
      return result;
    } catch (error) {
      logger.error('查询文档失败:', error);
      throw error;
    }
  }

  // 为dataService提供的便捷查询方法
  async findDocuments(collectionName: string, filters: any = {}): Promise<any[]> {
    try {
      const collection = this.db.collection(collectionName);
      
      if (Object.keys(filters).length === 0) {
        // 如果没有过滤条件，返回所有文档
        const aqlQuery = `FOR doc IN ${collectionName} RETURN doc`;
        return await this.queryDocuments(aqlQuery);
      } else {
        // 构建AQL查询
        const filterConditions = Object.keys(filters).map((key, index) => 
          `doc.${key} == @param${index}`
        ).join(' AND ');
        
        const bindVars: any = {};
        Object.keys(filters).forEach((key, index) => {
          bindVars[`param${index}`] = filters[key];
        });
        
        const aqlQuery = `FOR doc IN ${collectionName} FILTER ${filterConditions} RETURN doc`;
        return await this.queryDocuments(aqlQuery, bindVars);
      }
    } catch (error) {
      logger.error(`查找文档失败: ${collectionName}`, error);
      throw error;
    }
  }
}

// 导出单例实例
let arangoDBService: ArangoDBService | null = null;

export function createArangoDBService(config: ArangoDBConfig): ArangoDBService {
  if (!arangoDBService) {
    arangoDBService = new ArangoDBService(config);
  }
  return arangoDBService;
}

export function getArangoDBService(): ArangoDBService {
  if (!arangoDBService) {
    throw new Error('ArangoDB 服务未初始化，请先调用 createArangoDBService');
  }
  return arangoDBService;
}

export default ArangoDBService;
