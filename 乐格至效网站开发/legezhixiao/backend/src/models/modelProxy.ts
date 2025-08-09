/**
 * 模型代理
 * 提供Sequelize兼容的接口，底层使用ArangoDB
 */

import { dataService } from '../services/dataService';
import { logger } from '../utils/logger';

export class ModelProxy {
  private collection: string;

  constructor(collection: string) {
    this.collection = collection;
  }

  /**
   * 创建新记录
   */
  async create(data: any): Promise<any> {
    try {
      // 添加时间戳
      const now = new Date().toISOString();
      const documentData = {
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now
      };

      return await dataService.create(this.collection, documentData);
    } catch (error) {
      logger.error(`ModelProxy.create失败 [${this.collection}]:`, error);
      throw error;
    }
  }

  /**
   * 根据ID查找
   */
  async findByPk(id: string): Promise<any> {
    try {
      return await dataService.findById(this.collection, id);
    } catch (error) {
      logger.error(`ModelProxy.findByPk失败 [${this.collection}/${id}]:`, error);
      return null;
    }
  }

  /**
   * 查找一个记录
   */
  async findOne(options: any = {}): Promise<any> {
    try {
      const { where = {} } = options;
      const results = await dataService.findAll(this.collection, where);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error(`ModelProxy.findOne失败 [${this.collection}]:`, error);
      return null;
    }
  }

  /**
   * 查找所有记录
   */
  async findAll(options: any = {}): Promise<any[]> {
    try {
      const { where = {} } = options;
      return await dataService.findAll(this.collection, where);
    } catch (error) {
      logger.error(`ModelProxy.findAll失败 [${this.collection}]:`, error);
      return [];
    }
  }

  /**
   * 更新记录
   */
  async update(data: any, options: any): Promise<[number, any[]]> {
    try {
      const { where = {} } = options;
      
      // 添加更新时间戳
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      // 先查找要更新的记录
      const records = await dataService.findAll(this.collection, where);
      const updatedRecords = [];

      for (const record of records) {
        const updated = await dataService.update(this.collection, record._key, updateData);
        updatedRecords.push(updated);
      }

      return [updatedRecords.length, updatedRecords];
    } catch (error) {
      logger.error(`ModelProxy.update失败 [${this.collection}]:`, error);
      return [0, []];
    }
  }

  /**
   * 删除记录
   */
  async destroy(options: any): Promise<number> {
    try {
      const { where = {} } = options;
      const records = await dataService.findAll(this.collection, where);
      
      for (const record of records) {
        await dataService.delete(this.collection, record._key);
      }
      
      return records.length;
    } catch (error) {
      logger.error(`ModelProxy.destroy失败 [${this.collection}]:`, error);
      return 0;
    }
  }

  /**
   * 递增字段值
   */
  async increment(field: string, options: any): Promise<void> {
    try {
      const { where = {} } = options;
      const records = await dataService.findAll(this.collection, where);
      
      for (const record of records) {
        const currentValue = record[field] || 0;
        await dataService.update(this.collection, record._key, {
          [field]: currentValue + 1,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error(`ModelProxy.increment失败 [${this.collection}]:`, error);
    }
  }

  /**
   * 递减字段值
   */
  async decrement(field: string, options: any): Promise<void> {
    try {
      const { where = {} } = options;
      const records = await dataService.findAll(this.collection, where);
      
      for (const record of records) {
        const currentValue = record[field] || 0;
        await dataService.update(this.collection, record._key, {
          [field]: Math.max(0, currentValue - 1),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error(`ModelProxy.decrement失败 [${this.collection}]:`, error);
    }
  }

  /**
   * 获取字段最大值
   */
  async max(field: string, options: any = {}): Promise<number> {
    try {
      const { where = {} } = options;
      const records = await dataService.findAll(this.collection, where);
      
      if (records.length === 0) return 0;
      
      const values = records.map(r => r[field] || 0).filter(v => typeof v === 'number');
      return values.length > 0 ? Math.max(...values) : 0;
    } catch (error) {
      logger.error(`ModelProxy.max失败 [${this.collection}]:`, error);
      return 0;
    }
  }

  /**
   * 作用域查询（兼容性方法）
   */
  scope(scopeName: string) {
    // 返回自身，保持链式调用
    return this;
  }

  /**
   * 计数
   */
  async count(options: any = {}): Promise<number> {
    try {
      const { where = {} } = options;
      const records = await dataService.findAll(this.collection, where);
      return records.length;
    } catch (error) {
      logger.error(`ModelProxy.count失败 [${this.collection}]:`, error);
      return 0;
    }
  }

  /**
   * 按邮箱或用户名查找用户 (User模型特有方法)
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<any> {
    try {
      const records = await dataService.findAll(this.collection, {});
      return records.find(record => 
        record.email === emailOrUsername || record.username === emailOrUsername
      ) || null;
    } catch (error) {
      logger.error(`ModelProxy.findByEmailOrUsername失败 [${this.collection}]:`, error);
      return null;
    }
  }
}

/**
 * 模型工厂
 */
export class ModelFactory {
  private static models: Map<string, ModelProxy> = new Map();

  static getModel(name: string): ModelProxy {
    const collection = this.getCollectionName(name);
    
    if (!this.models.has(collection)) {
      this.models.set(collection, new ModelProxy(collection));
    }
    
    return this.models.get(collection)!;
  }

  private static getCollectionName(modelName: string): string {
    // 将模型名转换为ArangoDB集合名
    const collectionMap: { [key: string]: string } = {
      'User': 'users',
      'Project': 'projects', 
      'Chapter': 'chapters',
      'Character': 'characters',
      'WorldBuilding': 'worldbuilding',
      'WritingSession': 'writing_sessions',
      'WritingGoal': 'writing_goals',
      'TimelineEvent': 'timeline_events',
      'WritingTemplate': 'writing_templates'
    };

    return collectionMap[modelName] || modelName.toLowerCase() + 's';
  }
}

// 导出常用模型
export const User = ModelFactory.getModel('User');
export const Project = ModelFactory.getModel('Project');
export const Chapter = ModelFactory.getModel('Chapter');
export const Character = ModelFactory.getModel('Character');
export const WorldBuilding = ModelFactory.getModel('WorldBuilding');
export const WritingSession = ModelFactory.getModel('WritingSession');
export const WritingGoal = ModelFactory.getModel('WritingGoal');
export const TimelineEvent = ModelFactory.getModel('TimelineEvent');
export const WritingTemplate = ModelFactory.getModel('WritingTemplate');
