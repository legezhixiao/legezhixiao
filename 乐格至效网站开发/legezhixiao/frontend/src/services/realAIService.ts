/**
 * 乐格至效 - 真实AI服务实现
 * 
 * 集成SiliconFlow、OpenAI等真实AI服务API
 * 替代Mock AI服务，提供生产级AI功能
 */

import { getAIConfig } from '../config';

// AI服务配置接口
interface AIServiceConfig {
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  timeout: number;
}

// AI请求选项
interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stream?: boolean;
  stopSequences?: string[];
}

// 大纲生成数据结构
interface OutlineChapter {
  id: number;
  title: string;
  summary: string;
  keyEvents: string[];
  estimatedWords?: number;
}

interface OutlineResponse {
  title: string;
  genre: string;
  outline: {
    mainPlot: string;
    subPlots: string[];
    chapters: OutlineChapter[];
  };
  characters: Array<{
    name: string;
    role: string;
    description: string;
  }>;
  themes: string[];
  estimatedLength: number;
}

// 角色分析响应
interface CharacterAnalysisResponse {
  name: string;
  analysis: {
    personality: {
      core: string[];
      positive: string[];
      negative: string[];
      mbti?: string;
    };
    background: {
      origin: string;
      motivation: string;
      fears: string;
      goals: string;
    };
    relationships: {
      family: string;
      friends: string;
      romantic: string;
      enemies: string;
    };
    developmentArc: {
      start: string;
      middle: string;
      end: string;
      keyMoments: string[];
    };
  };
  suggestions: string[];
}

/**
 * 真实AI服务类
 */
class RealAIService {
  private config: AIServiceConfig;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1秒

  constructor() {
    this.config = getAIConfig();
    this.validateConfig();
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.apiKey && this.config.provider !== 'local') {
      console.warn('⚠️ AI API密钥未配置，某些功能可能不可用');
    }
    if (!this.config.apiUrl) {
      throw new Error('AI服务URL未配置');
    }
  }

  /**
   * 发送HTTP请求到AI服务
   */
  private async makeRequest(
    endpoint: string, 
    payload: any, 
    options: { timeout?: number; retries?: number } = {}
  ): Promise<any> {
    const { timeout = this.config.timeout, retries = this.retryAttempts } = options;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 根据不同的AI服务提供商设置认证头
    if (this.config.apiKey) {
      switch (this.config.provider) {
        case 'openai':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        case 'siliconflow':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        case 'deepseek':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        default:
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`AI服务请求失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`AI请求失败 (尝试 ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // 指数退避重试
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * 构建聊天消息格式
   */
  private buildChatMessages(prompt: string, systemPrompt?: string): any[] {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }

  /**
   * 生成文本
   */
  async generateText(prompt: string, options: AIRequestOptions = {}, systemPrompt?: string): Promise<string> {
    try {
      const payload = {
        model: this.config.model,
        messages: this.buildChatMessages(prompt, systemPrompt),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 0.9,
        stream: false,
        stop: options.stopSequences || undefined,
      };

      console.log('🤖 AI文本生成请求:', { prompt: prompt.substring(0, 100) + '...', model: this.config.model });
      
      const response = await this.makeRequest('/chat/completions', payload);
      
      if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message?.content || response.choices[0].text || '';
        
        console.log('✅ AI文本生成成功:', {
          inputLength: prompt.length,
          outputLength: content.length,
          usage: response.usage
        });
        
        return content;
      }
      
      throw new Error('AI服务返回了无效的响应格式');
    } catch (error) {
      console.error('❌ AI文本生成失败:', error);
      throw new Error(`文本生成失败: ${(error as Error).message}`);
    }
  }

  /**
   * 生成小说大纲
   */
  async generateOutline(requirements: any): Promise<OutlineResponse> {
    try {
      const { title, genre, length = 'medium', themes = [] } = requirements;
      
      const systemPrompt = `你是一个专业的小说编剧和创意写作专家。请根据用户提供的要求生成详细的小说大纲。
请以JSON格式返回结果，包含以下结构：
{
  "title": "小说标题",
  "genre": "小说类型",
  "outline": {
    "mainPlot": "主要情节线描述",
    "subPlots": ["副情节线1", "副情节线2"],
    "chapters": [
      {
        "id": 1,
        "title": "章节标题",
        "summary": "章节概要",
        "keyEvents": ["关键事件1", "关键事件2"],
        "estimatedWords": 3000
      }
    ]
  },
  "characters": [
    {
      "name": "角色名",
      "role": "角色定位",
      "description": "角色描述"
    }
  ],
  "themes": ["主题1", "主题2"],
  "estimatedLength": 总字数估计
}`;

      const prompt = `请为以下小说需求生成详细大纲：

标题：${title || '待定'}
类型：${genre || '现代都市'}
长度：${length} (short=3-5万字, medium=10-15万字, long=20万字以上)
主题元素：${themes.join(', ') || '成长, 友谊, 冒险'}

要求：
1. 生成引人入胜的主情节线
2. 设计2-3条副情节线增加故事层次
3. 规划合理的章节结构（${length === 'short' ? '10-15章' : length === 'medium' ? '20-30章' : '30-50章'}）
4. 创造鲜明的主要角色（主角、配角、反派）
5. 确保情节节奏紧凑，冲突设置合理
6. 融入指定的主题元素

请返回完整的JSON格式大纲。`;

      const result = await this.generateText(prompt, { 
        temperature: 0.8, 
        maxTokens: 4000
      }, systemPrompt);
      
      // 尝试解析JSON响应
      let parsedResult: OutlineResponse;
      try {
        // 提取JSON部分（去除可能的markdown格式）
        const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : result;
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.warn('JSON解析失败，使用默认结构:', parseError);
        
        // 如果JSON解析失败，创建基本结构
        parsedResult = {
          title: title || '生成的小说标题',
          genre: genre || '现代都市',
          outline: {
            mainPlot: '基于AI生成的主要情节线',
            subPlots: ['感情线', '成长线'],
            chapters: this.generateDefaultChapters(length)
          },
          characters: [
            { name: '主角', role: '主人公', description: '故事的核心角色' },
            { name: '重要配角', role: '支持角色', description: '协助主角的关键人物' }
          ],
          themes: themes.length > 0 ? themes : ['成长', '友谊'],
          estimatedLength: this.estimateWordCount(length)
        };
        
        // 将AI生成的文本作为补充说明
        parsedResult.outline.mainPlot = result.substring(0, 200) + '...';
      }
      
      console.log('✅ 小说大纲生成成功:', {
        title: parsedResult.title,
        chaptersCount: parsedResult.outline.chapters.length,
        charactersCount: parsedResult.characters.length
      });
      
      return parsedResult;
    } catch (error) {
      console.error('❌ 大纲生成失败:', error);
      throw new Error(`大纲生成失败: ${(error as Error).message}`);
    }
  }

  /**
   * 分析角色
   */
  async analyzeCharacter(characterData: any): Promise<CharacterAnalysisResponse> {
    try {
      const { name, background, personality, age, role } = characterData;
      
      const systemPrompt = `你是一个专业的角色分析师和心理学专家。请对用户提供的角色进行深入分析，并以JSON格式返回详细的分析结果。`;

      const prompt = `请分析以下角色：

角色姓名：${name || '未命名角色'}
年龄：${age || '未指定'}
背景：${background || '普通背景'}
性格特点：${personality || '待分析'}
角色定位：${role || '主要角色'}

请提供详细的角色分析，包括：
1. 性格分析（核心特质、优点、缺点、可能的MBTI类型）
2. 背景分析（出身、动机、恐惧、目标）
3. 关系分析（与家人、朋友、恋人、敌人的关系模式）
4. 成长弧线（起点、发展、终点、关键转折点）
5. 写作建议

请以JSON格式返回完整分析。`;

      const result = await this.generateText(prompt, { 
        temperature: 0.7, 
        maxTokens: 3000 
      }, systemPrompt);
      
      // 尝试解析JSON响应
      let parsedResult: CharacterAnalysisResponse;
      try {
        const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : result;
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.warn('角色分析JSON解析失败，使用默认结构:', parseError);
        
        parsedResult = {
          name: name || '角色分析',
          analysis: {
            personality: {
              core: ['复杂', '多面', '真实'],
              positive: ['勇敢', '善良', '智慧'],
              negative: ['冲动', '固执', '敏感'],
              mbti: 'ENFP - 活动家'
            },
            background: {
              origin: background || '普通家庭出身，有着不平凡的经历',
              motivation: '寻找自我价值和人生意义',
              fears: '失去所珍视的人和事物',
              goals: '成为更好的自己，保护重要的人'
            },
            relationships: {
              family: '与家人关系深厚，是精神支柱',
              friends: '重视友谊，愿意为朋友付出',
              romantic: '在感情上略显迟钝，但一旦认定会全心投入',
              enemies: '即使面对敌人也保持基本的尊重和底线'
            },
            developmentArc: {
              start: '迷茫困顿的普通人',
              middle: '经历挫折和考验，逐渐成长',
              end: '成熟稳重，能够承担责任的人',
              keyMoments: ['初次觉醒', '重大挫折', '关键选择', '最终成长']
            }
          },
          suggestions: [
            '可以增加更多细节来丰富角色的立体感',
            '考虑为角色设计独特的言行习惯',
            '建议添加一些弱点和缺陷，让角色更真实',
            '可以设计一些只属于这个角色的经历或秘密'
          ]
        };
        
        // 将AI生成的文本作为补充
        if (result.length > 100) {
          parsedResult.analysis.background.origin = result.substring(0, 100) + '...';
        }
      }
      
      console.log('✅ 角色分析成功:', { name: parsedResult.name });
      
      return parsedResult;
    } catch (error) {
      console.error('❌ 角色分析失败:', error);
      throw new Error(`角色分析失败: ${(error as Error).message}`);
    }
  }

  /**
   * 生成对话
   */
  async generateDialogue(context: any): Promise<string> {
    try {
      const { characters = [], situation = '日常对话', mood = 'neutral', context: sceneContext = '' } = context;
      
      const systemPrompt = `你是一个专业的对话编剧。请根据提供的情境和角色信息，生成自然、符合角色性格的对话。对话应该推进情节发展，体现角色个性，并符合指定的情绪氛围。`;

      const prompt = `请为以下情境生成对话：

参与角色：${characters.join(', ') || '角色A, 角色B'}
对话情境：${situation}
情绪氛围：${mood} (tense=紧张, happy=愉快, sad=悲伤, neutral=中性, romantic=浪漫)
背景信息：${sceneContext}

要求：
1. 对话要符合角色身份和性格特点
2. 语言要自然流畅，符合中文表达习惯
3. 体现指定的情绪氛围
4. 推进情节发展或揭示角色信息
5. 使用适当的动作描述和心理描写

请生成3-5轮对话。`;

      const result = await this.generateText(prompt, { 
        temperature: 0.8, 
        maxTokens: 1500 
      }, systemPrompt);
      
      console.log('✅ 对话生成成功:', { 
        situation, 
        mood,
        charactersCount: characters.length,
        outputLength: result.length 
      });
      
      return result;
    } catch (error) {
      console.error('❌ 对话生成失败:', error);
      throw new Error(`对话生成失败: ${(error as Error).message}`);
    }
  }

  /**
   * 改进文本
   */
  async improveText(text: string, type: string): Promise<string> {
    try {
      let systemPrompt = '';
      let improvementType = '';
      
      switch (type) {
        case 'grammar':
          systemPrompt = '你是一个专业的中文编辑。请修正文本中的语法错误、标点符号问题和用词不当，保持原意不变。';
          improvementType = '语法和用词优化';
          break;
        case 'style':
          systemPrompt = '你是一个文学编辑。请优化文本的表达方式，使语言更加生动优美，提升文学性，但保持原意。';
          improvementType = '文风和表达优化';
          break;
        case 'expand':
          systemPrompt = '你是一个创意写作专家。请在保持原文核心意思的基础上，增加细节描写、场景描述和情感表达，使文本更加丰富饱满。';
          improvementType = '内容扩展和丰富';
          break;
        case 'condense':
          systemPrompt = '你是一个文本编辑专家。请在保持核心信息的前提下，精简文本，去除冗余表达，使语言更加简洁有力。';
          improvementType = '精简和浓缩';
          break;
        case 'tone':
          systemPrompt = '你是一个文风调节专家。请调整文本的语调和情感色彩，使其更符合目标读者群体和使用场景。';
          improvementType = '语调和情感调整';
          break;
        default:
          systemPrompt = '你是一个全能的文本编辑专家。请全面优化这段文本，提升其质量、可读性和表现力。';
          improvementType = '全面优化';
      }

      const prompt = `请对以下文本进行${improvementType}：

原文：
${text}

要求：
1. 保持原文的核心意思和关键信息
2. ${improvementType}
3. 确保改进后的文本更加符合中文表达习惯
4. 如果是创意写作内容，要保持文学性和感染力

请直接提供改进后的文本。`;

      const result = await this.generateText(prompt, { 
        temperature: 0.7, 
        maxTokens: Math.max(text.length * 2, 1000)
      }, systemPrompt);
      
      console.log('✅ 文本改进成功:', { 
        type: improvementType,
        originalLength: text.length,
        improvedLength: result.length
      });
      
      return result;
    } catch (error) {
      console.error('❌ 文本改进失败:', error);
      throw new Error(`文本改进失败: ${(error as Error).message}`);
    }
  }

  /**
   * 生成默认章节结构
   */
  private generateDefaultChapters(length: string): OutlineChapter[] {
    const chapterCounts = {
      short: 12,
      medium: 25,
      long: 40
    };
    
    const count = chapterCounts[length as keyof typeof chapterCounts] || 25;
    const chapters: OutlineChapter[] = [];
    
    for (let i = 1; i <= count; i++) {
      chapters.push({
        id: i,
        title: `第${i}章：${this.getChapterTitle(i, count)}`,
        summary: `第${i}章的故事概要...`,
        keyEvents: [`事件${i}-1`, `事件${i}-2`],
        estimatedWords: length === 'short' ? 2500 : length === 'medium' ? 4000 : 5000
      });
    }
    
    return chapters;
  }

  /**
   * 获取章节标题模板
   */
  private getChapterTitle(chapter: number, total: number): string {
    const ratio = chapter / total;
    
    if (ratio <= 0.1) return '起始';
    if (ratio <= 0.3) return '展开';
    if (ratio <= 0.6) return '发展';
    if (ratio <= 0.8) return '高潮';
    return '结局';
  }

  /**
   * 估算字数
   */
  private estimateWordCount(length: string): number {
    const estimates = {
      short: 50000,
      medium: 150000,
      long: 300000
    };
    
    return estimates[length as keyof typeof estimates] || 150000;
  }

  /**
   * 获取服务状态
   */
  getStatus(): { available: boolean; provider: string; model: string } {
    return {
      available: !!this.config.apiKey || this.config.provider === 'local',
      provider: this.config.provider,
      model: this.config.model
    };
  }
}

// 创建真实AI服务实例
export const realAIService = new RealAIService();

export default realAIService;
