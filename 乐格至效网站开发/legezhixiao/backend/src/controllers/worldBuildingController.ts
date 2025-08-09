import { Request, Response } from 'express';
import { databaseConfig } from '../config/database';
import { logger } from '../utils/logger';

export class WorldBuildingController {
  // 获取项目的世界观设定
  public getWorldBuildingsByProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, WorldBuilding } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const worldBuildings = await WorldBuilding.findAll({
        where: { projectId },
        order: [['category', 'ASC'], ['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: worldBuildings
      });

    } catch (error) {
      logger.error('获取世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 根据分类获取世界观设定
  public getWorldBuildingsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, category } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, WorldBuilding } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      const worldBuildings = await WorldBuilding.findAll({
        where: { 
          projectId,
          type: decodeURIComponent(category)
        },
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: worldBuildings
      });

    } catch (error) {
      logger.error('获取分类世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取世界观设定分类列表
  public getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, WorldBuilding } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const categories = await WorldBuilding.findAll({
        where: { projectId },
        attributes: ['type'],
        group: ['type'],
        order: [['type', 'ASC']]
      });

      const categoryList = categories.map((item: any) => item.type);

      res.json({
        success: true,
        data: categoryList
      });

    } catch (error) {
      logger.error('获取世界观分类失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 获取单个世界观设定详情
  public getWorldBuildingById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { worldBuildingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { WorldBuilding, Project } = databaseConfig.models!;
      
      const worldBuilding = await WorldBuilding.findOne({
        where: { id: worldBuildingId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId },
          attributes: ['id', 'title']
        }]
      });

      if (!worldBuilding) {
        res.status(404).json({ error: '世界观设定不存在或无权限访问' });
      }

      res.json({
        success: true,
        data: worldBuilding
      });

    } catch (error) {
      logger.error('获取世界观设定详情失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 创建世界观设定
  public createWorldBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const worldBuildingData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, WorldBuilding } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const worldBuilding = await WorldBuilding.create({
        ...worldBuildingData,
        projectId
      });

      res.status(201).json({
        success: true,
        data: worldBuilding
      });

    } catch (error) {
      logger.error('创建世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 更新世界观设定
  public updateWorldBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { worldBuildingId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { WorldBuilding, Project } = databaseConfig.models!;
      
      const worldBuilding = await WorldBuilding.findOne({
        where: { id: worldBuildingId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId }
        }]
      });

      if (!worldBuilding) {
        res.status(404).json({ error: '世界观设定不存在或无权限访问' });
        return;
      }

      await worldBuilding.update(updateData);

      res.json({
        success: true,
        data: worldBuilding
      });

    } catch (error) {
      logger.error('更新世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 删除世界观设定
  public deleteWorldBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { worldBuildingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      const { WorldBuilding, Project } = databaseConfig.models!;
      
      const worldBuilding = await WorldBuilding.findOne({
        where: { id: worldBuildingId },
        include: [{
          model: Project,
          as: 'project',
          where: { userId }
        }]
      });

      if (!worldBuilding) {
        res.status(404).json({ error: '世界观设定不存在或无权限访问' });
        return;
      }

      await worldBuilding.destroy();

      res.json({
        success: true,
        message: '世界观设定删除成功'
      });

    } catch (error) {
      logger.error('删除世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 批量创建世界观设定
  public batchCreateWorldBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { worldBuildings } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, WorldBuilding } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const createdWorldBuildings = [];
      for (const wbData of worldBuildings) {
        try {
          const worldBuilding = await WorldBuilding.create({
            ...wbData,
            projectId
          });
          createdWorldBuildings.push(worldBuilding);
        } catch (error) {
          logger.warn(`创建世界观设定失败: ${wbData.title}`, error);
        }
      }

      res.json({
        success: true,
        data: {
          created: createdWorldBuildings.length,
          total: worldBuildings.length,
          worldBuildings: createdWorldBuildings
        }
      });

    } catch (error) {
      logger.error('批量创建世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 世界观设定搜索
  public searchWorldBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { keyword, category } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, WorldBuilding } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const whereClause: any = { projectId };

      if (category) {
        whereClause.type = category;
      }

      // 获取所有记录，然后在内存中过滤
      const allWorldBuildings = await WorldBuilding.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      // 如果有关键词，进行名称匹配过滤
      const keywordStr = Array.isArray(keyword) ? keyword[0] : keyword;
      const worldBuildings = keywordStr && typeof keywordStr === 'string'
        ? allWorldBuildings.filter((wb: any) => wb.name.toLowerCase().includes(keywordStr.toLowerCase()))
        : allWorldBuildings;

      res.json({
        success: true,
        data: worldBuildings
      });

    } catch (error) {
      logger.error('搜索世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 导出世界观设定
  public exportWorldBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
      }

      // 验证项目权限
      const { Project, WorldBuilding } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
      }

      const worldBuildings = await WorldBuilding.findAll({
        where: { projectId },
        order: [['type', 'ASC'], ['createdAt', 'ASC']]
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      // 按分类组织数据
      const categorizedData: any = {};
      worldBuildings.forEach((wb: any) => {
        if (!categorizedData[wb.type]) {
          categorizedData[wb.type] = [];
        }
        categorizedData[wb.type].push({
          name: wb.name,
          description: wb.description,
          tags: wb.tags,
          notes: wb.notes
        });
      });

      const exportData = {
        projectTitle: project.title,
        worldBuilding: categorizedData,
        exportTime: new Date().toISOString(),
        totalItems: worldBuildings.length
      };

      res.json({
        success: true,
        data: exportData
      });

    } catch (error) {
      logger.error('导出世界观设定失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };
}
