import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// 扩展Request接口
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    [key: string]: any;
  };
}

export class ProjectController {
  private logger = logger;
  private novelService: any;

  constructor() {
    // 延迟初始化服务，避免循环依赖
    this.initializeService();
  }

  private async initializeService() {
    try {
      const { NovelCreationService } = require('../services/novelCreationService.new');
      this.novelService = new NovelCreationService();
      console.log('✅ ProjectController: NovelCreationService 初始化成功');
    } catch (error) {
      console.error('❌ ProjectController: NovelCreationService 初始化失败:', error);
    }
  }

  // 获取用户的所有项目
  public getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      let userId = req.user?.id;

      // 临时开发模式：如果没有用户认证，使用测试用户ID
      if (!userId) {
        userId = 'test-user-001';
        this.logger.warn('使用临时用户ID进行开发测试');
      }

      if (!this.novelService) {
        await this.initializeService();
      }

      const projects = await this.novelService.getUserProjects(userId);
      
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

  // 创建新项目
  public createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const projectData = req.body;

      if (!this.novelService) {
        await this.initializeService();
      }

      const project = await this.novelService.createProject({
        ...projectData,
        userId
      });

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

  // 获取单个项目详情
  public getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      let userId = req.user?.id;
      const { projectId } = req.params;

      if (!userId) {
        userId = 'test-user-001';
      }

      if (!this.novelService) {
        await this.initializeService();
      }

      const project = await this.novelService.getProject(projectId, userId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: '项目不存在'
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

  // 更新项目信息
  public updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId } = req.params;
      const updateData = req.body;

      if (!this.novelService) {
        await this.initializeService();
      }

      const updatedProject = await this.novelService.updateProject(
        projectId,
        updateData,
        userId
      );

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

  // 删除项目
  public deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId } = req.params;

      if (!this.novelService) {
        await this.initializeService();
      }

      await this.novelService.deleteProject(projectId, userId);

      res.json({
        success: true,
        message: '项目删除成功'
      });
    } catch (error) {
      this.logger.error('删除项目失败:', error);
      res.status(500).json({
        success: false,
        message: '删除项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取项目统计信息
  public getProjectStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId } = req.params;

      if (!this.novelService) {
        await this.initializeService();
      }

      const stats = await this.novelService.getProjectStats(projectId, userId);

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

  // 备份项目
  public backupProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId } = req.params;

      if (!this.novelService) {
        await this.initializeService();
      }

      const backup = await this.novelService.backupProject(projectId, userId);

      res.json({
        success: true,
        data: backup,
        message: '项目备份成功'
      });
    } catch (error) {
      this.logger.error('备份项目失败:', error);
      res.status(500).json({
        success: false,
        message: '备份项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
}
