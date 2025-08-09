/**
 * 预设配置服务
 * 管理应用程序的预设配置和模板
 */

export interface PresetConfig {
  id: string;
  name: string;
  type: 'writing' | 'character' | 'plot' | 'world' | 'constraint';
  category: string;
  description: string;
  config: any;
  isDefault: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WritingPreset {
  genre: string;
  style: string;
  tone: string;
  targetWords: number;
  chapterStructure: {
    averageLength: number;
    targetChapters: number;
  };
  constraints: string[];
}

export interface CharacterPreset {
  archetypes: string[];
  personalityTraits: string[];
  backgroundElements: string[];
  relationshipTypes: string[];
}

export interface PlotPreset {
  structure: string;
  acts: number;
  keyEvents: string[];
  conflictTypes: string[];
  themes: string[];
}

export interface WorldPreset {
  setting: string;
  timeframe: string;
  technology: string;
  magic: boolean;
  cultures: string[];
  geography: string[];
}

export interface ConstraintPreset {
  rules: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    autoFix: boolean;
  }>;
}

export class PresetConfigService {
  private presets: Map<string, PresetConfig> = new Map();

  constructor() {
    this.initializeDefaultPresets();
  }

  /**
   * 初始化默认预设
   */
  private initializeDefaultPresets(): void {
    // 写作预设
    this.addDefaultPreset('fantasy-novel', '奇幻小说', 'writing', {
      genre: '奇幻',
      style: '第三人称',
      tone: '严肃',
      targetWords: 100000,
      chapterStructure: {
        averageLength: 3000,
        targetChapters: 33
      },
      constraints: ['character_consistency', 'world_building', 'magic_system']
    });

    this.addDefaultPreset('romance-novel', '言情小说', 'writing', {
      genre: '言情',
      style: '第一人称',
      tone: '轻松',
      targetWords: 80000,
      chapterStructure: {
        averageLength: 2500,
        targetChapters: 32
      },
      constraints: ['emotion_consistency', 'relationship_development']
    });

    // 角色预设
    this.addDefaultPreset('hero-archetype', '英雄原型', 'character', {
      archetypes: ['英雄', '导师', '守门人', '盟友', '反派'],
      personalityTraits: ['勇敢', '正义', '坚韧', '善良', '智慧'],
      backgroundElements: ['出身', '成长经历', '重要事件', '技能特长'],
      relationshipTypes: ['师生', '朋友', '恋人', '敌人', '家人']
    });

    // 情节预设
    this.addDefaultPreset('three-act', '三幕结构', 'plot', {
      structure: '三幕式',
      acts: 3,
      keyEvents: ['起始事件', '第一转折点', '中点', '第二转折点', '高潮', '结局'],
      conflictTypes: ['人物内心冲突', '人物间冲突', '人与环境冲突'],
      themes: ['成长', '爱情', '友谊', '正义', '救赎']
    });

    // 世界构建预设
    this.addDefaultPreset('medieval-fantasy', '中世纪奇幻', 'world', {
      setting: '中世纪奇幻世界',
      timeframe: '中世纪',
      technology: '冷兵器时代',
      magic: true,
      cultures: ['人类王国', '精灵族', '矮人族', '兽人部落'],
      geography: ['王都', '森林', '山脉', '荒野', '古遗迹']
    });

    // 约束预设
    this.addDefaultPreset('basic-constraints', '基础约束', 'constraint', {
      rules: [
        {
          type: 'character_consistency',
          description: '角色行为一致性检查',
          severity: 'high',
          autoFix: false
        },
        {
          type: 'timeline_consistency',
          description: '时间线一致性检查',
          severity: 'medium',
          autoFix: true
        },
        {
          type: 'grammar_check',
          description: '语法检查',
          severity: 'low',
          autoFix: true
        }
      ]
    });
  }

  /**
   * 添加默认预设
   */
  private addDefaultPreset(id: string, name: string, type: PresetConfig['type'], config: any): void {
    const preset: PresetConfig = {
      id,
      name,
      type,
      category: 'default',
      description: `默认${name}预设`,
      config,
      isDefault: true,
      isCustom: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.presets.set(id, preset);
  }

  /**
   * 获取所有预设
   */
  getAllPresets(): PresetConfig[] {
    return Array.from(this.presets.values());
  }

  /**
   * 根据类型获取预设
   */
  getPresetsByType(type: PresetConfig['type']): PresetConfig[] {
    return this.getAllPresets().filter(preset => preset.type === type);
  }

  /**
   * 获取单个预设
   */
  getPreset(id: string): PresetConfig | undefined {
    return this.presets.get(id);
  }

  /**
   * 添加自定义预设
   */
  addCustomPreset(preset: Omit<PresetConfig, 'id' | 'isDefault' | 'isCustom' | 'createdAt' | 'updatedAt'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const customPreset: PresetConfig = {
      ...preset,
      id,
      isDefault: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.presets.set(id, customPreset);
    return id;
  }

  /**
   * 更新预设
   */
  updatePreset(id: string, updates: Partial<PresetConfig>): boolean {
    const preset = this.presets.get(id);
    if (!preset) return false;

    // 不允许修改默认预设的核心属性
    if (preset.isDefault && (updates.isDefault !== undefined || updates.config !== undefined)) {
      return false;
    }

    const updatedPreset: PresetConfig = {
      ...preset,
      ...updates,
      id, // 确保ID不被修改
      updatedAt: new Date().toISOString()
    };

    this.presets.set(id, updatedPreset);
    return true;
  }

  /**
   * 删除预设
   */
  deletePreset(id: string): boolean {
    const preset = this.presets.get(id);
    if (!preset) return false;

    // 不允许删除默认预设
    if (preset.isDefault) return false;

    return this.presets.delete(id);
  }

  /**
   * 克隆预设
   */
  clonePreset(id: string, newName?: string): string | null {
    const preset = this.presets.get(id);
    if (!preset) return null;

    const clonedPreset = {
      ...preset,
      name: newName || `${preset.name} (副本)`,
      category: 'custom',
      isDefault: false,
      isCustom: true
    };

    return this.addCustomPreset(clonedPreset);
  }

  /**
   * 导出预设
   */
  exportPreset(id: string): string | null {
    const preset = this.presets.get(id);
    if (!preset) return null;

    return JSON.stringify(preset, null, 2);
  }

  /**
   * 导入预设
   */
  importPreset(presetJson: string): string | null {
    try {
      const preset = JSON.parse(presetJson) as PresetConfig;
      
      // 验证预设格式
      if (!preset.name || !preset.type || !preset.config) {
        throw new Error('无效的预设格式');
      }

      // 重新生成ID并标记为自定义
      const customPreset = {
        ...preset,
        category: 'imported',
        isDefault: false,
        isCustom: true
      };

      return this.addCustomPreset(customPreset);
    } catch (error) {
      console.error('Failed to import preset:', error);
      return null;
    }
  }

  /**
   * 搜索预设
   */
  searchPresets(query: string): PresetConfig[] {
    const searchTerm = query.toLowerCase();
    return this.getAllPresets().filter(preset =>
      preset.name.toLowerCase().includes(searchTerm) ||
      preset.description.toLowerCase().includes(searchTerm) ||
      preset.category.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * 重置为默认预设
   */
  resetToDefaults(): void {
    // 清除所有自定义预设
    for (const [id, preset] of this.presets) {
      if (preset.isCustom) {
        this.presets.delete(id);
      }
    }
  }
}

// 创建单例实例
export const presetConfigService = new PresetConfigService();

// 设置预设配置的辅助函数
export function setupPresetConfig(): void {
  // 初始化预设配置
  console.log('Setting up preset configurations...');
  // 这里可以添加一些默认预设的初始化逻辑
}
