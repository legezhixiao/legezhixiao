import { Request, Response } from 'express';
import { databaseConfig } from '../config/database';
import { NovelCreationService } from '../services/novelCreationService';
import { logger } from '../utils/logger';

export class CharacterController {
  private novelService: NovelCreationService;

  constructor() {
    this.novelService = new NovelCreationService();
  }

  // 临时用户ID获取辅助函数
  private getTempUserId(req: Request): string {
    return (req as any).user?.id || 'test-user-001';
  }

  // 获取项目的所有角色
  public getCharactersByProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = this.getTempUserId(req);

      // 验证项目权限
      const { Project } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      const characters = await this.novelService.getCharactersByProject(projectId);

      res.json({
        success: true,
        data: characters
      });

    } catch (error) {
      logger.error('获取角色列表失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取单个角色详情
  public getCharacterById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { characterId } = req.params;
      const userId = this.getTempUserId(req);

      const { Character, Project } = databaseConfig.models!;
      
      const character = await Character.findOne({
        where: { id: characterId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId },
          attributes: ['id', 'title']
        }]
      });

      if (!character) {
        res.status(404).json({ error: '角色不存在或无权限访问' });
      }

      res.json({
        success: true,
        data: character
      });

    } catch (error) {
      logger.error('获取角色详情失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 创建新角色
  public createCharacter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const characterData = req.body;
      const userId = this.getTempUserId(req);

      // 验证项目权限
      const { Project } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      const character = await this.novelService.createCharacter(projectId, characterData);

      res.status(201).json({
        success: true,
        data: character
      });

    } catch (error) {
      logger.error('创建角色失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 更新角色信息
  public updateCharacter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { characterId } = req.params;
      const updateData = req.body;
      const userId = this.getTempUserId(req);

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { Character, Project } = databaseConfig.models!;
      
      const character = await Character.findOne({
        where: { id: characterId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId }
        }]
      });

      if (!character) {
        res.status(404).json({ error: '角色不存在或无权限访问' });
        return;
      }

      await character.update(updateData);

      res.json({
        success: true,
        data: character
      });

    } catch (error) {
      logger.error('更新角色失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 删除角色
  public deleteCharacter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { characterId } = req.params;
      const userId = this.getTempUserId(req);

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { Character, Project } = databaseConfig.models!;
      
      const character = await Character.findOne({
        where: { id: characterId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId }
        }]
      });

      if (!character) {
        res.status(404).json({ error: '角色不存在或无权限访问' });
        return;
      }

      await character.destroy();

      res.json({
        success: true,
        message: '角色删除成功'
      });

    } catch (error) {
      logger.error('删除角色失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取角色关系网络
  public getCharacterRelationships = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = this.getTempUserId(req);

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, Character } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const characters = await Character.findAll({
        where: { projectId },
        attributes: ['id', 'name', 'importance', 'relationships', 'tags']
      });

      // 构建关系网络数据
      const nodes = characters.map((char: any) => ({
        id: char.id,
        name: char.name,
        importance: char.importance,
        tags: char.tags || []
      }));

      const edges: any[] = [];
      characters.forEach((char: any) => {
        if (char.relationships) {
          char.relationships.forEach((rel: any) => {
            edges.push({
              source: char.id,
              target: rel.characterId,
              type: rel.type,
              description: rel.description
            });
          });
        }
      });

      res.json({
        success: true,
        data: {
          nodes,
          edges
        }
      });

    } catch (error) {
      logger.error('获取角色关系网络失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 批量导入角色
  public batchImportCharacters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { characters } = req.body;
      const userId = this.getTempUserId(req);

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

      const createdCharacters = [];
      for (const characterData of characters) {
        try {
          const character = await this.novelService.createCharacter(projectId, characterData);
          createdCharacters.push(character);
        } catch (error) {
          logger.warn(`创建角色失败: ${characterData.name}`, error);
        }
      }

      res.json({
        success: true,
        data: {
          imported: createdCharacters.length,
          total: characters.length,
          characters: createdCharacters
        }
      });

    } catch (error) {
      logger.error('批量导入角色失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 角色出场统计
  public getCharacterAppearanceStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = this.getTempUserId(req);

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, Character, Chapter } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const characters = await Character.findAll({
        where: { projectId },
        attributes: ['id', 'name', 'importance']
      });

      const chapters = await Chapter.findAll({
        where: { projectId },
        attributes: ['id', 'title', 'characters', 'order']
      });

      // 统计角色出场次数
      const appearanceStats = characters.map((char: any) => {
        const appearances = chapters.filter((chapter: any) => 
          chapter.characters && chapter.characters.includes(char.id)
        );

        return {
          characterId: char.id,
          characterName: char.name,
          importance: char.importance,
          totalAppearances: appearances.length,
          chapters: appearances.map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            order: ch.order
          })).sort((a: any, b: any) => a.order - b.order)
        };
      });

      res.json({
        success: true,
        data: appearanceStats.sort((a: any, b: any) => b.totalAppearances - a.totalAppearances)
      });

    } catch (error) {
      logger.error('获取角色出场统计失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };
}
