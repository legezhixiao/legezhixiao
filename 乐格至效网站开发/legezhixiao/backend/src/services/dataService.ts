/**
 * 数据服务层
 * 将Sequelize模型操作转换为ArangoDB操作
 */

import { databaseAdapter } from '../config/databaseAdapter';
import { logger } from '../utils/logger';

export class DataService {
  private static instance: DataService;
  
  private constructor() {}
  
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * 获取ArangoDB服务
   */
  private getArangoService() {
    const arangoService = databaseAdapter.getArangoDBService();
    if (!arangoService) {
      throw new Error('ArangoDB服务未初始化');
    }
    return arangoService;
  }

  /**
   * 通用的创建操作
   */
  async create(collection: string, data: any): Promise<any> {
    try {
      const arangoService = this.getArangoService();
      const result = await arangoService.createDocument(collection, data);
      logger.debug(`创建文档成功: ${collection}`, { id: result._key });
      return this.formatResult(result);
    } catch (error) {
      logger.error(`创建文档失败: ${collection}`, error);
      throw error;
    }
  }

  /**
   * 通用的查找操作
   */
  async findById(collection: string, id: string): Promise<any> {
    try {
      const arangoService = this.getArangoService();
      const result = await arangoService.getDocument(collection, id);
      return result ? this.formatResult(result) : null;
    } catch (error) {
      logger.error(`查找文档失败: ${collection}/${id}`, error);
      return null;
    }
  }

  /**
   * 通用的查找多个操作
   */
  async findAll(collection: string, filters: any = {}): Promise<any[]> {
    try {
      const arangoService = this.getArangoService();
      const results = await arangoService.findDocuments(collection, filters);
      return results.map((result: any) => this.formatResult(result));
    } catch (error) {
      logger.error(`查找文档列表失败: ${collection}`, error);
      return [];
    }
  }

  /**
   * 通用的更新操作
   */
  async update(collection: string, id: string, data: any): Promise<any> {
    try {
      const arangoService = this.getArangoService();
      const result = await arangoService.updateDocument(collection, id, data);
      logger.debug(`更新文档成功: ${collection}/${id}`);
      return this.formatResult(result);
    } catch (error) {
      logger.error(`更新文档失败: ${collection}/${id}`, error);
      throw error;
    }
  }

  /**
   * 通用的删除操作
   */
  async delete(collection: string, id: string): Promise<boolean> {
    try {
      const arangoService = this.getArangoService();
      await arangoService.deleteDocument(collection, id);
      logger.debug(`删除文档成功: ${collection}/${id}`);
      return true;
    } catch (error) {
      logger.error(`删除文档失败: ${collection}/${id}`, error);
      return false;
    }
  }

  /**
   * 复杂查询操作
   */
  async query(aql: string, bindVars: any = {}): Promise<any[]> {
    try {
      const arangoService = this.getArangoService();
      const results = await arangoService.query(aql, bindVars);
      return results.map((result: any) => this.formatResult(result));
    } catch (error) {
      logger.error('AQL查询失败', { aql, bindVars, error });
      return [];
    }
  }

  /**
   * 格式化结果，使其兼容Sequelize格式
   */
  private formatResult(arangoDoc: any): any {
    if (!arangoDoc) return null;
    
    // 将ArangoDB文档转换为类似Sequelize模型的格式
    const result = {
      id: arangoDoc._key,
      ...arangoDoc,
      // 保留ArangoDB的元数据
      _id: arangoDoc._id,
      _key: arangoDoc._key,
      _rev: arangoDoc._rev,
      // 添加常用的Sequelize方法
      get: (field: string) => arangoDoc[field],
      set: (field: string, value: any) => { arangoDoc[field] = value; },
      save: async () => {
        // 这里可以实现保存逻辑
        return this.update(arangoDoc._id.split('/')[0], arangoDoc._key, arangoDoc);
      },
      destroy: async () => {
        // 这里可以实现删除逻辑
        return this.delete(arangoDoc._id.split('/')[0], arangoDoc._key);
      }
    };

    return result;
  }

  /**
   * 项目相关操作
   */
  async findProjectsByUserId(userId: string): Promise<any[]> {
    const aql = `
      FOR project IN projects
      FILTER project.userId == @userId
      SORT project.updatedAt DESC
      RETURN project
    `;
    return this.query(aql, { userId });
  }

  /**
   * 章节相关操作
   */
  async findChaptersByProjectId(projectId: string): Promise<any[]> {
    const aql = `
      FOR chapter IN chapters
      FILTER chapter.projectId == @projectId
      SORT chapter.number ASC
      RETURN chapter
    `;
    return this.query(aql, { projectId });
  }

  /**
   * 角色相关操作
   */
  async findCharactersByProjectId(projectId: string): Promise<any[]> {
    const aql = `
      FOR character IN characters
      FILTER character.projectId == @projectId
      SORT character.importance DESC, character.name ASC
      RETURN character
    `;
    return this.query(aql, { projectId });
  }

  /**
   * 写作会话相关操作
   */
  async getWritingStatsByUserId(userId: string, startDate?: string, endDate?: string): Promise<any[]> {
    let aql = `
      FOR session IN writing_sessions
      FILTER session.userId == @userId
    `;
    
    const bindVars: any = { userId };
    
    if (startDate) {
      aql += ` FILTER session.startTime >= @startDate`;
      bindVars.startDate = startDate;
    }
    
    if (endDate) {
      aql += ` FILTER session.endTime <= @endDate`;
      bindVars.endDate = endDate;
    }
    
    aql += ` SORT session.startTime DESC RETURN session`;
    
    return this.query(aql, bindVars);
  }
}

// 导出单例
export const dataService = DataService.getInstance();
