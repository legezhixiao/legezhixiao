/**
 * 真实会话管理服务
 * 基于真实认证服务和数据库服务管理用户会话
 */

import { authService, databaseService } from './ServiceFactory';

export interface SessionSummary {
  projectId: string;
  projectTitle: string;
  messageCount: number;
  lastActivity: string;
  createdAt: string;
  lastMessage?: string;
  lastUpdated: string;
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  email?: string;
  role: 'user' | 'admin' | 'premium';
  preferences: UserPreferences;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  fontSize: number;
  fontFamily: string;
  editorSettings: EditorSettings;
  aiSettings: AISettings;
  notificationSettings: NotificationSettings;
}

export interface EditorSettings {
  showLineNumbers: boolean;
  wordWrap: boolean;
  autoSave: boolean;
  autoComplete: boolean;
  spellCheck: boolean;
  grammarCheck: boolean;
  focusMode: boolean;
  typewriterMode: boolean;
}

export interface AISettings {
  enabled: boolean;
  autoSuggestions: boolean;
  model: string;
  creativity: number;
  responseLength: 'short' | 'medium' | 'long';
}

export interface NotificationSettings {
  enabled: boolean;
  saveReminders: boolean;
  goalReminders: boolean;
  email: boolean;
  push: boolean;
}

export interface WritingSession {
  id: string;
  userId: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  wordCount: number;
  goalWordCount?: number;
  notes?: string;
  mood?: string;
  productivity?: number;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * 真实会话管理器
 */
class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private sessionListeners: Set<(session: UserSession | null) => void> = new Set();

  private constructor() {
    this.loadStoredSession();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * 用户登录
   */
  public async login(credentials: { username: string; password: string; email?: string }): Promise<UserSession> {
    try {
      console.log('🔐 正在登录用户:', credentials.username);
      
      // 使用真实认证服务登录
      const authResult = await authService.login(credentials);
      
      // 创建会话
      const session: UserSession = {
        id: 'session_' + Date.now(),
        userId: authResult.id,
        username: authResult.username,
        email: authResult.email,
        role: authResult.role || 'user',
        preferences: this.getDefaultPreferences(),
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后过期
      };

      this.currentSession = session;
      this.storeSession(session);
      this.notifySessionChange();
      
      console.log('✅ 用户登录成功');
      return session;
    } catch (error) {
      console.error('❌ 登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  public async logout(): Promise<void> {
    try {
      console.log('🔐 正在登出用户');
      
      if (this.currentSession) {
        await authService.logout();
        this.currentSession = null;
        this.clearStoredSession();
        this.notifySessionChange();
      }
      
      console.log('✅ 用户登出成功');
    } catch (error) {
      console.error('❌ 登出失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前会话
   */
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * 检查会话是否有效
   */
  public isSessionValid(): boolean {
    if (!this.currentSession) {
      return false;
    }
    return new Date() < new Date(this.currentSession.expiresAt);
  }

  /**
   * 刷新会话
   */
  public async refreshSession(): Promise<UserSession> {
    if (!this.currentSession) {
      throw new Error('没有活动会话');
    }

    try {
      // 刷新token
      await authService.refreshToken();
      
      // 更新会话时间
      const refreshedSession: UserSession = {
        ...this.currentSession,
        lastActiveAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      this.currentSession = refreshedSession;
      this.storeSession(refreshedSession);
      this.notifySessionChange();
      
      return refreshedSession;
    } catch (error) {
      console.error('刷新会话失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户偏好设置
   */
  public async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentSession) {
      throw new Error('没有活动会话');
    }

    try {
      const updatedPreferences = { ...this.currentSession.preferences, ...preferences };
      
      // 使用真实服务更新偏好设置
      await authService.updatePreferences(updatedPreferences);
      
      this.currentSession.preferences = updatedPreferences;
      this.storeSession(this.currentSession);
      this.notifySessionChange();
    } catch (error) {
      console.error('更新偏好设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目消息
   */
  public async getProjectMessages(projectId: string): Promise<ProjectMessage[]> {
    try {
      // 从本地存储获取消息
      const messages = JSON.parse(localStorage.getItem(`messages_${projectId}`) || '[]');
      return messages;
    } catch (error) {
      console.error('获取项目消息失败:', error);
      return [];
    }
  }

  /**
   * 获取会话摘要
   */
  public async getSessionSummaries(): Promise<SessionSummary[]> {
    try {
      if (!this.currentSession) {
        return [];
      }

      // 获取用户项目
      const projects = await databaseService.getUserProjects(this.currentSession.userId);
      
      const summaries: SessionSummary[] = [];
      
      for (const project of projects) {
        const messages = await this.getProjectMessages(project.id);
        const lastMessage = messages[messages.length - 1];
        
        summaries.push({
          projectId: project.id,
          projectTitle: project.title,
          messageCount: messages.length,
          lastActivity: lastMessage?.timestamp || project.updatedAt,
          createdAt: project.createdAt,
          lastMessage: lastMessage?.content,
          lastUpdated: project.updatedAt
        });
      }
      
      return summaries.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    } catch (error) {
      console.error('获取会话摘要失败:', error);
      return [];
    }
  }

  /**
   * 监听会话变化
   */
  public onSessionChange(listener: (session: UserSession | null) => void): () => void {
    this.sessionListeners.add(listener);
    return () => {
      this.sessionListeners.delete(listener);
    };
  }

  /**
   * 搜索消息
   */
  public async searchMessages(query: string): Promise<ProjectMessage[]> {
    try {
      if (!this.currentSession) {
        return [];
      }

      const allMessages: ProjectMessage[] = [];
      
      // 获取用户的所有项目
      const projects = await databaseService.getUserProjects(this.currentSession.userId);
      
      // 搜索每个项目的消息
      for (const project of projects) {
        const messages = await this.getProjectMessages(project.id);
        const matchingMessages = messages.filter(msg => 
          msg.content.toLowerCase().includes(query.toLowerCase()) ||
          (msg.metadata?.title && msg.metadata.title.toLowerCase().includes(query.toLowerCase()))
        );
        allMessages.push(...matchingMessages);
      }
      
      // 按时间戳排序
      return allMessages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('搜索消息失败:', error);
      return [];
    }
  }

  /**
   * 删除项目会话
   */
  public async deleteProjectSession(projectId: string): Promise<void> {
    try {
      console.log('🗑️ 删除项目会话:', projectId);
      
      // 删除本地存储的消息
      localStorage.removeItem(`messages_${projectId}`);
      
      // 如果有数据库服务，也删除数据库中的消息
      // await databaseService.deleteProjectMessages(projectId);
      
      console.log('✅ 项目会话删除成功');
    } catch (error) {
      console.error('❌ 删除项目会话失败:', error);
      throw error;
    }
  }

  /**
   * 保存项目消息
   */
  public async saveProjectMessage(projectId: string, message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'user' | 'ai';
  }, projectTitle?: string): Promise<void> {
    try {
      console.log('💾 保存项目消息:', projectId, message.role);
      
      // 获取现有消息
      const existingMessages = await this.getProjectMessages(projectId);
      
      // 转换为ProjectMessage格式
      const projectMessage: ProjectMessage = {
        id: message.id,
        projectId,
        userId: this.currentSession?.userId || 'anonymous',
        type: message.role === 'user' ? 'user' : 'ai',
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        metadata: {
          createdAt: message.timestamp.toISOString(),
          updatedAt: message.timestamp.toISOString()
        }
      };
      
      // 添加新消息
      const updatedMessages = [...existingMessages, projectMessage];
      
      // 保存到本地存储
      localStorage.setItem(`messages_${projectId}`, JSON.stringify(updatedMessages));
      
      // 更新会话摘要
      const sessionSummary: SessionSummary = {
        projectId,
        projectTitle: projectTitle || `项目 ${projectId}`,
        messageCount: updatedMessages.length,
        lastActivity: new Date().toISOString(),
        createdAt: existingMessages.length === 0 ? new Date().toISOString() : 
                   JSON.parse(localStorage.getItem(`sessions_${projectId}`) || '{}').createdAt || new Date().toISOString(),
        lastMessage: message.content.substring(0, 100),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`sessions_${projectId}`, JSON.stringify(sessionSummary));
      
      console.log('✅ 项目消息保存成功');
    } catch (error) {
      console.error('❌ 保存项目消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目统计信息
   */
  public async getProjectStats(projectId: string): Promise<{
    totalMessages: number;
    totalWords: number;
    lastActivity: string;
    messageTypes: Record<string, number>;
  }> {
    try {
      const messages = await this.getProjectMessages(projectId);
      
      const stats = {
        totalMessages: messages.length,
        totalWords: messages.reduce((total, msg) => total + msg.content.split(' ').length, 0),
        lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : new Date().toISOString(),
        messageTypes: messages.reduce((types, msg) => {
          types[msg.type] = (types[msg.type] || 0) + 1;
          return types;
        }, {} as Record<string, number>)
      };
      
      return stats;
    } catch (error) {
      console.error('获取项目统计失败:', error);
      return {
        totalMessages: 0,
        totalWords: 0,
        lastActivity: new Date().toISOString(),
        messageTypes: {}
      };
    }
  }

  // 私有方法

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'light',
      language: 'zh-CN',
      fontSize: 14,
      fontFamily: 'system-ui',
      editorSettings: {
        showLineNumbers: true,
        wordWrap: true,
        autoSave: true,
        autoComplete: true,
        spellCheck: true,
        grammarCheck: false,
        focusMode: false,
        typewriterMode: false
      },
      aiSettings: {
        enabled: true,
        autoSuggestions: true,
        model: 'gpt-3.5-turbo',
        creativity: 0.7,
        responseLength: 'medium'
      },
      notificationSettings: {
        enabled: true,
        saveReminders: true,
        goalReminders: true,
        email: false,
        push: false
      }
    };
  }

  private storeSession(session: UserSession): void {
    try {
      localStorage.setItem('userSession', JSON.stringify(session));
    } catch (error) {
      console.error('存储会话失败:', error);
    }
  }

  private loadStoredSession(): void {
    try {
      const storedSession = localStorage.getItem('userSession');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (new Date() < new Date(session.expiresAt)) {
          this.currentSession = session;
        } else {
          this.clearStoredSession();
        }
      }
    } catch (error) {
      console.error('加载存储的会话失败:', error);
      this.clearStoredSession();
    }
  }

  private clearStoredSession(): void {
    try {
      localStorage.removeItem('userSession');
    } catch (error) {
      console.error('清除存储的会话失败:', error);
    }
  }

  private notifySessionChange(): void {
    this.sessionListeners.forEach(listener => {
      try {
        listener(this.currentSession);
      } catch (error) {
        console.error('会话监听器错误:', error);
      }
    });
  }
}

// 导出单例实例
export const sessionManager = SessionManager.getInstance();
