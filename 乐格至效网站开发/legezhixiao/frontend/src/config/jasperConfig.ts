// Jasper AI 全局配置文件
import React from 'react';

export interface JasperConfig {
  // AI 模型配置
  model: {
    name: string;
    maxTokens: number;
    temperature: number;
    topP: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  
  // 功能开关
  features: {
    templates: boolean;
    brandVoices: boolean;
    externalTools: boolean;
    collaboration: boolean;
    autoSave: boolean;
    suggestions: boolean;
  };
  
  // UI 配置
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en-US';
    autoComplete: boolean;
    showWordCount: boolean;
    showStatistics: boolean;
    compactMode: boolean;
  };
  
  // 工具配置
  tools: {
    enabled: string[];
    config: Record<string, any>;
  };
  
  // 缓存配置
  cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number; // 生存时间（毫秒）
  };
  
  // 协作配置
  collaboration: {
    enabled: boolean;
    realTime: boolean;
    comments: boolean;
    versionControl: boolean;
  };
}

export const defaultJasperConfig: JasperConfig = {
  model: {
    name: 'DeepSeek-V3',
    maxTokens: 1500,
    temperature: 0.8,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },
  features: {
    templates: true,
    brandVoices: true,
    externalTools: true,
    collaboration: false,
    autoSave: true,
    suggestions: true
  },
  ui: {
    theme: 'light',
    language: 'zh-CN',
    autoComplete: true,
    showWordCount: true,
    showStatistics: true,
    compactMode: false
  },
  tools: {
    enabled: ['wikipedia_search', 'thesaurus', 'knowledge_graph', 'sentiment_analysis'],
    config: {
      wikipedia_search: { language: 'zh' },
      thesaurus: { maxSynonyms: 8 },
      knowledge_graph: { maxDepth: 2 },
      sentiment_analysis: { detailed: true }
    }
  },
  cache: {
    enabled: true,
    maxSize: 100,
    ttl: 10 * 60 * 1000 // 10分钟
  },
  collaboration: {
    enabled: false,
    realTime: false,
    comments: true,
    versionControl: true
  }
};

// 本地存储键
export const JASPER_CONFIG_KEY = 'jasper_ai_config';
export const JASPER_TEMPLATES_KEY = 'jasper_custom_templates';
export const JASPER_DRAFTS_KEY = 'jasper_drafts';
export const JASPER_HISTORY_KEY = 'jasper_generation_history';

// 配置管理函数
export class JasperConfigManager {
  private static instance: JasperConfigManager;
  private config: JasperConfig;
  private listeners: Array<(config: JasperConfig) => void> = [];

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): JasperConfigManager {
    if (!JasperConfigManager.instance) {
      JasperConfigManager.instance = new JasperConfigManager();
    }
    return JasperConfigManager.instance;
  }

  // 获取配置
  getConfig(): JasperConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(updates: Partial<JasperConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.notifyListeners();
  }

  // 重置配置
  resetConfig(): void {
    this.config = { ...defaultJasperConfig };
    this.saveConfig();
    this.notifyListeners();
  }

  // 添加配置监听器
  addListener(listener: (config: JasperConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 从本地存储加载配置
  private loadConfig(): JasperConfig {
    try {
      const stored = localStorage.getItem(JASPER_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultJasperConfig, ...parsed };
      }
    } catch (error) {
      console.warn('加载 Jasper 配置失败，使用默认配置:', error);
    }
    return { ...defaultJasperConfig };
  }

  // 保存配置到本地存储
  private saveConfig(): void {
    try {
      localStorage.setItem(JASPER_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('保存 Jasper 配置失败:', error);
    }
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('配置监听器执行失败:', error);
      }
    });
  }

  // 导出配置
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // 导入配置
  importConfig(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson);
      this.config = { ...defaultJasperConfig, ...imported };
      this.saveConfig();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('导入配置失败:', error);
      return false;
    }
  }

  // 获取特定功能的配置
  getFeatureConfig(feature: keyof JasperConfig['features']): boolean {
    return this.config.features[feature];
  }

  // 更新特定功能的配置
  updateFeatureConfig(feature: keyof JasperConfig['features'], enabled: boolean): void {
    this.config.features[feature] = enabled;
    this.saveConfig();
    this.notifyListeners();
  }

  // 获取UI配置
  getUIConfig(): JasperConfig['ui'] {
    return { ...this.config.ui };
  }

  // 更新UI配置
  updateUIConfig(updates: Partial<JasperConfig['ui']>): void {
    this.config.ui = { ...this.config.ui, ...updates };
    this.saveConfig();
    this.notifyListeners();
  }

  // 获取模型配置
  getModelConfig(): JasperConfig['model'] {
    return { ...this.config.model };
  }

  // 更新模型配置
  updateModelConfig(updates: Partial<JasperConfig['model']>): void {
    this.config.model = { ...this.config.model, ...updates };
    this.saveConfig();
    this.notifyListeners();
  }

  // 获取工具配置
  getToolsConfig(): JasperConfig['tools'] {
    return { ...this.config.tools };
  }

  // 更新工具配置
  updateToolsConfig(updates: Partial<JasperConfig['tools']>): void {
    this.config.tools = { ...this.config.tools, ...updates };
    this.saveConfig();
    this.notifyListeners();
  }

  // 检查工具是否启用
  isToolEnabled(toolId: string): boolean {
    return this.config.tools.enabled.includes(toolId);
  }

  // 启用/禁用工具
  toggleTool(toolId: string, enabled?: boolean): void {
    const isCurrentlyEnabled = this.isToolEnabled(toolId);
    const shouldEnable = enabled !== undefined ? enabled : !isCurrentlyEnabled;

    if (shouldEnable && !isCurrentlyEnabled) {
      this.config.tools.enabled.push(toolId);
    } else if (!shouldEnable && isCurrentlyEnabled) {
      this.config.tools.enabled = this.config.tools.enabled.filter(id => id !== toolId);
    }

    this.saveConfig();
    this.notifyListeners();
  }
}

// 导出单例实例
export const jasperConfigManager = JasperConfigManager.getInstance();

// 便捷的钩子函数（React）
export function useJasperConfig() {
  const [config, setConfig] = React.useState(jasperConfigManager.getConfig());

  React.useEffect(() => {
    const unsubscribe = jasperConfigManager.addListener(setConfig);
    return unsubscribe;
  }, []);

  return {
    config,
    updateConfig: jasperConfigManager.updateConfig.bind(jasperConfigManager),
    resetConfig: jasperConfigManager.resetConfig.bind(jasperConfigManager),
    exportConfig: jasperConfigManager.exportConfig.bind(jasperConfigManager),
    importConfig: jasperConfigManager.importConfig.bind(jasperConfigManager)
  };
}

export default JasperConfigManager;
