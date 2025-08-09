import { Request, Response } from 'express';
import { databaseConfig } from '../config/database';
import { NovelCreationService } from '../services/novelCreationService';
import { logger } from '../utils/logger';

export class ProjectController {
  private novelService: NovelCreationService;
  private logger = logger;

  constructor() {
    this.novelService = new NovelCreationService();
  }

  // 获取用户的所有项目
  public getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      let userId = req.user?.id;

      // 临时开发模式：如果没有用户认证，使用测试用户ID
      if (!userId) {
        userId = 'test-user-1';
        this.logger.warn('使用测试用户ID获取项目列表');
      }

      const projects = await this.novelService.getProjectsByUser(userId);
      res.json({ projects });
    } catch (error) {
      this.logger.error('获取项目列表失败:', error);
      res.status(500).json({ error: '获取项目列表失败' });
    }
  }

  // 获取单个项目详情
  public getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      const project = await this.novelService.getProjectDetails(projectId, userId);

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      res.json({
        success: true,
        data: project
      });

    } catch (error) {
      logger.error('获取项目详情失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 创建新项目
  public createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectData = req.body;
      let userId = req.user?.id;

      // 临时开发模式：如果没有用户认证，使用测试用户ID
      if (!userId) {
        userId = 'test-user-1';
        this.logger.warn('使用测试用户ID进行项目创建');
      }

      this.logger.info('创建项目请求:', { userId, projectData });

      const project = await this.novelService.createProject(userId, projectData);

      this.logger.info('项目创建成功:', { projectId: project.id });

      res.status(201).json({
        success: true,
        data: project
      });

    } catch (error) {
      logger.error('创建项目失败:', error);
      res.status(500).json({ 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 更新项目信息
  public updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { Project } = databaseConfig.models!;
      
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      await project.update(updateData);

      res.json({
        success: true,
        data: project
      });

    } catch (error) {
      logger.error('更新项目失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 删除项目
  public deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { Project } = databaseConfig.models!;
      
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      await project.destroy();

      res.json({
        success: true,
        message: '项目删除成功'
      });

    } catch (error) {
      logger.error('删除项目失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取项目统计信息
  public getProjectStats = async (req: Request, res: Response): Promise<void> => {
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
      }

      const stats = await this.novelService.getProjectStats(projectId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取项目统计失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 项目备份
  public backupProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, Chapter, Character, WorldBuilding, TimelineEvent } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      // 获取项目的所有数据
      const [chapters, characters, worldBuildings, timelineEvents] = await Promise.all([
        Chapter.findAll({ where: { projectId } }),
        Character.findAll({ where: { projectId } }),
        WorldBuilding.findAll({ where: { projectId } }),
        TimelineEvent.findAll({ where: { projectId } })
      ]);

      const backupData = {
        project: project.toJSON(),
        chapters: chapters.map((ch: any) => ch.toJSON()),
        characters: characters.map((char: any) => char.toJSON()),
        worldBuildings: worldBuildings.map((wb: any) => wb.toJSON()),
        timelineEvents: timelineEvents.map((te: any) => te.toJSON()),
        exportTime: new Date().toISOString(),
        version: '1.0'
      };

      res.json({
        success: true,
        data: backupData
      });

    } catch (error) {
      logger.error('项目备份失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 项目还原
  public restoreProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { backupData } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      // 创建新项目
      const projectData = {
        ...backupData.project,
        title: `${backupData.project.title} (还原)`
      };
      delete projectData.id;

      const newProject = await this.novelService.createProject(userId, projectData);

      // 还原章节
      for (const chapterData of backupData.chapters) {
        delete chapterData.id;
        chapterData.projectId = newProject.id;
        await this.novelService.createChapter(newProject.id, chapterData);
      }

      // 还原角色
      for (const characterData of backupData.characters) {
        delete characterData.id;
        characterData.projectId = newProject.id;
        await this.novelService.createCharacter(newProject.id, characterData);
      }

      // 还原世界观设定
      const { WorldBuilding } = databaseConfig.models!;
      for (const wbData of backupData.worldBuildings) {
        delete wbData.id;
        wbData.projectId = newProject.id;
        await WorldBuilding.create(wbData);
      }

      // 还原时间线事件
      const { TimelineEvent } = databaseConfig.models!;
      for (const teData of backupData.timelineEvents) {
        delete teData.id;
        teData.projectId = newProject.id;
        await TimelineEvent.create(teData);
      }

      res.json({
        success: true,
        data: newProject,
        message: '项目还原成功'
      });

    } catch (error) {
      logger.error('项目还原失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 项目模板生成
  public generateProjectTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateType } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      let template: any = {};

      switch (templateType) {
        case 'fantasy':
          template = {
            title: '奇幻小说项目',
            genre: '奇幻',
            description: '一个奇幻世界的冒险故事',
            targetWords: 80000,
            chapters: [
              { title: '第一章 序幕', content: '', order: 1 },
              { title: '第二章 觉醒', content: '', order: 2 },
              { title: '第三章 冒险开始', content: '', order: 3 }
            ],
            characters: [
              { name: '主角', type: 'protagonist', importance: 'main' },
              { name: '导师', type: 'mentor', importance: 'supporting' },
              { name: '反派', type: 'antagonist', importance: 'main' }
            ],
            worldSettings: [
              { category: '魔法体系', content: '描述魔法的运作原理' },
              { category: '世界地理', content: '描述世界的地理环境' },
              { category: '种族设定', content: '描述各个种族的特点' }
            ]
          };
          break;

        case 'modern':
          template = {
            title: '现代都市小说',
            genre: '都市',
            description: '现代都市背景的故事',
            targetWords: 100000,
            chapters: [
              { title: '第一章 开端', content: '', order: 1 },
              { title: '第二章 相遇', content: '', order: 2 },
              { title: '第三章 转折', content: '', order: 3 }
            ],
            characters: [
              { name: '男主角', type: 'protagonist', importance: 'main' },
              { name: '女主角', type: 'love_interest', importance: 'main' },
              { name: '配角', type: 'supporting', importance: 'supporting' }
            ]
          };
          break;

        case 'romance':
          template = {
            title: '浪漫爱情小说',
            genre: '言情',
            description: '一段美好的爱情故事',
            targetWords: 60000,
            chapters: [
              { title: '第一章 初遇', content: '', order: 1 },
              { title: '第二章 心动', content: '', order: 2 },
              { title: '第三章 误会', content: '', order: 3 },
              { title: '第四章 和解', content: '', order: 4 },
              { title: '第五章 表白', content: '', order: 5 }
            ],
            characters: [
              { name: '女主', type: 'protagonist', importance: 'main' },
              { name: '男主', type: 'love_interest', importance: 'main' },
              { name: '闺蜜', type: 'friend', importance: 'supporting' }
            ]
          };
          break;

        default:
          template = {
            title: '新项目',
            genre: '未分类',
            description: '请描述您的故事',
            targetWords: 50000,
            chapters: [
              { title: '第一章', content: '', order: 1 }
            ],
            characters: [
              { name: '主角', type: 'protagonist', importance: 'main' }
            ]
          };
      }

      res.json({
        success: true,
        data: template
      });

    } catch (error) {
      logger.error('生成项目模板失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };
}
