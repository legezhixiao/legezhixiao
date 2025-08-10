/**
 * ArangoDB 项目控制器
 * 使用 ProjectArangoDB 模型的简化控制器
 */

import { Request, Response } from 'express';
import ProjectArangoDB from '../models/ProjectArangoDB';
import { logger } from '../utils/logger';

// 扩展Request接口，与全局类型定义保持一致
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export class ProjectControllerArangoDB {
  private logger = logger;

  /**
   * 获取用户的所有项目
   */
  public getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      let userId = req.user?.id;

      // 临时开发模式：如果没有用户认证，使用测试用户ID
      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      this.logger.info(`获取用户项目: ${userId}`);
      
      const projects = await ProjectArangoDB.findByUserId(userId);
      
      res.json({
        success: true,
        data: projects,
        message: '项目列表获取成功'
      });
    } catch (error) {
      this.logger.error('获取项目列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 创建新项目
   */
  public createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      let userId = req.user?.id;

      // 临时开发模式：如果没有用户认证，使用测试用户ID
      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      const projectData = {
        ...req.body,
        userId
      };

      this.logger.info('创建新项目:', projectData);
      
      const project = await ProjectArangoDB.create(projectData);
      
      res.status(201).json({
        success: true,
        data: project,
        message: '项目创建成功'
      });
    } catch (error) {
      this.logger.error('创建项目失败:', error);
      res.status(500).json({
        success: false,
        message: '创建项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 获取单个项目详情
   */
  public getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      let userId = req.user?.id;

      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      this.logger.info(`获取项目详情: ${projectId}, 用户: ${userId}`);
      
      const project = await ProjectArangoDB.findByIdAndUserId(projectId, userId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: '项目不存在或无权限访问'
        });
        return;
      }

      res.json({
        success: true,
        data: project,
        message: '项目详情获取成功'
      });
    } catch (error) {
      this.logger.error('获取项目详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 更新项目信息
   */
  public updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      let userId = req.user?.id;

      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      // 首先检查项目是否存在且用户有权限
      const existingProject = await ProjectArangoDB.findByIdAndUserId(projectId, userId);
      if (!existingProject) {
        res.status(404).json({
          success: false,
          message: '项目不存在或无权限访问'
        });
        return;
      }

      this.logger.info(`更新项目: ${projectId}`, req.body);
      
      const updatedProject = await ProjectArangoDB.update(projectId, req.body);
      
      res.json({
        success: true,
        data: updatedProject,
        message: '项目更新成功'
      });
    } catch (error) {
      this.logger.error('更新项目失败:', error);
      res.status(500).json({
        success: false,
        message: '更新项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 删除项目
   */
  public deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      let userId = req.user?.id;

      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      // 首先检查项目是否存在且用户有权限
      const existingProject = await ProjectArangoDB.findByIdAndUserId(projectId, userId);
      if (!existingProject) {
        res.status(404).json({
          success: false,
          message: '项目不存在或无权限访问'
        });
        return;
      }

      this.logger.info(`删除项目: ${projectId}`);
      
      const deleted = await ProjectArangoDB.delete(projectId);
      
      if (deleted) {
        res.json({
          success: true,
          message: '项目删除成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '项目删除失败'
        });
      }
    } catch (error) {
      this.logger.error('删除项目失败:', error);
      res.status(500).json({
        success: false,
        message: '删除项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 获取用户项目统计
   */
  public getProjectStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      let userId = req.user?.id;

      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      const stats = await ProjectArangoDB.getUserProjectStats(userId);
      
      res.json({
        success: true,
        data: stats,
        message: '项目统计获取成功'
      });
    } catch (error) {
      this.logger.error('获取项目统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 搜索项目
   */
  public searchProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      let userId = req.user?.id;
      const { q: searchTerm } = req.query;

      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      if (!searchTerm || typeof searchTerm !== 'string') {
        res.status(400).json({
          success: false,
          message: '搜索词不能为空'
        });
        return;
      }

      const projects = await ProjectArangoDB.search(userId, searchTerm);
      
      res.json({
        success: true,
        data: projects,
        message: '项目搜索完成'
      });
    } catch (error) {
      this.logger.error('搜索项目失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
}

export default ProjectControllerArangoDB;
