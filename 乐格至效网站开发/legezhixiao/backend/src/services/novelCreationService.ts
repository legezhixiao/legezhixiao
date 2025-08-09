import { databaseConfig } from '../config/database';
import { Op } from 'sequelize';

export class NovelCreationService {
  private models: any;

  constructor() {
    // 延迟初始化models
    this.models = null;
  }

  private getModels() {
    if (!this.models) {
      this.models = databaseConfig.models;
    }
    return this.models;
  }

  // 项目相关服务
  async createProject(userId: string, projectData: any) {
    const { Project } = this.getModels();
    
    const project = await Project.create({
      userId,
      ...projectData,
      currentWordCount: 0,
      chapterCount: 0,
      status: 'draft'
    });

    // 创建默认写作目标
    await this.createDefaultWritingGoal(userId, project.id);

    return project;
  }

  async getProjectsByUser(userId: string) {
    const { Project, Chapter } = this.models;
    
    const projects = await Project.findAll({
      where: { userId },
      include: [
        {
          model: Chapter,
          as: 'chapters',
          attributes: ['id', 'title', 'status', 'wordCount', 'order']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    return projects;
  }

  async getProjectDetails(projectId: string, userId: string) {
    const { Project, Chapter, Character, WorldBuilding } = this.models;
    
    const project = await Project.findOne({
      where: { id: projectId, userId },
      include: [
        {
          model: Chapter,
          as: 'chapters',
          order: [['order', 'ASC']]
        },
        {
          model: Character,
          as: 'characters'
        },
        {
          model: WorldBuilding,
          as: 'worldBuildings'
        }
      ]
    });

    return project;
  }

  async getProjectStats(projectId: string) {
    const { Chapter, Character, WritingSession, WorldBuilding } = this.models;
    
    const [
      chapterCount,
      characterCount,
      worldBuildingCount,
      totalWordCount,
      sessionCount
    ] = await Promise.all([
      Chapter.count({ where: { projectId } }),
      Character.count({ where: { projectId } }),
      WorldBuilding.count({ where: { projectId } }),
      Chapter.sum('wordCount', { where: { projectId } }) || 0,
      WritingSession.count({ where: { projectId } })
    ]);

    return {
      chapterCount,
      characterCount,
      worldBuildingCount,
      totalWordCount,
      sessionCount
    };
  }

  async getProjectsWithProgress(userId: string) {
    const { Project, Chapter, WritingGoal, WritingSession } = this.models;
    
    const projects = await Project.findAll({
      where: { userId },
      include: [
        {
          model: Chapter,
          as: 'chapters',
          attributes: ['id', 'title', 'status', 'wordCount', 'order']
        },
        {
          model: WritingGoal,
          as: 'writingGoals',
          where: { status: 'active' },
          required: false,
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // 计算项目统计信息
    const projectsWithStats = await Promise.all(projects.map(async (project: any) => {
      const recentSessions = await WritingSession.findAll({
        where: {
          projectId: project.id,
          startTime: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
          }
        },
        attributes: ['wordsWritten', 'startTime'],
        order: [['startTime', 'DESC']]
      });

      const totalWords = recentSessions.reduce((sum: number, session: any) => sum + session.wordsWritten, 0);
      const avgWordsPerDay = totalWords / 30;
      
      return {
        ...project.toJSON(),
        stats: {
          recentWords: totalWords,
          avgWordsPerDay: Math.round(avgWordsPerDay),
          totalSessions: recentSessions.length,
          lastWritingDate: recentSessions[0]?.startTime || null
        }
      };
    }));

    return projectsWithStats;
  }

  // 章节相关服务
  async createChapter(projectId: string, chapterData: any) {
    const { Chapter, Project } = this.models;
    
    // 获取下一个章节顺序
    const maxOrder = await Chapter.max('order', { where: { projectId } }) || 0;
    
    const chapter = await Chapter.create({
      projectId,
      ...chapterData,
      order: maxOrder + 1,
      status: 'draft',
      wordCount: 0,
      version: 1
    });

    // 更新项目章节数
    await Project.increment('chapterCount', { where: { id: projectId } });

    return chapter;
  }

  async updateChapterContent(chapterId: string, content: string, userId: string) {
    const { Chapter, Project, WritingSession } = this.models;
    
    const chapter = await Chapter.findByPk(chapterId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!chapter) {
      throw new Error('章节不存在');
    }

    const previousWordCount = chapter.wordCount;
    const newWordCount = this.countWords(content);
    const wordsWritten = newWordCount - previousWordCount;

    // 更新章节
    await chapter.update({
      content,
      wordCount: newWordCount,
      version: chapter.version + 1
    });

    // 更新项目字数
    const wordCountDiff = newWordCount - previousWordCount;
    await Project.increment('currentWordCount', { 
      by: wordCountDiff,
      where: { id: chapter.projectId } 
    });

    // 记录写作会话（如果有显著变化）
    if (Math.abs(wordsWritten) > 10) {
      await this.recordWritingActivity(userId, chapter.projectId, chapterId, wordsWritten);
    }

    return chapter;
  }

  // 角色相关服务
  async createCharacter(projectId: string, characterData: any) {
    const { Character } = this.models;
    
    const character = await Character.create({
      projectId,
      ...characterData,
      status: 'active'
    });

    return character;
  }

  async getCharactersByProject(projectId: string) {
    const { Character, Chapter } = this.models;
    
    const characters = await Character.findAll({
      where: { projectId },
      include: [
        {
          model: Chapter,
          as: 'firstChapter',
          attributes: ['id', 'title', 'order'],
          required: false
        },
        {
          model: Chapter,
          as: 'lastChapter',
          attributes: ['id', 'title', 'order'],
          required: false
        }
      ],
      order: [['importance', 'DESC'], ['name', 'ASC']]
    });

    return characters;
  }

  // 世界观设定服务
  async createWorldBuilding(projectId: string, worldBuildingData: any) {
    const { WorldBuilding } = this.models;
    
    const worldBuilding = await WorldBuilding.create({
      projectId,
      ...worldBuildingData
    });

    return worldBuilding;
  }

  async getWorldBuildingHierarchy(projectId: string) {
    const { WorldBuilding } = this.models;
    
    const items = await WorldBuilding.findAll({
      where: { projectId },
      order: [['importance', 'DESC'], ['type', 'ASC'], ['name', 'ASC']]
    });

    // 构建层级结构
    const hierarchy = this.buildHierarchy(items);
    return hierarchy;
  }

  // 时间线服务
  async createTimelineEvent(projectId: string, eventData: any) {
    const { TimelineEvent } = this.models;
    
    // 获取下一个顺序
    const maxOrder = await TimelineEvent.max('order', { where: { projectId } }) || 0;
    
    const event = await TimelineEvent.create({
      projectId,
      ...eventData,
      order: maxOrder + 1
    });

    return event;
  }

  async getTimelineEvents(projectId: string, filters: any = {}) {
    const { TimelineEvent } = this.models;
    
    const where: any = { projectId };
    
    if (filters.eventType) {
      where.eventType = filters.eventType;
    }
    
    if (filters.importance) {
      where.importance = filters.importance;
    }

    const events = await TimelineEvent.findAll({
      where,
      order: [['order', 'ASC'], ['realDate', 'ASC']]
    });

    return events;
  }

  // 写作目标服务
  async createDefaultWritingGoal(userId: string, projectId: string) {
    const { WritingGoal } = this.models;
    
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1); // 一个月目标

    const goal = await WritingGoal.create({
      userId,
      projectId,
      type: 'monthly',
      targetWords: 50000, // 默认月目标5万字
      currentWords: 0,
      startDate: today,
      endDate,
      status: 'active',
      priority: 'medium',
      title: '月度写作目标',
      description: '完成本月的写作计划'
    });

    return goal;
  }

  async updateWritingGoalProgress(userId: string, projectId: string, wordsWritten: number) {
    const { WritingGoal } = this.models;
    
    const activeGoals = await WritingGoal.findAll({
      where: {
        userId,
        projectId,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });

    for (const goal of activeGoals) {
      await goal.increment('currentWords', { by: wordsWritten });
      
      // 检查是否完成目标
      if (goal.currentWords + wordsWritten >= goal.targetWords) {
        await goal.update({ status: 'completed' });
      }
    }
  }

  // 写作会话服务
  async startWritingSession(userId: string, projectId: string, chapterId?: string) {
    const { WritingSession, Project, Chapter } = this.models;
    
    // 获取当前字数
    let wordsBefore = 0;
    if (chapterId) {
      const chapter = await Chapter.findByPk(chapterId);
      wordsBefore = chapter?.wordCount || 0;
    } else {
      const project = await Project.findByPk(projectId);
      wordsBefore = project?.currentWordCount || 0;
    }

    const session = await WritingSession.create({
      userId,
      projectId,
      chapterId,
      startTime: new Date(),
      wordsWritten: 0,
      wordsBefore,
      wordsAfter: wordsBefore
    });

    return session;
  }

  async endWritingSession(sessionId: string, wordsAfter: number, sessionData: any = {}) {
    const { WritingSession } = this.models;
    
    const session = await WritingSession.findByPk(sessionId);
    if (!session) {
      throw new Error('写作会话不存在');
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / (1000 * 60)); // 分钟
    const wordsWritten = wordsAfter - session.wordsBefore;

    await session.update({
      endTime,
      duration,
      wordsWritten,
      wordsAfter,
      ...sessionData
    });

    // 更新写作目标进度
    if (wordsWritten > 0) {
      await this.updateWritingGoalProgress(session.userId, session.projectId, wordsWritten);
    }

    return session;
  }

  // 统计分析服务
  async getWritingStatistics(userId: string, projectId?: string, timeRange: string = '30d') {
    const { WritingSession, Project, Chapter } = this.models;
    
    const days = this.parseTimeRange(timeRange);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const where: any = {
      userId,
      startTime: { [Op.gte]: startDate }
    };
    
    if (projectId) {
      where.projectId = projectId;
    }

    const sessions = await WritingSession.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['title'] },
        { model: Chapter, as: 'chapter', attributes: ['title'], required: false }
      ],
      order: [['startTime', 'ASC']]
    });

    return this.analyzeWritingSessions(sessions);
  }

  // 工具方法
  private countWords(text: string): number {
    if (!text) return 0;
    // 中文字符计数 + 英文单词计数
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(word => word.length > 0).length;
    return chineseChars + englishWords;
  }

  private async recordWritingActivity(userId: string, projectId: string, chapterId: string, wordsWritten: number) {
    const { WritingSession } = this.models;
    
    // 检查是否已有今天的会话记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSession = await WritingSession.findOne({
      where: {
        userId,
        projectId,
        chapterId,
        startTime: { [Op.gte]: today }
      },
      order: [['startTime', 'DESC']]
    });

    if (existingSession) {
      // 更新现有会话
      await existingSession.increment('wordsWritten', { by: wordsWritten });
      await existingSession.update({ 
        endTime: new Date(),
        wordsAfter: existingSession.wordsAfter + wordsWritten
      });
    } else {
      // 创建新的会话记录
      await WritingSession.create({
        userId,
        projectId,
        chapterId,
        startTime: new Date(),
        endTime: new Date(),
        duration: 1,
        wordsWritten,
        wordsBefore: 0,
        wordsAfter: wordsWritten
      });
    }
  }

  private buildHierarchy(items: any[]): any[] {
    const hierarchy: any[] = [];
    const itemMap = new Map();

    // 创建映射
    items.forEach(item => {
      itemMap.set(item.id, { ...item.toJSON(), children: [] });
    });

    // 构建层级关系
    items.forEach(item => {
      const itemWithChildren = itemMap.get(item.id);
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId).children.push(itemWithChildren);
      } else {
        hierarchy.push(itemWithChildren);
      }
    });

    return hierarchy;
  }

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

  private analyzeWritingSessions(sessions: any[]) {
    const totalWords = sessions.reduce((sum, session) => sum + session.wordsWritten, 0);
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageWordsPerSession = sessions.length > 0 ? Math.round(totalWords / sessions.length) : 0;
    const averageWordsPerMinute = totalDuration > 0 ? Math.round(totalWords / totalDuration) : 0;

    // 按日期分组统计
    const dailyStats = sessions.reduce((acc: any, session) => {
      const date = session.startTime.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { words: 0, duration: 0, sessions: 0 };
      }
      acc[date].words += session.wordsWritten;
      acc[date].duration += session.duration || 0;
      acc[date].sessions += 1;
      return acc;
    }, {});

    // 最高产出日
    const bestDay = Object.entries(dailyStats)
      .sort(([,a]: any, [,b]: any) => b.words - a.words)[0];

    return {
      totalWords,
      totalDuration,
      totalSessions: sessions.length,
      averageWordsPerSession,
      averageWordsPerMinute,
      dailyStats,
      bestDay: bestDay ? {
        date: bestDay[0],
        words: (bestDay[1] as any).words
      } : null,
      streak: this.calculateWritingStreak(Object.keys(dailyStats))
    };
  }

  private calculateWritingStreak(writingDates: string[]): number {
    if (writingDates.length === 0) return 0;
    
    const sortedDates = writingDates.sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    
    let streak = 0;
    let checkDate = new Date(today);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = checkDate.toISOString().split('T')[0];
      
      if (sortedDates.includes(currentDate)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }
}
