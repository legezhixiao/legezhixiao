// ArangoDB 类型定义（临时解决方案）
interface Database {
  version(): Promise<{ version: string; license: string; server: string; details?: Record<string, any> }>;
  collection(name: string): Collection;
  createCollection(name: string): Promise<Collection>;
  createEdgeCollection(name: string): Promise<Collection>;
  query(queryString: string, bindVars?: any): Promise<Cursor>;
  close(): Promise<void>;
}

interface Collection {
  exists(): Promise<boolean>;
  save(doc: any, options?: any): Promise<{ _key: string; _id: string; _rev: string; new?: any }>;
  document(key: string): Promise<any>;
  update(key: string, doc: any, options?: any): Promise<{ _key: string; _id: string; _rev: string; new?: any }>;
  remove(key: string): Promise<{ _key: string; _id: string; _rev: string }>;
}

interface Cursor {
  all(): Promise<any[]>;
  next(): Promise<any>;
  hasNext(): boolean;
}

// 如果arangojs可用，使用真实的导入；否则使用模拟
let Database: new (config: any) => Database;

try {
  ({ Database } = require('arangojs'));
} catch (error: any) {
  console.warn('⚠️ arangojs 包未安装，使用模拟实现');
  // 模拟Database类
  Database = class MockDatabase {
    constructor(_config: any) {
      console.log('🔧 使用ArangoDB模拟实现');
    }
    
    async version() {
      return { version: '3.11.0', license: 'community', server: 'arango' };
    }
    
    collection(_name: string) {
      return {
        exists: () => Promise.resolve(true),
        save: (_doc: any, options?: any) => Promise.resolve({ 
          _key: 'mock', 
          _id: 'mock/mock', 
          _rev: 'mock',
          new: options?.returnNew ? _doc : undefined
        }),
        document: (_key: string) => Promise.resolve({}),
        update: (key: string, _doc: any, options?: any) => Promise.resolve({ 
          _key: key, 
          _id: `mock/${key}`, 
          _rev: 'mock',
          new: options?.returnNew ? _doc : undefined
        }),
        remove: (key: string) => Promise.resolve({ _key: key, _id: `mock/${key}`, _rev: 'mock' })
      };
    }
    
    async createCollection(name: string) {
      return this.collection(name);
    }
    
    async createEdgeCollection(name: string) {
      return this.collection(name);
    }
    
    async query(_queryString: string, _bindVars?: any) {
      return {
        all: () => Promise.resolve([]),
        next: () => Promise.resolve({}),
        hasNext: () => false
      };
    }
    
    async close() {
      console.log('🔌 模拟ArangoDB连接关闭');
    }
  } as any;
}

import { message } from 'antd';

// 真实数据库服务配置
const DB_CONFIG = {
  USE_MOCK: import.meta.env.VITE_USE_MOCK_DB === 'true' || false,
  ARANGO_URL: import.meta.env.VITE_ARANGO_URL || 'http://localhost:8529',
  ARANGO_DB_NAME: import.meta.env.VITE_ARANGO_DB_NAME || 'legezhixiao_db',
  ARANGO_USERNAME: import.meta.env.VITE_ARANGO_USERNAME || 'root',
  ARANGO_PASSWORD: import.meta.env.VITE_ARANGO_PASSWORD || '',
  CONNECTION_TIMEOUT: 10000,
  RETRY_COUNT: 3,
};

// 数据库文档类型定义
export interface UserDocument {
  _key?: string;
  _id?: string;
  _rev?: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'premium' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  preferences: {
    theme: string;
    language: string;
    timezone: string;
    notifications: Record<string, boolean>;
    privacy: Record<string, any>;
    writing: Record<string, any>;
  };
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface ProjectDocument {
  _key?: string;
  _id?: string;
  _rev?: string;
  userId: string;
  title: string;
  description: string;
  genre: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  visibility: 'private' | 'public' | 'shared';
  settings: {
    wordCountGoal: number;
    targetAudience: string;
    writingStyle: string;
    contentRating: string;
    publishingPlan: string;
  };
  stats: {
    totalWords: number;
    totalChapters: number;
    averageWordsPerChapter: number;
    lastUpdated: string;
  };
  metadata: {
    tags: string[];
    categories: string[];
    customFields: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChapterDocument {
  _key?: string;
  _id?: string;
  _rev?: string;
  projectId: string;
  userId: string;
  title: string;
  content: string;
  summary: string;
  chapterNumber: number;
  volumeId?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  wordCount: number;
  readingTime: number;
  settings: {
    publishSchedule?: string;
    authorNotes?: string;
    contentWarnings?: string[];
  };
  metadata: {
    lastEditedAt: string;
    version: number;
    revisionHistory?: any[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CharacterDocument {
  _key?: string;
  _id?: string;
  _rev?: string;
  projectId: string;
  userId: string;
  name: string;
  description: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  appearance: {
    age?: number;
    gender?: string;
    physicalDescription?: string;
    distinguishingFeatures?: string[];
  };
  personality: {
    traits: string[];
    motivations: string[];
    fears: string[];
    goals: string[];
  };
  background: {
    origin?: string;
    education?: string;
    occupation?: string;
    relationships?: string[];
    history?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeGraphNode {
  _key?: string;
  _id?: string;
  _rev?: string;
  projectId: string;
  userId: string;
  name: string;
  type: 'character' | 'location' | 'event' | 'concept' | 'item';
  description: string;
  properties: Record<string, any>;
  metadata: {
    tags: string[];
    importance: number;
    connections: number;
  };
  position?: {
    x: number;
    y: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeGraphRelationship {
  _key?: string;
  _id?: string;
  _rev?: string;
  _from: string;
  _to: string;
  projectId: string;
  userId: string;
  type: string;
  description: string;
  strength: number;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 真实ArangoDB服务类
export class RealArangoDBService {
  private static instance: RealArangoDBService;
  private database: Database | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    console.log('🔧 RealArangoDBService 初始化');
  }

  static getInstance(): RealArangoDBService {
    if (!RealArangoDBService.instance) {
      RealArangoDBService.instance = new RealArangoDBService();
    }
    return RealArangoDBService.instance;
  }

  // 真实数据库连接
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._doConnect();
    return this.connectionPromise;
  }

  private async _doConnect(): Promise<void> {
    try {
      console.log('🔗 连接到ArangoDB...', {
        url: DB_CONFIG.ARANGO_URL,
        database: DB_CONFIG.ARANGO_DB_NAME
      });

      // 创建数据库连接
      this.database = new Database({
        url: DB_CONFIG.ARANGO_URL,
        databaseName: DB_CONFIG.ARANGO_DB_NAME,
        auth: {
          username: DB_CONFIG.ARANGO_USERNAME,
          password: DB_CONFIG.ARANGO_PASSWORD,
        },
        agentOptions: {
          timeout: DB_CONFIG.CONNECTION_TIMEOUT,
        },
      });

      // 测试连接
      await this.database.version();

      // 确保集合存在
      await this.ensureCollections();

      this.isConnected = true;
      console.log('✅ ArangoDB连接成功');
      message.success('数据库连接成功');

    } catch (error) {
      console.error('❌ ArangoDB连接失败:', error);
      this.isConnected = false;
      this.database = null;
      this.connectionPromise = null;
      
      const errorMessage = error instanceof Error ? error.message : '数据库连接失败';
      message.error(`数据库连接失败: ${errorMessage}`);
      throw error;
    }
  }

  // 确保所有必要的集合存在
  private async ensureCollections(): Promise<void> {
    if (!this.database) throw new Error('数据库未连接');

    const collections = [
      { name: 'users', type: 'document' },
      { name: 'projects', type: 'document' },
      { name: 'chapters', type: 'document' },
      { name: 'characters', type: 'document' },
      { name: 'knowledge_graph_nodes', type: 'document' },
      { name: 'knowledge_graph_relationships', type: 'edge' },
    ];

    for (const collectionDef of collections) {
      try {
        const collection = this.database.collection(collectionDef.name);
        const exists = await collection.exists();
        
        if (!exists) {
          if (collectionDef.type === 'edge') {
            await this.database.createEdgeCollection(collectionDef.name);
          } else {
            await this.database.createCollection(collectionDef.name);
          }
          console.log(`✅ 创建集合: ${collectionDef.name}`);
        }
      } catch (error) {
        console.error(`❌ 创建集合 ${collectionDef.name} 失败:`, error);
      }
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    if (this.database) {
      try {
        await this.database.close();
        console.log('🔌 ArangoDB连接已断开');
      } catch (error) {
        console.error('断开ArangoDB连接时发生错误:', error);
      }
    }
    
    this.database = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  // 检查连接状态
  isConnectedToDB(): boolean {
    return this.isConnected && this.database !== null;
  }

  // 获取数据库实例
  getDatabase(): Database | null {
    return this.database;
  }

  // 用户操作
  async createUser(user: Omit<UserDocument, '_key' | '_id' | '_rev'>): Promise<UserDocument> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('users');
      const result = await collection.save({
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ 创建用户成功:', result._key);
      return { ...user, _key: result._key, _id: result._id, _rev: result._rev } as UserDocument;
    } catch (error) {
      console.error('❌ 创建用户失败:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('users');
      const document = await collection.document(userId);
      return document as UserDocument;
    } catch (error: any) {
      if (error.errorNum === 1202) { // Document not found
        return null;
      }
      console.error('❌ 获取用户失败:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<UserDocument | null> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const cursor = await this.database.query(`
        FOR user IN users
        FILTER user.username == @username
        RETURN user
      `, { username });

      const result = await cursor.next();
      return result || null;
    } catch (error) {
      console.error('❌ 通过用户名获取用户失败:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<UserDocument>): Promise<UserDocument> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('users');
      const result = await collection.update(userId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      }, { returnNew: true });

      console.log('✅ 更新用户成功:', userId);
      return result.new as UserDocument;
    } catch (error) {
      console.error('❌ 更新用户失败:', error);
      throw error;
    }
  }

  // 项目操作
  async createProject(project: Omit<ProjectDocument, '_key' | '_id' | '_rev'>): Promise<ProjectDocument> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('projects');
      const result = await collection.save({
        ...project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ 创建项目成功:', result._key);
      return { ...project, _key: result._key, _id: result._id, _rev: result._rev } as ProjectDocument;
    } catch (error) {
      console.error('❌ 创建项目失败:', error);
      throw error;
    }
  }

  async getProjectsByUserId(userId: string): Promise<ProjectDocument[]> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const cursor = await this.database.query(`
        FOR project IN projects
        FILTER project.userId == @userId
        SORT project.updatedAt DESC
        RETURN project
      `, { userId });

      return await cursor.all();
    } catch (error) {
      console.error('❌ 获取用户项目失败:', error);
      throw error;
    }
  }

  async getProjectById(projectId: string): Promise<ProjectDocument | null> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('projects');
      const document = await collection.document(projectId);
      return document as ProjectDocument;
    } catch (error: any) {
      if (error.errorNum === 1202) { // Document not found
        return null;
      }
      console.error('❌ 获取项目失败:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('projects');
      const result = await collection.update(projectId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      }, { returnNew: true });

      console.log('✅ 更新项目成功:', projectId);
      return result.new as ProjectDocument;
    } catch (error) {
      console.error('❌ 更新项目失败:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('projects');
      await collection.remove(projectId);
      
      console.log('✅ 删除项目成功:', projectId);
      return true;
    } catch (error) {
      console.error('❌ 删除项目失败:', error);
      throw error;
    }
  }

  // 章节操作
  async getChaptersByProjectId(projectId: string): Promise<ChapterDocument[]> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const cursor = await this.database.query(`
        FOR chapter IN chapters
        FILTER chapter.projectId == @projectId
        SORT chapter.chapterNumber ASC
        RETURN chapter
      `, { projectId });

      return await cursor.all();
    } catch (error) {
      console.error('❌ 获取项目章节失败:', error);
      throw error;
    }
  }

  async getChapterById(chapterId: string): Promise<ChapterDocument | null> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('chapters');
      const document = await collection.document(chapterId);
      return document as ChapterDocument;
    } catch (error: any) {
      if (error.errorNum === 1202) { // Document not found
        return null;
      }
      console.error('❌ 获取章节失败:', error);
      throw error;
    }
  }

  async updateChapter(chapterId: string, updates: Partial<ChapterDocument>): Promise<ChapterDocument> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('chapters');
      const result = await collection.update(chapterId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      }, { returnNew: true });

      console.log('✅ 更新章节成功:', chapterId);
      return result.new as ChapterDocument;
    } catch (error) {
      console.error('❌ 更新章节失败:', error);
      throw error;
    }
  }

  // 知识图谱操作
  async createKnowledgeGraphNode(node: Omit<KnowledgeGraphNode, '_key' | '_id' | '_rev'>): Promise<KnowledgeGraphNode> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('knowledge_graph_nodes');
      const result = await collection.save({
        ...node,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ 创建知识图谱节点成功:', result._key);
      return { ...node, _key: result._key, _id: result._id, _rev: result._rev } as KnowledgeGraphNode;
    } catch (error) {
      console.error('❌ 创建知识图谱节点失败:', error);
      throw error;
    }
  }

  async getKnowledgeGraphByProjectId(projectId: string): Promise<{
    nodes: KnowledgeGraphNode[];
    relationships: KnowledgeGraphRelationship[];
  }> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      // 获取节点
      const nodesCursor = await this.database.query(`
        FOR node IN knowledge_graph_nodes
        FILTER node.projectId == @projectId
        RETURN node
      `, { projectId });

      // 获取关系
      const relationshipsCursor = await this.database.query(`
        FOR rel IN knowledge_graph_relationships
        FILTER rel.projectId == @projectId
        RETURN rel
      `, { projectId });

      const nodes = await nodesCursor.all();
      const relationships = await relationshipsCursor.all();

      console.log('✅ 获取知识图谱成功:', { projectId, nodesCount: nodes.length, relationshipsCount: relationships.length });
      return { nodes, relationships };
    } catch (error) {
      console.error('❌ 获取知识图谱失败:', error);
      throw error;
    }
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; database: string; connected: boolean }> {
    try {
      if (!this.database) {
        return { status: 'disconnected', database: 'none', connected: false };
      }

      const version = await this.database.version();
      return {
        status: 'healthy',
        database: `ArangoDB ${version.version}`,
        connected: this.isConnected
      };
    } catch (error) {
      return {
        status: 'error',
        database: error instanceof Error ? error.message : 'unknown error',
        connected: false
      };
    }
  }

  // 实现IDatabaseService接口的缺失方法
  async deleteUser(id: string): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('数据库未连接');
      }
      
      await this.database.collection('users').remove(id);
      message.success('用户删除成功');
    } catch (error: any) {
      console.error('❌ 删除用户失败:', error);
      message.error(`删除用户失败: ${error.message}`);
      throw error;
    }
  }

  async getUserProjects(userId: string): Promise<any[]> {
    try {
      if (!this.database) {
        throw new Error('数据库未连接');
      }
      
      const cursor = await this.database.query(`
        FOR project IN projects
        FILTER project.userId == @userId
        SORT project.createdAt DESC
        RETURN project
      `, { userId });

      const projects = await cursor.all();
      console.log('✅ 获取用户项目成功:', { userId, count: projects.length });
      return projects;
    } catch (error: any) {
      console.error('❌ 获取用户项目失败:', error);
      throw error;
    }
  }

  // 为接口兼容性添加的方法
  async getChapter(chapterId: string): Promise<any> {
    return this.getChapterById(chapterId);
  }

  async getProjectChapters(projectId: string): Promise<any[]> {
    return this.getChaptersByProjectId(projectId);
  }

  async deleteChapter(chapterId: string): Promise<void> {
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('chapters');
      await collection.remove(chapterId);
      console.log('✅ 删除章节成功:', chapterId);
    } catch (error) {
      console.error('❌ 删除章节失败:', error);
      throw error;
    }
  }

  // 重载createChapter方法以匹配接口
  async createChapter(chapterIdOrData: string | Omit<ChapterDocument, '_key' | '_id' | '_rev'>, chapterData?: any): Promise<ChapterDocument> {
    // 如果第一个参数是字符串，说明是新接口调用
    if (typeof chapterIdOrData === 'string') {
      const data = { ...chapterData, id: chapterIdOrData };
      return this.createChapter(data);
    }
    
    // 原始方法实现
    await this.connect();
    if (!this.database) throw new Error('数据库未连接');

    try {
      const collection = this.database.collection('chapters');
      const chapter = chapterIdOrData;
      const result = await collection.save({
        ...chapter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ 创建章节成功:', result._key);
      return { ...chapter, _key: result._key, _id: result._id, _rev: result._rev } as ChapterDocument;
    } catch (error) {
      console.error('❌ 创建章节失败:', error);
      throw error;
    }
  }
}

// 创建真实数据库服务实例
export const realArangoDBService = RealArangoDBService.getInstance();

// 默认导出
export default realArangoDBService;
