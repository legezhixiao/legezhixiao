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

export class ChapterController {
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
      console.log('✅ ChapterController: NovelCreationService 初始化成功');
    } catch (error) {
      console.error('❌ ChapterController: NovelCreationService 初始化失败:', error);
    }
  }

  // 获取项目的所有章节 - 兼容旧路由
  public getChaptersByProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 重定向到主要的getChapters方法
    return this.getChapters(req, res);
  };

  // 获取项目的所有章节
  public getChapters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId } = req.params;

      if (!this.novelService) {
        await this.initializeService();
      }

      const chapters = await this.novelService.getChapters(projectId, userId);
      
      res.json({
        success: true,
        data: chapters,
        message: '章节列表获取成功'
      });
    } catch (error) {
      this.logger.error('获取章节列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取章节列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 创建新章节
  public createChapter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId } = req.params;
      const chapterData = req.body;

      if (!this.novelService) {
        await this.initializeService();
      }

      const chapter = await this.novelService.createChapter(projectId, chapterData, userId);

      res.status(201).json({
        success: true,
        data: chapter,
        message: '章节创建成功'
      });
    } catch (error) {
      this.logger.error('创建章节失败:', error);
      res.status(500).json({
        success: false,
        message: '创建章节失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取单个章节详情
  public getChapterById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId, chapterId } = req.params;

      if (!this.novelService) {
        await this.initializeService();
      }

      // 模拟获取章节详情
      const chapter = {
        id: chapterId,
        projectId,
        title: `章节 ${chapterId}`,
        content: '这是章节的详细内容...',
        order: parseInt(chapterId),
        wordsCount: 5000,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json({
        success: true,
        data: chapter,
        message: '章节详情获取成功'
      });
    } catch (error) {
      this.logger.error('获取章节详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取章节详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 更新章节
  public updateChapter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { chapterId } = req.params;
      const updateData = req.body;

      if (!this.novelService) {
        await this.initializeService();
      }

      const updatedChapter = await this.novelService.updateChapter(chapterId, updateData, userId);

      res.json({
        success: true,
        data: updatedChapter,
        message: '章节更新成功'
      });
    } catch (error) {
      this.logger.error('更新章节失败:', error);
      res.status(500).json({
        success: false,
        message: '更新章节失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 删除章节
  public deleteChapter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { chapterId } = req.params;

      if (!this.novelService) {
        await this.initializeService();
      }

      await this.novelService.deleteChapter(chapterId, userId);

      res.json({
        success: true,
        message: '章节删除成功'
      });
    } catch (error) {
      this.logger.error('删除章节失败:', error);
      res.status(500).json({
        success: false,
        message: '删除章节失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 自动保存章节内容
  public autoSaveChapter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { chapterId } = req.params;
      const { content } = req.body;

      if (!this.novelService) {
        await this.initializeService();
      }

      const updatedChapter = await this.novelService.updateChapter(
        chapterId, 
        { content, lastAutoSave: new Date() }, 
        userId
      );

      res.json({
        success: true,
        data: { 
          savedAt: new Date(),
          wordsCount: content ? content.length : 0 
        },
        message: '章节自动保存成功'
      });
    } catch (error) {
      this.logger.error('章节自动保存失败:', error);
      res.status(500).json({
        success: false,
        message: '章节自动保存失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取章节统计信息
  public getChapterStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { chapterId } = req.params;

      const stats = {
        chapterId,
        wordsCount: 5000,
        charactersCount: 25000,
        paragraphsCount: 50,
        readingTime: '20分钟',
        lastUpdated: new Date(),
        status: 'published'
      };

      res.json({
        success: true,
        data: stats,
        message: '章节统计获取成功'
      });
    } catch (error) {
      this.logger.error('获取章节统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取章节统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
}
