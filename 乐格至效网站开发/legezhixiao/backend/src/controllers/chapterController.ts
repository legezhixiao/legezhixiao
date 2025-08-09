import { Request, Response } from 'express';
import { databaseConfig } from '../config/database';
import { NovelCreationService } from '../services/novelCreationService';
import { logger } from '../utils/logger';

export class ChapterController {
  private novelService: NovelCreationService;

  constructor() {
    this.novelService = new NovelCreationService();
  }

  // 获取项目的所有章节
  public getChaptersByProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const { Chapter, Project } = databaseConfig.models!;
      
      // 验证项目权限
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      const chapters = await Chapter.findAll({
        where: { projectId },
        order: [['order', 'ASC']],
        attributes: [
          'id', 'title', 'status', 'wordCount', 'order', 
          'summary', 'tags', 'createdAt', 'updatedAt'
        ]
      });

      res.json({
        success: true,
        data: chapters
      });

    } catch (error) {
      logger.error('获取章节列表失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取单个章节详情
  public getChapterById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chapterId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { Chapter, Project } = databaseConfig.models!;
      
      const chapter = await Chapter.findOne({
        where: { id: chapterId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId },
          attributes: ['id', 'title']
        }]
      });

      if (!chapter) {
        res.status(404).json({ error: '章节不存在或无权限访问' });
      }

      res.json({
        success: true,
        data: chapter
      });

    } catch (error) {
      logger.error('获取章节详情失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 创建新章节
  public createChapter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;
      const chapterData = req.body;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const chapter = await this.novelService.createChapter(projectId, chapterData);

      res.status(201).json({
        success: true,
        data: chapter
      });

    } catch (error) {
      logger.error('创建章节失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 更新章节内容
  public updateChapterContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chapterId } = req.params;
      const { content, title, summary, tags, notes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { Chapter, Project } = databaseConfig.models!;
      
      // 验证权限
      const chapter = await Chapter.findOne({
        where: { id: chapterId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId }
        }]
      });

      if (!chapter) {
        res.status(404).json({ error: '章节不存在或无权限访问' });
        return;
      }

      // 更新内容
      if (content !== undefined) {
        if (!userId) {
          res.status(401).json({ error: '未授权访问' });
          return;
        }
        await this.novelService.updateChapterContent(chapterId, content, userId);
      }

      // 更新其他字段
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;
      if (tags !== undefined) updateData.tags = tags;
      if (notes !== undefined) updateData.notes = notes;

      if (Object.keys(updateData).length > 0) {
        await chapter.update(updateData);
      }

      // 重新获取更新后的章节
      const updatedChapter = await Chapter.findByPk(chapterId);

      res.json({
        success: true,
        data: updatedChapter
      });

    } catch (error) {
      logger.error('更新章节失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 删除章节
  public deleteChapter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chapterId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { Chapter, Project } = databaseConfig.models!;
      
      const chapter = await Chapter.findOne({
        where: { id: chapterId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId }
        }]
      });

      if (!chapter) {
        res.status(404).json({ error: '章节不存在或无权限访问' });
        return;
      }

      await chapter.destroy();

      // 更新项目章节数
      await Project.decrement('chapterCount', { 
        where: { id: chapter.projectId } 
      });

      res.json({
        success: true,
        message: '章节删除成功'
      });

    } catch (error) {
      logger.error('删除章节失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 重新排序章节
  public reorderChapters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { chapterOrders } = req.body; // [{ id, order }]
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, Chapter } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      // 重新排序章节
      try {
        for (const { id, order } of chapterOrders) {
          await Chapter.update(
            { order },
            { 
              where: { id, projectId }
            }
          );
        }

        logger.info('章节排序成功', { projectId, updatedCount: chapterOrders.length });
        res.json({ message: '排序成功' });

      } catch (error) {
        logger.error('章节排序失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
      }
    } catch (error) {
      logger.error('章节排序失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取章节统计
  public getChapterStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const statistics = await this.novelService.getWritingStatistics(userId, projectId, '30d');

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      logger.error('获取章节统计失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 自动保存章节
  public autoSaveChapter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chapterId } = req.params;
      const { content } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const { Chapter, Project } = databaseConfig.models!;
      
      const chapter = await Chapter.findOne({
        where: { id: chapterId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId }
        }]
      });

      if (!chapter) {
        res.status(404).json({ error: '章节不存在或无权限访问' });
        return;
      }

      // 计算字数
      const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
      const englishWords = content.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter((word: string) => word.length > 0).length;
      const wordCount = chineseChars + englishWords;

      // 保存原始字数用于差值计算
      const originalWordCount = chapter.wordCount;

      // 更新内容和字数
      await chapter.update({
        content,
        wordCount,
        version: chapter.version + 1
      });

      // 更新项目字数统计
      const wordCountDiff = wordCount - originalWordCount;
      if (wordCountDiff !== 0) {
        await Project.increment('currentWordCount', { 
          by: wordCountDiff,
          where: { id: chapter.projectId } 
        });
      }

      res.json({
        success: true,
        data: {
          wordCount,
          version: chapter.version + 1,
          lastSaved: new Date()
        }
      });

    } catch (error) {
      logger.error('自动保存失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };
}
