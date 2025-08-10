import { Database, aql } from 'arangojs';
import { logger } from '../utils/logger';

export interface ArangoDBConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export class ArangoDBService {
  private db: Database;
  private isConnected: boolean = false;

  constructor(config: ArangoDBConfig) {
    const url = `http://${config.host}:${config.port}`;
    
    const dbConfig: any = {
      url,
      databaseName: config.database
    };
    
    // 只有在有用户名和密码时才添加认证
    if (config.username && config.password) {
      dbConfig.auth = {
        username: config.username,
        password: config.password
      };
    }
    
    this.db = new Database(dbConfig);
  }

  async connect(): Promise<void> {
    try {
      logger.info('正在连接到 ArangoDB...');
      
      // 测试连接
      await this.db.version();
      this.isConnected = true;
      
      logger.info('ArangoDB 连接成功');
      
      // 初始化集合
      await this.initializeCollections();
      
    } catch (error) {
      this.isConnected = false;
      logger.error('ArangoDB 连接失败:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        this.db.close();
        this.isConnected = false;
        logger.info('ArangoDB 连接已关闭');
      }
    } catch (error) {
      logger.error('关闭 ArangoDB 连接时出错:', error);
      throw error;
    }
  }

  private async initializeCollections(): Promise<void> {
    try {
      logger.info('初始化 ArangoDB 集合...');

      // 创建用户集合
      const userCollection = this.db.collection('users');
      if (!await userCollection.exists()) {
        await userCollection.create();
        
        // 创建唯一索引
        await userCollection.ensureIndex({
          type: 'persistent',
          fields: ['username'],
          unique: true
        } as any);
        
        await userCollection.ensureIndex({
          type: 'persistent',
          fields: ['email'],
          unique: true
        } as any);
        
        logger.info('用户集合创建成功');
      }

      // 创建用户会话集合
      const sessionCollection = this.db.collection('user_sessions');
      if (!await sessionCollection.exists()) {
        await sessionCollection.create();
        
        // 创建过期时间索引
        await sessionCollection.ensureIndex({
          type: 'ttl',
          fields: ['expiresAt'],
          expireAfter: 0
        } as any);
        
        logger.info('用户会话集合创建成功');
      }

      // 创建小说集合
      const novelCollection = this.db.collection('novels');
      if (!await novelCollection.exists()) {
        await novelCollection.create();
        
        // 创建索引
        await novelCollection.ensureIndex({
          type: 'persistent',
          fields: ['authorId']
        } as any);
        
        await novelCollection.ensureIndex({
          type: 'inverted',
          fields: ['title', 'description']
        } as any);
        
        logger.info('小说集合创建成功');
      }

      // 创建章节集合
      const chapterCollection = this.db.collection('chapters');
      if (!await chapterCollection.exists()) {
        await chapterCollection.create();
        
        // 创建索引
        await chapterCollection.ensureIndex({
          type: 'persistent',
          fields: ['novelId']
        } as any);
        
        await chapterCollection.ensureIndex({
          type: 'persistent',
          fields: ['chapterNumber']
        } as any);
        
        logger.info('章节集合创建成功');
      }

      // 创建AI代理配置集合
      const agentConfigCollection = this.db.collection('agent_configs');
      if (!await agentConfigCollection.exists()) {
        await agentConfigCollection.create();
        
        await agentConfigCollection.ensureIndex({
          type: 'persistent',
          fields: ['userId']
        } as any);
        
        logger.info('AI代理配置集合创建成功');
      }

      // 创建知识图谱节点集合
      const knowledgeGraphNodesCollection = this.db.collection('knowledge_graph_nodes');
      if (!await knowledgeGraphNodesCollection.exists()) {
        await knowledgeGraphNodesCollection.create();
        
        // 创建索引
        await knowledgeGraphNodesCollection.ensureIndex({
          type: 'persistent',
          fields: ['projectId']
        } as any);
        
        await knowledgeGraphNodesCollection.ensureIndex({
          type: 'persistent',
          fields: ['type']
        } as any);
        
        await knowledgeGraphNodesCollection.ensureIndex({
          type: 'inverted',
          fields: ['name', 'description']
        } as any);
        
        logger.info('知识图谱节点集合创建成功');
      }

      // 创建知识图谱关系集合
      const knowledgeGraphRelationshipsCollection = this.db.collection('knowledge_graph_relationships');
      if (!await knowledgeGraphRelationshipsCollection.exists()) {
        await knowledgeGraphRelationshipsCollection.create();
        
        // 创建索引
        await knowledgeGraphRelationshipsCollection.ensureIndex({
          type: 'persistent',
          fields: ['projectId']
        } as any);
        
        await knowledgeGraphRelationshipsCollection.ensureIndex({
          type: 'persistent',
          fields: ['startNodeId']
        } as any);
        
        await knowledgeGraphRelationshipsCollection.ensureIndex({
          type: 'persistent',
          fields: ['endNodeId']
        } as any);
        
        await knowledgeGraphRelationshipsCollection.ensureIndex({
          type: 'persistent',
          fields: ['type']
        } as any);
        
        logger.info('知识图谱关系集合创建成功');
      }

      logger.info('所有集合初始化完成');
      
    } catch (error) {
      logger.error('初始化集合时出错:', error);
      throw error;
    }
  }

  // 通用查询方法
  async query(aqlQuery: string, bindVars?: any): Promise<any> {
    try {
      if (!this.isConnected) {
        throw new Error('数据库未连接');
      }
      
      const cursor = await this.db.query(aqlQuery, bindVars);
      return await cursor.all();
      
    } catch (error) {
      logger.error('查询执行失败:', error);
      throw error;
    }
  }

  // 获取集合
  getCollection(name: string) {
    return this.db.collection(name);
  }

  // 检查连接状态
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; version?: string; error?: string }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: '数据库未连接' };
      }
      
      const version = await this.db.version();
      return { 
        status: 'connected', 
        version: version.version 
      };
      
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }

  // AQL 模板标记函数
  aql(strings: TemplateStringsArray, ...values: any[]): any {
    return aql(strings, ...values);
  }

  // 文档操作方法
  async createDocument(collectionName: string, data: any): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.save(data);
      return result;
    } catch (error) {
      logger.error(`创建文档失败 (${collectionName}):`, error);
      throw error;
    }
  }

  async getDocument(collectionName: string, key: string): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.document(key);
      return result;
    } catch (error) {
      logger.error(`获取文档失败 (${collectionName}/${key}):`, error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, key: string, data: any): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.update(key, data);
      return result;
    } catch (error) {
      logger.error(`更新文档失败 (${collectionName}/${key}):`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, key: string): Promise<any> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.remove(key);
      return result;
    } catch (error) {
      logger.error(`删除文档失败 (${collectionName}/${key}):`, error);
      throw error;
    }
  }

  async queryDocuments(aqlQuery: string, bindVars?: any): Promise<any[]> {
    try {
      const result = await this.query(aqlQuery, bindVars);
      return result;
    } catch (error) {
      logger.error('查询文档失败:', error);
      throw error;
    }
  }

  // 为dataService提供的便捷查询方法
  async findDocuments(collectionName: string, filters: any = {}): Promise<any[]> {
    try {
      const collection = this.db.collection(collectionName);
      
      if (Object.keys(filters).length === 0) {
        // 如果没有过滤条件，返回所有文档
        const aqlQuery = `FOR doc IN ${collectionName} RETURN doc`;
        return await this.queryDocuments(aqlQuery);
      } else {
        // 构建AQL查询
        const filterConditions = Object.keys(filters).map((key, index) => 
          `doc.${key} == @param${index}`
        ).join(' AND ');
        
        const bindVars: any = {};
        Object.keys(filters).forEach((key, index) => {
          bindVars[`param${index}`] = filters[key];
        });
        
        const aqlQuery = `FOR doc IN ${collectionName} FILTER ${filterConditions} RETURN doc`;
        return await this.queryDocuments(aqlQuery, bindVars);
      }
    } catch (error) {
      logger.error(`查找文档失败: ${collectionName}`, error);
      throw error;
    }
  }

  // =================================
  // 知识图谱相关方法
  // =================================

  /**
   * 获取项目的知识图谱节点
   */
  async getKnowledgeGraphByProject(projectId: string): Promise<any[]> {
    try {
      const query = `
        FOR node IN knowledge_graph_nodes
        FILTER node.projectId == @projectId
        RETURN node
      `;
      return await this.queryDocuments(query, { projectId });
    } catch (error) {
      logger.error(`获取项目知识图谱失败 [${projectId}]:`, error);
      return [];
    }
  }

  /**
   * 获取项目的图关系
   */
  async getGraphRelationshipsByProject(projectId: string): Promise<any[]> {
    try {
      const query = `
        FOR rel IN knowledge_graph_relationships
        LET startNode = DOCUMENT(CONCAT("knowledge_graph_nodes/", rel.startNodeId))
        LET endNode = DOCUMENT(CONCAT("knowledge_graph_nodes/", rel.endNodeId))
        FILTER startNode.projectId == @projectId OR endNode.projectId == @projectId
        RETURN rel
      `;
      return await this.queryDocuments(query, { projectId });
    } catch (error) {
      logger.error(`获取项目图关系失败 [${projectId}]:`, error);
      return [];
    }
  }

  /**
   * 搜索知识图谱节点
   */
  async searchKnowledgeGraphNodes(projectId: string, type?: string, searchQuery?: string): Promise<any[]> {
    try {
      let filterConditions = ['node.projectId == @projectId'];
      const bindVars: any = { projectId };
      
      if (type && type !== 'all') {
        filterConditions.push('node.type == @type');
        bindVars.type = type;
      }
      
      if (searchQuery) {
        filterConditions.push('(LIKE(LOWER(node.name), LOWER(@searchPattern)) OR LIKE(LOWER(node.description), LOWER(@searchPattern)))');
        bindVars.searchPattern = `%${searchQuery}%`;
      }

      const query = `
        FOR node IN knowledge_graph_nodes
        FILTER ${filterConditions.join(' AND ')}
        RETURN node
      `;
      
      return await this.queryDocuments(query, bindVars);
    } catch (error) {
      logger.error('搜索知识图谱节点失败:', error);
      return [];
    }
  }

  /**
   * 创建知识图谱节点
   */
  async createKnowledgeGraphNode(nodeData: any): Promise<any> {
    try {
      const result = await this.createDocument('knowledge_graph_nodes', nodeData);
      return {
        ...nodeData,
        _key: result._key,
        _id: result._id,
        id: result._key
      };
    } catch (error) {
      logger.error('创建知识图谱节点失败:', error);
      throw error;
    }
  }

  /**
   * 更新知识图谱节点
   */
  async updateKnowledgeGraphNode(nodeId: string, updates: any): Promise<any> {
    try {
      const result = await this.updateDocument('knowledge_graph_nodes', nodeId, updates);
      const updatedNode = await this.getDocument('knowledge_graph_nodes', nodeId);
      return {
        ...updatedNode,
        id: updatedNode._key
      };
    } catch (error) {
      logger.error('更新知识图谱节点失败:', error);
      throw error;
    }
  }

  /**
   * 删除知识图谱节点
   */
  async deleteKnowledgeGraphNode(nodeId: string): Promise<boolean> {
    try {
      await this.deleteDocument('knowledge_graph_nodes', nodeId);
      return true;
    } catch (error) {
      logger.error('删除知识图谱节点失败:', error);
      return false;
    }
  }

  /**
   * 获取节点的关系
   */
  async getNodeRelationships(nodeId: string): Promise<any[]> {
    try {
      const query = `
        FOR rel IN knowledge_graph_relationships
        FILTER rel.startNodeId == @nodeId OR rel.endNodeId == @nodeId
        RETURN rel
      `;
      return await this.queryDocuments(query, { nodeId });
    } catch (error) {
      logger.error('获取节点关系失败:', error);
      return [];
    }
  }

  /**
   * 获取关联节点
   */
  async getConnectedNodes(nodeId: string): Promise<any[]> {
    try {
      const query = `
        FOR rel IN knowledge_graph_relationships
        FILTER rel.startNodeId == @nodeId OR rel.endNodeId == @nodeId
        LET connectedNodeId = rel.startNodeId == @nodeId ? rel.endNodeId : rel.startNodeId
        FOR node IN knowledge_graph_nodes
        FILTER node._key == connectedNodeId
        RETURN node
      `;
      return await this.queryDocuments(query, { nodeId });
    } catch (error) {
      logger.error('获取关联节点失败:', error);
      return [];
    }
  }

  /**
   * 创建图关系
   */
  async createGraphRelationship(relationshipData: any): Promise<any> {
    try {
      const result = await this.createDocument('knowledge_graph_relationships', relationshipData);
      return {
        ...relationshipData,
        _key: result._key,
        _id: result._id,
        id: result._key
      };
    } catch (error) {
      logger.error('创建图关系失败:', error);
      throw error;
    }
  }

  /**
   * 更新图关系
   */
  async updateGraphRelationship(relationshipId: string, updates: any): Promise<any> {
    try {
      const result = await this.updateDocument('knowledge_graph_relationships', relationshipId, updates);
      const updatedRel = await this.getDocument('knowledge_graph_relationships', relationshipId);
      return {
        ...updatedRel,
        id: updatedRel._key
      };
    } catch (error) {
      logger.error('更新图关系失败:', error);
      throw error;
    }
  }

  /**
   * 删除图关系
   */
  async deleteGraphRelationship(relationshipId: string): Promise<boolean> {
    try {
      await this.deleteDocument('knowledge_graph_relationships', relationshipId);
      return true;
    } catch (error) {
      logger.error('删除图关系失败:', error);
      return false;
    }
  }

  /**
   * 删除节点的所有关系
   */
  async deleteNodeRelationships(nodeId: string): Promise<void> {
    try {
      const query = `
        FOR rel IN knowledge_graph_relationships
        FILTER rel.startNodeId == @nodeId OR rel.endNodeId == @nodeId
        REMOVE rel IN knowledge_graph_relationships
      `;
      await this.queryDocuments(query, { nodeId });
    } catch (error) {
      logger.error('删除节点关系失败:', error);
      throw error;
    }
  }

  /**
   * 获取图分析数据
   */
  async getGraphAnalytics(projectId: string): Promise<any> {
    try {
      // 获取节点统计
      const nodeStatsQuery = `
        FOR node IN knowledge_graph_nodes
        FILTER node.projectId == @projectId
        COLLECT type = node.type WITH COUNT INTO count
        RETURN { type, count }
      `;

      // 获取关系统计
      const relStatsQuery = `
        FOR rel IN knowledge_graph_relationships
        LET startNode = DOCUMENT(CONCAT("knowledge_graph_nodes/", rel.startNodeId))
        LET endNode = DOCUMENT(CONCAT("knowledge_graph_nodes/", rel.endNodeId))
        FILTER startNode.projectId == @projectId OR endNode.projectId == @projectId
        COLLECT type = rel.type WITH COUNT INTO count
        RETURN { type, count }
      `;

      // 获取中心节点
      const centralNodesQuery = `
        FOR node IN knowledge_graph_nodes
        FILTER node.projectId == @projectId
        LET connections = (
          FOR rel IN knowledge_graph_relationships
          FILTER rel.startNodeId == node._key OR rel.endNodeId == node._key
          RETURN 1
        )
        SORT LENGTH(connections) DESC
        LIMIT 10
        RETURN { node, connections: LENGTH(connections) }
      `;

      const [nodeStats, relStats, centralNodes] = await Promise.all([
        this.queryDocuments(nodeStatsQuery, { projectId }),
        this.queryDocuments(relStatsQuery, { projectId }),
        this.queryDocuments(centralNodesQuery, { projectId })
      ]);

      // 转换统计数据为对象格式
      const nodesByType = nodeStats.reduce((acc: any, item: any) => {
        acc[item.type] = item.count;
        return acc;
      }, {});

      const relationshipsByType = relStats.reduce((acc: any, item: any) => {
        acc[item.type] = item.count;
        return acc;
      }, {});

      return {
        totalNodes: Object.values(nodesByType).reduce((sum: number, count: any) => sum + count, 0),
        totalRelationships: Object.values(relationshipsByType).reduce((sum: number, count: any) => sum + count, 0),
        nodesByType,
        relationshipsByType,
        centralNodes,
        isolatedNodes: [], // TODO: 实现孤立节点查询
        strongestRelationships: [] // TODO: 实现最强关系查询
      };
    } catch (error) {
      logger.error('获取图分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 分析内容创建节点（简单实现）
   */
  async analyzeContentForNodes(projectId: string, content: string): Promise<any[]> {
    try {
      // 这是一个简单的实现，实际应该使用AI进行内容分析
      const entities = this.extractEntities(content);
      const nodes = [];

      for (const entity of entities) {
        const nodeData = {
          projectId,
          type: entity.type,
          name: entity.name,
          description: entity.description,
          importance: entity.importance || 50,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const node = await this.createKnowledgeGraphNode(nodeData);
        nodes.push(node);
      }

      return nodes;
    } catch (error) {
      logger.error('分析内容创建节点失败:', error);
      return [];
    }
  }

  /**
   * 简单的实体提取（应该用AI替换）
   */
  private extractEntities(content: string): any[] {
    const entities = [];
    
    // 简单的规则提取（实际应该使用NLP/AI）
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('角色') || line.includes('人物')) {
        entities.push({
          type: 'CHARACTER',
          name: line.replace(/^.*[角色人物][:：]\s*/, '').trim(),
          description: '从内容中提取的角色'
        });
      } else if (line.includes('地点') || line.includes('场所')) {
        entities.push({
          type: 'LOCATION',
          name: line.replace(/^.*[地点场所][:：]\s*/, '').trim(),
          description: '从内容中提取的地点'
        });
      }
    }
    
    return entities;
  }

  /**
   * 搜索相关节点
   */
  async searchRelatedNodes(projectId: string, context: string, type?: string): Promise<any[]> {
    try {
      let filterConditions = ['node.projectId == @projectId'];
      const bindVars: any = { projectId };
      
      if (type) {
        filterConditions.push('node.type == @type');
        bindVars.type = type;
      }

      // 简单的相关性搜索（基于名称和描述的关键词匹配）
      const keywords = context.toLowerCase().split(/\s+/);
      const keywordConditions = keywords.map((keyword, index) => {
        bindVars[`keyword${index}`] = `%${keyword}%`;
        return `(LIKE(LOWER(node.name), @keyword${index}) OR LIKE(LOWER(node.description), @keyword${index}))`;
      });

      if (keywordConditions.length > 0) {
        filterConditions.push(`(${keywordConditions.join(' OR ')})`);
      }

      const query = `
        FOR node IN knowledge_graph_nodes
        FILTER ${filterConditions.join(' AND ')}
        RETURN node
      `;
      
      return await this.queryDocuments(query, bindVars);
    } catch (error) {
      logger.error('搜索相关节点失败:', error);
      return [];
    }
  }

  /**
   * 批量创建节点
   */
  async batchCreateNodes(nodes: any[]): Promise<any[]> {
    try {
      const results = [];
      for (const nodeData of nodes) {
        const result = await this.createKnowledgeGraphNode({
          ...nodeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        results.push(result);
      }
      return results;
    } catch (error) {
      logger.error('批量创建节点失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建关系
   */
  async batchCreateRelationships(relationships: any[]): Promise<any[]> {
    try {
      const results = [];
      for (const relData of relationships) {
        const result = await this.createGraphRelationship({
          ...relData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        results.push(result);
      }
      return results;
    } catch (error) {
      logger.error('批量创建关系失败:', error);
      throw error;
    }
  }

  /**
   * 导出项目图谱
   */
  async exportProjectGraph(projectId: string): Promise<any> {
    try {
      const nodes = await this.getKnowledgeGraphByProject(projectId);
      const relationships = await this.getGraphRelationshipsByProject(projectId);

      return {
        nodes,
        relationships,
        exportDate: new Date().toISOString(),
        projectId
      };
    } catch (error) {
      logger.error('导出项目图谱失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
let arangoDBService: ArangoDBService | null = null;

export function createArangoDBService(config: ArangoDBConfig): ArangoDBService {
  if (!arangoDBService) {
    arangoDBService = new ArangoDBService(config);
  }
  return arangoDBService;
}

export function getArangoDBService(): ArangoDBService {
  if (!arangoDBService) {
    throw new Error('ArangoDB 服务未初始化，请先调用 createArangoDBService');
  }
  return arangoDBService;
}

export default ArangoDBService;
