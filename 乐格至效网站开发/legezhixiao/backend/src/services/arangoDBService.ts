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
            // 创建项目集合
            const projectCollection = this.db.collection('projects');
            if (!await projectCollection.exists()) {
              await projectCollection.create();
              // 常用索引
              await projectCollection.ensureIndex({
                type: 'persistent',
                fields: ['userId']
              } as any);
              await projectCollection.ensureIndex({
                type: 'persistent',
                fields: ['title']
              } as any);
              await projectCollection.ensureIndex({
                type: 'persistent',
                fields: ['status']
              } as any);
              logger.info('项目集合创建成功');
            }
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
      console.log('🔍 analyzeContentForNodes开始:', { projectId, contentLength: content.length });
      
      // 这是一个简单的实现，实际应该使用AI进行内容分析
      const entities = this.extractEntities(content);
      console.log('📝 提取的实体:', entities);
      
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

        console.log('💾 尝试创建节点:', nodeData);
        const node = await this.createKnowledgeGraphNode(nodeData);
        console.log('✅ 节点创建成功:', node);
        nodes.push(node);
      }

      console.log('🎉 analyzeContentForNodes完成:', { nodeCount: nodes.length });
      return nodes;
    } catch (error) {
      console.error('❌ analyzeContentForNodes错误:', error);
      logger.error('分析内容创建节点失败:', error);
      return [];
    }
  }

  /**
   * 智能实体提取（使用AI分析）
   */
  private extractEntities(content: string): any[] {
    console.log('🔎 开始提取实体，内容:', content);
    const entities: any[] = [];
    
    // 智能关键词模式匹配
    const patterns: { [key: string]: RegExp[] } = {
      CHARACTER: [
        /([一-龢]{2,4}|[A-Za-z]{2,10})\s*(?:是|为|叫做|名为)(?:.*?(?:角色|人物|主角|配角|反派|英雄|专家|博士|教授|工程师|科学家|侦探|医生))/gi,
        /(?:角色|人物|主角|配角|反派|英雄|专家|博士|教授|工程师|科学家|侦探|医生)[:：]\s*([一-龢]{2,6}|[A-Za-z]{2,15})/gi,
        /([一-龢]{2,4}|[A-Za-z]{2,10})\s*(?:博士|教授|工程师|科学家|专家|助手|CEO|创始人|侦探|医生)/gi
      ],
      LOCATION: [
        /(?:在|位于|来到|前往|住在)(?:\s*)([一-龢]{2,8}|[A-Za-z\s]{2,20})(?:市|省|国|城|区|街|路|实验室|公司|大学|研究所|机构|公寓|房间)/gi,
        /(?:地点|场所|位置)[:：]\s*([一-龢]{2,10}|[A-Za-z\s]{2,25})/gi,
        /([一-龢]{2,8}|[A-Za-z\s]{2,20})(?:实验室|研究所|公司|大学|机构|中心|基地|公寓)/gi
      ],
      ORGANIZATION: [
        /([一-龢]{2,10}|[A-Za-z\s]{2,25})(?:公司|集团|组织|机构|实验室|研究所|大学|中心|委员会)/gi,
        /(?:公司|组织|机构)[:：]\s*([一-龢]{2,10}|[A-Za-z\s]{2,25})/gi
      ],
      CONCEPT: [
        /([一-龢]{2,10}|[A-Za-z\s]{2,25})(?:项目|计划|算法|技术|系统|平台|协议|理论)/gi,
        /(?:项目|计划|算法|技术|系统)[:：]\s*([一-龢]{2,10}|[A-Za-z\s]{2,25})/gi
      ],
      EVENT: [
        /([一-龢]{2,10}|[A-Za-z\s]{2,25})(?:事件|会议|发布|合作|竞赛|冲突|危机)/gi,
        /(?:发生|举行|召开)\s*([一-龢]{2,10}|[A-Za-z\s]{2,25})/gi
      ]
    };

    // 对每种类型进行模式匹配
    for (const [type, typePatterns] of Object.entries(patterns)) {
      console.log(`🔍 检查${type}类型模式...`);
      for (const pattern of typePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const name = match[1]?.trim();
          console.log(`🎯 ${type}模式匹配到:`, name);
          if (name && name.length >= 2 && name.length <= 20) {
            // 避免重复实体
            if (!entities.some((e: any) => e.name === name && e.type === type)) {
              entities.push({
                type,
                name,
                description: `从内容中智能提取的${this.getTypeDescription(type)}`,
                importance: this.calculateImportance(content, name),
                context: this.extractContext(content, name, 50)
              });
              console.log(`✅ 添加${type}实体:`, name);
            }
          }
        }
      }
    }

    // 简单的通用实体提取（备用）- 扩展更多模式
    console.log('🔄 使用通用提取模式...');
    
    // 人物提取
    const characterPatterns = [
      /([一-龢]{2,4})\s*是\s*一?位?([^，。！？]*)/g,
      /([一-龢]{2,4})\s*(?:住在|来自|工作于)/g,
      /([一-龢]{2,4})\s*(?:的|和)/g
    ];
    
    for (const pattern of characterPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim();
        console.log('📝 通用角色模式匹配:', name);
        if (name && name.length >= 2 && !entities.some((e: any) => e.name === name)) {
          entities.push({
            type: 'CHARACTER',
            name,
            description: '从内容中提取的角色',
            importance: 70,
            context: content.substring(Math.max(0, match.index - 20), match.index + 50)
          });
          console.log('✅ 添加通用角色:', name);
        }
      }
    }
    
    // 地点提取
    const locationPatterns = [
      /(?:住在|位于|在)([一-龢]{2,6})/g,
      /([一-龢]{2,6})(?:的|里|中)/g
    ];
    
    for (const pattern of locationPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim();
        console.log('🏠 通用地点模式匹配:', name);
        if (name && name.length >= 2 && !entities.some((e: any) => e.name === name)) {
          entities.push({
            type: 'LOCATION',
            name,
            description: '从内容中提取的地点',
            importance: 60,
            context: content.substring(Math.max(0, match.index - 20), match.index + 50)
          });
          console.log('✅ 添加通用地点:', name);
        }
      }
    }
    
    console.log('🎊 实体提取完成，共找到:', entities.length, '个实体');
    return entities.slice(0, 10); // 限制最多10个实体
  }

  private getTypeDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      CHARACTER: '角色',
      LOCATION: '地点',
      ORGANIZATION: '组织',
      CONCEPT: '概念',
      EVENT: '事件'
    };
    return descriptions[type] || '实体';
  }

  private extractContext(content: string, name: string, length: number): string {
    const index = content.indexOf(name);
    if (index === -1) return '';
    
    const start = Math.max(0, index - length/2);
    const end = Math.min(content.length, index + name.length + length/2);
    return content.substring(start, end).trim();
  }

  private calculateImportance(content: string, name: string): number {
    const mentions = (content.match(new RegExp(name, 'g')) || []).length;
    const contentLength = content.length;
    const nameLength = name.length;
    
    // 基于提及频率、内容长度等计算重要性
    let importance = Math.min(90, 30 + mentions * 15 + (nameLength > 3 ? 10 : 0));
    
    // 特殊类型加权
    if (content.includes(`${name}是`) || content.includes(`${name}为`)) importance += 10;
    if (content.includes(`主角`) && content.includes(name)) importance += 20;
    
    return Math.max(20, Math.min(100, importance));
  }

  /**
   * 根据类型获取节点
   */
  async getNodesByType(projectId: string, nodeType: string): Promise<any[]> {
    try {
      const query = `
        FOR node IN knowledge_graph_nodes
        FILTER node.projectId == @projectId AND node.type == @nodeType
        RETURN node
      `;

      const bindVars = {
        projectId,
        nodeType
      };

      const cursor = await this.db.query(query, bindVars);
      return await cursor.all();
    } catch (error) {
      logger.error('根据类型获取节点失败:', error);
      return [];
    }
  }
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
