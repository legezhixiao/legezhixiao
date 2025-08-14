import { 
  GraphNode, 
  GraphRelationship,
  GraphQuery,
  GraphData 
} from '../types/graph';
import { api } from '../utils/api';

export class KnowledgeGraphService {
  protected baseUrl = '/api/knowledge-graph';
  protected nodes: GraphNode[] = [];
  protected relationships: GraphRelationship[] = [];

  constructor() {
    this.loadData();
  }

  protected async loadData() {
    try {
      const [nodesResponse, relationshipsResponse] = await Promise.all([
        api.get(`${this.baseUrl}/nodes`),
        api.get(`${this.baseUrl}/relationships`)
      ]);
      
      this.nodes = nodesResponse.data;
      this.relationships = relationshipsResponse.data;
    } catch (error) {
      console.error('加载知识图谱数据失败:', error);
      throw error;
    }
  }

  // 基础CRUD方法
  async createNode(node: Omit<GraphNode, 'id'>): Promise<GraphNode> {
    const response = await api.post(`${this.baseUrl}/nodes`, node);
    const newNode = response.data;
    this.nodes.push(newNode);
    return newNode;
  }

  async updateNode(nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode> {
    const response = await api.put(`${this.baseUrl}/nodes/${nodeId}`, updates);
    const updatedNode = response.data;
    const index = this.nodes.findIndex(n => n.id === nodeId);
    if (index !== -1) {
      this.nodes[index] = updatedNode;
    }
    return updatedNode;
  }

  async deleteNode(nodeId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/nodes/${nodeId}`);
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.relationships = this.relationships.filter(
      r => r.startNodeId !== nodeId && r.endNodeId !== nodeId
    );
  }

  async createRelationship(relationship: Omit<GraphRelationship, 'id'>): Promise<GraphRelationship> {
    const response = await api.post(`${this.baseUrl}/relationships`, relationship);
    const newRelationship = response.data;
    this.relationships.push(newRelationship);
    return newRelationship;
  }

  async updateRelationship(relationshipId: string, updates: Partial<GraphRelationship>): Promise<GraphRelationship> {
    const response = await api.put(`${this.baseUrl}/relationships/${relationshipId}`, updates);
    const updatedRelationship = response.data;
    const index = this.relationships.findIndex(r => r.id === relationshipId);
    if (index !== -1) {
      this.relationships[index] = updatedRelationship;
    }
    return updatedRelationship;
  }

  async deleteRelationship(relationshipId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/relationships/${relationshipId}`);
    this.relationships = this.relationships.filter(r => r.id !== relationshipId);
  }

  // 查询方法
  async searchNodes(query: string): Promise<GraphNode[]> {
    const response = await api.get(`${this.baseUrl}/nodes/search`, { params: { q: query } });
    return response.data;
  }

  async getNodeRelationships(nodeId: string): Promise<GraphRelationship[]> {
    const response = await api.get(`${this.baseUrl}/nodes/${nodeId}/relationships`);
    return response.data;
  }

  async getConnectedNodes(nodeId: string): Promise<GraphNode[]> {
    const response = await api.get(`${this.baseUrl}/nodes/${nodeId}/connected`);
    return response.data;
  }

  // 获取当前缓存的数据
  getNodes(): GraphNode[] {
    return [...this.nodes];
  }

  getRelationships(): GraphRelationship[] {
    return [...this.relationships];
  }

  // 刷新数据
  async refresh(): Promise<void> {
    await this.loadData();
  }
}
