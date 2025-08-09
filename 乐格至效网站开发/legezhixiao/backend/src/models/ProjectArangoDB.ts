/**
 * ArangoDB 项目模型
 * 提供项目相关的数据操作
 */

import { dataService } from '../services/dataService';
import { logger } from '../utils/logger';

export interface ProjectAttributes {
  _key?: string;
  _id?: string;
  _rev?: string;
  title: string;
  description?: string;
  genre?: string;
  language?: string;
  targetAudience?: string;
  userId: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  currentWordCount?: number;
  targetWordCount?: number;
  chapterCount?: number;
  tags?: string[];
  coverImage?: string;
  settings?: any;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProjectArangoDB {
  private static collection = 'projects';

  /**
   * 创建项目
   */
  static async create(projectData: Partial<ProjectAttributes>): Promise<ProjectAttributes> {
    try {
      // 设置默认值
      const now = new Date();
      const project = {
        ...projectData,
        status: projectData.status || 'draft',
        currentWordCount: projectData.currentWordCount || 0,
        targetWordCount: projectData.targetWordCount || 50000,
        chapterCount: projectData.chapterCount || 0,
        tags: projectData.tags || [],
        settings: projectData.settings || {},
        metadata: projectData.metadata || {},
        createdAt: projectData.createdAt || now,
        updatedAt: projectData.updatedAt || now
      };

      const result = await dataService.create(this.collection, project);
      logger.info(`项目创建成功: ${result._key}`);
      return result;
    } catch (error) {
      logger.error('创建项目失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID获取项目列表
   */
  static async findByUserId(userId: string): Promise<ProjectAttributes[]> {
    try {
      const query = `
        FOR project IN ${this.collection}
        FILTER project.userId == @userId
        SORT project.updatedAt DESC
        RETURN project
      `;
      
      const result = await dataService.query(query, { userId });
      return result;
    } catch (error) {
      logger.error('根据用户ID查找项目失败:', error);
      return [];
    }
  }

  /**
   * 根据ID查找项目
   */
  static async findById(id: string): Promise<ProjectAttributes | null> {
    try {
      return await dataService.findById(this.collection, id);
    } catch (error) {
      logger.error('根据ID查找项目失败:', error);
      return null;
    }
  }

  /**
   * 根据ID和用户ID查找项目（权限检查）
   */
  static async findByIdAndUserId(id: string, userId: string): Promise<ProjectAttributes | null> {
    try {
      const query = `
        FOR project IN ${this.collection}
        FILTER project._key == @id AND project.userId == @userId
        RETURN project
      `;
      
      const result = await dataService.query(query, { id, userId });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('根据ID和用户ID查找项目失败:', error);
      return null;
    }
  }

  /**
   * 更新项目
   */
  static async update(id: string, updateData: Partial<ProjectAttributes>): Promise<ProjectAttributes | null> {
    try {
      updateData.updatedAt = new Date();
      return await dataService.update(this.collection, id, updateData);
    } catch (error) {
      logger.error('更新项目失败:', error);
      return null;
    }
  }

  /**
   * 删除项目
   */
  static async delete(id: string): Promise<boolean> {
    try {
      return await dataService.delete(this.collection, id);
    } catch (error) {
      logger.error('删除项目失败:', error);
      return false;
    }
  }

  /**
   * 获取用户的项目统计
   */
  static async getUserProjectStats(userId: string): Promise<any> {
    try {
      const query = `
        LET projects = (
          FOR project IN ${this.collection}
          FILTER project.userId == @userId
          RETURN project
        )
        
        RETURN {
          totalProjects: LENGTH(projects),
          draftProjects: LENGTH(projects[* FILTER CURRENT.status == 'draft']),
          activeProjects: LENGTH(projects[* FILTER CURRENT.status == 'active']),
          completedProjects: LENGTH(projects[* FILTER CURRENT.status == 'completed']),
          totalWords: SUM(projects[*].currentWordCount)
        }
      `;
      
      const result = await dataService.query(query, { userId });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('获取用户项目统计失败:', error);
      return null;
    }
  }

  /**
   * 搜索项目
   */
  static async search(userId: string, searchTerm: string): Promise<ProjectAttributes[]> {
    try {
      const query = `
        FOR project IN ${this.collection}
        FILTER project.userId == @userId
        AND (
          CONTAINS(LOWER(project.title), LOWER(@searchTerm)) OR
          CONTAINS(LOWER(project.description), LOWER(@searchTerm)) OR
          @searchTerm IN project.tags[*]
        )
        SORT project.updatedAt DESC
        RETURN project
      `;
      
      return await dataService.query(query, { userId, searchTerm });
    } catch (error) {
      logger.error('搜索项目失败:', error);
      return [];
    }
  }

  /**
   * 根据状态获取项目
   */
  static async findByStatus(userId: string, status: string): Promise<ProjectAttributes[]> {
    try {
      const query = `
        FOR project IN ${this.collection}
        FILTER project.userId == @userId AND project.status == @status
        SORT project.updatedAt DESC
        RETURN project
      `;
      
      return await dataService.query(query, { userId, status });
    } catch (error) {
      logger.error('根据状态查找项目失败:', error);
      return [];
    }
  }

  /**
   * 更新项目字数统计
   */
  static async updateWordCount(projectId: string, wordCount: number): Promise<ProjectAttributes | null> {
    try {
      const updateData = {
        currentWordCount: wordCount,
        updatedAt: new Date()
      };
      
      return await this.update(projectId, updateData);
    } catch (error) {
      logger.error('更新项目字数失败:', error);
      return null;
    }
  }

  /**
   * 更新章节数量
   */
  static async updateChapterCount(projectId: string, chapterCount: number): Promise<ProjectAttributes | null> {
    try {
      const updateData = {
        chapterCount: chapterCount,
        updatedAt: new Date()
      };
      
      return await this.update(projectId, updateData);
    } catch (error) {
      logger.error('更新章节数量失败:', error);
      return null;
    }
  }
}

export default ProjectArangoDB;
