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

export class WritingStatsController {
  private logger = logger;

  // 获取用户写作统计
  public getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';

      // 模拟统计数据
      const stats = {
        userId,
        totalWords: 25000,
        totalChapters: 15,
        totalProjects: 3,
        writingStreak: 7,
        averageWordsPerDay: 1200,
        monthlyGoal: 30000,
        monthlyProgress: 25000,
        weeklyStats: [
          { date: '2025-07-21', words: 1500 },
          { date: '2025-07-22', words: 1200 },
          { date: '2025-07-23', words: 980 },
          { date: '2025-07-24', words: 1350 },
          { date: '2025-07-25', words: 1100 },
          { date: '2025-07-26', words: 1400 },
          { date: '2025-07-27', words: 800 }
        ],
        genreDistribution: {
          fantasy: 15000,
          mystery: 7000,
          romance: 3000
        }
      };

      res.json({
        success: true,
        data: stats,
        message: '用户写作统计获取成功'
      });
    } catch (error) {
      this.logger.error('获取用户写作统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户写作统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取项目写作统计
  public getProjectStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId } = req.params;

      const stats = {
        projectId,
        totalWords: 15000,
        totalChapters: 8,
        averageWordsPerChapter: 1875,
        writingPace: {
          wordsPerDay: 500,
          chaptersPerWeek: 2,
          estimatedCompletion: '2025-12-01'
        },
        dailyProgress: [
          { date: '2025-07-21', words: 600 },
          { date: '2025-07-22', words: 450 },
          { date: '2025-07-23', words: 520 },
          { date: '2025-07-24', words: 680 },
          { date: '2025-07-25', words: 400 },
          { date: '2025-07-26', words: 750 },
          { date: '2025-07-27', words: 300 }
        ],
        chapterProgress: {
          completed: 8,
          inProgress: 1,
          planned: 12
        }
      };

      res.json({
        success: true,
        data: stats,
        message: '项目写作统计获取成功'
      });
    } catch (error) {
      this.logger.error('获取项目写作统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目写作统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 更新写作目标
  public updateWritingGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { goalType, target, deadline } = req.body;

      const goal = {
        id: `goal-${Date.now()}`,
        userId,
        goalType, // daily, weekly, monthly, project
        target,
        deadline,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json({
        success: true,
        data: goal,
        message: '写作目标更新成功'
      });
    } catch (error) {
      this.logger.error('更新写作目标失败:', error);
      res.status(500).json({
        success: false,
        message: '更新写作目标失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 记录写作会话
  public recordWritingSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { projectId, chapterId, wordsWritten, timeSpent, sessionType } = req.body;

      const session = {
        id: `session-${Date.now()}`,
        userId,
        projectId,
        chapterId,
        wordsWritten,
        timeSpent, // 分钟
        sessionType, // writing, editing, planning
        startTime: new Date(Date.now() - timeSpent * 60000),
        endTime: new Date(),
        createdAt: new Date()
      };

      res.json({
        success: true,
        data: session,
        message: '写作会话记录成功'
      });
    } catch (error) {
      this.logger.error('记录写作会话失败:', error);
      res.status(500).json({
        success: false,
        message: '记录写作会话失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取写作习惯分析
  public getWritingHabits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';

      const habits = {
        userId,
        bestWritingTime: {
          hour: 14, // 下午2点
          productivityScore: 85
        },
        averageSessionLength: 45, // 分钟
        mostProductiveDay: 'Tuesday',
        writingFrequency: {
          weekdays: 5,
          weekends: 2,
          average: 7
        },
        genrePreferences: [
          { genre: 'fantasy', percentage: 60 },
          { genre: 'mystery', percentage: 28 },
          { genre: 'romance', percentage: 12 }
        ],
        writingSpeed: {
          averageWPM: 45,
          peakWPM: 65,
          minWPM: 25
        },
        streaks: {
          current: 7,
          longest: 23,
          thisMonth: 18
        }
      };

      res.json({
        success: true,
        data: habits,
        message: '写作习惯分析获取成功'
      });
    } catch (error) {
      this.logger.error('获取写作习惯分析失败:', error);
      res.status(500).json({
        success: false,
        message: '获取写作习惯分析失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取成就和里程碑
  public getAchievements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';

      const achievements = {
        userId,
        totalAchievements: 15,
        recent: [
          {
            id: 'first-chapter',
            title: '首章完成',
            description: '完成你的第一个章节',
            icon: '📝',
            unlockedAt: '2025-07-20'
          },
          {
            id: 'word-warrior',
            title: '文字战士',
            description: '单日写作超过1000字',
            icon: '⚔️',
            unlockedAt: '2025-07-22'
          },
          {
            id: 'streak-week',
            title: '七日连击',
            description: '连续7天坚持写作',
            icon: '🔥',
            unlockedAt: '2025-07-27'
          }
        ],
        milestones: [
          {
            id: 'words-10k',
            title: '万字里程碑',
            progress: 25000,
            target: 10000,
            completed: true,
            completedAt: '2025-07-15'
          },
          {
            id: 'words-50k',
            title: '五万字挑战',
            progress: 25000,
            target: 50000,
            completed: false,
            estimatedCompletion: '2025-09-15'
          }
        ]
      };

      res.json({
        success: true,
        data: achievements,
        message: '成就和里程碑获取成功'
      });
    } catch (error) {
      this.logger.error('获取成就和里程碑失败:', error);
      res.status(500).json({
        success: false,
        message: '获取成就和里程碑失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 导出写作报告
  public exportWritingReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'test-user-001';
      const { startDate, endDate, format } = req.query;

      const report = {
        userId,
        period: {
          start: startDate || '2025-07-01',
          end: endDate || '2025-07-27'
        },
        summary: {
          totalWords: 25000,
          totalSessions: 45,
          totalTime: 2700, // 分钟
          averageWordsPerSession: 556,
          projects: 3,
          chapters: 15
        },
        format: format || 'json',
        generatedAt: new Date(),
        downloadUrl: `/api/stats/reports/${userId}-${Date.now()}.${format}`
      };

      res.json({
        success: true,
        data: report,
        message: '写作报告生成成功'
      });
    } catch (error) {
      this.logger.error('导出写作报告失败:', error);
      res.status(500).json({
        success: false,
        message: '导出写作报告失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
}
