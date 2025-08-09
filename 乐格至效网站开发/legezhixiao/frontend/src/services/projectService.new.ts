/**
 * 项目服务 - 新版本
 * 管理小说项目的CRUD操作和业务逻辑
 * 使用后端API替代本地存储
 */

import { api } from './api';

export interface NovelProject {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  status: 'planning' | 'writing' | 'editing' | 'completed' | 'published';
  targetWords: number;
  currentWords: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  
  // 内容数据
  chapters: Chapter[];
  characters: Character[];
  worldBuilding: WorldBuilding;
  outline: ProjectOutline;
  themes: string[];
  tags: string[];
  
  // 设置
  settings: ProjectSettings;
  
  // 统计数据
  stats?: ProjectStats;
}

export interface Chapter {
  id: string;
  projectId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'review' | 'completed';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  aiSuggestions?: AISuggestion[];
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: 'main' | 'supporting' | 'minor';
  importance: 'high' | 'medium' | 'low';
  description: string;
  personality: string[];
  background: string;
  goals: string[];
  relationships: { [characterId: string]: string };
  developmentArc: DevelopmentPoint[];
  appearance?: string;
  voice?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DevelopmentPoint {
  chapterId: string;
  description: string;
  type: 'growth' | 'conflict' | 'revelation' | 'change';
}

export interface WorldBuilding {
  setting: string;
  timeframe: string;
  locations: Location[];
  cultures: Culture[];
  timeline: TimelineEvent[];
  rules: WorldRule[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  type: 'city' | 'building' | 'natural' | 'other';
  significance: string;
}

export interface Culture {
  id: string;
  name: string;
  description: string;
  customs: string[];
  language?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'historical' | 'personal' | 'fictional';
}

export interface WorldRule {
  id: string;
  category: string;
  title: string;
  description: string;
  scope: 'global' | 'local';
}

export interface ProjectOutline {
  structure: OutlineNode[];
  plotPoints: PlotPoint[];
  themes: ThemeElement[];
}

export interface OutlineNode {
  id: string;
  type: 'act' | 'chapter' | 'scene';
  title: string;
  description: string;
  order: number;
  parentId?: string;
  children?: OutlineNode[];
}

export interface PlotPoint {
  id: string;
  type: 'hook' | 'inciting_incident' | 'plot_point_1' | 'midpoint' | 'plot_point_2' | 'climax' | 'resolution';
  title: string;
  description: string;
  chapterId?: string;
  order: number;
}

export interface ThemeElement {
  id: string;
  theme: string;
  description: string;
  manifestations: string[];
}

export interface ProjectSettings {
  wordCountGoal: number;
  dailyWordGoal: number;
  autoSave: boolean;
  autoSaveInterval: number;
  writingMode: 'normal' | 'focus' | 'distraction_free';
  spellCheck: boolean;
  grammarCheck: boolean;
  aiSuggestions: boolean;
  constraintLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface ProjectStats {
  totalWords: number;
  chaptersCompleted: number;
  averageWordsPerChapter: number;
  writingStreak: number;
  lastWritingDate: string;
  dailyStats: DailyStats[];
  progressPercentage: number;
}

export interface DailyStats {
  date: string;
  wordsWritten: number;
  timeSpent: number; // 分钟
  chaptersWorked: string[];
}

export interface AISuggestion {
  id: string;
  type: 'grammar' | 'style' | 'plot' | 'character' | 'dialogue' | 'description';
  content: string;
  suggestion: string;
  confidence: number;
  position: { start: number; end: number };
  appliedAt?: string;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  genre?: string;
  targetWords?: number;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  genre?: string;
  status?: NovelProject['status'];
  targetWords?: number;
  themes?: string[];
  tags?: string[];
  settings?: Partial<ProjectSettings>;
}

class ProjectService {
  private readonly API_BASE_URL = '/project';

  // 获取所有项目
  async getProjects(): Promise<NovelProject[]> {
    try {
      const response = await api.get(`${this.API_BASE_URL}`);
      return response.data.map(this.processProjectData);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      throw error;
    }
  }

  // 获取单个项目
  async getProject(projectId: string): Promise<NovelProject | null> {
    try {
      const response = await api.get(`${this.API_BASE_URL}/${projectId}`);
      return this.processProjectData(response.data);
    } catch (error) {
      console.error('获取项目失败:', error);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // 创建项目
  async createProject(projectData: CreateProjectData): Promise<NovelProject> {
    try {
      const response = await api.post(`${this.API_BASE_URL}`, {
        ...projectData,
        status: 'planning',
        currentWords: 0,
        chapters: [],
        characters: [],
        worldBuilding: {
          setting: '',
          timeframe: '',
          locations: [],
          cultures: [],
          timeline: [],
          rules: []
        },
        outline: {
          structure: [],
          plotPoints: [],
          themes: []
        },
        themes: projectData.title ? [projectData.title] : [],
        tags: [],
        settings: {
          wordCountGoal: projectData.targetWords || 50000,
          dailyWordGoal: 2000,
          autoSave: true,
          autoSaveInterval: 30,
          writingMode: 'normal',
          spellCheck: true,
          grammarCheck: true,
          aiSuggestions: true,
          constraintLevel: 'medium',
          ...projectData.settings
        }
      });
      
      return this.processProjectData(response.data);
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }

  // 更新项目
  async updateProject(projectId: string, updates: UpdateProjectData): Promise<NovelProject> {
    try {
      const response = await api.put(`${this.API_BASE_URL}/${projectId}`, updates);
      return this.processProjectData(response.data);
    } catch (error) {
      console.error('更新项目失败:', error);
      throw error;
    }
  }

  // 删除项目
  async deleteProject(projectId: string): Promise<void> {
    try {
      await api.delete(`${this.API_BASE_URL}/${projectId}`);
    } catch (error) {
      console.error('删除项目失败:', error);
      throw error;
    }
  }

  // 更新项目的最后打开时间
  async updateLastOpened(projectId: string): Promise<void> {
    try {
      await this.updateProject(projectId, {
        // 后端会自动更新updatedAt，这里可以发送一个标记
      });
    } catch (error) {
      console.error('更新最后打开时间失败:', error);
      // 不抛出错误，因为这不是关键操作
    }
  }

  // 搜索项目
  async searchProjects(query: string): Promise<NovelProject[]> {
    try {
      const allProjects = await this.getProjects();
      
      if (!query.trim()) {
        return allProjects;
      }
      
      const searchTerm = query.toLowerCase();
      return allProjects.filter(project => 
        project.title.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.genre.toLowerCase().includes(searchTerm) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        project.themes.some(theme => theme.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('搜索项目失败:', error);
      throw error;
    }
  }

  // 获取项目统计
  async getProjectStats(projectId: string): Promise<ProjectStats | null> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        return null;
      }

      // 计算统计数据
      const totalWords = project.currentWords;
      const chaptersCompleted = project.chapters.filter(ch => ch.status === 'completed').length;
      const averageWordsPerChapter = project.chapters.length > 0 
        ? Math.round(totalWords / project.chapters.length) 
        : 0;
      const progressPercentage = project.targetWords > 0 
        ? Math.round((totalWords / project.targetWords) * 100)
        : 0;

      return {
        totalWords,
        chaptersCompleted,
        averageWordsPerChapter,
        writingStreak: 0, // 需要后端计算
        lastWritingDate: project.updatedAt,
        dailyStats: [], // 需要后端提供
        progressPercentage
      };
    } catch (error) {
      console.error('获取项目统计失败:', error);
      return null;
    }
  }

  // 处理项目数据，确保类型正确
  private processProjectData(data: any): NovelProject {
    return {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      chapters: data.chapters || [],
      characters: data.characters || [],
      worldBuilding: data.worldBuilding || {
        setting: '',
        timeframe: '',
        locations: [],
        cultures: [],
        timeline: [],
        rules: []
      },
      outline: data.outline || {
        structure: [],
        plotPoints: [],
        themes: []
      },
      themes: data.themes || [],
      tags: data.tags || [],
      settings: {
        wordCountGoal: 50000,
        dailyWordGoal: 2000,
        autoSave: true,
        autoSaveInterval: 30,
        writingMode: 'normal',
        spellCheck: true,
        grammarCheck: true,
        aiSuggestions: true,
        constraintLevel: 'medium',
        ...data.settings
      }
    };
  }

  // 导出项目数据
  async exportProject(projectId: string, format: 'json' | 'docx' | 'txt' = 'json'): Promise<Blob> {
    try {
      // 这里应该调用后端的导出API
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('项目不存在');
      }

      if (format === 'json') {
        const projectJson = JSON.stringify(project, null, 2);
        return new Blob([projectJson], { type: 'application/json' });
      } else {
        // 其他格式需要后端支持
        throw new Error(`暂不支持 ${format} 格式导出`);
      }
    } catch (error) {
      console.error('导出项目失败:', error);
      throw error;
    }
  }

  // 复制项目
  async duplicateProject(projectId: string, newTitle?: string): Promise<NovelProject> {
    try {
      const originalProject = await this.getProject(projectId);
      if (!originalProject) {
        throw new Error('源项目不存在');
      }

      const duplicateData: CreateProjectData = {
        title: newTitle || `${originalProject.title} (副本)`,
        description: originalProject.description,
        genre: originalProject.genre,
        targetWords: originalProject.targetWords,
        settings: originalProject.settings
      };

      return await this.createProject(duplicateData);
    } catch (error) {
      console.error('复制项目失败:', error);
      throw error;
    }
  }
}

export const projectService = new ProjectService();
export default projectService;
