/**
 * 知识图谱服务
 * 提供ArangoDB后端支持的知识图谱功能
 */

import { api } from './api';

export interface GraphNode {
  id: string;
  projectId: string;
  type: 'CHARACTER' | 'LOCATION' | 'EVENT' | 'PLOT_POINT' | 'ITEM' | 'CONCEPT';
  name: string;
  description?: string;
  importance?: number; // 0-100
  status?: 'draft' | 'active' | 'archived' | 'deprecated';
  tags?: string[];
  properties?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphRelationship {
  id: string;
  startNodeId: string;
  endNodeId: string;
  type: string;
  description?: string;
  strength?: number; // 0-100
  status?: 'active' | 'past' | 'potential' | 'deprecated';
  properties?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphQuery {
  projectId?: string;
  nodeTypes?: string[];
  relationshipTypes?: string[];
  searchTerm?: string;
  importanceRange?: [number, number];
  status?: string;
  limit?: number;
}

export interface GraphAnalytics {
  totalNodes: number;
  totalRelationships: number;
  nodesByType: Record<string, number>;
  relationshipsByType: Record<string, number>;
  centralNodes: Array<{ node: GraphNode; connections: number }>;
  isolatedNodes: GraphNode[];
  strongestRelationships: GraphRelationship[];
}

export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

/**
 * 知识图谱服务类
 * 提供ArangoDB后端支持的知识图谱功能
 */
export class KnowledgeGraphService {
  private baseUrl = '/knowledge-graph';

  /**
   * 搜索节点
   */
  async searchNodes(
    projectId: string, 
    type?: string, 
    query?: string
  ): Promise<GraphNode[]> {
    try {
      const params = new URLSearchParams();
      params.append('projectId', projectId);
      if (type) params.append('type', type);
      if (query) params.append('query', query);

      const response = await api.get(`${this.baseUrl}/nodes?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('搜索知识图谱节点失败:', error);
      return [];
    }
  }

  /**
   * 创建节点
   */
  async createNode(nodeData: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphNode> {
    try {
      const response = await api.post(`${this.baseUrl}/nodes`, nodeData);
      return response.data;
    } catch (error) {
      console.error('创建知识图谱节点失败:', error);
      throw error;
    }
  }

  /**
   * 更新节点
   */
  async updateNode(nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode> {
    try {
      const response = await api.put(`${this.baseUrl}/nodes/${nodeId}`, updates);
      return response.data;
    } catch (error) {
      console.error('更新知识图谱节点失败:', error);
      throw error;
    }
  }

  /**
   * 删除节点
   */
  async deleteNode(nodeId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/nodes/${nodeId}`);
    } catch (error) {
      console.error('删除知识图谱节点失败:', error);
      throw error;
    }
  }

  /**
   * 获取节点的关系
   */
  async getNodeRelationships(nodeId: string): Promise<GraphRelationship[]> {
    try {
      const response = await api.get(`${this.baseUrl}/nodes/${nodeId}/relationships`);
      return response.data;
    } catch (error) {
      console.error('获取节点关系失败:', error);
      return [];
    }
  }

  /**
   * 获取节点的关联节点
   */
  async getConnectedNodes(nodeId: string): Promise<GraphNode[]> {
    try {
      const response = await api.get(`${this.baseUrl}/nodes/${nodeId}/connected`);
      return response.data;
    } catch (error) {
      console.error('获取关联节点失败:', error);
      return [];
    }
  }

  /**
   * 创建关系
   */
  async createRelationship(
    relationshipData: Omit<GraphRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GraphRelationship> {
    try {
      const response = await api.post(`${this.baseUrl}/relationships`, relationshipData);
      return response.data;
    } catch (error) {
      console.error('创建知识图谱关系失败:', error);
      throw error;
    }
  }

  /**
   * 更新关系
   */
  async updateRelationship(
    relationshipId: string, 
    updates: Partial<GraphRelationship>
  ): Promise<GraphRelationship> {
    try {
      const response = await api.put(`${this.baseUrl}/relationships/${relationshipId}`, updates);
      return response.data;
    } catch (error) {
      console.error('更新知识图谱关系失败:', error);
      throw error;
    }
  }

  /**
   * 删除关系
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/relationships/${relationshipId}`);
    } catch (error) {
      console.error('删除知识图谱关系失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目的完整知识图谱
   */
  async getProjectGraph(projectId: string): Promise<GraphData> {
    try {
      const response = await api.get(`${this.baseUrl}/projects/${projectId}/graph`);
      return response.data;
    } catch (error) {
      console.error('获取项目知识图谱失败:', error);
      return { nodes: [], relationships: [] };
    }
  }

  /**
   * 获取项目的图分析数据
   */
  async getAnalytics(projectId: string): Promise<GraphAnalytics> {
    try {
      const response = await api.get(`${this.baseUrl}/projects/${projectId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('获取图分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 分析内容并自动创建知识图谱节点
   */
  async analyzeAndCreateNodes(projectId: string, content: string): Promise<GraphNode[]> {
    try {
      const response = await api.post(`${this.baseUrl}/analyze`, {
        projectId,
        content
      });
      return response.data;
    } catch (error) {
      console.error('分析内容创建节点失败:', error);
      return [];
    }
  }

  /**
   * 搜索相关节点（用于AI建议）
   */
  async searchRelatedNodes(
    projectId: string, 
    context: string, 
    type?: string
  ): Promise<GraphNode[]> {
    try {
      const response = await api.post(`${this.baseUrl}/search-related`, {
        projectId,
        context,
        type
      });
      return response.data;
    } catch (error) {
      console.error('搜索相关节点失败:', error);
      return [];
    }
  }

  /**
   * 查找两个节点之间的路径
   */
  async findPath(startNodeId: string, endNodeId: string, maxDepth: number = 3): Promise<{
    vertices: GraphNode[];
    edges: GraphRelationship[];
  }[]> {
    try {
      const response = await api.post(`${this.baseUrl}/path`, {
        startNodeId,
        endNodeId,
        maxDepth
      });
      return response.data;
    } catch (error) {
      console.error('查找路径失败:', error);
      return [];
    }
  }

  /**
   * 批量导入节点
   */
  async importNodes(nodes: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<GraphNode[]> {
    try {
      const response = await api.post(`${this.baseUrl}/import/nodes`, { nodes });
      return response.data;
    } catch (error) {
      console.error('批量导入节点失败:', error);
      throw error;
    }
  }

  /**
   * 批量导入关系
   */
  async importRelationships(relationships: Omit<GraphRelationship, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<GraphRelationship[]> {
    try {
      const response = await api.post(`${this.baseUrl}/import/relationships`, { relationships });
      return response.data;
    } catch (error) {
      console.error('批量导入关系失败:', error);
      throw error;
    }
  }

  /**
   * 导出项目的知识图谱
   */
  async exportGraph(projectId: string): Promise<GraphData> {
    try {
      const response = await api.get(`${this.baseUrl}/projects/${projectId}/export`);
      return response.data;
    } catch (error) {
      console.error('导出知识图谱失败:', error);
      throw error;
    }
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await api.get(`${this.baseUrl}/health`);
      return response.status === 200;
    } catch (error) {
      console.warn('知识图谱服务不可用:', error);
      return false;
    }
  }
}

// 创建单例实例
export const knowledgeGraphService = new KnowledgeGraphService();
export default knowledgeGraphService;
