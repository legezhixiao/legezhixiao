import { AIServiceManager } from './aiService';

// Jasper AI 模板接口
export interface JasperTemplate {
  id: string;
  name: string;
  description: string;
  category: 'novel' | 'character' | 'scene' | 'dialogue' | 'marketing' | 'blog';
  icon: string;
  systemPrompt: string;
  userPromptTemplate: string;
  suggestedParams: {
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
  requiredFields: string[];
  optionalFields: string[];
}

// 品牌语调接口
export interface BrandVoice {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  examples: string[];
  tone: 'professional' | 'casual' | 'creative' | 'academic' | 'marketing';
  instructions: string;
}

// 外部工具接口
export interface ExternalTool {
  id: string;
  name: string;
  description: string;
  category: 'research' | 'translation' | 'storage' | 'analysis' | 'social' | 'ai';
  enabled: boolean;
  apiEndpoint?: string;
  requiresAuth: boolean;
  execute: (params: any) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    cost?: number;
  };
}

// Jasper AI 请求接口
export interface JasperRequest {
  templateId: string;
  brandVoiceId?: string;
  inputs: Record<string, any>;
  useTools?: boolean;
  selectedTools?: string[];
  customInstructions?: string;
  outputLength?: 'short' | 'medium' | 'long';
}

// Jasper AI 响应接口
export interface JasperResponse {
  id: string;
  content: string;
  template: JasperTemplate;
  brandVoice?: BrandVoice;
  toolsUsed: string[];
  toolResults: Record<string, ToolResult>;
  metadata: {
    tokensUsed: number;
    executionTime: number;
    confidence: number;
    wordCount: number;
  };
  suggestions?: string[];
}

class JasperAIService {
  private templates: Map<string, JasperTemplate> = new Map();
  private brandVoices: Map<string, BrandVoice> = new Map();
  private externalTools: Map<string, ExternalTool> = new Map();
  private activeSession: string | null = null;

  constructor() {
    this.initializeTemplates();
    this.initializeBrandVoices();
    this.initializeExternalTools();
  }

  // 初始化 Jasper 风格模板
  private initializeTemplates(): void {
    const templates: JasperTemplate[] = [
      {
        id: 'novel_chapter',
        name: '小说章节生成器',
        description: '基于大纲生成完整的小说章节',
        category: 'novel',
        icon: '📖',
        systemPrompt: `你是一位经验丰富的小说家，擅长创作引人入胜的小说章节。你能够：
1. 根据章节大纲发展完整情节
2. 创造生动的角色对话
3. 营造身临其境的场景
4. 保持故事节奏和悬念
5. 确保与整体故事风格一致`,
        userPromptTemplate: `请基于以下信息创作一个小说章节：

章节大纲：{outline}
角色信息：{characters}
故事背景：{background}
前情提要：{previous_context}

要求：
- 章节长度：约{word_count}字
- 风格：{style}
- 情感基调：{tone}
- 包含适当的对话、动作和心理描写
- 为下一章留下适当的悬念

请直接开始创作章节内容：`,
        suggestedParams: {
          temperature: 0.8,
          maxTokens: 1500,
          topP: 0.9
        },
        requiredFields: ['outline'],
        optionalFields: ['characters', 'background', 'previous_context', 'word_count', 'style', 'tone']
      },
      {
        id: 'character_creator',
        name: '角色创造器',
        description: '创建立体丰满的小说角色',
        category: 'character',
        icon: '👤',
        systemPrompt: `你是角色设定专家，能够创造立体、有深度的小说角色。你的角色设定包括：
1. 详细的外貌和气质描写
2. 复杂的性格特征和内心世界
3. 有说服力的背景故事
4. 清晰的动机和目标
5. 独特的说话方式和行为习惯`,
        userPromptTemplate: `请为以下角色概念创建详细的角色档案：

角色基本概念：{concept}
在故事中的作用：{role}
年龄范围：{age_range}
性别：{gender}
职业/身份：{occupation}

请创建包含以下内容的角色档案：

1. **基本信息**
   - 姓名、年龄、性别、职业
   - 外貌特征（身材、相貌、穿着风格）

2. **性格特征**
   - 主要性格特点（优点和缺点）
   - 行为习惯和口头禅
   - 处事风格和价值观

3. **背景故事**
   - 成长经历和重要事件
   - 家庭背景和人际关系
   - 教育经历和社会地位

4. **内心世界**
   - 最大的恐惧和渴望
   - 核心动机和人生目标
   - 内心冲突和矛盾

5. **在故事中的作用**
   - 与主角的关系
   - 对情节发展的影响
   - 角色成长弧线`,
        suggestedParams: {
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.8
        },
        requiredFields: ['concept'],
        optionalFields: ['role', 'age_range', 'gender', 'occupation']
      },
      {
        id: 'scene_painter',
        name: '场景描绘师',
        description: '创建生动的场景描写',
        category: 'scene',
        icon: '🎨',
        systemPrompt: `你是场景描写大师，能够用文字创造身临其境的感觉。你擅长：
1. 调动读者的五感体验
2. 营造符合情节的氛围
3. 通过环境反映角色心理
4. 使用生动的比喻和意象
5. 平衡细节描写和叙事节奏`,
        userPromptTemplate: `请描绘以下场景，让读者感到身临其境：

场景位置：{location}
时间设定：{time}
天气环境：{weather}
氛围要求：{atmosphere}
相关角色：{characters}
情节背景：{plot_context}

描写要求：
- 调动五感（视觉、听觉、嗅觉、触觉、味觉）
- 营造{atmosphere}的氛围
- 长度约{word_count}字
- 风格：{style}

请开始场景描写：`,
        suggestedParams: {
          temperature: 0.9,
          maxTokens: 800,
          topP: 0.9
        },
        requiredFields: ['location'],
        optionalFields: ['time', 'weather', 'atmosphere', 'characters', 'plot_context', 'word_count', 'style']
      },
      {
        id: 'dialogue_master',
        name: '对话大师',
        description: '创作自然流畅的对话',
        category: 'dialogue',
        icon: '💬',
        systemPrompt: `你是对话写作专家，能够创作符合角色性格的生动对话。你的对话特点：
1. 符合每个角色的独特语言风格
2. 包含丰富的潜台词和情感层次
3. 推动情节发展或揭示角色性格
4. 语言自然，避免说教和生硬
5. 适当穿插动作和心理描写`,
        userPromptTemplate: `请为以下情况创作对话：

对话场景：{scene}
参与角色：{characters}
对话目的：{purpose}
情感氛围：{emotion}
情节背景：{context}

角色信息：
{character_details}

对话要求：
- 体现各角色的性格特点和关系
- 包含适当的潜台词
- 推动情节发展：{purpose}
- 情感基调：{emotion}
- 长度约{word_count}字
- 适当加入动作和心理描写

请开始创作对话：`,
        suggestedParams: {
          temperature: 0.8,
          maxTokens: 700,
          topP: 0.8
        },
        requiredFields: ['scene', 'characters'],
        optionalFields: ['purpose', 'emotion', 'context', 'character_details', 'word_count']
      },
      {
        id: 'plot_enhancer',
        name: '情节增强器',
        description: '优化和增强现有情节',
        category: 'novel',
        icon: '⚡',
        systemPrompt: `你是情节优化专家，能够分析和改进小说情节。你擅长：
1. 识别情节中的薄弱环节
2. 增加冲突和张力
3. 创造意外转折
4. 加强角色动机
5. 提升整体叙事节奏`,
        userPromptTemplate: `请分析并优化以下情节：

当前情节：{current_plot}
存在问题：{issues}
优化目标：{goals}
故事背景：{background}

请提供：
1. **情节分析**
   - 识别当前情节的优点和不足
   - 指出可能的逻辑漏洞或薄弱环节

2. **优化建议**
   - 具体的改进方案
   - 增强冲突和张力的方法
   - 角色动机的强化建议

3. **重写版本**
   - 基于分析提供优化后的情节
   - 保持原有核心，增强戏剧效果
   - 长度约{word_count}字

请开始分析和优化：`,
        suggestedParams: {
          temperature: 0.7,
          maxTokens: 1200,
          topP: 0.8
        },
        requiredFields: ['current_plot'],
        optionalFields: ['issues', 'goals', 'background', 'word_count']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // 初始化品牌语调
  private initializeBrandVoices(): void {
    const brandVoices: BrandVoice[] = [
      {
        id: 'classical_literature',
        name: '经典文学',
        description: '优雅深刻，富有诗意的文学风格',
        characteristics: ['语言优美', '思想深刻', '情感丰富', '意境深远', '文字典雅'],
        examples: ['如莫言、余华、王安忆的写作风格', '注重文学性和艺术性'],
        tone: 'academic',
        instructions: `采用经典文学风格，特点：
- 语言优美典雅，富有诗意
- 注重情感的细腻表达
- 善用比喻、象征等修辞手法
- 关注人性深度和社会思考
- 节奏相对舒缓，注重意境营造`
      },
      {
        id: 'modern_urban',
        name: '现代都市',
        description: '时尚快节奏，贴近现代生活',
        characteristics: ['语言简洁', '节奏明快', '贴近现实', '情感真实', '时代感强'],
        examples: ['如张嘉佳、安妮宝贝、郭敬明的风格', '反映都市生活节奏'],
        tone: 'casual',
        instructions: `采用现代都市风格，特点：
- 语言简洁明快，贴近口语
- 反映现代都市生活
- 节奏紧凑，情节推进快速
- 关注年轻人的情感和生活
- 融入网络用语和流行元素`
      },
      {
        id: 'fantasy_epic',
        name: '史诗奇幻',
        description: '宏大神秘，富有想象力的奇幻风格',
        characteristics: ['世界观宏大', '想象力丰富', '语言华丽', '史诗感强', '神秘色彩'],
        examples: ['如江南、今何在、树下野狐的风格', '参考托尔金、乔治·马丁'],
        tone: 'creative',
        instructions: `采用史诗奇幻风格，特点：
- 构建宏大的幻想世界观
- 语言富有史诗感和神秘色彩
- 善用华丽的描写和想象
- 注重世界设定的完整性
- 融入神话传说元素`
      },
      {
        id: 'youth_romance',
        name: '青春言情',
        description: '清新温暖，充满青春气息',
        characteristics: ['语言清新', '情感纯真', '怀旧温暖', '青春气息', '浪漫唯美'],
        examples: ['如饶雪漫、辛夷坞、桐华的风格', '校园和青春题材'],
        tone: 'casual',
        instructions: `采用青春言情风格，特点：
- 语言清新自然，富有青春气息
- 情感表达纯真细腻
- 善于营造温暖怀旧的氛围
- 关注青春期的成长和爱情
- 使用充满希望的积极语调`
      },
      {
        id: 'suspense_thriller',
        name: '悬疑推理',
        description: '紧张严密，逻辑性强的推理风格',
        characteristics: ['逻辑严密', '氛围紧张', '细节丰富', '悬念迭起', '推理缜密'],
        examples: ['如东野圭吾、阿加莎、蔡骏的风格', '注重逻辑和悬念'],
        tone: 'professional',
        instructions: `采用悬疑推理风格，特点：
- 逻辑严密，细节考究
- 营造紧张神秘的氛围
- 善于设置悬念和伏笔
- 注重推理过程的合理性
- 语言简洁有力，节奏紧凑`
      }
    ];

    brandVoices.forEach(voice => {
      this.brandVoices.set(voice.id, voice);
    });
  }

  // 初始化外部工具
  private initializeExternalTools(): void {
    const tools: ExternalTool[] = [
      {
        id: 'wikipedia_search',
        name: 'Wikipedia 搜索',
        description: '搜索维基百科获取背景资料和参考信息',
        category: 'research',
        enabled: true,
        apiEndpoint: 'https://zh.wikipedia.org/api/rest_v1/page/summary/',
        requiresAuth: false,
        execute: async (params: { query: string }) => {
          const startTime = Date.now();
          try {
            const response = await fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(params.query)}`);
            const data = await response.json();
            return {
              success: true,
              data: {
                title: data.title,
                extract: data.extract,
                url: data.content_urls?.desktop?.page,
                thumbnail: data.thumbnail?.source
              },
              metadata: {
                executionTime: Date.now() - startTime
              }
            };
          } catch (error) {
            return {
              success: false,
              error: '维基百科搜索失败: ' + (error as Error).message,
              metadata: {
                executionTime: Date.now() - startTime
              }
            };
          }
        }
      },
      {
        id: 'thesaurus',
        name: '同义词词典',
        description: '获取同义词、近义词和相关词汇',
        category: 'research',
        enabled: true,
        requiresAuth: false,
        execute: async (params: { word: string }) => {
          const startTime = Date.now();
          // 模拟同义词API调用
          const synonymsDatabase: Record<string, string[]> = {
            '美丽': ['漂亮', '好看', '秀丽', '美好', '迷人', '动人', '俊美', '娇美'],
            '快乐': ['开心', '愉快', '高兴', '欢乐', '喜悦', '欣喜', '欢快', '愉悦'],
            '强大': ['强壮', '厉害', '威武', '雄壮', '有力', '强劲', '强悍', '强盛'],
            '智慧': ['聪明', '明智', '睿智', '机智', '聪慧', '智能', '明理', '贤明'],
            '勇敢': ['勇气', '胆量', '无畏', '英勇', '勇毅', '果敢', '刚勇', '豪勇']
          };

          const synonyms = synonymsDatabase[params.word] || [`${params.word}的同义词1`, `${params.word}的同义词2`, `${params.word}的同义词3`];
          
          return {
            success: true,
            data: {
              word: params.word,
              synonyms: synonyms,
              count: synonyms.length
            },
            metadata: {
              executionTime: Date.now() - startTime
            }
          };
        }
      },
      {
        id: 'knowledge_graph',
        name: '知识图谱查询',
        description: '从项目知识图谱获取实体关系数据',
        category: 'storage',
        enabled: true,
        requiresAuth: true,
        execute: async (params: { entity: string, projectId?: string }) => {
          const startTime = Date.now();
          try {
            // 默认使用项目ID '1'，与前端路由匹配
            const projectId = params.projectId || '1';
            
            const response = await fetch(`/api/knowledge-graph/projects/${projectId}/nodes?query=${encodeURIComponent(params.entity)}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`知识图谱API响应错误: ${response.status}`);
            }
            
            const data = await response.json();
            return {
              success: true,
              data: {
                nodes: data.nodes || [],
                relationships: data.relationships || [],
                entity: params.entity,
                projectId: projectId
              },
              metadata: {
                executionTime: Date.now() - startTime
              }
            };
          } catch (error) {
            return {
              success: false,
              error: '知识图谱查询失败: ' + (error as Error).message,
              metadata: {
                executionTime: Date.now() - startTime
              }
            };
          }
        }
      },
      {
        id: 'create_knowledge_graph',
        name: '生成知识图谱',
        description: '基于内容分析生成知识图谱',
        category: 'analysis',
        enabled: true,
        requiresAuth: true,
        execute: async (params: { content: string, projectId?: string, type?: string }) => {
          const startTime = Date.now();
          try {
            const projectId = params.projectId || '1';
            
            const response = await fetch(`/api/knowledge-graph/projects/${projectId}/analyze`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content: params.content,
                type: params.type || 'document'
              })
            });
            
            if (!response.ok) {
              throw new Error(`知识图谱生成API响应错误: ${response.status}`);
            }
            
            const data = await response.json();
            return {
              success: true,
              data: {
                nodes: data.nodes || [],
                relationships: data.relationships || [],
                analysis: data.analysis || {},
                projectId: projectId
              },
              metadata: {
                executionTime: Date.now() - startTime,
                toolCall: 'create_knowledge_graph',
                visualization: 'knowledge_graph'
              }
            };
          } catch (error) {
            return {
              success: false,
              error: '知识图谱生成失败: ' + (error as Error).message,
              metadata: {
                executionTime: Date.now() - startTime
              }
            };
          }
        }
      },
      {
        id: 'sentiment_analysis',
        name: '情感分析',
        description: '分析文本的情感倾向和情绪色彩',
        category: 'analysis',
        enabled: true,
        requiresAuth: false,
        execute: async (params: { text: string }) => {
          const startTime = Date.now();
          try {
            const response = await fetch('/api/ai/sentiment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''}`
              },
              body: JSON.stringify({ text: params.text })
            });
            const data = await response.json();
            return {
              success: true,
              data: data,
              metadata: {
                executionTime: Date.now() - startTime
              }
            };
          } catch (error) {
            return {
              success: false,
              error: '情感分析失败: ' + (error as Error).message,
              metadata: {
                executionTime: Date.now() - startTime
              }
            };
          }
        }
      }
    ];

    tools.forEach(tool => {
      this.externalTools.set(tool.id, tool);
    });
  }

  // 获取所有模板
  getTemplates(): JasperTemplate[] {
    return Array.from(this.templates.values());
  }

  // 获取特定类别的模板
  getTemplatesByCategory(category: JasperTemplate['category']): JasperTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  // 获取模板
  getTemplate(id: string): JasperTemplate | undefined {
    return this.templates.get(id);
  }

  // 获取所有品牌语调
  getBrandVoices(): BrandVoice[] {
    return Array.from(this.brandVoices.values());
  }

  // 获取品牌语调
  getBrandVoice(id: string): BrandVoice | undefined {
    return this.brandVoices.get(id);
  }

  // 获取可用工具
  getAvailableTools(): ExternalTool[] {
    return Array.from(this.externalTools.values()).filter(tool => tool.enabled);
  }

  // 智能工具推荐
  recommendTools(templateId: string, inputs: Record<string, any>): string[] {
    const template = this.getTemplate(templateId);
    if (!template) return [];

    const recommendations: string[] = [];
    const inputText = Object.values(inputs).join(' ').toLowerCase();

    // 根据模板类型和输入内容推荐工具
    if (template.category === 'character' || inputText.includes('角色') || inputText.includes('人物')) {
      recommendations.push('knowledge_graph');
    }

    if (inputText.includes('历史') || inputText.includes('背景') || inputText.includes('资料')) {
      recommendations.push('wikipedia_search');
    }

    if (template.category === 'dialogue' || inputText.includes('对话') || inputText.includes('情感')) {
      recommendations.push('sentiment_analysis');
    }

    if (inputText.includes('词汇') || inputText.includes('表达') || inputText.includes('描述')) {
      recommendations.push('thesaurus');
    }

    return recommendations.filter(toolId => this.externalTools.get(toolId)?.enabled);
  }

  // 执行外部工具
  private async executeTools(toolIds: string[], inputs: Record<string, any>): Promise<Record<string, ToolResult>> {
    const results: Record<string, ToolResult> = {};
    
    for (const toolId of toolIds) {
      const tool = this.externalTools.get(toolId);
      if (!tool || !tool.enabled) continue;

      try {
        // 根据工具类型和输入生成参数
        let params = {};
        const inputText = Object.values(inputs).join(' ');

        switch (toolId) {
          case 'wikipedia_search':
            params = { query: inputs.concept || inputs.location || inputs.background || '历史背景' };
            break;
          case 'thesaurus':
            const words = inputText.match(/[\u4e00-\u9fa5]+/g) || [];
            params = { word: words[0] || '描述' };
            break;
          case 'knowledge_graph':
            params = { entity: inputs.characters || inputs.concept || '角色' };
            break;
          case 'sentiment_analysis':
            params = { text: inputText };
            break;
          default:
            params = inputs;
        }

        results[toolId] = await tool.execute(params);
      } catch (error) {
        results[toolId] = {
          success: false,
          error: `工具 ${tool.name} 执行失败: ${(error as Error).message}`,
          metadata: { executionTime: 0 }
        };
      }
    }

    return results;
  }

  // 主要生成方法
  async generate(request: JasperRequest): Promise<JasperResponse> {
    const startTime = Date.now();
    const template = this.getTemplate(request.templateId);
    
    if (!template) {
      throw new Error(`模板 ${request.templateId} 不存在`);
    }

    const brandVoice = request.brandVoiceId ? this.getBrandVoice(request.brandVoiceId) : undefined;
    
    // 执行外部工具（如果启用）
    let toolResults: Record<string, ToolResult> = {};
    if (request.useTools && request.selectedTools?.length) {
      toolResults = await this.executeTools(request.selectedTools, request.inputs);
    }

    // 构建增强提示词
    let userPrompt = template.userPromptTemplate;
    
    // 替换输入变量
    Object.entries(request.inputs).forEach(([key, value]) => {
      userPrompt = userPrompt.replace(new RegExp(`{${key}}`, 'g'), value || '');
    });

    // 添加工具结果
    if (Object.keys(toolResults).length > 0) {
      const toolInfo = Object.entries(toolResults)
        .filter(([_, result]) => result.success)
        .map(([toolId, result]) => {
          const tool = this.externalTools.get(toolId);
          return `\n**${tool?.name}提供的信息**：\n${JSON.stringify(result.data, null, 2)}`;
        })
        .join('\n');
      
      if (toolInfo) {
        userPrompt += `\n\n**参考资料**：${toolInfo}`;
      }
    }

    // 添加品牌语调指导
    let systemPrompt = template.systemPrompt;
    if (brandVoice) {
      systemPrompt += `\n\n**写作风格要求**：\n${brandVoice.instructions}`;
    }

    // 添加自定义指令
    if (request.customInstructions) {
      userPrompt += `\n\n**特殊要求**：\n${request.customInstructions}`;
    }

    // 根据输出长度调整参数
    const lengthMultiplier = {
      'short': 0.5,
      'medium': 1.0,
      'long': 1.5
    };
    const multiplier = lengthMultiplier[request.outputLength || 'medium'];
    const maxTokens = Math.floor(template.suggestedParams.maxTokens * multiplier);

    try {
      // 调用AI服务
      const aiService = AIServiceManager.getInstance();
      const aiResponse = await aiService.generateResponse({
        message: userPrompt,
        context: systemPrompt,
        type: 'general',
        maxTokens: maxTokens
      });

      const executionTime = Date.now() - startTime;
      const wordCount = aiResponse.text.length;

      return {
        id: Date.now().toString(),
        content: aiResponse.text,
        template,
        brandVoice,
        toolsUsed: request.selectedTools || [],
        toolResults,
        metadata: {
          tokensUsed: Math.floor(wordCount / 4), // 估算token数
          executionTime,
          confidence: aiResponse.confidence,
          wordCount
        },
        suggestions: this.generateSuggestions(aiResponse.text, template)
      };

    } catch (error) {
      throw new Error(`Jasper AI 生成失败: ${(error as Error).message}`);
    }
  }

  // 生成改进建议
  private generateSuggestions(_content: string, template: JasperTemplate): string[] {
    const suggestions: string[] = [];
    
    switch (template.category) {
      case 'novel':
        suggestions.push('可以增加更多感官细节来增强沉浸感');
        suggestions.push('考虑加强角色间的冲突来推动情节');
        break;
      case 'character':
        suggestions.push('可以添加更多独特的行为习惯');
        suggestions.push('考虑完善角色的成长背景');
        break;
      case 'scene':
        suggestions.push('可以加入更多环境声音的描写');
        suggestions.push('考虑通过环境反映角色心情');
        break;
      case 'dialogue':
        suggestions.push('可以增加更多肢体语言描写');
        suggestions.push('考虑在对话中加入更多潜台词');
        break;
    }

    return suggestions;
  }

  // 设置活动会话
  setActiveSession(sessionId: string): void {
    this.activeSession = sessionId;
  }

  // 获取活动会话
  getActiveSession(): string | null {
    return this.activeSession;
  }

  // 获取单个工具
  getTool(toolId: string): ExternalTool | undefined {
    return this.externalTools.get(toolId);
  }

  // 清理资源
  cleanup(): void {
    this.templates.clear();
    this.brandVoices.clear();
    this.externalTools.clear();
    this.activeSession = null;
  }
}

// 单例模式
let jasperInstance: JasperAIService | null = null;

export function getJasperAIService(): JasperAIService {
  if (!jasperInstance) {
    jasperInstance = new JasperAIService();
  }
  return jasperInstance;
}

export default JasperAIService;
