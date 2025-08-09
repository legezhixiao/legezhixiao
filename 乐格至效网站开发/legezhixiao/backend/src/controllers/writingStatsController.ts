// @ts-nocheck
import { Request, Response } from 'express';
import { databaseConfig } from '../config/database';
import { NovelCreationService } from '../services/novelCreationService';
import { logger } from '../utils/logger';

export class WritingStatsController {
  private novelService: NovelCreationService;

  constructor() {
    this.novelService = new NovelCreationService();
  }

  // 获取写作统计概览
  public getWritingOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { timeRange = '30d' } = req.query;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const stats = await this.novelService.getWritingStatistics(userId, undefined, timeRange as string);

      // 获取项目统计
      const projects = await this.novelService.getProjectsWithProgress(userId);
      
      // 获取写作目标进度
      const { WritingGoal } = databaseConfig.models!;
      const activeGoals = await WritingGoal.findAll({
        where: {
          userId,
          status: 'active',
          startDate: { [Op.lte]: new Date() },
          endDate: { [Op.gte]: new Date() }
        },
        order: [['priority', 'DESC'], ['createdAt', 'DESC']],
        limit: 5
      });

      res.json({
        success: true,
        data: {
          overview: stats,
          projects: projects.length,
          activeProjects: projects.filter(p => p.status === 'in_progress').length,
          totalWords: projects.reduce((sum, p) => sum + p.currentWordCount, 0),
          goals: activeGoals.map(goal => ({
            ...(goal.toJSON ? goal.toJSON() : goal),
            progress: goal.getProgress ? goal.getProgress() : 0,
            daysRemaining: goal.getDaysRemaining ? goal.getDaysRemaining() : 0
          }))
        }
      });

    } catch (error) {
      logger.error('获取写作概览失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取项目写作统计
  public getProjectStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { timeRange = '30d' } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
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

      const stats = await this.novelService.getWritingStatistics(userId, projectId, timeRange as string);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取项目统计失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 开始写作会话
  public startWritingSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, chapterId, goal } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const session = await this.novelService.startWritingSession(userId, projectId, chapterId);

      // 如果设置了目标，更新会话
      if (goal) {
        await session.update({ goal });
      }

      res.json({
        success: true,
        data: session
      });

    } catch (error) {
      logger.error('开始写作会话失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 结束写作会话
  public endWritingSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { wordsAfter, mood, productivity, notes, achievements } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const { WritingSession } = databaseConfig.models!;
      
      // 验证会话权限
      const existingSession = await WritingSession.findOne({
        where: { id: sessionId, userId }
      });

      if (!existingSession) {
        res.status(404).json({ error: '写作会话不存在' });
        return;
      }

      const sessionData: any = {};
      if (mood !== undefined) sessionData.mood = mood;
      if (productivity !== undefined) sessionData.productivity = productivity;
      if (notes !== undefined) sessionData.notes = notes;
      if (achievements !== undefined) sessionData.achievements = achievements;

      const session = await this.novelService.endWritingSession(sessionId, wordsAfter, sessionData);

      res.json({
        success: true,
        data: session
      });

    } catch (error) {
      logger.error('结束写作会话失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取写作会话历史
  public getWritingSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { projectId, limit = 20, offset = 0 } = req.query;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const { WritingSession, Project, Chapter } = databaseConfig.models!;
      
      const where: any = { userId };
      if (projectId) {
        where.projectId = projectId;
      }

      const sessions = await WritingSession.findAndCountAll({
        where,
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title']
          },
          {
            model: Chapter,
            as: 'chapter',
            attributes: ['id', 'title'],
            required: false
          }
        ],
        order: [['startTime', 'DESC']],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: sessions
      });

    } catch (error) {
      logger.error('获取写作会话历史失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取写作热力图数据
  public getWritingHeatmap = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { year = new Date().getFullYear() } = req.query;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const { WritingSession } = databaseConfig.models!;
      
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);

      const sessions = await WritingSession.findAll({
        where: {
          userId,
          startTime: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: ['startTime', 'wordsWritten', 'duration'],
        order: [['startTime', 'ASC']]
      });

      // 按日期聚合数据
      const heatmapData: { [key: string]: { words: number; sessions: number; duration: number } } = {};

      sessions.forEach(session => {
        const date = session.startTime.toISOString().split('T')[0];
        if (!heatmapData[date]) {
          heatmapData[date] = { words: 0, sessions: 0, duration: 0 };
        }
        heatmapData[date].words += session.wordsWritten;
        heatmapData[date].sessions += 1;
        heatmapData[date].duration += session.duration || 0;
      });

      res.json({
        success: true,
        data: heatmapData
      });

    } catch (error) {
      logger.error('获取写作热力图失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取写作趋势分析
  public getWritingTrends = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { projectId, period = 'daily', timeRange = '30d' } = req.query;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const days = this.parseTimeRange(timeRange as string);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { WritingSession } = databaseConfig.models!;
      
      const where: any = {
        userId,
        startTime: { [Op.gte]: startDate }
      };

      if (projectId) {
        where.projectId = projectId;
      }

      const sessions = await WritingSession.findAll({
        where,
        attributes: ['startTime', 'wordsWritten', 'duration'],
        order: [['startTime', 'ASC']]
      });

      // 根据周期聚合数据
      const trends = this.aggregateByPeriod(sessions, period as string);

      res.json({
        success: true,
        data: trends
      });

    } catch (error) {
      logger.error('获取写作趋势失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 工具方法
  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/(\d+)([dwmy])/);
    if (!match) return 30;
    
    const [, num, unit] = match;
    const number = parseInt(num);
    
    switch (unit) {
      case 'd': return number;
      case 'w': return number * 7;
      case 'm': return number * 30;
      case 'y': return number * 365;
      default: return 30;
    }
  }

  private aggregateByPeriod(sessions: any[], period: string) {
    const aggregated: { [key: string]: { words: number; sessions: number; duration: number } } = {};

    sessions.forEach(session => {
      let key: string;
      const date = new Date(session.startTime);

      switch (period) {
        case 'hourly':
          key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
          break;
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!aggregated[key]) {
        aggregated[key] = { words: 0, sessions: 0, duration: 0 };
      }

      aggregated[key].words += session.wordsWritten;
      aggregated[key].sessions += 1;
      aggregated[key].duration += session.duration || 0;
    });

    return Object.entries(aggregated)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
