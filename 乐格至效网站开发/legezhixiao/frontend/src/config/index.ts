/**
 * 乐格至效 - 环境配置工具类
 * 
 * 提供统一的环境变量读取和配置管理
 * 支持开发、测试、生产环境的配置切换
 */

export interface AppConfig {
  // 基础配置
  appName: string;
  appVersion: string;
  nodeEnv: string;
  
  // API配置
  apiUrl: string;
  apiTimeout: number;
  
  // 服务模式配置
  useMockAuth: boolean;
  useMockDB: boolean;
  useMockAI: boolean;
  
  // 数据库配置
  arangoUrl: string;
  arangoDbName: string;
  arangoUsername: string;
  arangoPassword: string;
  arangoTimeout: number;
  
  // AI服务配置
  aiProvider: string;
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
  aiTimeout: number;
  
  // 安全配置
  jwtSecret: string;
  tokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  
  // 功能开关
  enableCache: boolean;
  enableDevTools: boolean;
  debugMode: boolean;
  logLevel: string;
  enableConsoleLog: boolean;
}

/**
 * 环境配置类
 */
class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 获取环境变量值
   */
  private getEnvVar(key: string, defaultValue: string = ''): string {
    // 优先获取 VITE_ 前缀的变量 (Vite环境)
    const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
    const viteValue = import.meta.env[viteKey];
    if (viteValue !== undefined) {
      return viteValue;
    }

    // 兼容 REACT_APP_ 前缀的变量
    const reactKey = key.startsWith('REACT_APP_') ? key : `REACT_APP_${key.replace('VITE_', '')}`;
    const reactValue = import.meta.env[reactKey];
    if (reactValue !== undefined) {
      return reactValue;
    }

    // 直接获取变量名
    const directValue = import.meta.env[key];
    if (directValue !== undefined) {
      return directValue;
    }

    return defaultValue;
  }

  /**
   * 获取布尔值环境变量
   */
  private getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
    const value = this.getEnvVar(key);
    if (value === '') {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * 获取数字环境变量
   */
  private getNumberEnvVar(key: string, defaultValue: number = 0): number {
    const value = this.getEnvVar(key);
    if (value === '') {
      return defaultValue;
    }
    const numValue = parseInt(value, 10);
    return isNaN(numValue) ? defaultValue : numValue;
  }

  /**
   * 加载配置
   */
  private loadConfig(): AppConfig {
    const nodeEnv = this.getEnvVar('NODE_ENV', 'development');
    
    return {
      // 基础配置
      appName: this.getEnvVar('APP_NAME', '乐格至效'),
      appVersion: this.getEnvVar('APP_VERSION', '1.0.0'),
      nodeEnv,
      
      // API配置
      apiUrl: this.getEnvVar('API_URL', 'http://localhost:3000/api'),
      apiTimeout: this.getNumberEnvVar('API_TIMEOUT', 10000),
      
      // 服务模式配置 (开发环境可以使用Mock, 生产环境强制使用真实服务)
      useMockAuth: nodeEnv === 'production' ? false : this.getBooleanEnvVar('USE_MOCK_AUTH', false),
      useMockDB: nodeEnv === 'production' ? false : this.getBooleanEnvVar('USE_MOCK_DB', false),
      useMockAI: nodeEnv === 'production' ? false : this.getBooleanEnvVar('USE_MOCK_AI', true),
      
      // 数据库配置
      arangoUrl: this.getEnvVar('ARANGO_URL', 'http://localhost:8529'),
      arangoDbName: this.getEnvVar('ARANGO_DB_NAME', 'legezhixiao_db'),
      arangoUsername: this.getEnvVar('ARANGO_USERNAME', 'root'),
      arangoPassword: this.getEnvVar('ARANGO_PASSWORD', ''),
      arangoTimeout: this.getNumberEnvVar('ARANGO_TIMEOUT', 10000),
      
      // AI服务配置
      aiProvider: this.getEnvVar('AI_PROVIDER', 'siliconflow'),
      aiApiKey: this.getEnvVar('AI_API_KEY', ''),
      aiApiUrl: this.getEnvVar('AI_API_URL', 'https://api.siliconflow.cn/v1'),
      aiModel: this.getEnvVar('AI_MODEL', 'deepseek-ai/DeepSeek-V3'),
      aiTimeout: this.getNumberEnvVar('AI_TIMEOUT', 30000),
      
      // 安全配置
      jwtSecret: this.getEnvVar('JWT_SECRET', 'default-development-secret'),
      tokenExpiresIn: this.getNumberEnvVar('TOKEN_EXPIRES_IN', 24),
      refreshTokenExpiresIn: this.getNumberEnvVar('REFRESH_TOKEN_EXPIRES_IN', 7),
      
      // 功能开关
      enableCache: this.getBooleanEnvVar('ENABLE_CACHE', true),
      enableDevTools: this.getBooleanEnvVar('ENABLE_DEV_TOOLS', nodeEnv === 'development'),
      debugMode: this.getBooleanEnvVar('DEBUG_MODE', nodeEnv === 'development'),
      logLevel: this.getEnvVar('LOG_LEVEL', nodeEnv === 'production' ? 'error' : 'info'),
      enableConsoleLog: this.getBooleanEnvVar('ENABLE_CONSOLE_LOG', nodeEnv !== 'production'),
    };
  }

  /**
   * 获取完整配置
   */
  public getConfig(): AppConfig {
    return this.config;
  }

  /**
   * 获取API配置
   */
  public getApiConfig() {
    return {
      url: this.config.apiUrl,
      timeout: this.config.apiTimeout,
    };
  }

  /**
   * 获取数据库配置
   */
  public getDatabaseConfig() {
    return {
      url: this.config.arangoUrl,
      databaseName: this.config.arangoDbName,
      username: this.config.arangoUsername,
      password: this.config.arangoPassword,
      timeout: this.config.arangoTimeout,
    };
  }

  /**
   * 获取AI服务配置
   */
  public getAIConfig() {
    return {
      provider: this.config.aiProvider,
      apiKey: this.config.aiApiKey,
      apiUrl: this.config.aiApiUrl,
      model: this.config.aiModel,
      timeout: this.config.aiTimeout,
    };
  }

  /**
   * 获取服务模式配置
   */
  public getServiceModeConfig() {
    return {
      useMockAuth: this.config.useMockAuth,
      useMockDB: this.config.useMockDB,
      useMockAI: this.config.useMockAI,
    };
  }

  /**
   * 是否为开发环境
   */
  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  /**
   * 是否为生产环境
   */
  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  /**
   * 是否启用调试模式
   */
  public isDebugMode(): boolean {
    return this.config.debugMode;
  }

  /**
   * 重新加载配置 (用于运行时配置更新)
   */
  public reloadConfig(): void {
    this.config = this.loadConfig();
  }

  /**
   * 打印配置信息 (仅在开发环境)
   */
  public printConfig(): void {
    if (this.isDevelopment() && this.config.enableConsoleLog) {
      console.group('🔧 乐格至效 - 应用配置');
      console.log('环境:', this.config.nodeEnv);
      console.log('API地址:', this.config.apiUrl);
      console.log('数据库地址:', this.config.arangoUrl);
      console.log('服务模式:', {
        认证: this.config.useMockAuth ? 'Mock' : '真实',
        数据库: this.config.useMockDB ? 'Mock' : '真实',
        AI: this.config.useMockAI ? 'Mock' : '真实',
      });
      console.log('调试模式:', this.config.debugMode ? '开启' : '关闭');
      console.groupEnd();
    }
  }
}

// 创建全局配置实例
const configManager = new ConfigManager();

// 在开发环境打印配置信息
configManager.printConfig();

export default configManager;

// 导出常用的配置获取方法
export const getConfig = () => configManager.getConfig();
export const getApiConfig = () => configManager.getApiConfig();
export const getDatabaseConfig = () => configManager.getDatabaseConfig();
export const getAIConfig = () => configManager.getAIConfig();
export const getServiceModeConfig = () => configManager.getServiceModeConfig();
export const isDevelopment = () => configManager.isDevelopment();
export const isProduction = () => configManager.isProduction();
export const isDebugMode = () => configManager.isDebugMode();
