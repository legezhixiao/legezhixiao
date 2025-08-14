import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { AppError } from '../types';

// 定义情感分析相关的接口
interface EmotionalArc {
  event: string;
  emotion: string;
  intensity: number;
  timestamp?: string;
}

interface EmotionalDynamics {
  timestamp: string;
  sentiment: string;
  intensity: number;
  context: string;
}

interface Entity {
  type: string;
  name: string;
  description?: string;
  attributes?: Record<string, any>;
  aliases?: string[];
  disambiguatedId?: string;
  emotionalArcs?: EmotionalArc[];
}

interface Relation {
  source: string;
  target: string;
  type: string;
  attributes?: Record<string, any>;
  emotionalDynamics?: EmotionalDynamics[];
}

interface Event {
  description: string;
  participants: string[];
  timeInfo?: {
    expression: string;
    type: string;
    normalized?: string;
    position: number;
  };
  location?: string;
  order: number;
  confidence: number;
  sentiment?: {
    type: string;
    intensity: number;
    emotions: Record<string, number>;
  };
  impact?: {
    scope: 'individual' | 'group' | 'global';
    severity: number;
    consequences: string[];
  };
}

// 文件解析服务
export class FileParsingService {
  
  // 解析文本文件
  private async parseTextFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.trim();
    } catch (error) {
      throw new AppError('读取文本文件失败', 500);
    }
  }

  // 解析 Markdown 文件
  private async parseMarkdownFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // 移除 Markdown 语法，保留纯文本
      return content
        .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
        .replace(/`(.*?)`/g, '$1') // 移除代码标记
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
        .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
        .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
        .replace(/^\s*>\s+/gm, '') // 移除引用标记
        .trim();
    } catch (error) {
      throw new AppError('读取 Markdown 文件失败', 500);
    }
  }

  // 解析 HTML 文件
  private async parseHtmlFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // 简单的 HTML 标签移除（生产环境建议使用更强大的 HTML 解析库）
      return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script 标签
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // 移除 style 标签
        .replace(/<[^>]+>/g, '') // 移除所有 HTML 标签
        .replace(/&nbsp;/g, ' ') // 替换 HTML 实体
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim();
    } catch (error) {
      throw new AppError('读取 HTML 文件失败', 500);
    }
  }

  // 解析 JSON 文件（假设包含 content 字段）
  private async parseJsonFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(content);
      
      // 尝试提取文本内容
      if (jsonData.content) {
        return jsonData.content;
      } else if (jsonData.text) {
        return jsonData.text;
      } else if (jsonData.chapters && Array.isArray(jsonData.chapters)) {
        // 如果是章节数组格式
        return jsonData.chapters
          .map((chapter: any) => chapter.content || chapter.text || '')
          .join('\n\n');
      } else if (typeof jsonData === 'string') {
        return jsonData;
      } else {
        // 如果找不到明确的文本字段，返回整个JSON的字符串表示
        return JSON.stringify(jsonData, null, 2);
      }
    } catch (error) {
      throw new AppError('读取或解析 JSON 文件失败', 500);
    }
  }

  // 解析 Word 文档 (.docx)
  private async parseWordDocx(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new AppError('Word文档内容为空或无法读取', 400);
      }

      // 检查是否有警告信息
      if (result.messages && result.messages.length > 0) {
        console.warn('Word文档解析警告:', result.messages);
      }

      return result.value;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('解析Word文档失败: ' + (error as Error).message, 500);
    }
  }

  // 解析旧版Word文档 (.doc) - mammoth对.doc支持有限
  private async parseWordDoc(filePath: string): Promise<string> {
    try {
      // mammoth对.doc支持有限，但我们可以尝试
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new AppError('旧版Word文档(.doc)解析支持有限，建议转换为.docx格式', 400);
      }

      return result.value;
    } catch (error) {
      throw new AppError('旧版Word文档(.doc)解析失败，建议转换为.docx格式后重试', 400);
    }
  }

  // 主要的文件解析方法
  public async parseFile(filePath: string, mimeType: string): Promise<string> {
    let content = '';
    
    try {
      // 检查文件是否存在
      await fs.access(filePath);
      
      // 检查文件大小
      const stats = await fs.stat(filePath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        throw new AppError('文件大小超过限制（10MB）', 400);
      }

      // 当MIME类型为application/octet-stream时，根据文件扩展名决定解析方式
      if (mimeType === 'application/octet-stream') {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypeMap = new Map([
          ['.txt', 'text/plain'],
          ['.md', 'text/markdown'],
          ['.html', 'text/html'],
          ['.json', 'application/json'],
          ['.rtf', 'application/rtf'],
          ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          ['.doc', 'application/msword']
        ]);

        mimeType = mimeTypeMap.get(ext) || '';
        if (!mimeType) {
          throw new AppError(
            `不支持的文件类型: ${ext}。支持的格式：${Array.from(mimeTypeMap.keys()).join(', ')}`,
            400
          );
        }
      }

      switch (mimeType) {
        case 'text/plain':
          content = await this.parseTextFile(filePath);
          break;
        
        case 'text/markdown':
        case 'text/x-markdown':
          content = await this.parseMarkdownFile(filePath);
          break;
        
        case 'text/html':
          content = await this.parseHtmlFile(filePath);
          break;
        
        case 'application/json':
          content = await this.parseJsonFile(filePath);
          break;
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.parseWordDocx(filePath);
          break;
        
        case 'application/msword':
          content = await this.parseWordDoc(filePath);
          break;
        
        case 'application/pdf':
          // PDF 需要特殊的库来解析，暂时不支持
          throw new AppError('PDF 文档解析功能正在开发中，请使用 .txt 或 .md 格式', 400);
        
        case 'application/rtf':
          // RTF 需要特殊的库来解析，暂时不支持
          throw new AppError('RTF 文档解析功能正在开发中，请使用 .txt 或 .md 格式', 400);
        
        default:
          throw new AppError(`不支持的文件类型: ${mimeType}`, 400);
      }

      // 验证内容不为空
      if (!content || content.trim().length === 0) {
        throw new AppError('文件内容为空', 400);
      }

      return content;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('文件处理失败', 500);
    }
  }

  /**
   * 从文本内容中提取实体和关系
   * @param content 要分析的文本内容
   * @returns 提取的实体和关系信息
   */
  /**
   * 提取实体的属性特征
   */
  private extractEntityAttributes(
    entityType: string,
    entityName: string,
    context: string,
    windowSize: number = 100
  ): Record<string, any> {
    const attributes: Record<string, any> = {
      firstAppearance: context.indexOf(entityName),
      frequency: (context.match(new RegExp(entityName, 'g')) || []).length
    };

    // 在实体出现位置附近寻找属性描述
    const positions: number[] = [];
    const nameRegex = new RegExp(entityName, 'g');
    let match;
    while ((match = nameRegex.exec(context)) !== null) {
      positions.push(match.index);
    }

    // 为每个出现位置收集上下文
    const contextWindows = positions.map(pos => {
      const start = Math.max(0, pos - windowSize);
      const end = Math.min(context.length, pos + entityName.length + windowSize);
      return context.slice(start, end);
    });

    switch (entityType) {
      case 'CHARACTER': {
        // 提取性格特征
        const personalityPatterns = {
          positive: /(性格|为人|秉性)?(温和|善良|正直|勇敢|机智|豪爽|大方|谨慎|稳重|冷静|聪明|智慧|仁慈|开朗|活泼|坚强|谦逊|耐心|细心|勤奋)/,
          negative: /(性格|为人|秉性)?(暴躁|狡猾|自私|傲慢|固执|鲁莽|懒惰|虚伪|胆小|愚钝|狠毒|阴险|贪婪|残暴|怯懦|轻浮|粗心|冷漠)/
        };
        
        const traits: string[] = [];
        contextWindows.forEach(window => {
          Object.entries(personalityPatterns).forEach(([type, pattern]) => {
            const match = window.match(pattern);
            if (match) {
              traits.push(match[2]);
            }
          });
        });
        if (traits.length > 0) {
          attributes.personality = [...new Set(traits)];
        }

        // 提取年龄和辈分信息
        const agePattern = /(?:年仅|年方|年近|虚岁)?([一二三四五六七八九十百千0-9]+[岁年])/;
        const generationPattern = /(少年|青年|中年|老年|前辈|前代|后辈|晚辈)/;
        
        contextWindows.forEach(window => {
          const ageMatch = window.match(agePattern);
          if (ageMatch) {
            attributes.age = ageMatch[1];
          }
          const genMatch = window.match(generationPattern);
          if (genMatch) {
            attributes.generation = genMatch[1];
          }
        });

        // 提取身份和地位信息
        const statusPattern = /(掌门|宗主|帮主|教主|门主|族长|首领|统领|将军|王|帝|皇|官|师|主)/;
        contextWindows.forEach(window => {
          const match = window.match(statusPattern);
          if (match) {
            attributes.status = match[1];
          }
        });
        break;
      }

      case 'ITEM': {
        // 提取物品属性
        const itemAttributes = {
          quality: /(上品|极品|绝品|神品|凡品|下品)/,
          rarity: /(稀有|珍贵|罕见|独一无二|举世无双|世所罕见)/,
          power: /(神威|威力|威能|功效|效果|作用)/,
          material: /(由|用|以)([^，。]+)(炼制|打造|制成)/
        };

        Object.entries(itemAttributes).forEach(([key, pattern]) => {
          contextWindows.forEach(window => {
            const match = window.match(pattern);
            if (match) {
              attributes[key] = match[key === 'material' ? 2 : 1];
            }
          });
        });

        // 提取物品来历
        const originPattern = /(传自|来自|源自|出自)([^，。]+)/;
        contextWindows.forEach(window => {
          const match = window.match(originPattern);
          if (match) {
            attributes.origin = match[2];
          }
        });
        break;
      }

      case 'SKILL': {
        // 提取技能属性
        const skillAttributes = {
          level: /(入门|小成|大成|圆满|登峰造极|返璞归真|初级|中级|高级|顶级)/,
          power: /(威力|威能|杀伤力|破坏力|效果)(极强|强大|一般|微弱)/,
          type: /(攻击|防御|辅助|治疗|控制|封印|幻术|身法)/,
          element: /(金|木|水|火|土|风|雷|光|暗|冰|雪|毒)/
        };

        Object.entries(skillAttributes).forEach(([key, pattern]) => {
          contextWindows.forEach(window => {
            const match = window.match(pattern);
            if (match) {
              attributes[key] = match[key === 'power' ? 2 : 1];
            }
          });
        });

        // 提取修炼难度
        const difficultyPattern = /(难度|修炼|掌握)(艰深|极难|困难|一般|容易)/;
        contextWindows.forEach(window => {
          const match = window.match(difficultyPattern);
          if (match) {
            attributes.difficulty = match[2];
          }
        });
        break;
      }

      case 'LOCATION': {
        // 提取地点特征
        const locationAttributes = {
          size: /(广大|宏伟|巨大|宽广|辽阔|狭小|逼仄)/,
          environment: /(险峻|平坦|陡峭|幽深|空旷|荒凉|繁华|热闹)/,
          climate: /(寒冷|炎热|温和|潮湿|干燥|多雨|多雾)/,
          significance: /(重要|关键|核心|偏远|边缘|偏僻)/
        };

        Object.entries(locationAttributes).forEach(([key, pattern]) => {
          contextWindows.forEach(window => {
            const match = window.match(pattern);
            if (match) {
              attributes[key] = match[1];
            }
          });
        });

        // 提取特殊资源
        const resourcePattern = /盛产|出产|富含|蕴含([^，。]+)/;
        contextWindows.forEach(window => {
          const match = window.match(resourcePattern);
          if (match) {
            attributes.resources = match[1];
          }
        });
        break;
      }

      case 'ORGANIZATION': {
        // 提取组织特征
        const organizationAttributes = {
          scale: /(庞大|巨大|规模宏大|中等|小型)/,
          influence: /(显赫|强大|普通|微弱|没落)/,
          nature: /(正派|邪派|中立|善|恶)/,
          age: /(悠久|古老|历史悠久|新兴|初创)/
        };

        Object.entries(organizationAttributes).forEach(([key, pattern]) => {
          contextWindows.forEach(window => {
            const match = window.match(pattern);
            if (match) {
              attributes[key] = match[1];
            }
          });
        });

        // 提取势力范围
        const territoryPattern = /势力范围|管辖范围|统治范围([^，。]+)/;
        contextWindows.forEach(window => {
          const match = window.match(territoryPattern);
          if (match) {
            attributes.territory = match[1];
          }
        });
        break;
      }
    }

    return attributes;
  }

  /**
   * 提取实体和关系
   */
  /**
   * 解析代词指代
   */
  private resolvePronouns(
    text: string,
    entities: Array<{
      type: string;
      name: string;
      description?: string;
      attributes?: Record<string, any>;
    }>
  ): Array<{
    pronoun: string;
    referent: string;
    position: number;
    confidence: number;
  }> {
    // 代词映射表
    const pronounPatterns = {
      // 人称代词
      personal: {
        first: /(我|俺|咱|朕|寡人|本王|本君|本座|老夫|本尊)/,
        second: /(你|您|汝|尔|贵|阁下|大人|前辈|先生|姑娘)/,
        third: /(他|她|它|此人|其|彼|那人|这人)/
      },
      // 指示代词
      demonstrative: {
        near: /(这|此|这个|这位|这名|这种)/,
        far: /(那|彼|那个|那位|那名|那种)/
      },
      // 反身代词
      reflexive: /(自己|本身|亲自)/
    };

    const references: Array<{
      pronoun: string;
      referent: string;
      position: number;
      confidence: number;
    }> = [];

    // 分句处理
    const sentences = text.split(/[。！？!?.]+/).filter(s => s.trim().length > 0);
    let currentSpeaker: string | null = null;
    let lastMentionedEntities: string[] = [];

    sentences.forEach((sentence, sentenceIndex) => {
      // 检测说话者
      const speechPattern = /([^，。！？!?.]+)(?:说|道|笑道|喊道|回答|问道)/;
      const speechMatch = sentence.match(speechPattern);
      if (speechMatch) {
        const possibleSpeaker = speechMatch[1];
        const speakerEntity = entities.find(e => possibleSpeaker.includes(e.name));
        if (speakerEntity) {
          currentSpeaker = speakerEntity.name;
          lastMentionedEntities = [currentSpeaker];
        }
      }

      // 更新最近提到的实体
      entities.forEach(entity => {
        if (sentence.includes(entity.name)) {
          if (!lastMentionedEntities.includes(entity.name)) {
            lastMentionedEntities.unshift(entity.name);
            if (lastMentionedEntities.length > 5) {
              lastMentionedEntities.pop();
            }
          }
        }
      });

      // 处理代词
      Object.entries(pronounPatterns).forEach(([category, types]) => {
        Object.entries(types).forEach(([type, pattern]) => {
          const regex = new RegExp(pattern, 'g');
          let match;
          while ((match = regex.exec(sentence)) !== null) {
            const pronoun = match[0];
            let referent: string | null = null;
            let confidence = 0;

            // 根据代词类型和上下文确定指代对象
            switch (category) {
              case 'personal':
                if (type === 'first') {
                  referent = currentSpeaker;
                  confidence = 0.9;
                } else if (type === 'third' && lastMentionedEntities.length > 0) {
                  referent = lastMentionedEntities[0];
                  confidence = 0.7;
                }
                break;

              case 'demonstrative':
                if (lastMentionedEntities.length > 0) {
                  if (type === 'near') {
                    referent = lastMentionedEntities[0];
                    confidence = 0.8;
                  } else if (type === 'far' && lastMentionedEntities.length > 1) {
                    referent = lastMentionedEntities[1];
                    confidence = 0.7;
                  }
                }
                break;

              case 'reflexive':
                if (currentSpeaker) {
                  referent = currentSpeaker;
                  confidence = 0.9;
                } else if (lastMentionedEntities.length > 0) {
                  referent = lastMentionedEntities[0];
                  confidence = 0.7;
                }
                break;
            }

            if (referent) {
              references.push({
                pronoun,
                referent,
                position: match.index,
                confidence
              });
            }
          }
        });
      });
    });

    return references;
  }

  /**
   * 处理同名实体和别名
   */
  private resolveEntityAliases(
    entities: Array<{
      type: string;
      name: string;
      description?: string;
      attributes?: Record<string, any>;
    }>,
    content: string
  ): Array<{
    type: string;
    name: string;
    description?: string;
    attributes?: Record<string, any>;
    aliases?: string[];
    disambiguatedId?: string;
  }> {
    const aliasPatterns = {
      title: /(又称|亦称|别称|别名|绰号|名为|名叫)/,
      kinship: /(父|母|兄|弟|姐|妹|子|女|夫|妻|祖父|祖母)/,
      nickname: /(小|老|大|二|三|四|五|六|七|八|九|十)/,
      status: /(前|前任|现任|后|后任|新|旧|原)/
    };

    // 处理同名实体
    const entityGroups = new Map<string, Array<{
      entity: any;
      context: string;
      contextStart: number;
    }>>();

    // 按名字分组实体
    entities.forEach(entity => {
      const positions: number[] = [];
      const nameRegex = new RegExp(entity.name, 'g');
      let match;
      while ((match = nameRegex.exec(content)) !== null) {
        positions.push(match.index);
      }

      // 为每个出现位置收集上下文
      positions.forEach(pos => {
        const contextStart = Math.max(0, pos - 50);
        const contextEnd = Math.min(content.length, pos + entity.name.length + 50);
        const context = content.slice(contextStart, contextEnd);

        if (!entityGroups.has(entity.name)) {
          entityGroups.set(entity.name, []);
        }
        entityGroups.get(entity.name)?.push({
          entity: { ...entity },
          context,
          contextStart
        });
      });
    });

    // 处理每个同名实体组
    const resolvedEntities: Array<{
      type: string;
      name: string;
      description?: string;
      attributes?: Record<string, any>;
      aliases?: string[];
      disambiguatedId?: string;
    }> = [];

    entityGroups.forEach((group, name) => {
      if (group.length === 1) {
        // 单个实体，只需处理别名
        const entity = group[0].entity;
        const aliases = new Set<string>();

        // 搜索别名模式
        Object.entries(aliasPatterns).forEach(([type, pattern]) => {
          const regex = new RegExp(`${pattern.source}([^，。！？!?.]+?)(?=[，。！？!?.]|$)`, 'g');
          let match;
          while ((match = regex.exec(content)) !== null) {
            const context = content.slice(
              Math.max(0, match.index - 30),
              match.index + match[0].length + 30
            );
            if (context.includes(entity.name)) {
              aliases.add(match[1].trim());
            }
          }
        });

        if (aliases.size > 0) {
          entity.aliases = Array.from(aliases);
        }
        resolvedEntities.push(entity);
      } else {
        // 多个同名实体，需要消歧
        let disambiguationCount = 1;
        group.forEach((occurrence, index) => {
          const context = occurrence.context;
          const entity = { ...occurrence.entity };

          // 尝试从上下文中提取区分特征
          const distinguishingFeatures: string[] = [];
          Object.entries(aliasPatterns).forEach(([type, pattern]) => {
            const regex = new RegExp(`${entity.name}${pattern.source}([^，。！？!?.]+)`, 'g');
            let match;
            while ((match = regex.exec(context)) !== null) {
              distinguishingFeatures.push(match[1].trim());
            }
          });

          // 基于特征或位置生成唯一标识
          if (distinguishingFeatures.length > 0) {
            entity.disambiguatedId = `${entity.name}_${distinguishingFeatures[0]}`;
            entity.description = `${entity.name}（${distinguishingFeatures.join('，')}）`;
          } else {
            entity.disambiguatedId = `${entity.name}_${disambiguationCount++}`;
            entity.description = `${entity.name}（第${index + 1}处出现）`;
          }

          resolvedEntities.push(entity);
        });
      }
    });

    return resolvedEntities;
  }

  /**
   * 提取实体和关系
   */
  private async extractEntitiesAndRelations(content: string): Promise<{
    entities: Entity[];
    relations: Relation[];
    references: Array<{
      pronoun: string;
      referent: string;
      position: number;
      confidence: number;
    }>;
  }> {
    try {
      // 实体类型定义
      const entityTypes = {
        CHARACTER: '角色',
        LOCATION: '地点',
        ORGANIZATION: '组织',
        EVENT: '事件',
        ITEM: '物品',
        CONCEPT: '概念',
        SKILL: '技能',
        FACTION: '势力',
        RACE: '种族',
        TITLE: '称号',
        RELATIONSHIP: '关系'
      };

      const entities: Array<{
        type: string;
        name: string;
        description?: string;
        attributes?: Record<string, any>;
      }> = [];

      const relations: Array<{
        source: string;
        target: string;
        type: string;
        attributes?: Record<string, any>;
      }> = [];

      // 提取命名实体（基于正则表达式和上下文规则）
      // 1. 提取角色名和称号
      const characterPatterns = [
        /[\u4e00-\u9fa5]{2,4}(?=说|道|笑|问|答|喊|叫)/g,  // 对话标识
        /(?:这个|那个|这位|那位|这名|那名)[\u4e00-\u9fa5]{2,4}/g,  // 指代标识
        /[\u4e00-\u9fa5]{2,4}(?=大师|前辈|师兄|师姐|师弟|师妹)/g,  // 称谓标识
        /(?:老|小|大|二|三)[\u4e00-\u9fa5]{1,3}/g  // 年龄辈分标识
      ];

      const characters = new Set<string>();
      const titles = new Set<string>();
      
      characterPatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        matches.forEach(match => {
          // 提取实际名字（去除前缀词）
          const name = match.replace(/[这那个位名老小大二三]/, '');
          if (name.length >= 2) {
            characters.add(name);
          }
        });
      });

      // 提取称号
      const titlePattern = /(?:[\u4e00-\u9fa5]{2,4})(?:大师|前辈|师兄|师姐|师弟|师妹|掌门|宗主|教主|门主|帮主|王|帝|将军|统领|首领|族长|城主)/g;
      const titleMatches = content.match(titlePattern) || [];
      titleMatches.forEach(match => {
        titles.add(match);
      });

      // 2. 提取地点和场景
      const locationPatterns = {
        general: /[\u4e00-\u9fa5]{2,10}[城镇村府宫殿山洞室堂殿寺庙谷]/g,
        natural: /[\u4e00-\u9fa5]{2,10}(?:山|林|湖|海|河|谷|潭|泉|瀑布)/g,
        building: /[\u4e00-\u9fa5]{2,10}(?:宫|殿|楼|阁|亭|台|寺|观|庙|府|院|阵|园)/g,
        area: /[\u4e00-\u9fa5]{2,10}(?:域|界|国|郡|州|县|镇|城|村|地|境)/g
      };

      const locations = new Set<string>();
      Object.values(locationPatterns).forEach(pattern => {
        const matches = content.match(pattern) || [];
        matches.forEach(match => {
          if (!characters.has(match)) {
            locations.add(match);
          }
        });
      });

      // 3. 提取组织和势力
      const organizationPatterns = {
        general: /[\u4e00-\u9fa5]{2,10}[帮派门宗会军团队组织社]/g,
        sect: /[\u4e00-\u9fa5]{2,10}(?:宗|派|教|盟|宫|阁|楼|殿)/g,
        military: /[\u4e00-\u9fa5]{2,10}(?:军|师|营|旅|团|队|卫|营)/g,
        government: /[\u4e00-\u9fa5]{2,10}(?:朝|廷|国|部|司|院|府|衙|署)/g
      };

      const organizations = new Set<string>();
      Object.values(organizationPatterns).forEach(pattern => {
        const matches = content.match(pattern) || [];
        matches.forEach(match => {
          if (!characters.has(match) && !locations.has(match)) {
            organizations.add(match);
          }
        });
      });

      // 4. 提取物品和法宝
      const itemPatterns = {
        weapon: /[\u4e00-\u9fa5]{2,10}(?:剑|刀|枪|斧|钺|戟|矛|弓|箭|锤|鞭|棍|杖)/g,
        magic: /[\u4e00-\u9fa5]{2,10}(?:符|咒|丹|药|珠|玉|镜|印|图|册|经|卷)/g,
        treasure: /[\u4e00-\u9fa5]{2,10}(?:宝|器|兵|铠|甲|衣|袍|靴|环|佩|玉)/g
      };

      const items = new Set<string>();
      Object.values(itemPatterns).forEach(pattern => {
        const matches = content.match(pattern) || [];
        matches.forEach(match => {
          if (!characters.has(match) && !locations.has(match) && !organizations.has(match)) {
            items.add(match);
          }
        });
      });

      // 5. 提取技能和功法
      const skillPatterns = {
        martial: /[\u4e00-\u9fa5]{2,10}(?:拳|掌|指|腿|脚|功|法|诀|术|技|箭法|剑法|刀法)/g,
        magic: /[\u4e00-\u9fa5]{2,10}(?:咒|术|法|诀|神通|秘技|绝学|心法)/g,
        internal: /[\u4e00-\u9fa5]{2,10}(?:心法|功法|心诀|功诀|内功|心经|功经)/g
      };

      const skills = new Set<string>();
      Object.values(skillPatterns).forEach(pattern => {
        const matches = content.match(pattern) || [];
        matches.forEach(match => {
          if (!items.has(match)) {
            skills.add(match);
          }
        });
      });

      // 6. 提取种族和特殊群体
      const racePatterns = {
        general: /[\u4e00-\u9fa5]{2,6}(?:族|人|民)/g,
        fantasy: /[\u4e00-\u9fa5]{2,6}(?:妖|魔|仙|神|鬼|灵|兽)/g
      };

      const races = new Set<string>();
      Object.values(racePatterns).forEach(pattern => {
        const matches = content.match(pattern) || [];
        matches.forEach(match => {
          if (!organizations.has(match)) {
            races.add(match);
          }
        });
      });

      // 添加实体到结果集
      const addEntities = (
        names: Set<string>, 
        type: string, 
        description?: string
      ) => {
        names.forEach(name => {
          const attributes = this.extractEntityAttributes(type, name, content);
          entities.push({
            type,
            name,
            description,
            attributes
          });
        });
      };

      // 按实体类型分别处理
      addEntities(characters, 'CHARACTER');
      addEntities(titles, 'TITLE');
      addEntities(locations, 'LOCATION');
      addEntities(organizations, 'ORGANIZATION');
      addEntities(items, 'ITEM');
      addEntities(skills, 'SKILL');
      addEntities(races, 'RACE');

      // 构建实体间的关系
      const relationPatterns = {
        master_apprentice: /(?<master>[\u4e00-\u9fa5]{2,4})(?:收|带|教导|教习|教授)(?<apprentice>[\u4e00-\u9fa5]{2,4})(?:为徒|学艺|修行)/,
        family: /(?<person1>[\u4e00-\u9fa5]{2,4})(?:的|是|为)(?<person2>[\u4e00-\u9fa5]{2,4})(?:的)?(?:父|母|兄|弟|姐|妹|子|女|夫|妻|祖父|祖母)/,
        faction: /(?<person>[\u4e00-\u9fa5]{2,4})(?:加入|属于|效忠于|来自)(?<org>[\u4e00-\u9fa5]{2,10})/,
        location: /(?<person>[\u4e00-\u9fa5]{2,4})(?:位于|在|到达|来到|前往)(?<place>[\u4e00-\u9fa5]{2,10})/,
        skill: /(?<person>[\u4e00-\u9fa5]{2,4})(?:修炼|学会|掌握|使用)(?<skill>[\u4e00-\u9fa5]{2,10})/,
        item: /(?<person>[\u4e00-\u9fa5]{2,4})(?:获得|得到|拥有|使用)(?<item>[\u4e00-\u9fa5]{2,10})/
      };

      // 基于模式匹配提取关系
      Object.entries(relationPatterns).forEach(([relationType, pattern]) => {
        let match;
        const regex = new RegExp(pattern, 'g');
        while ((match = regex.exec(content)) !== null) {
          const groups = match.groups || {};
          const sourceEntity = entities.find(e => 
            Object.values(groups).includes(e.name)
          );
          const targetEntity = entities.find(e => 
            Object.values(groups).includes(e.name) && 
            e !== sourceEntity
          );

          if (sourceEntity && targetEntity) {
            relations.push({
              source: sourceEntity.name,
              target: targetEntity.name,
              type: relationType.toUpperCase(),
              attributes: {
                context: content.slice(
                  Math.max(0, match.index - 20),
                  Math.min(content.length, match.index + match[0].length + 20)
                ),
                confidence: 0.9,
                pattern: match[0]
              }
            });
          }
        }
      });

      // 基于共现分析构建补充关系
      const windowSize = 50; // 上下文窗口大小
      entities.forEach((entity, i) => {
        entities.slice(i + 1).forEach(targetEntity => {
          // 跳过已经有明确关系的实体对
          if (relations.some(r => 
            (r.source === entity.name && r.target === targetEntity.name) ||
            (r.source === targetEntity.name && r.target === entity.name)
          )) {
            return;
          }

          const sourcePos = content.indexOf(entity.name);
          const targetPos = content.indexOf(targetEntity.name);
          const distance = Math.abs(sourcePos - targetPos);
          
          if (distance <= windowSize) {
            // 提取关系上下文
            const start = Math.min(sourcePos, targetPos);
            const end = Math.max(sourcePos, targetPos) + targetEntity.name.length;
            const context = content.slice(
              Math.max(0, start - 20),
              Math.min(content.length, end + 20)
            );

            // 基于实体类型推断关系类型
            let relationType = 'RELATED_TO';
            let confidence = 0.5; // 默认置信度

            if (entity.type === 'CHARACTER' && targetEntity.type === 'CHARACTER') {
              relationType = 'CHARACTER_RELATION';
              confidence = 0.7;
            } else if (
              entity.type === 'CHARACTER' && 
              targetEntity.type === 'ORGANIZATION'
            ) {
              relationType = 'BELONGS_TO';
              confidence = 0.6;
            } else if (
              entity.type === 'CHARACTER' && 
              targetEntity.type === 'LOCATION'
            ) {
              relationType = 'APPEARS_IN';
              confidence = 0.6;
            } else if (
              entity.type === 'CHARACTER' &&
              targetEntity.type === 'SKILL'
            ) {
              relationType = 'POSSESSES';
              confidence = 0.7;
            } else if (
              entity.type === 'CHARACTER' &&
              targetEntity.type === 'ITEM'
            ) {
              relationType = 'OWNS';
              confidence = 0.7;
            }

            relations.push({
              source: entity.name,
              target: targetEntity.name,
              type: relationType,
              attributes: {
                confidence: Math.min(confidence * (1 - distance / windowSize), 0.9),
                context,
                distance,
                sourceType: entity.type,
                targetType: targetEntity.type,
                sourceFrequency: (content.match(new RegExp(entity.name, 'g')) || []).length,
                targetFrequency: (content.match(new RegExp(targetEntity.name, 'g')) || []).length,
                coOccurrenceCount: content.match(new RegExp(`${entity.name}[\\s\\S]{0,100}${targetEntity.name}|${targetEntity.name}[\\s\\S]{0,100}${entity.name}`, 'g'))?.length || 0
              }
            });
          }
        });
      });

      // 处理同名实体和别名
      const resolvedEntities = this.resolveEntityAliases(entities, content);

      // 处理代词指代
      const references = this.resolvePronouns(content, resolvedEntities);

      // 对关系进行过滤和整理
      const filteredRelations = relations
        // 移除重复的关系
        .filter((rel, index, self) => 
          index === self.findIndex(r => 
            (r.source === rel.source && r.target === rel.target) ||
            (r.source === rel.target && r.target === rel.source)
          )
        )
        // 根据置信度排序
        .sort((a, b) => (b.attributes?.confidence || 0) - (a.attributes?.confidence || 0))
        // 只保留置信度较高的关系
        .filter(rel => (rel.attributes?.confidence || 0) > 0.3)
        // 更新关系中的实体ID
        .map(rel => ({
          ...rel,
          source: resolvedEntities.find(e => e.name === rel.source)?.disambiguatedId || rel.source,
          target: resolvedEntities.find(e => e.name === rel.target)?.disambiguatedId || rel.target
        }));

      return {
        entities: resolvedEntities
          // 根据出现频率排序
          .sort((a, b) => (b.attributes?.frequency || 0) - (a.attributes?.frequency || 0)),
        relations: filteredRelations,
        references: references
      };
    } catch (error) {
      throw new AppError('实体关系提取失败', 500);
    }
  }

  // 分析文件内容，提取章节信息和知识图谱
  public async analyzeNovelContent(content: string): Promise<{
    totalWords: number;
    estimatedChapters: number;
    chapters: Array<{ title: string; content: string; order: number }>;
    summary: string;
    knowledgeGraph?: {
      entities: Array<{
        type: string;
        name: string;
        description?: string;
        attributes?: Record<string, any>;
        aliases?: string[];
        disambiguatedId?: string;
        emotionalArcs?: Array<{
          event: string;
          emotion: string;
          intensity: number;
          timestamp?: string;
        }>;
      }>;
      relations: Array<{
        source: string;
        target: string;
        type: string;
        attributes?: Record<string, any>;
        emotionalDynamics?: Array<{
          timestamp: string;
          sentiment: string;
          intensity: number;
          context: string;
        }>;
      }>;
      references: Array<{
        pronoun: string;
        referent: string;
        position: number;
        confidence: number;
      }>;
    };
    timeline?: {
      events: Array<{
        description: string;
        participants: string[];
        timeInfo?: {
          expression: string;
          type: string;
          normalized?: string;
          position: number;
        };
        location?: string;
        order: number;
        confidence: number;
        sentiment?: {
          type: string;
          intensity: number;
          emotions: Record<string, number>;
        };
        impact?: {
          scope: 'individual' | 'group' | 'global';
          severity: number;
          consequences: string[];
        };
      }>;
      timeExpressions: Array<{
        expression: string;
        type: string;
        normalized?: string;
        position: number;
      }>;
      eventChains?: Array<{
        events: Array<{
          event: any;
          role: 'cause' | 'effect' | 'neutral';
          importance: number;
        }>;
        theme: string;
        significance: number;
      }>;
      causalRelations?: Array<{
        cause: any;
        effect: any;
        confidence: number;
        basis: string[];
      }>;
    };
    semanticAnalysis?: {
      conceptNetwork: Array<{
        concept: string;
        relatedConcepts: Array<{
          concept: string;
          strength: number;
          basis: string[];
        }>;
        globalImportance: number;
      }>;
      thematicClusters: Array<{
        theme: string;
        concepts: string[];
        entities: string[];
        events: any[];
        significance: number;
      }>;
      worldBuildingElements: {
        coreBeliefs: string[];
        socialStructures: Array<{
          name: string;
          members: string[];
          relationships: Array<{
            from: string;
            to: string;
            type: string;
          }>;
        }>;
        culturalElements: Array<{
          category: string;
          elements: string[];
          significance: string;
        }>;
      };
    };
  }> {
    try {
      if (!content) {
        throw new AppError('无法分析空内容', 400);
      }

      // 计算字数
      const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = content.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(word => word.length > 0).length;
    const totalWords = chineseChars + englishWords;

    // 尝试识别章节
    const chapters: Array<{ title: string; content: string; order: number }> = [];
    
    // 常见的章节标识符
    const chapterPatterns = [
      /^第[一二三四五六七八九十百千万\d]+章\s*.*/gm,
      /^第[0-9]+章\s*.*/gm,
      /^章节[0-9]+\s*.*/gm,
      /^Chapter\s+[0-9]+\s*.*/gim,
      /^第[0-9]+节\s*.*/gm,
      /^[0-9]+\.\s*.*/gm
    ];

    let chapterSplits: string[] = [];
    
    // 尝试使用不同的模式分割章节
    for (const pattern of chapterPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 1) {
        chapterSplits = content.split(pattern).filter(part => part.trim().length > 0);
        break;
      }
    }

    // 如果没有找到章节标识符，按段落数量估算章节
    if (chapterSplits.length <= 1) {
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const wordsPerChapter = 3000; // 假设每章3000字
      const estimatedChapters = Math.max(1, Math.ceil(totalWords / wordsPerChapter));
      
      // 如果内容较短，作为单章节处理
      if (totalWords < 5000 || paragraphs.length < 5) {
        chapters.push({
          title: '第一章',
          content: content.trim(),
          order: 1
        });
      } else {
        // 将内容分割为估算的章节数
        const paragraphsPerChapter = Math.ceil(paragraphs.length / estimatedChapters);
        
        for (let i = 0; i < estimatedChapters; i++) {
          const start = i * paragraphsPerChapter;
          const end = Math.min(start + paragraphsPerChapter, paragraphs.length);
          const chapterContent = paragraphs.slice(start, end).join('\n\n');
          
          if (chapterContent.trim().length > 0) {
            chapters.push({
              title: `第${i + 1}章`,
              content: chapterContent.trim(),
              order: i + 1
            });
          }
        }
      }
    } else {
      // 使用识别的章节分割
      chapterSplits.forEach((chapterContent, index) => {
        if (chapterContent.trim().length > 0) {
          // 尝试从内容开头提取章节标题
          const lines = chapterContent.trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          
          let title = `第${index + 1}章`;
          let content = chapterContent.trim();
          
          // 如果第一行看起来像标题，将其作为章节标题
          if (firstLine.length < 100 && (
            firstLine.includes('章') || 
            firstLine.includes('Chapter') ||
            /^[0-9]+\./.test(firstLine)
          )) {
            title = firstLine;
            content = lines.slice(1).join('\n').trim();
          }
          
          chapters.push({
            title: title,
            content: content,
            order: index + 1
          });
        }
      });
    }

    // 生成内容摘要
    const summary = this.generateSummary(content);

    // 提取知识图谱数据
    const knowledgeGraph = await this.extractEntitiesAndRelations(content);

    // 提取时间表达式
    const timeExpressions = this.extractTimeExpressions(content);

    // 提取事件序列
    const events = this.extractEvents(content, knowledgeGraph.entities);

    // 分析情感和事件链
    const { chains, causalRelations } = this.analyzeEventChain(events);

    // 分析语义关联和主题聚类
    const semanticAnalysis = this.analyzeSemanticRelations(
      knowledgeGraph.entities.map(e => e.name),
      events,
      knowledgeGraph.entities
        .filter(e => e.type === 'CONCEPT')
        .map(e => ({ term: e.name, description: e.description || '' }))
    );

    // 为每个事件添加情感分析
    const eventsWithSentiment = events.map(event => {
      const emotionAnalysis = this.analyzeEmotion(event.description);
      return {
        ...event,
        sentiment: {
          type: emotionAnalysis.sentiment,
          intensity: emotionAnalysis.intensity,
          emotions: emotionAnalysis.emotions
        },
        impact: {
          scope: event.participants.length > 3 ? 'group' as const :
                event.participants.length > 1 ? 'individual' as const : 'global' as const,
          severity: emotionAnalysis.intensity,
          consequences: causalRelations
            .filter(rel => rel.cause === event)
            .map(rel => rel.effect.description)
        }
      };
    });

    // 构建时间线
    const timeline = {
      events: eventsWithSentiment.sort((a, b) => {
        // 首先按时间表达式类型排序
        if (a.timeInfo && b.timeInfo) {
          // 绝对时间优先
          if (a.timeInfo.type.startsWith('absolute') && !b.timeInfo.type.startsWith('absolute')) {
            return -1;
          }
          if (!a.timeInfo.type.startsWith('absolute') && b.timeInfo.type.startsWith('absolute')) {
            return 1;
          }
        }
        // 其次按文本顺序排序
        return a.order - b.order;
      }),
      timeExpressions,
      eventChains: chains,
      causalRelations
    };

    // 基于时间线更新实体和关系的时序属性
    knowledgeGraph.entities.forEach(entity => {
      const entityEvents = eventsWithSentiment.filter(event => 
        event.participants.includes(entity.name)
      );

      if (entityEvents.length > 0) {
        entity.attributes = entity.attributes || {};
        entity.attributes.firstAppearanceEvent = entityEvents[0].description;
        entity.attributes.eventCount = entityEvents.length;
        entity.attributes.lastAppearanceEvent = entityEvents[entityEvents.length - 1].description;

        // 添加情感弧线
        entity.emotionalArcs = entityEvents.map(event => ({
          event: event.description,
          emotion: event.sentiment?.type || 'neutral',
          intensity: event.sentiment?.intensity || 0,
          timestamp: event.timeInfo?.expression
        }));
      }
    });

    knowledgeGraph.relations.forEach(relation => {
      const relationEvents = eventsWithSentiment.filter(event => 
        event.participants.includes(relation.source) && 
        event.participants.includes(relation.target)
      );

      if (relationEvents.length > 0) {
        relation.attributes = relation.attributes || {};
        relation.attributes.firstInteractionEvent = relationEvents[0].description;
        relation.attributes.interactionCount = relationEvents.length;
        relation.attributes.lastInteractionEvent = relationEvents[relationEvents.length - 1].description;

        // 添加情感动态
        relation.emotionalDynamics = relationEvents.map(event => ({
          timestamp: event.timeInfo?.expression || `事件${event.order}`,
          sentiment: event.sentiment?.type || 'neutral',
          intensity: event.sentiment?.intensity || 0,
          context: event.description
        }));
      }
    });

    return {
      totalWords,
      estimatedChapters: chapters.length,
      chapters,
      summary,
      knowledgeGraph,
      timeline,
      semanticAnalysis
    };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('内容分析失败', 500);
    }
  }

  // 生成内容摘要
  /**
   * 提取文本中的时间表达式
   */
  private extractTimeExpressions(text: string): Array<{
    expression: string;
    type: string;
    normalized?: string;
    position: number;
  }> {
    const timePatterns = {
      absolute: {
        // 具体时间
        date: /([一二三四五六七八九十百千0-9]+年)?([一二三四五六七八九十0-9]+月)([一二三四五六七八九十0-9]+[日号])?/,
        time: /([一二三四五六七八九十0-9]+时)?([一二三四五六七八九十0-9]+分)?([一二三四五六七八九十0-9]+秒)?/,
        season: /(春|夏|秋|冬)(季|天|日)/,
        period: /(朝|夕|晨|昏|午|晚|早|夜|黎明|黄昏|傍晚|清晨)/
      },
      relative: {
        // 相对时间
        past: /(前|昨|往|曾|已|刚|当初|从前)/,
        future: /(后|明|将|即|未|待|将来|不久)/,
        sequence: /(先|后|接着|随后|之前|之后|然后)/,
        duration: /([一二三四五六七八九十百千0-9]+)(年|月|日|时|分|秒|天|载|岁)/
      },
      period: {
        // 时期
        age: /(上古|远古|古代|近代|现代)/,
        dynasty: /(朝|代|时期|时代|年代)/,
        lifecycle: /(幼年|少年|青年|中年|老年)/
      }
    };

    const timeExpressions: Array<{
      expression: string;
      type: string;
      normalized?: string;
      position: number;
    }> = [];

    // 遍历所有时间模式
    Object.entries(timePatterns).forEach(([category, patterns]) => {
      Object.entries(patterns).forEach(([type, pattern]) => {
        const regex = new RegExp(pattern, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
          timeExpressions.push({
            expression: match[0],
            type: `${category}_${type}`,
            position: match.index
          });
        }
      });
    });

    return timeExpressions.sort((a, b) => a.position - b.position);
  }

  /**
   * 提取事件及其时序信息
   */
  private extractEvents(
    content: string,
    entities: Array<{
      type: string;
      name: string;
      attributes?: Record<string, any>;
    }>
  ): Event[] {
    // 事件标识词
    const eventIndicators = {
      action: /(发生|进行|开始|结束|完成)/,
      interaction: /(遇见|相遇|见面|交谈|交手|战斗|切磋|比试)/,
      change: /(变化|转变|改变|提升|突破|衰落|陨落|崛起)/,
      movement: /(前往|抵达|到达|离开|返回|进入|出发)/
    };

    // 分句
    const sentences = content.split(/[。！？!?.]+/).filter(s => s.trim().length > 0);
    
    const events: Array<{
      description: string;
      participants: string[];
      timeInfo?: {
        expression: string;
        type: string;
        normalized?: string;
        position: number;
      };
      location?: string;
      order: number;
      confidence: number;
    }> = [];

    // 提取时间表达式
    const timeExpressions = this.extractTimeExpressions(content);

    // 遍历句子提取事件
    sentences.forEach((sentence, index) => {
      let isEvent = false;
      const participants = new Set<string>();
      let location: string | undefined;

      // 检查是否包含事件标识词
      Object.values(eventIndicators).forEach(pattern => {
        if (pattern.test(sentence)) {
          isEvent = true;
        }
      });

      // 检查实体参与情况
      entities.forEach(entity => {
        if (sentence.includes(entity.name)) {
          participants.add(entity.name);
          if (entity.type === 'LOCATION') {
            location = entity.name;
          }
        }
      });

      // 如果是事件且有参与者
      if (isEvent && participants.size > 0) {
        // 查找最近的时间表达式
        const nearestTime = timeExpressions.reduce((nearest, current) => {
          const currentDistance = Math.abs(
            content.indexOf(sentence) - current.position
          );
          const nearestDistance = nearest
            ? Math.abs(content.indexOf(sentence) - nearest.position)
            : Infinity;
          return currentDistance < nearestDistance ? current : nearest;
        }, undefined as any);

        events.push({
          description: sentence.trim(),
          participants: Array.from(participants),
          timeInfo: nearestTime,
          location,
          order: index,
          confidence: participants.size > 1 ? 0.8 : 0.6
        });
      }
    });

    return events;
  }

  /**
   * 生成内容摘要
   */
  /**
   * 分析情感倾向和强度
   */
  private analyzeSemanticRelations(
    entities: string[],
    events: Event[],
    concepts: Array<{term: string; description: string}> = []
  ): {
    conceptNetwork: Array<{
      concept: string;
      relatedConcepts: Array<{concept: string; strength: number; basis: string[]}>;
      globalImportance: number;
    }>;
    thematicClusters: Array<{
      theme: string;
      concepts: string[];
      entities: string[];
      events: Event[];
      significance: number;
    }>;
    worldBuildingElements: {
      coreBeliefs: string[];
      socialStructures: Array<{
        name: string;
        members: string[];
        relationships: Array<{from: string; to: string; type: string}>;
      }>;
      culturalElements: Array<{
        category: string;
        elements: string[];
        significance: string;
      }>;
    };
  } {
    // 构建概念关联网络
    const conceptNetwork: Array<{
      concept: string;
      relatedConcepts: Array<{concept: string; strength: number; basis: string[]}>;
      globalImportance: number;
    }> = [];

    // 从实体、事件和已知概念中提取所有概念
    const allConcepts = new Set([
      ...entities,
      ...concepts.map(c => c.term),
      ...events.flatMap(e => {
        const words = e.description.split(/[，。；？！,\.;\?!\s]/);
        return words.filter(w => w.length >= 2);
      })
    ]);

    // 分析概念间的关联
    allConcepts.forEach(concept => {
      const relatedConcepts: Array<{concept: string; strength: number; basis: string[]}> = [];
      
      allConcepts.forEach(otherConcept => {
        if (concept === otherConcept) return;

        const basis: string[] = [];
        let strength = 0;

        // 检查事件中的共现
        events.forEach(event => {
          if (
            event.description.includes(concept) && 
            event.description.includes(otherConcept)
          ) {
            strength += 0.3;
            basis.push(`在事件中共现: ${event.description.slice(0, 20)}...`);
          }

          if (
            event.participants.includes(concept) && 
            event.participants.includes(otherConcept)
          ) {
            strength += 0.4;
            basis.push('作为事件共同参与者');
          }
        });

        const conceptDesc = concepts.find(c => c.term === concept)?.description || '';
        const otherDesc = concepts.find(c => c.term === otherConcept)?.description || '';

        if (conceptDesc.includes(otherConcept)) {
          strength += 0.2;
          basis.push('概念直接引用');
        }

        if (strength > 0.2) {
          relatedConcepts.push({
            concept: otherConcept,
            strength: Math.min(strength, 1),
            basis
          });
        }
      });

      const globalImportance = relatedConcepts.reduce(
        (sum, rc) => sum + rc.strength,
        0
      ) / allConcepts.size;

      conceptNetwork.push({
        concept,
        relatedConcepts: relatedConcepts.sort((a, b) => b.strength - a.strength),
        globalImportance
      });
    });

    // 按全局重要性排序
    conceptNetwork.sort((a, b) => b.globalImportance - a.globalImportance);

    // 主题聚类
    const thematicClusters: Array<{
      theme: string;
      concepts: string[];
      entities: string[];
      events: Event[];
      significance: number;
    }> = [];

    conceptNetwork
      .filter(cn => cn.globalImportance > 0.3)
      .forEach(centralConcept => {
        const relatedConcepts = centralConcept.relatedConcepts
          .filter(rc => rc.strength > 0.3)
          .map(rc => rc.concept);

        const clusterEntities = entities.filter(entity =>
          relatedConcepts.some(rc => 
            events.some(e => 
              e.participants.includes(entity) && 
              (e.description.includes(rc) || e.participants.includes(rc))
            )
          )
        );

        const clusterEvents = events.filter(event =>
          event.description.includes(centralConcept.concept) ||
          event.participants.some(p => 
            [centralConcept.concept, ...relatedConcepts].includes(p)
          )
        );

        const significance = (
          centralConcept.globalImportance + 
          clusterEvents.length / events.length +
          clusterEntities.length / entities.length
        ) / 3;

        thematicClusters.push({
          theme: centralConcept.concept,
          concepts: [centralConcept.concept, ...relatedConcepts],
          entities: clusterEntities,
          events: clusterEvents,
          significance
        });
      });

    // 按主题重要性排序
    thematicClusters.sort((a, b) => b.significance - a.significance);

    // 世界观构建
    const worldBuildingElements = {
      coreBeliefs: this.extractCoreBeliefs(events, conceptNetwork),
      socialStructures: this.analyzeSocialStructures(entities, events),
      culturalElements: this.extractCulturalElements(events, conceptNetwork)
    };

    return {
      conceptNetwork,
      thematicClusters,
      worldBuildingElements
    };
  }

  private analyzeEmotion(text: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    intensity: number;
    emotions: Record<string, number>;
    keywords: string[];
  } {
    const emotionDictionary = {
      positive: {
        joy: ['欢喜', '快乐', '高兴', '开心', '兴奋', '愉悦', '欣喜', '雀跃', '欢欣', '喜悦'],
        love: ['喜欢', '爱', '疼爱', '宠爱', '钟情', '倾心', '仰慕', '欣赏', '敬爱', '眷恋'],
        hope: ['希望', '期待', '憧憬', '向往', '企盼', '盼望', '渴望', '祈愿', '梦想', '憬想'],
        peace: ['平静', '安宁', '祥和', '温馨', '恬淡', '宁静', '安详', '淡定', '从容', '安然'],
        gratitude: ['感激', '感谢', '谢意', '感恩', '致谢', '铭记', '念及', '答谢', '报答', '感念']
      },
      negative: {
        anger: ['愤怒', '生气', '恼火', '发火', '暴怒', '震怒', '恼怒', '气愤', '火大', '光火'],
        sadness: ['悲伤', '难过', '伤心', '哀愁', '忧郁', '悲痛', '黯然', '落寞', '凄凉', '忧伤'],
        fear: ['害怕', '恐惧', '畏惧', '惊恐', '惊惧', '胆怯', '惊慌', '惶恐', '惊惶', '恐慌'],
        hate: ['憎恨', '厌恶', '讨厌', '痛恨', '嫌弃', '反感', '恶心', '憎恶', '仇恨', '鄙视'],
        anxiety: ['焦虑', '担心', '忧心', '忧虑', '烦恼', '不安', '困扰', '忧愁', '苦恼', '烦忧']
      },
      neutral: {
        surprise: ['惊讶', '吃惊', '诧异', '意外', '震惊', '愕然', '惊奇', '惊异', '讶异', '惊诧'],
        confusion: ['困惑', '迷茫', '疑惑', '茫然', '不解', '迷惘', '费解', '懵懂', '迷惑', '困惑']
      }
    };

    // 初始化情感计数
    const emotionCounts: Record<string, number> = {};
    Object.entries(emotionDictionary).forEach(([category, emotions]) => {
      Object.entries(emotions).forEach(([emotion, keywords]) => {
        emotionCounts[emotion] = 0;
      });
    });

    // 匹配情感关键词
    const keywords: string[] = [];
    Object.entries(emotionDictionary).forEach(([category, emotions]) => {
      Object.entries(emotions).forEach(([emotion, emotionKeywords]) => {
        emotionKeywords.forEach(keyword => {
          const regex = new RegExp(keyword, 'g');
          const matches = text.match(regex);
          if (matches) {
            emotionCounts[emotion] += matches.length;
            keywords.push(...matches);
          }
        });
      });
    });

    // 计算总体情感倾向
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    Object.entries(emotionDictionary.positive).forEach(([emotion, _]) => {
      positiveScore += emotionCounts[emotion];
    });
    Object.entries(emotionDictionary.negative).forEach(([emotion, _]) => {
      negativeScore += emotionCounts[emotion];
    });
    Object.entries(emotionDictionary.neutral).forEach(([emotion, _]) => {
      neutralScore += emotionCounts[emotion];
    });

    const totalScore = positiveScore + negativeScore + neutralScore;
    const intensity = totalScore > 0 ? Math.min(Math.max(totalScore / 100, 0), 1) : 0;

    let sentiment: 'positive' | 'negative' | 'neutral';
    if (positiveScore > negativeScore && positiveScore > neutralScore) {
      sentiment = 'positive';
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    return {
      sentiment,
      intensity,
      emotions: emotionCounts,
      keywords: Array.from(new Set(keywords))
    };
  }

  /**
   * 分析事件链和因果关系
   */
  /**
   * 提取核心信念
   */
  private extractCoreBeliefs(
    events: Event[],
    conceptNetwork: Array<{
      concept: string;
      relatedConcepts: Array<{concept: string; strength: number; basis: string[]}>;
      globalImportance: number;
    }>
  ): string[] {
    const valueKeywords = [
      '认为', '相信', '觉得', '坚持', '追求',
      '应该', '必须', '一定要', '永远', '绝不',
      '对错', '善恶', '是非', '价值', '意义'
    ];

    const beliefs = new Set<string>();
    
    events.forEach(event => {
      if (valueKeywords.some(keyword => event.description.includes(keyword))) {
        const sentence = event.description.match(
          new RegExp(`[^。！？]+[${valueKeywords.join('|')}][^。！？]*[。！？]`)
        )?.[0];

        if (sentence) {
          beliefs.add(sentence.trim());
        }
      }
    });

    conceptNetwork
      .filter(cn => cn.globalImportance > 0.5)
      .forEach(cn => {
        const valueRelated = cn.relatedConcepts.filter(rc =>
          valueKeywords.some(keyword => 
            rc.concept.includes(keyword) || 
            rc.basis.some(b => b.includes(keyword))
          )
        );

        if (valueRelated.length > 0) {
          beliefs.add(`${cn.concept}作为核心价值观与${
            valueRelated.map(vr => vr.concept).join('、')
          }相关`);
        }
      });

    return Array.from(beliefs);
  }

  /**
   * 分析社会结构
   */
  private analyzeSocialStructures(
    entities: string[],
    events: Event[]
  ): Array<{
    name: string;
    members: string[];
    relationships: Array<{from: string; to: string; type: string}>;
  }> {
    const structures: Array<{
      name: string;
      members: string[];
      relationships: Array<{from: string; to: string; type: string}>;
    }> = [];

    const relationshipMarkers = {
      family: ['父', '母', '子', '女', '兄', '弟', '姐', '妹', '夫', '妻'],
      organization: ['组织', '团队', '公司', '集团', '部门', '学校', '机构'],
      social: ['朋友', '同学', '同事', '伙伴', '搭档', '师徒'],
      power: ['领导', '上司', '下属', '主管', '经理', '老板']
    };

    // 从事件中识别社会群体
    const groups = new Map<string, Set<string>>();
    
    events.forEach(event => {
      if (event.participants.length < 2) return;

      const orgMarkers = relationshipMarkers.organization;
      const hasOrgMarker = orgMarkers.some(marker => 
        event.description.includes(marker)
      );

      if (hasOrgMarker) {
        const groupName = event.description.match(
          new RegExp(`[^，。]+(?:${orgMarkers.join('|')})[^，。]*`)
        )?.[0] || '未命名组织';

        if (!groups.has(groupName)) {
          groups.set(groupName, new Set());
        }
        event.participants.forEach(p => groups.get(groupName)?.add(p));
      }
    });

    groups.forEach((members, groupName) => {
      const relationships: Array<{from: string; to: string; type: string}> = [];
      const memberArray = Array.from(members);

      for (let i = 0; i < memberArray.length; i++) {
        for (let j = i + 1; j < memberArray.length; j++) {
          const member1 = memberArray[i];
          const member2 = memberArray[j];

          const commonEvents = events.filter(event =>
            event.participants.includes(member1) &&
            event.participants.includes(member2)
          );

          if (commonEvents.length > 0) {
            let relationshipType = 'unknown';
            for (const [type, markers] of Object.entries(relationshipMarkers)) {
              if (commonEvents.some(event =>
                markers.some(marker =>
                  event.description.includes(marker)
                )
              )) {
                relationshipType = type;
                break;
              }
            }

            relationships.push({
              from: member1,
              to: member2,
              type: relationshipType
            });
          }
        }
      }

      structures.push({
        name: groupName,
        members: memberArray,
        relationships
      });
    });

    return structures;
  }

  /**
   * 提取文化元素
   */
  private extractCulturalElements(
    events: Event[],
    conceptNetwork: Array<{
      concept: string;
      relatedConcepts: Array<{concept: string; strength: number; basis: string[]}>;
      globalImportance: number;
    }>
  ): Array<{
    category: string;
    elements: string[];
    significance: string;
  }> {
    const culturalCategories = {
      customs: ['习俗', '传统', '礼仪', '规矩', '禁忌'],
      beliefs: ['信仰', '神明', '教义', '祭祀', '祈祷'],
      values: ['道德', '伦理', '美德', '品格', '操守'],
      arts: ['艺术', '音乐', '舞蹈', '诗歌', '绘画'],
      knowledge: ['智慧', '学问', '技艺', '秘术', '法门']
    };

    const culturalElements: Array<{
      category: string;
      elements: string[];
      significance: string;
    }> = [];

    Object.entries(culturalCategories).forEach(([category, keywords]) => {
      const elements = new Set<string>();

      events.forEach(event => {
        if (keywords.some(keyword => event.description.includes(keyword))) {
          const matches = event.description.match(
            new RegExp(`[^，。]+(?:${keywords.join('|')})[^，。]+`, 'g')
          );
          if (matches) {
            matches.forEach(match => elements.add(match.trim()));
          }
        }
      });

      conceptNetwork.forEach(cn => {
        if (
          keywords.some(keyword => cn.concept.includes(keyword)) ||
          cn.relatedConcepts.some(rc => 
            keywords.some(keyword => rc.concept.includes(keyword))
          )
        ) {
          elements.add(cn.concept);
        }
      });

      if (elements.size > 0) {
        const significance = events.filter(event =>
          Array.from(elements).some(element => 
            event.description.includes(element)
          )
        ).length / events.length;

        culturalElements.push({
          category,
          elements: Array.from(elements),
          significance: significance > 0.3 ? '重要' : 
                      significance > 0.1 ? '相关' : '次要'
        });
      }
    });

    return culturalElements;
  }

  private analyzeEventChain(events: Event[]): {
    chains: Array<{
      events: Array<{
        event: typeof events[0];
        role: 'cause' | 'effect' | 'neutral';
        importance: number;
      }>;
      theme: string;
      significance: number;
    }>;
    causalRelations: Array<{
      cause: typeof events[0];
      effect: typeof events[0];
      confidence: number;
      basis: string[];
    }>;
  } {
    // 因果关系标记词
    const causalMarkers = {
      cause: ['因为', '由于', '缘于', '既然', '基于', '出于', '源于'],
      effect: ['所以', '因此', '故此', '以致', '导致', '造成', '引起', '致使'],
      condition: ['如果', '若是', '倘若', '假如', '一旦', '只要'],
      purpose: ['为了', '以便', '目的是', '为的是']
    };

    const causalRelations: Array<{
      cause: typeof events[0];
      effect: typeof events[0];
      confidence: number;
      basis: string[];
    }> = [];

    // 分析相邻事件的因果关系
    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];
      
      const basis: string[] = [];
      let confidence = 0.1; // 基础置信度

      // 检查时序关系
      if (currentEvent.timeInfo && nextEvent.timeInfo) {
        if (
          currentEvent.timeInfo.type.startsWith('absolute') && 
          nextEvent.timeInfo.type.startsWith('absolute')
        ) {
          confidence += 0.2;
          basis.push('时间顺序明确');
        }
      }

      // 检查参与者重叠
      const commonParticipants = currentEvent.participants.filter(p => 
        nextEvent.participants.includes(p)
      );
      if (commonParticipants.length > 0) {
        confidence += 0.2;
        basis.push(`共同参与者: ${commonParticipants.join(', ')}`);
      }

      // 检查因果标记词
      Object.entries(causalMarkers).forEach(([type, markers]) => {
        markers.forEach(marker => {
          if (
            currentEvent.description.includes(marker) || 
            nextEvent.description.includes(marker)
          ) {
            confidence += 0.3;
            basis.push(`因果标记: ${marker}`);
          }
        });
      });

      if (confidence > 0.4) {
        causalRelations.push({
          cause: currentEvent,
          effect: nextEvent,
          confidence,
          basis
        });
      }
    }

    // 构建事件链
    const chains: Array<{
      events: Array<{
        event: typeof events[0];
        role: 'cause' | 'effect' | 'neutral';
        importance: number;
      }>;
      theme: string;
      significance: number;
    }> = [];

    // 根据参与者和主题对事件分组
    const eventGroups = new Map<string, typeof events>();
    events.forEach(event => {
      event.participants.forEach(participant => {
        if (!eventGroups.has(participant)) {
          eventGroups.set(participant, []);
        }
        eventGroups.get(participant)?.push(event);
      });
    });

    // 为每个主要参与者构建事件链
    eventGroups.forEach((participantEvents, participant) => {
      if (participantEvents.length < 2) return;

      const chainEvents = participantEvents
        .sort((a, b) => a.order - b.order)
        .map(event => {
          // 计算事件重要性
          let importance = 0.5; // 基础重要性

          // 基于因果关系调整重要性
          const asEffect = causalRelations.filter(r => r.effect === event).length;
          const asCause = causalRelations.filter(r => r.cause === event).length;
          importance += (asEffect + asCause) * 0.1;

          // 基于参与者数量调整重要性
          importance += event.participants.length * 0.05;

          // 基于时间信息调整重要性
          if (event.timeInfo?.type.startsWith('absolute')) {
            importance += 0.1;
          }

          let role: 'cause' | 'effect' | 'neutral' = 'neutral';
          if (asCause > asEffect) {
            role = 'cause';
          } else if (asEffect > asCause) {
            role = 'effect';
          }

          return { event, role, importance };
        });

      chains.push({
        events: chainEvents,
        theme: `关于${participant}的事件链`,
        significance: chainEvents.reduce((sum, e) => sum + e.importance, 0) / chainEvents.length
      });
    });

    // 按重要性排序
    chains.sort((a, b) => b.significance - a.significance);

    return { chains, causalRelations };
  }

  /**
   * 生成内容摘要
   */
  private generateSummary(content: string, maxLength: number = 200): string {
    try {
      // 移除多余的空白字符
      const cleanContent = content.replace(/\s+/g, ' ').trim();
    
      // 如果内容较短，直接返回
      if (cleanContent.length <= maxLength) {
        return cleanContent;
      }
      
      // 尝试在句子边界截断
      const sentences = cleanContent.split(/[。！？!?.]/).filter(s => s.trim().length > 0);
      let summary = '';
      
      for (const sentence of sentences) {
        if ((summary + sentence + '。').length <= maxLength) {
          summary += sentence + '。';
        } else {
          break;
        }
      }
      
      // 如果没有找到合适的句子边界，直接截断
      if (!summary) {
        summary = cleanContent.substring(0, maxLength - 3) + '...';
      }
      
      return summary.trim();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('生成摘要失败', 500);
    }
  }
}
