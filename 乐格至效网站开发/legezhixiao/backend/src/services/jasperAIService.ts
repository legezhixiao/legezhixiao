import axios from 'axios';
import { getArangoDBService } from './arangoDBService';

interface ToolResponse {
  id: string;
  name: string;
  result: any;
  success: boolean;
  error?: string;
}

interface JasperAIResponse {
  id: string;
  text: string;
  confidence: number;
  provider: string;
  toolsUsed: ToolResponse[];
}

class JasperAIService {
  private get arangoDBService() {
    return getArangoDBService();
  }
  
  private getExternalTools() {
    return {
      knowledge_graph: {
        name: 'knowledge_graph',
        description: '获取项目的知识图谱数据，包括节点和关系',
        parameters: {
          projectId: {
            type: 'string',
            description: '项目ID'
          }
        },
        handler: async (params: { projectId: string }) => {
          try {
            const [nodes, relationships] = await Promise.all([
              this.arangoDBService.getKnowledgeGraphByProject(params.projectId),
              this.arangoDBService.getGraphRelationshipsByProject(params.projectId)
            ]);
            
            return {
              success: true,
              data: { nodes, relationships }
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },

      create_knowledge_graph: {
        name: 'create_knowledge_graph',
        description: '分析文本内容并创建知识图谱节点',
        parameters: {
          projectId: {
            type: 'string',
            description: '项目ID'
          },
          content: {
            type: 'string',
            description: '要分析的文本内容'
          },
          type: {
            type: 'string',
            description: '内容类型',
            default: 'document'
          }
        },
        handler: async (params: { projectId: string; content: string; type?: string }) => {
          try {
            console.log('🛠️ create_knowledge_graph工具被调用:', { 
              projectId: params.projectId, 
              contentLength: params.content.length,
              type: params.type 
            });
            
            const nodes = await this.arangoDBService.analyzeContentForNodes(
              params.projectId,
              params.content
            );
            
            console.log('📊 analyzeContentForNodes返回结果:', { 
              nodeCount: nodes.length,
              nodes: nodes.map(n => ({ name: n.name, type: n.type }))
            });
            
            return {
              success: true,
              data: { nodes, message: `成功分析内容并创建了 ${nodes.length} 个知识图谱节点` }
            };
          } catch (error: any) {
            console.error('❌ create_knowledge_graph工具错误:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
      },

      character_analysis: {
        name: 'character_analysis',
        description: '分析项目中的角色，提供角色发展建议',
        parameters: {
          projectId: {
            type: 'string',
            description: '项目ID'
          },
          characterName: {
            type: 'string',
            description: '要分析的角色名称（可选）'
          }
        },
        handler: async (params: { projectId: string; characterName?: string }) => {
          try {
            const characters = await this.arangoDBService.getNodesByType(params.projectId, 'CHARACTER');
            
            let analysisData;
            if (params.characterName) {
              const character = characters.find(c => c.name === params.characterName);
              if (!character) {
                return { success: false, error: `角色 "${params.characterName}" 不存在` };
              }
              analysisData = {
                character,
                relationships: await this.arangoDBService.getNodeRelationships(character._key),
                development_suggestions: this.generateCharacterDevelopmentSuggestions(character)
              };
            } else {
              analysisData = {
                total_characters: characters.length,
                characters: characters.map(c => ({
                  name: c.name,
                  type: c.type,
                  importance: c.importance || 50,
                  description: c.description
                })),
                analysis: this.generateCharacterAnalysis(characters)
              };
            }
            
            return {
              success: true,
              data: analysisData
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },

      plot_planning: {
        name: 'plot_planning',
        description: '基于知识图谱生成情节规划建议',
        parameters: {
          projectId: {
            type: 'string',
            description: '项目ID'
          },
          plotType: {
            type: 'string',
            description: '情节类型：conflict, development, climax, resolution',
            default: 'development'
          }
        },
        handler: async (params: { projectId: string; plotType?: string }) => {
          try {
            const [nodes, relationships] = await Promise.all([
              this.arangoDBService.getKnowledgeGraphByProject(params.projectId),
              this.arangoDBService.getGraphRelationshipsByProject(params.projectId)
            ]);
            
            const plotSuggestions = this.generatePlotSuggestions(nodes, relationships, params.plotType || 'development');
            
            return {
              success: true,
              data: {
                plot_type: params.plotType || 'development',
                suggestions: plotSuggestions,
                nodes_count: nodes.length,
                relationships_count: relationships.length
              }
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },

      relationship_analysis: {
        name: 'relationship_analysis',
        description: '分析节点间的关系，发现潜在的故事线索',
        parameters: {
          projectId: {
            type: 'string',
            description: '项目ID'
          }
        },
        handler: async (params: { projectId: string }) => {
          try {
            const relationships = await this.arangoDBService.getGraphRelationshipsByProject(params.projectId);
            const nodes = await this.arangoDBService.getKnowledgeGraphByProject(params.projectId);
            
            const analysis = this.analyzeRelationshipPatterns(nodes, relationships);
            
            return {
              success: true,
              data: {
                total_relationships: relationships.length,
                relationship_types: analysis.types,
                story_potential: analysis.storyPotential,
                missing_connections: analysis.missingConnections,
                conflict_opportunities: analysis.conflicts
              }
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      }
    };
  }

  async processWithTools(message: string, projectId: string = '1'): Promise<JasperAIResponse> {
    const toolsUsed: ToolResponse[] = [];
    let enhancedMessage = message;

    // 检查是否需要使用各种工具
    if (this.shouldUseKnowledgeGraph(message)) {
      console.log('🔧 检测到需要使用知识图谱相关工具');
      
      // 角色分析工具
      if (this.shouldAnalyzeCharacters(message)) {
        const characterResult = await this.executeCharacterAnalysisTool(message, projectId);
        toolsUsed.push(characterResult);
        
        if (characterResult.success) {
          enhancedMessage += `\n\n[角色分析结果] ${JSON.stringify(characterResult.result, null, 2)}`;
        }
      }

      // 情节规划工具
      if (this.shouldPlanPlot(message)) {
        const plotResult = await this.executePlotPlanningTool(message, projectId);
        toolsUsed.push(plotResult);
        
        if (plotResult.success) {
          enhancedMessage += `\n\n[情节规划结果] ${JSON.stringify(plotResult.result, null, 2)}`;
        }
      }

      // 关系分析工具
      if (this.shouldAnalyzeRelationships(message)) {
        const relationshipResult = await this.executeRelationshipAnalysisTool(projectId);
        toolsUsed.push(relationshipResult);
        
        if (relationshipResult.success) {
          enhancedMessage += `\n\n[关系分析结果] ${JSON.stringify(relationshipResult.result, null, 2)}`;
        }
      }
      
      // 尝试创建知识图谱
      if (this.shouldCreateKnowledgeGraph(message)) {
        const createResult = await this.executeCreateKnowledgeGraphTool(message, projectId);
        toolsUsed.push(createResult);
        
        if (createResult.success) {
          enhancedMessage += `\n\n[系统工具执行结果] ${createResult.result.message}`;
        }
      }

      // 获取现有知识图谱数据
      const graphResult = await this.executeKnowledgeGraphTool(projectId);
      toolsUsed.push(graphResult);
      
      if (graphResult.success) {
        const graphData = graphResult.result;
        enhancedMessage += `\n\n[知识图谱上下文] 当前项目包含 ${graphData.nodes.length} 个知识节点和 ${graphData.relationships.length} 个关系。`;
        
        // 添加节点摘要信息
        if (graphData.nodes.length > 0) {
          const nodesSummary = graphData.nodes.slice(0, 5).map((node: any) => 
            `- ${node.name} (${node.type})`
          ).join('\n');
          enhancedMessage += `\n主要节点：\n${nodesSummary}`;
        }
      }
    }

    // 调用SiliconFlow AI
    const aiResponse = await this.callSiliconFlowAPI(enhancedMessage);

    return {
      id: Date.now().toString(),
      text: aiResponse,
      confidence: 0.9,
      provider: 'jasper-ai-enhanced',
      toolsUsed
    };
  }

  shouldUseKnowledgeGraph(message: string): boolean {
    const keywords = [
      '知识图谱', 'knowledge graph', '知识', '关系', '节点',
      '分析', '创建', '图谱', '结构', '实体', '联系',
      '人物关系', '情节结构', '世界观', '角色分析', '情节规划',
      '角色', '人物', '情节', '故事', '关系分析', '剧情',
      '主角', '配角', '反派', '冲突', '发展', '高潮', '结局'
    ];
    
    return keywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private shouldCreateKnowledgeGraph(message: string): boolean {
    const createKeywords = [
      '创建', '生成', '建立', '构建', '分析内容',
      '提取', '识别', '添加', '新增', '从内容', '基于文本'
    ];
    
    return createKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private shouldAnalyzeCharacters(message: string): boolean {
    const characterKeywords = [
      '角色分析', '人物分析', '角色发展', '人物发展',
      '角色关系', '人物关系', '角色设计', '人物设计',
      '主角', '配角', '反派', '角色', '人物'
    ];
    
    return characterKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private shouldPlanPlot(message: string): boolean {
    const plotKeywords = [
      '情节规划', '剧情规划', '情节设计', '故事规划',
      '冲突设计', '高潮设计', '结局设计', '情节发展',
      '剧情', '情节', '故事线', '叙事', '冲突', '转折'
    ];
    
    return plotKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private shouldAnalyzeRelationships(message: string): boolean {
    const relationshipKeywords = [
      '关系分析', '关系网络', '关系图', '联系分析',
      '人际关系', '角色关系', '关系', '联系', '网络'
    ];
    
    return relationshipKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private async executeKnowledgeGraphTool(projectId: string): Promise<ToolResponse> {
    try {
      const tools = this.getExternalTools();
      const result = await tools.knowledge_graph.handler({ projectId });
      
      return {
        id: `tool_${Date.now()}_1`,
        name: 'knowledge_graph',
        result: result.data,
        success: result.success,
        error: result.error
      };
    } catch (error: any) {
      return {
        id: `tool_${Date.now()}_1`,
        name: 'knowledge_graph',
        result: null,
        success: false,
        error: error.message
      };
    }
  }

  private async executeCreateKnowledgeGraphTool(message: string, projectId: string): Promise<ToolResponse> {
    try {
      // 从消息中提取要分析的内容
      const content = this.extractContentFromMessage(message);
      
      const tools = this.getExternalTools();
      const result = await tools.create_knowledge_graph.handler({
        projectId,
        content,
        type: 'document'
      });
      
      return {
        id: `tool_${Date.now()}_2`,
        name: 'create_knowledge_graph',
        result: result.data,
        success: result.success,
        error: result.error
      };
    } catch (error: any) {
      return {
        id: `tool_${Date.now()}_2`,
        name: 'create_knowledge_graph',
        result: null,
        success: false,
        error: error.message
      };
    }
  }

  private async executeCharacterAnalysisTool(message: string, projectId: string): Promise<ToolResponse> {
    try {
      const tools = this.getExternalTools();
      
      // 从消息中提取角色名称（如果有）
      const characterName = this.extractCharacterName(message);
      
      const result = await tools.character_analysis.handler({
        projectId,
        characterName
      });
      
      return {
        id: `tool_${Date.now()}_3`,
        name: 'character_analysis',
        result: result.data,
        success: result.success,
        error: result.error
      };
    } catch (error: any) {
      return {
        id: `tool_${Date.now()}_3`,
        name: 'character_analysis',
        result: null,
        success: false,
        error: error.message
      };
    }
  }

  private async executePlotPlanningTool(message: string, projectId: string): Promise<ToolResponse> {
    try {
      const tools = this.getExternalTools();
      
      // 从消息中识别情节类型
      const plotType = this.extractPlotType(message);
      
      const result = await tools.plot_planning.handler({
        projectId,
        plotType
      });
      
      return {
        id: `tool_${Date.now()}_4`,
        name: 'plot_planning',
        result: result.data,
        success: result.success,
        error: result.error
      };
    } catch (error: any) {
      return {
        id: `tool_${Date.now()}_4`,
        name: 'plot_planning',
        result: null,
        success: false,
        error: error.message
      };
    }
  }

  private async executeRelationshipAnalysisTool(projectId: string): Promise<ToolResponse> {
    try {
      const tools = this.getExternalTools();
      
      const result = await tools.relationship_analysis.handler({
        projectId
      });
      
      return {
        id: `tool_${Date.now()}_5`,
        name: 'relationship_analysis',
        result: result.data,
        success: result.success,
        error: result.error
      };
    } catch (error: any) {
      return {
        id: `tool_${Date.now()}_5`,
        name: 'relationship_analysis',
        result: null,
        success: false,
        error: error.message
      };
    }
  }

  private extractCharacterName(message: string): string | undefined {
    // 尝试从消息中提取角色名称
    const patterns = [
      /角色[""""]([^""""]+ )[""""]/, 
      /人物[""""]([^""""]+ )[""""]/, 
      /分析([一-龢]{2,6}|[A-Za-z]{2,15})(?:角色|人物)/,
      /([一-龢]{2,6}|[A-Za-z]{2,15})(?:的角色|的人物)/
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractPlotType(message: string): string {
    if (message.includes('冲突') || message.includes('矛盾')) return 'conflict';
    if (message.includes('高潮') || message.includes('关键')) return 'climax';
    if (message.includes('结局') || message.includes('解决')) return 'resolution';
    return 'development';
  }

  private extractContentFromMessage(message: string): string {
    console.log('🎯 原始消息:', message);
    
    // 提取冒号后或引号内的内容作为要分析的文本
    const patterns = [
      /[：:]["']([^"']+)["']/,  // 冒号后的引号内容
      /分析.*?[：:](.+?)(?:\n|$)/,  // "分析...:"后的内容
      /内容[：:](.+?)(?:\n|$)/,     // "内容:"后的内容  
      /[：:](.+?)(?:\n|$)/,         // 冒号后的内容
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 10) {
        const extracted = match[1].trim();
        console.log('📤 提取的内容:', extracted);
        return extracted;
      }
    }

    // 如果消息本身包含故事内容（检查是否有角色名或故事元素）
    if (message.includes('是一位') || message.includes('住在') || message.includes('他们') || message.match(/[一-龢]{2,4}(是|为|叫)/)) {
      console.log('📖 直接使用整个消息作为故事内容');
      return message;
    }

    // 如果没有特定模式，返回整个消息
    console.log('📝 使用整个消息:', message);
    return message;
  }

  private async callSiliconFlowAPI(message: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.siliconflow.cn/v1/chat/completions',
        {
          model: 'deepseek-ai/DeepSeek-V3',
          messages: [
            {
              role: 'system',
              content: '你是乐格至效AI小说创作助手Jasper，专门帮助用户进行小说创作。你具备知识图谱分析能力，可以分析文本中的人物、地点、事件等实体及其关系，并为小说创作提供专业建议。'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': 'Bearer sk-mjithqmjwccqgffouexthbavtnvftwkqjludpcxhrmeztcib',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices?.[0]?.message?.content || '抱歉，无法生成回复。';
    } catch (error: any) {
      console.error('SiliconFlow API调用失败:', error);
      return '抱歉，AI服务暂时不可用。';
    }
  }

  // 角色发展建议生成
  private generateCharacterDevelopmentSuggestions(character: any): any {
    return {
      personality_development: [
        '深化角色的内在冲突和矛盾',
        '增加角色的背景故事细节',
        '设计角色的成长弧线'
      ],
      relationship_potential: [
        '与其他角色建立更复杂的关系',
        '探索角色间的权力动态',
        '设计情感纠葛和冲突'
      ],
      plot_involvement: [
        '让角色在关键情节中发挥作用',
        '给角色独特的技能或知识',
        '创造角色特有的挑战'
      ],
      character_arc: {
        current_state: character.description || '待发展',
        growth_potential: `${character.name}具有很大的发展潜力`,
        suggested_journey: '从当前状态到成熟角色的转变过程'
      }
    };
  }

  // 角色分析生成
  private generateCharacterAnalysis(characters: any[]): any {
    const types = characters.reduce((acc: any, char: any) => {
      acc[char.type] = (acc[char.type] || 0) + 1;
      return acc;
    }, {});

    return {
      character_distribution: types,
      development_status: characters.length > 3 ? '角色群体丰富' : '角色需要扩展',
      relationship_complexity: '基础关系网络',
      suggestions: [
        '考虑添加更多支撑角色',
        '发展角色间的多层次关系',
        '为主要角色设计明确的目标和动机'
      ]
    };
  }

  // 情节建议生成
  private generatePlotSuggestions(nodes: any[], relationships: any[], plotType: string): any {
    const characters = nodes.filter((n: any) => n.type === 'CHARACTER');
    const locations = nodes.filter((n: any) => n.type === 'LOCATION');
    const concepts = nodes.filter((n: any) => n.type === 'CONCEPT');

    const suggestions = {
      conflict: [
        '设计角色间的利益冲突',
        '创造外部威胁或挑战',
        '引入道德伦理困境'
      ],
      development: [
        '推进角色关系的演变',
        '展开世界观的细节',
        '深化主题探讨'
      ],
      climax: [
        '汇聚所有矛盾冲突',
        '让角色面临最大挑战',
        '揭示重要秘密或真相'
      ],
      resolution: [
        '解决主要冲突',
        '展示角色成长',
        '为故事提供满意的结局'
      ]
    };

    return {
      plot_elements: {
        characters_available: characters.length,
        locations_available: locations.length,
        concepts_available: concepts.length
      },
      suggestions: suggestions[plotType as keyof typeof suggestions] || suggestions.development,
      potential_conflicts: this.identifyPotentialConflicts(nodes, relationships),
      story_arcs: this.generateStoryArcs(characters, relationships)
    };
  }

  // 关系模式分析
  private analyzeRelationshipPatterns(nodes: any[], relationships: any[]): any {
    const relationshipTypes = relationships.reduce((acc: any, rel: any) => {
      acc[rel.type] = (acc[rel.type] || 0) + 1;
      return acc;
    }, {});

    const nodeConnections = nodes.map((node: any) => {
      const connections = relationships.filter((rel: any) => 
        rel._from.includes(node._key) || rel._to.includes(node._key)
      );
      return {
        node: node.name,
        connections: connections.length,
        isolated: connections.length === 0
      };
    });

    return {
      types: relationshipTypes,
      storyPotential: this.calculateStoryPotential(nodes, relationships),
      missingConnections: this.identifyMissingConnections(nodes, relationships),
      conflicts: this.identifyPotentialConflicts(nodes, relationships)
    };
  }

  // 计算故事潜力
  private calculateStoryPotential(nodes: any[], relationships: any[]): any {
    const characterCount = nodes.filter((n: any) => n.type === 'CHARACTER').length;
    const relationshipDensity = relationships.length / Math.max(nodes.length, 1);
    
    let potential = 'low';
    if (characterCount >= 3 && relationshipDensity > 0.5) potential = 'high';
    else if (characterCount >= 2 && relationshipDensity > 0.3) potential = 'medium';

    return {
      level: potential,
      character_count: characterCount,
      relationship_density: relationshipDensity,
      recommendations: potential === 'low' ? 
        ['增加更多角色', '建立更多关系连接'] :
        ['保持当前发展方向', '深化现有关系']
    };
  }

  // 识别缺失连接
  private identifyMissingConnections(nodes: any[], relationships: any[]): string[] {
    const suggestions = [];
    const characters = nodes.filter((n: any) => n.type === 'CHARACTER');
    
    if (characters.length > 1) {
      // 检查是否所有角色都有连接
      for (const char of characters) {
        const hasConnections = relationships.some((rel: any) => 
          rel._from.includes(char._key) || rel._to.includes(char._key)
        );
        if (!hasConnections) {
          suggestions.push(`角色"${char.name}"缺少与其他元素的连接`);
        }
      }
    }

    return suggestions;
  }

  // 识别潜在冲突
  private identifyPotentialConflicts(nodes: any[], relationships: any[]): string[] {
    const conflicts = [];
    const characters = nodes.filter((n: any) => n.type === 'CHARACTER');
    
    if (characters.length >= 2) {
      conflicts.push('角色间的理念冲突');
      conflicts.push('资源竞争冲突');
    }

    const organizations = nodes.filter((n: any) => n.type === 'ORGANIZATION');
    if (organizations.length >= 1) {
      conflicts.push('个人与组织的价值观冲突');
    }

    return conflicts;
  }

  // 生成故事弧线
  private generateStoryArcs(characters: any[], relationships: any[]): any[] {
    return characters.map((char: any) => ({
      character: char.name,
      arc_type: 'character_growth',
      stages: ['introduction', 'challenge', 'growth', 'resolution'],
      key_relationships: relationships
        .filter((rel: any) => rel._from.includes(char._key) || rel._to.includes(char._key))
        .map((rel: any) => rel.type)
    }));
  }
}

export const jasperAIService = new JasperAIService();
