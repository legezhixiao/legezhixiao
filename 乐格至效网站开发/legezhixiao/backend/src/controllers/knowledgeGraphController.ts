import { Request, Response } from 'express';
import { getArangoDBService } from '../services/arangoDBService';
import { logger } from '../utils/logger';

/**
 * 知识图谱健康检查
 */
export const healthCheck = async (req: Request, res: Response): Promise<Response> => {
  try {
    const arangoDBService = getArangoDBService();
    const dbHealth = await arangoDBService.healthCheck();
    
    // 检查知识图谱集合是否存在
    const collections = ['knowledge_graph_nodes', 'knowledge_graph_relationships'];
    const collectionStatus: Record<string, string> = {};
    
    for (const collectionName of collections) {
      try {
        const collection = arangoDBService.getCollection(collectionName);
        collectionStatus[collectionName] = 'available';
      } catch (error) {
        collectionStatus[collectionName] = 'missing';
      }
    }
    
    return res.status(200).json({
      status: 'healthy',
      database: dbHealth,
      collections: collectionStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('知识图谱健康检查失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '健康检查失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 获取项目的知识图谱
 */
export const getProjectGraph = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '项目ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    
    const [nodes, relationships] = await Promise.all([
      arangoDBService.getKnowledgeGraphByProject(projectId),
      arangoDBService.getGraphRelationshipsByProject(projectId)
    ]);

    return res.json({
      success: true,
      data: {
        nodes,
        relationships
      }
    });
  } catch (error) {
    logger.error('获取项目知识图谱失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取项目知识图谱失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 搜索知识图谱节点
 */
export const searchNodes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    const { type, query } = req.query as { type?: string; query?: string };
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '项目ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const nodes = await arangoDBService.searchKnowledgeGraphNodes(projectId, type, query);

    return res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    logger.error('搜索知识图谱节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '搜索节点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 创建知识图谱节点
 */
export const createNode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    const nodeData = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '项目ID是必需的'
      });
    }

    const completeNodeData = {
      ...nodeData,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const arangoDBService = getArangoDBService();
    const node = await arangoDBService.createKnowledgeGraphNode(completeNodeData);

    return res.status(201).json({
      success: true,
      data: node
    });
  } catch (error) {
    logger.error('创建知识图谱节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建节点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 更新知识图谱节点
 */
export const updateNode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { nodeId } = req.params;
    const updates = req.body;
    
    if (!nodeId) {
      return res.status(400).json({
        success: false,
        message: '节点ID是必需的'
      });
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const arangoDBService = getArangoDBService();
    const node = await arangoDBService.updateKnowledgeGraphNode(nodeId, updatesWithTimestamp);

    return res.json({
      success: true,
      data: node
    });
  } catch (error) {
    logger.error('更新知识图谱节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '更新节点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 删除知识图谱节点
 */
export const deleteNode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { nodeId } = req.params;
    
    if (!nodeId) {
      return res.status(400).json({
        success: false,
        message: '节点ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    
    // 先删除节点的所有关系
    await arangoDBService.deleteNodeRelationships(nodeId);
    
    // 然后删除节点
    const success = await arangoDBService.deleteKnowledgeGraphNode(nodeId);

    if (success) {
      return res.json({
        success: true,
        message: '节点删除成功'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: '节点不存在或删除失败'
      });
    }
  } catch (error) {
    logger.error('删除知识图谱节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除节点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 获取节点的关系
 */
export const getNodeRelationships = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { nodeId } = req.params;
    
    if (!nodeId) {
      return res.status(400).json({
        success: false,
        message: '节点ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const relationships = await arangoDBService.getNodeRelationships(nodeId);

    return res.json({
      success: true,
      data: relationships
    });
  } catch (error) {
    logger.error('获取节点关系失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取节点关系失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 获取关联节点
 */
export const getConnectedNodes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { nodeId } = req.params;
    
    if (!nodeId) {
      return res.status(400).json({
        success: false,
        message: '节点ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const nodes = await arangoDBService.getConnectedNodes(nodeId);

    return res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    logger.error('获取关联节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取关联节点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 创建图关系
 */
export const createRelationship = async (req: Request, res: Response): Promise<Response> => {
  try {
    const relationshipData = req.body;
    
    if (!relationshipData.startNodeId || !relationshipData.endNodeId) {
      return res.status(400).json({
        success: false,
        message: '起始节点ID和结束节点ID是必需的'
      });
    }

    const completeRelationshipData = {
      ...relationshipData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const arangoDBService = getArangoDBService();
    const relationship = await arangoDBService.createGraphRelationship(completeRelationshipData);

    return res.status(201).json({
      success: true,
      data: relationship
    });
  } catch (error) {
    logger.error('创建图关系失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建关系失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 更新图关系
 */
export const updateRelationship = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { relationshipId } = req.params;
    const updates = req.body;
    
    if (!relationshipId) {
      return res.status(400).json({
        success: false,
        message: '关系ID是必需的'
      });
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const arangoDBService = getArangoDBService();
    const relationship = await arangoDBService.updateGraphRelationship(relationshipId, updatesWithTimestamp);

    return res.json({
      success: true,
      data: relationship
    });
  } catch (error) {
    logger.error('更新图关系失败:', error);
    return res.status(500).json({
      success: false,
      message: '更新关系失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 删除图关系
 */
export const deleteRelationship = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { relationshipId } = req.params;
    
    if (!relationshipId) {
      return res.status(400).json({
        success: false,
        message: '关系ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const success = await arangoDBService.deleteGraphRelationship(relationshipId);

    if (success) {
      return res.json({
        success: true,
        message: '关系删除成功'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: '关系不存在或删除失败'
      });
    }
  } catch (error) {
    logger.error('删除图关系失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除关系失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 获取图分析数据
 */
export const getAnalytics = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '项目ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const analytics = await arangoDBService.getGraphAnalytics(projectId);

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('获取图分析数据失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取分析数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 分析内容并创建节点
 */
export const analyzeAndCreateNodes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    
    if (!projectId || !content) {
      return res.status(400).json({
        success: false,
        message: '项目ID和内容是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const nodes = await arangoDBService.analyzeContentForNodes(projectId, content);

    return res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    logger.error('分析内容创建节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '分析内容失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 搜索相关节点
 */
export const searchRelatedNodes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    const { context, type } = req.query as { context?: string; type?: string };
    
    if (!projectId || !context) {
      return res.status(400).json({
        success: false,
        message: '项目ID和上下文是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const nodes = await arangoDBService.searchRelatedNodes(projectId, context, type);

    return res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    logger.error('搜索相关节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '搜索相关节点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 查找节点间路径
 */
export const findPath = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startNodeId, endNodeId } = req.query as { startNodeId?: string; endNodeId?: string };
    const maxDepth = parseInt(req.query.maxDepth as string) || 3;
    
    if (!startNodeId || !endNodeId) {
      return res.status(400).json({
        success: false,
        message: '起始节点ID和结束节点ID是必需的'
      });
    }

    // 暂时返回空数组，因为findNodePath方法需要ArangoDB图遍历功能
    const paths: any[] = [];

    return res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    logger.error('查找路径失败:', error);
    return res.status(500).json({
      success: false,
      message: '查找路径失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 批量导入节点
 */
export const importNodes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    const { nodes } = req.body;
    
    if (!projectId || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        message: '项目ID和节点数组是必需的'
      });
    }

    const nodesWithProject = nodes.map(node => ({
      ...node,
      projectId
    }));

    const arangoDBService = getArangoDBService();
    const createdNodes = await arangoDBService.batchCreateNodes(nodesWithProject);

    return res.json({
      success: true,
      data: createdNodes
    });
  } catch (error) {
    logger.error('批量导入节点失败:', error);
    return res.status(500).json({
      success: false,
      message: '批量导入节点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 批量导入关系
 */
export const importRelationships = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { relationships } = req.body;
    
    if (!Array.isArray(relationships)) {
      return res.status(400).json({
        success: false,
        message: '关系数组是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const createdRelationships = await arangoDBService.batchCreateRelationships(relationships);

    return res.json({
      success: true,
      data: createdRelationships
    });
  } catch (error) {
    logger.error('批量导入关系失败:', error);
    return res.status(500).json({
      success: false,
      message: '批量导入关系失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

/**
 * 导出项目图谱
 */
export const exportGraph = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '项目ID是必需的'
      });
    }

    const arangoDBService = getArangoDBService();
    const graphData = await arangoDBService.exportProjectGraph(projectId);

    return res.json({
      success: true,
      data: graphData
    });
  } catch (error) {
    logger.error('导出项目图谱失败:', error);
    return res.status(500).json({
      success: false,
      message: '导出项目图谱失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};
