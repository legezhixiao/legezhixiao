/**
 * 系统配置服务
 * 管理应用程序的系统级配置和设置
 */
// 文件已清空
export interface SystemConfig {
  app: AppConfig;
  api: APIConfig;
  ai: AIConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  features: FeatureFlags;
  ui: UIConfig;
}

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  supportedLanguages: string[];
  defaultLanguage: string;
  timezone: string;
}

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  endpoints: {
    auth: string;
    projects: string;
    ai: string;
    upload: string;
    user: string;
  };
}

export interface AIConfig {
  providers: AIProvider[];
  defaultProvider: string;
  models: AIModel[];
  defaultModel: string;
  constraints: ConstraintConfig;
  rateLimits: RateLimitConfig;
}

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'siliconflow' | 'deepseek' | 'local';
  baseURL: string;
  requiresAPIKey: boolean;
  supportedModels: string[];
  features: AIFeature[];
  pricing?: PricingInfo;
}

export interface AIModel {
  id: string;
  providerId: string;
  name: string;
  description: string;
  maxTokens: number;
  costPer1kTokens?: number;
  capabilities: ModelCapability[];
  languages: string[];
  specialties: string[];
}

export interface AIFeature {
  name: string;
  description: string;
  enabled: boolean;
}

export interface ModelCapability {
  type: 'completion' | 'chat' | 'editing' | 'analysis';
  quality: 'low' | 'medium' | 'high' | 'excellent';
}

export interface PricingInfo {
  inputTokens: number;
  outputTokens: number;
  currency: string;
}

export interface ConstraintConfig {
  modules: ConstraintModule[];
  defaultSeverity: 'low' | 'medium' | 'high';
  autoFixEnabled: boolean;
  realTimeChecking: boolean;
}

export interface ConstraintModule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: ConstraintRule[];
}

export interface ConstraintRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  autoFix: boolean;
  pattern?: string;
  validator?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  burstLimit: number;
  cooldownPeriod: number;
}

export interface StorageConfig {
  local: LocalStorageConfig;
  cloud: CloudStorageConfig;
  backup: BackupConfig;
}

export interface LocalStorageConfig {
  enabled: boolean;
  maxSize: number; // MB
  compression: boolean;
  encryption: boolean;
  autoCleanup: boolean;
  retentionDays: number;
}



export interface CloudStorageConfig {
  enabled: boolean;
  provider: 'aws' | 'azure' | 'gcp' | 'custom';
  syncInterval: number; // minutes
  conflictResolution: 'client' | 'server' | 'manual';
  maxFileSize: number; // MB
}

export interface BackupConfig {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  retention: number; // days
  compression: boolean;
  location: 'local' | 'cloud' | 'both';
}

export interface SecurityConfig {
  authentication: AuthConfig;
  encryption: EncryptionConfig;
  privacy: PrivacyConfig;
}

export interface AuthConfig {
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  passwordPolicy: PasswordPolicy;
  twoFactorAuth: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
}

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  saltRounds: number;
  dataEncryption: boolean;
}

export interface PrivacyConfig {
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
  telemetry: boolean;
  gdprCompliance: boolean;
}

export interface PerformanceConfig {
  caching: CacheConfig;
  optimization: OptimizationConfig;
  monitoring: MonitoringConfig;
}

export interface CacheConfig {
  enabled: boolean;
  maxSize: number; // MB
  ttl: number; // seconds
  strategies: CacheStrategy[];
}

export interface CacheStrategy {
  name: string;
  pattern: string;
  duration: number;
}

export interface OptimizationConfig {
  lazyLoading: boolean;
  codesplitting: boolean;
  imageCompression: boolean;
  minification: boolean;
  bundleAnalysis: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  errorTracking: boolean;
  performanceMetrics: boolean;
  userAnalytics: boolean;
  realTimeMonitoring: boolean;
}

export interface FeatureFlags {
  [featureName: string]: boolean;
}

export interface UIConfig {
  themes: ThemeConfig[];
  defaultTheme: string;
  layout: LayoutConfig;
  accessibility: AccessibilityConfig;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ColorPalette;
  fonts: FontConfig;
  spacing: SpacingConfig;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface FontConfig {
  primary: string;
  secondary: string;
  monospace: string;
  sizes: FontSizes;
  weights: FontWeights;
}

export interface FontSizes {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface FontWeights {
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface SpacingConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface LayoutConfig {
  sidebar: SidebarConfig;
  header: HeaderConfig;
  editor: EditorLayoutConfig;
}

export interface SidebarConfig {
  width: number;
  collapsible: boolean;
  defaultCollapsed: boolean;
  position: 'left' | 'right';
}

export interface HeaderConfig {
  height: number;
  sticky: boolean;
  showLogo: boolean;
  showNavigation: boolean;
}

export interface EditorLayoutConfig {
  lineHeight: number;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

export interface AccessibilityConfig {
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  textScaling: boolean;
}

export class SystemConfigService {
  private static instance: SystemConfigService;
  private config: SystemConfig;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  static getInstance(): SystemConfigService {
    if (!SystemConfigService.instance) {
      SystemConfigService.instance = new SystemConfigService();
    }
    return SystemConfigService.instance;
  }

  /**
   * 获取完整配置
   */
  getConfig(): SystemConfig {
    return { ...this.config };
  }

  /**
   * 获取特定配置节
   */
  getSection<T extends keyof SystemConfig>(section: T): SystemConfig[T] {
    return { ...this.config[section] };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<SystemConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
    
    this.saveConfig();
    this.notifyListeners('config-updated', this.config);
  }

  /**
   * 更新特定配置节
   */
  updateSection<T extends keyof SystemConfig>(
    section: T, 
    updates: Partial<SystemConfig[T]>
  ): void {
    this.config[section] = {
      ...this.config[section],
      ...updates
    };
    
    this.saveConfig();
    this.notifyListeners(`${section}-updated`, this.config[section]);
  }

  /**
   * 重置为默认配置
   */
  resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    this.notifyListeners('config-reset', this.config);
  }

  /**
   * 获取AI提供商列表
   */
  getAIProviders(): AIProvider[] {
    return this.config.ai.providers;
  }

  /**
   * 获取AI模型列表
   */
  getAIModels(providerId?: string): AIModel[] {
    if (providerId) {
      return this.config.ai.models.filter(model => model.providerId === providerId);
    }
    return this.config.ai.models;
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeConfig {
    const themeId = this.config.ui.defaultTheme;
    return this.config.ui.themes.find(theme => theme.id === themeId) || this.config.ui.themes[0];
  }

  /**
   * 设置主题
   */
  setTheme(themeId: string): void {
    if (this.config.ui.themes.some(theme => theme.id === themeId)) {
      this.updateSection('ui', { defaultTheme: themeId });
    }
  }

  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.config.features[featureName] === true;
  }

  /**
   * 切换功能开关
   */
  toggleFeature(featureName: string): void {
    this.config.features[featureName] = !this.config.features[featureName];
    this.saveConfig();
    this.notifyListeners('feature-toggled', { featureName, enabled: this.config.features[featureName] });
  }

  /**
   * 获取API端点
   */
  getAPIEndpoint(name: keyof APIConfig['endpoints']): string {
    return `${this.config.api.baseURL}${this.config.api.endpoints[name]}`;
  }

  /**
   * 获取约束模块
   */
  getConstraintModules(): ConstraintModule[] {
    return this.config.ai.constraints.modules;
  }

  /**
   * 更新约束模块
   */
  updateConstraintModule(moduleId: string, updates: Partial<ConstraintModule>): void {
    const moduleIndex = this.config.ai.constraints.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex !== -1) {
      this.config.ai.constraints.modules[moduleIndex] = {
        ...this.config.ai.constraints.modules[moduleIndex],
        ...updates
      };
      this.saveConfig();
      this.notifyListeners('constraint-module-updated', { moduleId, updates });
    }
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson) as SystemConfig;
      
      // 验证配置结构
      if (this.validateConfig(importedConfig)) {
        this.config = importedConfig;
        this.saveConfig();
        this.notifyListeners('config-imported', this.config);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }

  /**
   * 添加配置变更监听器
   */
  addListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 移除配置变更监听器
   */
  removeListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 私有方法

  private getDefaultConfig(): SystemConfig {
    return {
      app: {
        name: '乐格至效 AI小说创作平台',
        version: '1.0.0',
        environment: 'development',
        debugMode: true,
        logLevel: 'info',
        supportedLanguages: ['zh-CN', 'en-US'],
        defaultLanguage: 'zh-CN',
        timezone: 'Asia/Shanghai'
      },
      api: {
        baseURL: 'http://localhost:8001/api/v1',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        endpoints: {
          auth: '/auth',
          projects: '/projects',
          ai: '/ai',
          upload: '/upload',
          user: '/user'
        }
      },
      ai: {
        providers: [
          {
            id: 'siliconflow',
            name: 'SiliconFlow',
            type: 'siliconflow',
            baseURL: 'https://api.siliconflow.cn/v1',
            requiresAPIKey: true,
            supportedModels: ['deepseek-ai/DeepSeek-V3'],
            features: [
              { name: 'completion', description: '文本补全', enabled: true },
              { name: 'chat', description: '对话生成', enabled: true },
              { name: 'editing', description: '文本编辑', enabled: true }
            ]
          }
        ],
        defaultProvider: 'siliconflow',
        models: [
          {
            id: 'deepseek-v3',
            providerId: 'siliconflow',
            name: 'DeepSeek-V3',
            description: 'DeepSeek最新版本，擅长中文创作',
            maxTokens: 8192,
            capabilities: [
              { type: 'completion', quality: 'excellent' },
              { type: 'chat', quality: 'excellent' }
            ],
            languages: ['zh-CN', 'en-US'],
            specialties: ['creative-writing', 'dialogue', 'narrative']
          }
        ],
        defaultModel: 'deepseek-v3',
        constraints: {
          modules: [
            {
              id: 'character-consistency',
              name: '角色一致性',
              description: '检查角色行为和特征的一致性',
              enabled: true,
              rules: [
                {
                  id: 'character-voice',
                  name: '角色声音',
                  description: '确保角色对话风格一致',
                  severity: 'medium',
                  autoFix: false
                }
              ]
            }
          ],
          defaultSeverity: 'medium',
          autoFixEnabled: true,
          realTimeChecking: true
        },
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 100000,
          burstLimit: 10,
          cooldownPeriod: 60
        }
      },
      storage: {
        local: {
          enabled: true,
          maxSize: 500,
          compression: true,
          encryption: false,
          autoCleanup: true,
          retentionDays: 30
        },
        cloud: {
          enabled: false,
          provider: 'custom',
          syncInterval: 15,
          conflictResolution: 'manual',
          maxFileSize: 10
        },
        backup: {
          enabled: true,
          frequency: 'hourly',
          retention: 7,
          compression: true,
          location: 'local'
        }
      },
      security: {
        authentication: {
          sessionTimeout: 1440,
          maxLoginAttempts: 5,
          lockoutDuration: 30,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            preventReuse: 5
          },
          twoFactorAuth: false
        },
        encryption: {
          algorithm: 'AES-256',
          keySize: 256,
          saltRounds: 12,
          dataEncryption: false
        },
        privacy: {
          dataCollection: false,
          analytics: false,
          crashReporting: true,
          telemetry: false,
          gdprCompliance: true
        }
      },
      performance: {
        caching: {
          enabled: true,
          maxSize: 100,
          ttl: 3600,
          strategies: [
            { name: 'api-cache', pattern: '/api/*', duration: 300 },
            { name: 'static-cache', pattern: '/static/*', duration: 86400 }
          ]
        },
        optimization: {
          lazyLoading: true,
          codesplitting: true,
          imageCompression: true,
          minification: true,
          bundleAnalysis: false
        },
        monitoring: {
          enabled: false,
          errorTracking: true,
          performanceMetrics: false,
          userAnalytics: false,
          realTimeMonitoring: false
        }
      },
      features: {
        'ai-assistance': true,
        'real-time-collaboration': false,
        'version-control': true,
        'export-formats': true,
        'custom-themes': true,
        'plugin-system': false,
        'advanced-analytics': false,
        'cloud-sync': false
      },
      ui: {
        themes: [
          {
            id: 'light',
            name: '明亮主题',
            colors: {
              primary: '#1976d2',
              secondary: '#424242',
              accent: '#82b1ff',
              background: '#ffffff',
              surface: '#f5f5f5',
              text: '#212121',
              textSecondary: '#757575',
              border: '#e0e0e0',
              error: '#f44336',
              warning: '#ff9800',
              success: '#4caf50',
              info: '#2196f3'
            },
            fonts: {
              primary: 'Roboto, sans-serif',
              secondary: 'Noto Sans SC, sans-serif',
              monospace: 'Fira Code, monospace',
              sizes: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem'
              },
              weights: {
                light: 300,
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700
              }
            },
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem',
              '2xl': '3rem'
            }
          },
          {
            id: 'dark',
            name: '深色主题',
            colors: {
              primary: '#90caf9',
              secondary: '#f5f5f5',
              accent: '#82b1ff',
              background: '#121212',
              surface: '#1e1e1e',
              text: '#ffffff',
              textSecondary: '#b3b3b3',
              border: '#333333',
              error: '#cf6679',
              warning: '#ffb74d',
              success: '#81c784',
              info: '#64b5f6'
            },
            fonts: {
              primary: 'Roboto, sans-serif',
              secondary: 'Noto Sans SC, sans-serif',
              monospace: 'Fira Code, monospace',
              sizes: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem'
              },
              weights: {
                light: 300,
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700
              }
            },
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem',
              '2xl': '3rem'
            }
          }
        ],
        defaultTheme: 'light',
        layout: {
          sidebar: {
            width: 300,
            collapsible: true,
            defaultCollapsed: false,
            position: 'left'
          },
          header: {
            height: 64,
            sticky: true,
            showLogo: true,
            showNavigation: true
          },
          editor: {
            lineHeight: 1.6,
            fontSize: 14,
            fontFamily: 'Fira Code, monospace',
            tabSize: 2,
            wordWrap: true,
            minimap: false
          }
        },
        accessibility: {
          highContrast: false,
          screenReader: false,
          keyboardNavigation: true,
          focusIndicators: true,
          textScaling: false
        }
      }
    };
  }

  private loadConfig(): void {
    try {
      // 本地存储已废弃
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private saveConfig(): void {
    try {
      // 本地存储已废弃
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  private validateConfig(config: any): boolean {
    // 简单的配置验证
    return config && 
           config.app && 
           config.api && 
           config.ai && 
           config.storage && 
           config.security && 
           config.performance && 
           config.features && 
           config.ui;
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in config listener:', error);
        }
      });
    }
  }
}

// 创建单例实例
export const systemConfig = SystemConfigService.getInstance();
