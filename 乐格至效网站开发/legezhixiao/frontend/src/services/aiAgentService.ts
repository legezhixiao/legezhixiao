/**
 * 真实AI代理服务
 * 基于真实AI服务提供智能写作辅助功能
 */

import { aiService } from './ServiceFactory';
import { Character } from '../types';

export interface AIAgentExecutedAction {
  id: string;
  type: string;
  actionType: string; // 为兼容性添加actionType字段
  timestamp: Date;
  result: any;
  success?: boolean;
}

export interface AIAgentProcess {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  steps: AIAgentStep[];
}

export interface AIAgentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

export interface AIAgentResponse {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
  context?: AIAgentContext; // 为兼容性添加
  actions?: AIAgentExecutedAction[]; // 为兼容性添加
}

export interface ProjectAnalysis {
  projectId: string;
  totalChapters: number;
  totalWords: number;
  avgWordsPerChapter: number;
  themes: string[];
  characters: string[];
  plotPoints: string[];
  suggestions: string[];
  completionRate: number;
  lastAnalyzed: string;
  summary: string;
}

export interface AIAgentContext {
  projectId?: string;
  chapterId?: string;
  currentText?: string;
  characters?: Character[];
  plotContext?: string;
  userPreferences?: any;
  sessionId?: string;
  lastAction?: string;
  actionHistory?: AIAgentExecutedAction[];
  metadata?: any;
  // 为useAIAgent兼容性添加的字段
  currentProject?: any;
  currentChapter?: any;
  currentCharacters?: Character[];
  userInput?: string;
  conversationHistory?: any[];
}

/**
 * 真实AI代理服务类
 */
class AIAgentService {
  private static instance: AIAgentService;
  private eventListeners: Map<string, Function[]> = new Map();
  private context: AIAgentContext = {};

  private constructor() {}

  public static getInstance(): AIAgentService {
    if (!AIAgentService.instance) {
      AIAgentService.instance = new AIAgentService();
    }
    return AIAgentService.instance;
  }

  /**
   * 获取当前上下文
   */
  public getContext(): AIAgentContext {
    return { ...this.context };
  }

  /**
   * 更新上下文
   */
  public updateContext(updates: Partial<AIAgentContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * 清空上下文
   */
  public clearContext(): void {
    this.context = {};
  }

  /**
   * 获取可用操作列表
   */
  public getAvailableActions(): string[] {
    return [
      'generate_content',
      'generate_outline', 
      'analyze_character',
      'generate_dialogue',
      'improve_text',
      'get_suggestions',
      'analyze_project'
    ];
  }

  /**
   * 执行特定操作
   */
  public async executeAction(actionType: string, params: any): Promise<any> {
    console.log(`🎯 执行操作: ${actionType}`, params);
    
    try {
      let result;
      
      switch (actionType) {
        case 'generate_content':
          result = await this.generateContent(params.prompt, params.options);
          break;
        case 'generate_outline':
          result = await this.generateOutline(params.prompt, params.options);
          break;
        case 'analyze_character':
          result = await this.analyzeCharacter(params.character);
          break;
        case 'generate_dialogue':
          result = await this.generateDialogue(params.context);
          break;
        case 'improve_text':
          result = await this.improveText(params.text, params.options);
          break;
        case 'get_suggestions':
          const suggestions = await this.getWritingSuggestions(params.context);
          result = { success: true, data: { suggestions } };
          break;
        case 'analyze_project':
          const analysis = await this.analyzeProject(params.projectId);
          result = { success: true, data: { analysis } };
          break;
        default:
          throw new Error(`未知的操作类型: ${actionType}`);
      }

      // 记录执行的操作
      const executedAction: AIAgentExecutedAction = {
        id: Date.now().toString(),
        type: actionType,
        actionType: actionType, // 为兼容性添加
        timestamp: new Date(),
        result,
        success: result.success !== false
      };

      // 更新上下文中的操作历史
      this.updateContext({
        lastAction: actionType,
        actionHistory: [...(this.context.actionHistory || []), executedAction]
      });

      this.emit('actionExecuted', executedAction);
      
      return result;
    } catch (error) {
      console.error(`执行操作失败: ${actionType}`, error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const failedAction: AIAgentExecutedAction = {
        id: Date.now().toString(),
        type: actionType,
        actionType: actionType, // 为兼容性添加
        timestamp: new Date(),
        result: { success: false, message: errorMessage },
        success: false
      };
      
      this.emit('actionExecuted', failedAction);
      throw error;
    }
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * 生成文本内容
   */
  public async generateContent(prompt: string, options?: any): Promise<AIAgentResponse> {
    try {
      console.log('🤖 生成内容:', prompt.substring(0, 50) + '...');
      
      const content = await aiService.generateText(prompt, options);
      
      return {
        success: true,
        message: '内容生成成功',
        data: { content },
        suggestions: ['可以进一步完善细节', '考虑添加更多描述']
      };
    } catch (error) {
      console.error('生成内容失败:', error);
      return {
        success: false,
        message: '生成内容失败',
        data: null
      };
    }
  }

  /**
   * 生成大纲
   */
  public async generateOutline(prompt: string, options?: any): Promise<AIAgentResponse> {
    try {
      console.log('📝 生成大纲:', prompt.substring(0, 50) + '...');
      
      const outline = await aiService.generateOutline(prompt, options);
      
      return {
        success: true,
        message: '大纲生成成功',
        data: { outline },
        suggestions: ['可以进一步细化章节', '考虑添加更多情节点']
      };
    } catch (error) {
      console.error('生成大纲失败:', error);
      return {
        success: false,
        message: '生成大纲失败',
        data: null
      };
    }
  }

  /**
   * 角色分析
   */
  public async analyzeCharacter(character: Character): Promise<AIAgentResponse> {
    try {
      console.log('👤 分析角色:', character.name);
      
      const analysis = await aiService.analyzeCharacter(character);
      
      return {
        success: true,
        message: '角色分析完成',
        data: { analysis },
        suggestions: ['可以完善角色背景', '考虑添加更多特征']
      };
    } catch (error) {
      console.error('角色分析失败:', error);
      return {
        success: false,
        message: '角色分析失败',
        data: null
      };
    }
  }

  /**
   * 生成对话
   */
  public async generateDialogue(context: any): Promise<AIAgentResponse> {
    try {
      console.log('💬 生成对话');
      
      const dialogue = await aiService.generateDialogue(context);
      
      return {
        success: true,
        message: '对话生成成功',
        data: { dialogue },
        suggestions: ['可以调整语调', '考虑角色性格一致性']
      };
    } catch (error) {
      console.error('生成对话失败:', error);
      return {
        success: false,
        message: '生成对话失败',
        data: null
      };
    }
  }

  /**
   * 改进文本
   */
  public async improveText(text: string, options?: any): Promise<AIAgentResponse> {
    try {
      console.log('✨ 改进文本:', text.substring(0, 50) + '...');
      
      const improvedText = await aiService.improveText(text, options);
      
      return {
        success: true,
        message: '文本改进完成',
        data: { improvedText },
        suggestions: ['原文已优化', '建议审查改进内容']
      };
    } catch (error) {
      console.error('改进文本失败:', error);
      return {
        success: false,
        message: '改进文本失败',
        data: null
      };
    }
  }

  /**
   * 分析项目（简化版本，不依赖复杂的数据库查询）
   */
  public async analyzeProject(projectId: string): Promise<ProjectAnalysis> {
    try {
      console.log('🔍 分析项目:', projectId);
      
      // 简化的项目分析，返回基本信息
      const analysis: ProjectAnalysis = {
        projectId,
        totalChapters: 0,
        totalWords: 0,
        avgWordsPerChapter: 0,
        themes: [],
        characters: [],
        plotPoints: [],
        suggestions: ['建议完善项目内容', '可以添加更多章节'],
        completionRate: 0,
        lastAnalyzed: new Date().toISOString(),
        summary: '项目分析功能正在开发中'
      };

      return analysis;
    } catch (error) {
      console.error('项目分析失败:', error);
      throw error;
    }
  }

  /**
   * 处理用户输入
   */
  public async processUserInput(userInput: string, context?: any): Promise<AIAgentResponse> {
    try {
      console.log('🤖 处理用户输入:', userInput.substring(0, 50) + '...');
      
      // 分析用户意图
      const intent = this.analyzeUserIntent(userInput);
      
      let response: AIAgentResponse;
      
      switch (intent) {
        case 'generate_content':
          response = await this.generateContent(userInput, context);
          break;
        case 'generate_outline':
          response = await this.generateOutline(userInput, context);
          break;
        case 'improve_text':
          response = await this.improveText(userInput, context);
          break;
        case 'generate_dialogue':
          response = await this.generateDialogue({ userInput, ...context });
          break;
        default:
          // 通用文本生成
          response = await this.generateContent(userInput, context);
      }
      
      // 触发actionExecuted事件
      this.emit('actionExecuted', {
        type: intent,
        userInput,
        response,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      console.error('处理用户输入失败:', error);
      return {
        success: false,
        message: '处理输入失败',
        data: null
      };
    }
  }

  /**
   * 分析用户意图
   */
  private analyzeUserIntent(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('大纲') || lowerInput.includes('outline')) {
      return 'generate_outline';
    }
    if (lowerInput.includes('对话') || lowerInput.includes('dialogue')) {
      return 'generate_dialogue';
    }
    if (lowerInput.includes('改进') || lowerInput.includes('优化') || lowerInput.includes('improve')) {
      return 'improve_text';
    }
    
    return 'generate_content';
  }

  /**
   * 获取写作建议
   */
  public async getWritingSuggestions(context: string): Promise<string[]> {
    try {
      const prompt = `基于以下写作上下文，提供3-5个具体的写作建议：\n${context}`;
      const suggestions = await aiService.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.7
      });
      
      // 简单解析建议
      return suggestions.split('\n').filter(s => s.trim().length > 0).slice(0, 5);
    } catch (error) {
      console.error('获取写作建议失败:', error);
      return ['继续保持写作节奏', '注意角色发展', '完善场景描述'];
    }
  }
}

// 导出单例实例
export const aiAgentService = AIAgentService.getInstance();
