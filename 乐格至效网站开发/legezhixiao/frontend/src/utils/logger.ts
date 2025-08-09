// 前端日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// 日志条目接口
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  function?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
}

/**
 * 前端日志管理器
 */
class FrontendLogger {
  private sessionId: string;
  private logLevel: LogLevel;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private flushInterval = 30000; // 30秒
  private apiEndpoint = '/api/logs/frontend';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.logLevel = window.location.hostname === 'localhost' ? LogLevel.ERROR : LogLevel.INFO;
    
    // 定期发送日志到后端 - 减少频率
    setInterval(() => this.flushLogs(), this.flushInterval * 2); // 60秒
    
    // 页面卸载时发送剩余日志
    window.addEventListener('beforeunload', () => this.flushLogs());
    
    // 重新启用全局错误处理
    this.setupGlobalErrorHandlers();
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandlers() {
    // 捕获未处理的JavaScript错误
    window.addEventListener('error', (event) => {
      this.error('全局JavaScript错误', 'GlobalErrorHandler', {
        function: 'globalErrorHandler',
        metadata: { 
          type: 'javascript',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      });
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.error('未处理的Promise拒绝', 'GlobalErrorHandler', {
        function: 'unhandledPromiseRejection',
        metadata: { 
          type: 'promise',
          reason: event.reason,
          promise: event.promise
        }
      });
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.error('资源加载错误', 'GlobalErrorHandler', {
          function: 'resourceLoadError',
          metadata: { 
            type: 'resource',
            element: (event.target as HTMLElement).tagName,
            source: (event.target as any).src || (event.target as any).href,
            message: '资源加载失败'
          }
        });
      }
    }, true);
  }

  /**
   * 创建日志条目
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    module: string,
    context: {
      function?: string;
      metadata?: Record<string, any>;
      error?: Error;
    } = {}
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module,
      function: context.function,
      metadata: context.metadata,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId
    };

    if (context.error) {
      entry.error = {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name
      };
    }

    return entry;
  }

  /**
   * 获取当前用户ID
   */
  private getCurrentUserId(): string | undefined {
    // 从localStorage或其他地方获取用户ID
    return localStorage.getItem('userId') || undefined;
  }

  /**
   * 添加日志到缓冲区
   */
  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    // 控制台输出（开发环境）
    if (window.location.hostname === 'localhost') {
      const consoleMethod = this.getConsoleMethod(entry.level);
      consoleMethod(
        `[${entry.module}${entry.function ? `::${entry.function}` : ''}] ${entry.message}`,
        entry.metadata || '',
        entry.error || ''
      );
    }

    // 缓冲区溢出时清理
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // 严重错误立即发送
    if (entry.level === LogLevel.ERROR) {
      this.flushLogs();
    }
  }

  /**
   * 获取对应的控制台方法
   */
  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * 发送日志到后端
   */
  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      // 发送失败时重新加入缓冲区
      this.logBuffer.unshift(...logs);
      console.error('发送前端日志失败:', error);
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, module: string, context?: { function?: string; metadata?: Record<string, any> }) {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.addToBuffer(this.createLogEntry(LogLevel.DEBUG, message, module, context));
    }
  }

  /**
   * 信息日志
   */
  info(message: string, module: string, context?: { function?: string; metadata?: Record<string, any> }) {
    if (this.logLevel <= LogLevel.INFO) {
      this.addToBuffer(this.createLogEntry(LogLevel.INFO, message, module, context));
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, module: string, context?: { function?: string; metadata?: Record<string, any> }) {
    if (this.logLevel <= LogLevel.WARN) {
      this.addToBuffer(this.createLogEntry(LogLevel.WARN, message, module, context));
    }
  }

  /**
   * 错误日志
   */
  error(message: string, module: string, context?: { function?: string; metadata?: Record<string, any>; error?: Error }) {
    this.addToBuffer(this.createLogEntry(LogLevel.ERROR, message, module, context));
  }

  /**
   * API调用日志
   */
  apiCall(url: string, method: string, statusCode: number, duration: number, module: string) {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.addToBuffer(this.createLogEntry(level, `API调用: ${method} ${url}`, module, {
      function: 'apiCall',
      metadata: {
        url,
        method,
        statusCode,
        duration: `${duration}ms`
      }
    }));
  }

  /**
   * 用户行为日志
   */
  userAction(action: string, module: string, metadata?: Record<string, any>) {
    this.addToBuffer(this.createLogEntry(LogLevel.INFO, `用户行为: ${action}`, module, {
      function: 'userAction',
      metadata: {
        action,
        ...metadata
      }
    }));
  }

  /**
   * 性能日志
   */
  performance(operation: string, duration: number, module: string, metadata?: Record<string, any>) {
    const level = duration > 3000 ? LogLevel.WARN : LogLevel.INFO;
    this.addToBuffer(this.createLogEntry(level, `性能监控: ${operation}`, module, {
      function: 'performance',
      metadata: {
        operation,
        duration: `${duration}ms`,
        isSlowOperation: duration > 3000,
        ...metadata
      }
    }));
  }
}

// 创建全局日志实例
export const frontendLogger = new FrontendLogger();

// 为不同模块创建专用日志器
export const createModuleLogger = (moduleName: string) => ({
  debug: (message: string, context?: { function?: string; metadata?: Record<string, any> }) =>
    frontendLogger.debug(message, moduleName, context),
  info: (message: string, context?: { function?: string; metadata?: Record<string, any> }) =>
    frontendLogger.info(message, moduleName, context),
  warn: (message: string, context?: { function?: string; metadata?: Record<string, any> }) =>
    frontendLogger.warn(message, moduleName, context),
  error: (message: string, context?: { function?: string; metadata?: Record<string, any>; error?: Error }) =>
    frontendLogger.error(message, moduleName, context),
  apiCall: (url: string, method: string, statusCode: number, duration: number) =>
    frontendLogger.apiCall(url, method, statusCode, duration, moduleName),
  userAction: (action: string, metadata?: Record<string, any>) =>
    frontendLogger.userAction(action, moduleName, metadata),
  performance: (operation: string, duration: number, metadata?: Record<string, any>) =>
    frontendLogger.performance(operation, duration, moduleName, metadata)
});

export default frontendLogger;
