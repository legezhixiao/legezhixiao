/**
 * 统一数据服务
 * 提供统一的数据访问层，整合本地存储、云端同步和缓存管理
 */
import { projectService } from './projectService';
import { unifiedAuthService } from './unifiedAuthService';
import { systemConfig } from './systemConfig';

export interface DataSyncStatus {
  lastSyncTime: string;
  syncInProgress: boolean;
  conflictsDetected: number;
  syncDirection: 'up' | 'down' | 'bidirectional';
  pendingChanges: number;
}

export interface DataConflict {
  id: string;
  type: 'project' | 'chapter' | 'character' | 'settings';
  localVersion: any;
  remoteVersion: any;
  conflictTime: string;
  autoResolvable: boolean;
}

export interface SyncOptions {
  force?: boolean;
  direction?: 'up' | 'down' | 'bidirectional';
  includeTypes?: string[];
  excludeTypes?: string[];
}

export interface DataBackup {
  id: string;
  timestamp: string;
  type: 'auto' | 'manual';
  size: number;
  compressed: boolean;
  encrypted: boolean;
  items: BackupItem[];
}

export interface BackupItem {
  type: string;
  id: string;
  size: number;
  checksum: string;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}

export interface DataStats {
  totalProjects: number;
  totalChapters: number;
  totalCharacters: number;
  totalWords: number;
  storageUsed: number;
  lastBackup?: string;
  cacheHitRate: number;
}

export class UnifiedDataService {
  private static instance: UnifiedDataService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private syncQueue: Array<{ type: string; operation: string; data: any }> = [];
  private conflictQueue: DataConflict[] = [];
  private isInitialized = false;
  private syncInProgress = false;

  constructor() {
    this.initializeService();
  }

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  /**
   * 初始化数据服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 设置缓存配置
      this.configureCaching();
      
      // 检查是否需要数据迁移
      await this.checkDataMigration();
      
      // 启动自动同步和备份
      this.startAutoSync();
      this.startAutoBackup();
      
      this.isInitialized = true;
      console.log('Unified Data Service initialized');
    } catch (error) {
      console.error('Failed to initialize data service:', error);
      throw error;
    }
  }

  /**
   * 获取项目数据
   */
  async getProject(projectId: string, useCache = true): Promise<any> {
    const cacheKey = `project:${projectId}`;
    
    // 检查缓存
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      // 从本地数据库获取
      const project = await projectService.getProject(projectId);
      
      if (project && useCache) {
        this.setCache(cacheKey, project, 300); // 5分钟缓存
      }
      
      return project;
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

  /**
   * 保存项目数据
   */
  async saveProject(project: any): Promise<any> {
    try {
      // 保存到本地数据库
      const savedProject = await projectService.updateProject(project.id, project);
      
      // 更新缓存
      this.setCache(`project:${project.id}`, savedProject, 300);
      
      // 添加到同步队列
      this.addToSyncQueue('project', 'update', savedProject);
      
      return savedProject;
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  /**
   * 删除项目数据
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      // 从本地数据库删除
      await projectService.deleteProject(projectId);
      
      // 清除缓存
      this.removeFromCache(`project:${projectId}`);
      
      // 添加到同步队列
      this.addToSyncQueue('project', 'delete', { id: projectId });
      
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * 获取所有项目
   */
  async getAllProjects(useCache = true): Promise<any[]> {
    const cacheKey = 'projects:all';
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const projects = await projectService.getProjects();
      
      if (useCache) {
        this.setCache(cacheKey, projects, 120); // 2分钟缓存
      }
      
      return projects;
    } catch (error) {
      console.error('Failed to get all projects:', error);
      throw error;
    }
  }

  /**
   * 搜索数据
   */
  async searchData(query: string, types: string[] = ['project', 'chapter', 'character']): Promise<any[]> {
    try {
      const results: any[] = [];

      if (types.includes('project')) {
        const projects = await projectService.searchProjects(query);
        results.push(...projects.map(p => ({ type: 'project', data: p })));
      }

      // TODO: 实现章节和角色搜索
      
      return results;
    } catch (error) {
      console.error('Failed to search data:', error);
      throw error;
    }
  }

  /**
   * 数据同步
   */
  async syncData(options: SyncOptions = {}): Promise<DataSyncStatus> {
    if (this.syncInProgress) {
      throw new Error('同步操作正在进行中');
    }

    this.syncInProgress = true;

    try {
      const syncStatus: DataSyncStatus = {
        lastSyncTime: new Date().toISOString(),
        syncInProgress: true,
        conflictsDetected: 0,
        syncDirection: options.direction || 'bidirectional',
        pendingChanges: this.syncQueue.length
      };

      // 检查用户认证
      if (!unifiedAuthService.isAuthenticated()) {
        throw new Error('用户未认证');
      }

      // 执行同步操作
      await this.performSync(options);
      
      syncStatus.syncInProgress = false;
      syncStatus.conflictsDetected = this.conflictQueue.length;
      
      return syncStatus;
    } catch (error) {
      console.error('Data sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 解决数据冲突
   */
  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflict = this.conflictQueue.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error('未找到冲突');
    }

    try {
      let resolvedData: any;

      switch (resolution) {
        case 'local':
          resolvedData = conflict.localVersion;
          break;
        case 'remote':
          resolvedData = conflict.remoteVersion;
          break;
        case 'merge':
          resolvedData = this.mergeConflictData(conflict.localVersion, conflict.remoteVersion);
          break;
      }

      // 应用解决方案
      await this.applyConflictResolution(conflict, resolvedData);
      
      // 从冲突队列移除
      this.conflictQueue = this.conflictQueue.filter(c => c.id !== conflictId);
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }

  /**
   * 创建数据备份
   */
  async createBackup(type: 'auto' | 'manual' = 'manual'): Promise<DataBackup> {
    try {
      const timestamp = new Date().toISOString();
      const backupId = `backup_${Date.now()}`;
      
      // 收集所有数据
      const allData = await this.collectAllData();
      
      // 创建备份项目列表
      const items: BackupItem[] = allData.map(item => ({
        type: item.type,
        id: item.id,
        size: JSON.stringify(item.data).length,
        checksum: this.calculateChecksum(JSON.stringify(item.data))
      }));

      const backup: DataBackup = {
        id: backupId,
        timestamp,
        type,
        size: items.reduce((sum, item) => sum + item.size, 0),
        compressed: false,
        encrypted: false,
        items
      };

      // 保存备份
      await this.saveBackup(backup, allData);
      
      return backup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * 恢复数据备份
   */
  async restoreBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.loadBackup(backupId);
      if (!backup) {
        throw new Error('未找到备份');
      }

      // 恢复数据
      await this.restoreBackupData(backup);
      
      // 清除缓存
      this.clearCache();
      
      console.log(`Backup ${backupId} restored successfully`);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * 获取数据统计
   */
  async getDataStats(): Promise<DataStats> {
    try {
      const projects = await this.getAllProjects(false);
      const totalProjects = projects.length;
      
      let totalChapters = 0;
      let totalCharacters = 0;
      let totalWords = 0;

      projects.forEach(project => {
        totalChapters += project.chapters?.length || 0;
        totalCharacters += project.characters?.length || 0;
        totalWords += project.currentWords || 0;
      });

      // 获取存储信息 - 暂时返回模拟数据
      const storageInfo = {
        name: 'unified_storage',
        totalSize: 0,
        usedSize: 0,
        availableSize: Number.MAX_SAFE_INTEGER
      };
      const storageUsed = storageInfo.usedSize || 0;

      const cacheHitRate = this.calculateCacheHitRate();

      return {
        totalProjects,
        totalChapters,
        totalCharacters,
        totalWords,
        storageUsed,
        cacheHitRate
      };
    } catch (error) {
      console.error('Failed to get data stats:', error);
      throw error;
    }
  }

  /**
   * 清理数据
   */
  async cleanupData(options: { 
    removeOldBackups?: boolean;
    clearCache?: boolean;
    compactDatabase?: boolean;
  } = {}): Promise<void> {
    try {
      if (options.clearCache) {
        this.clearCache();
      }

      if (options.removeOldBackups) {
        await this.removeOldBackups();
      }

      if (options.compactDatabase) {
        // TODO: 实现数据库压缩
      }

      console.log('Data cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup data:', error);
      throw error;
    }
  }

  /**
   * 导出数据
   */
  async exportData(format: 'json' | 'csv' | 'xml' = 'json'): Promise<string> {
    try {
      const allData = await this.collectAllData();
      
      switch (format) {
        case 'json':
          return JSON.stringify(allData, null, 2);
        case 'csv':
          return this.convertToCSV(allData);
        case 'xml':
          return this.convertToXML(allData);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * 导入数据
   */
  async importData(data: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<void> {
    try {
      let parsedData: any[];

      switch (format) {
        case 'json':
          parsedData = JSON.parse(data);
          break;
        case 'csv':
          parsedData = this.parseCSV(data);
          break;
        case 'xml':
          parsedData = this.parseXML(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // 验证和导入数据
      await this.importDataItems(parsedData);
      
      // 清除缓存以确保数据一致性
      this.clearCache();
      
      console.log('Data import completed');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  // 私有方法

  private async initializeService(): Promise<void> {
    // 服务初始化逻辑
  }

  private configureCaching(): void {
    // const config = systemConfig.getSection('performance').caching;
    // 配置缓存策略
  }

  private async checkDataMigration(): Promise<void> {
    // 检查是否需要数据迁移
  }

  private startAutoSync(): void {
    const config = systemConfig.getSection('storage').cloud;
    if (config.enabled) {
      setInterval(() => {
        this.syncData({ direction: 'bidirectional' }).catch(console.error);
      }, config.syncInterval * 60 * 1000);
    }
  }

  private startAutoBackup(): void {
    const config = systemConfig.getSection('storage').backup;
    if (config.enabled) {
      const intervals: { [key: string]: number } = {
        realtime: 5 * 60 * 1000,  // 5分钟
        hourly: 60 * 60 * 1000,   // 1小时
        daily: 24 * 60 * 60 * 1000, // 1天
        weekly: 7 * 24 * 60 * 60 * 1000 // 1周
      };

      const interval = intervals[config.frequency] || intervals.daily;
      
      setInterval(() => {
        this.createBackup('auto').catch(console.error);
      }, interval);
    }
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  private clearCache(): void {
    this.cache.clear();
  }

  private addToSyncQueue(type: string, operation: string, data: any): void {
    this.syncQueue.push({ type, operation, data });
  }

  private async performSync(options: SyncOptions): Promise<void> {
    // TODO: 实现实际的同步逻辑
    console.log('Performing sync with options:', options);
  }

  private mergeConflictData(local: any, remote: any): any {
    // 简单的合并策略，实际项目中需要更复杂的逻辑
    return {
      ...local,
      ...remote,
      mergedAt: new Date().toISOString()
    };
  }

  private async applyConflictResolution(conflict: DataConflict, resolvedData: any): Promise<void> {
    // 应用冲突解决方案
    switch (conflict.type) {
      case 'project':
        await this.saveProject(resolvedData);
        break;
      // 其他类型...
    }
  }

  private async collectAllData(): Promise<any[]> {
    const data: any[] = [];
    
    // 收集项目数据
    const projects = await this.getAllProjects(false);
    projects.forEach(project => {
      data.push({ type: 'project', id: project.id, data: project });
    });

    return data;
  }

  private calculateChecksum(data: string): string {
    // 简单的校验和计算
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转为32位整数
    }
    return hash.toString(16);
  }

  private async saveBackup(_backup: DataBackup, _data: any[]): Promise<void> {
    // 保存备份数据 - 预留功能
    // const backupData = {
    //   backup,
    //   data
    // };
    
    // localStorage.setItem(`backup:${backup.id}`, JSON.stringify(backupData));
  }

  private async loadBackup(backupId: string): Promise<any> {
    // const backupData = localStorage.getItem(`backup:${backupId}`);
    const backupDataString = localStorage.getItem(`backup:${backupId}`);
    return backupDataString ? JSON.parse(backupDataString) : null;
  }

  private async restoreBackupData(backupData: any): Promise<void> {
    // 恢复备份数据
    for (const item of backupData.data) {
      switch (item.type) {
        case 'project':
          await projectService.createProject(item.data);
          break;
        // 其他类型...
      }
    }
  }

  private calculateCacheHitRate(): number {
    // 简化的缓存命中率计算
    return 85; // 假设85%的命中率
  }

  private async removeOldBackups(): Promise<void> {
    // const config = systemConfig.getSection('storage').backup;
    // const cutoffDate = new Date(Date.now() - config.retention * 24 * 60 * 60 * 1000);
    
    // 移除过期备份
    /*
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('backup:')) {
        try {
          const backupData = JSON.parse(localStorage.getItem(key) || '');
          const backupDate = new Date(backupData.backup.timestamp);
          
          if (backupDate < cutoffDate) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error processing backup:', error);
        }
      }
    }
    */
  }

  private convertToCSV(_data: any[]): string {
    // TODO: 实现CSV转换
    return '';
  }

  private convertToXML(_data: any[]): string {
    // TODO: 实现XML转换
    return '';
  }

  private parseCSV(_data: string): any[] {
    // TODO: 实现CSV解析
    return [];
  }

  private parseXML(_data: string): any[] {
    // TODO: 实现XML解析
    return [];
  }

  private async importDataItems(data: any[]): Promise<void> {
    for (const item of data) {
      switch (item.type) {
        case 'project':
          await projectService.createProject(item.data);
          break;
        // 其他类型...
      }
    }
  }
}

// 创建单例实例
export const unifiedDataService = UnifiedDataService.getInstance();
