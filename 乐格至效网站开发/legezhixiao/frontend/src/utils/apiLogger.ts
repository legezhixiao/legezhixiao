/**
 * 前端API日志记录器
 * 提供全面的API请求和错误监控
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  category: string;
  data?: any;
  stack?: string;
}

class ApiLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel = LogLevel.DEBUG;

  constructor() {
    // 监听未捕获的错误
    this.setupGlobalErrorHandling();
    this.info('ApiLogger', '前端日志系统已初始化');
  }

  private setupGlobalErrorHandling() {
    // 捕获JavaScript错误
    window.addEventListener('error', (event) => {
      this.error('GlobalError', `JavaScript错误: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // 捕获Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.error('UnhandledPromise', `未处理的Promise拒绝: ${event.reason}`, {
        reason: event.reason,
        promise: event.promise
      });
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.error('ResourceError', `资源加载失败: ${(event.target as any)?.src || (event.target as any)?.href}`, {
          target: event.target,
          type: (event.target as any)?.tagName
        });
      }
    }, true);
  }

  private log(level: LogLevel, category: string, message: string, data?: any, stack?: string) {
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      category,
      data,
      stack
    };

    this.logs.push(entry);

    // 保持日志数量限制
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 控制台输出
    this.outputToConsole(entry);

    // 发送到后端（如果需要）
    this.sendToBackend(entry);
  }

  private outputToConsole(entry: LogEntry) {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`🔍 ${prefix}`, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(`ℹ️ ${prefix}`, entry.message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${prefix}`, entry.message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${prefix}`, entry.message, entry.data || '');
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  private async sendToBackend(entry: LogEntry) {
    // 只发送警告和错误到后端
    if (entry.level < LogLevel.WARN) return;

    try {
      await fetch('/api/logs/frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // 避免无限循环，不记录发送日志的错误
      console.error('Failed to send log to backend:', error);
    }
  }

  public debug(category: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  public info(category: string, message: string, data?: any) {
    this.log(LogLevel.INFO, category, message, data);
  }

  public warn(category: string, message: string, data?: any) {
    this.log(LogLevel.WARN, category, message, data);
  }

  public error(category: string, message: string, data?: any) {
    const stack = new Error().stack;
    this.log(LogLevel.ERROR, category, message, data, stack);
  }

  public setLevel(level: LogLevel) {
    this.currentLevel = level;
    this.info('ApiLogger', `日志级别设置为: ${LogLevel[level]}`);
  }

  public getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.info('ApiLogger', '日志已清空');
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // API请求监控
  public logApiRequest(url: string, method: string, data?: any) {
    this.debug('API_REQUEST', `${method} ${url}`, { data });
  }

  public logApiResponse(url: string, method: string, status: number, data?: any, duration?: number) {
    const message = `${method} ${url} - ${status}`;
    if (status >= 400) {
      this.error('API_RESPONSE', message, { status, data, duration });
    } else {
      this.debug('API_RESPONSE', message, { status, data, duration });
    }
  }

  public logApiError(url: string, method: string, error: any) {
    this.error('API_ERROR', `${method} ${url} 失败`, {
      error: error.message || error,
      stack: error.stack
    });
  }

  // 组件生命周期监控
  public logComponentMount(componentName: string, props?: any) {
    this.debug('COMPONENT', `${componentName} 组件挂载`, { props });
  }

  public logComponentUnmount(componentName: string) {
    this.debug('COMPONENT', `${componentName} 组件卸载`);
  }

  public logComponentError(componentName: string, error: any, errorInfo?: any) {
    this.error('COMPONENT_ERROR', `${componentName} 组件错误`, {
      error: error.message || error,
      errorInfo,
      stack: error.stack
    });
  }

  // 路由监控
  public logRouteChange(from: string, to: string) {
    this.info('ROUTE', `路由变化: ${from} -> ${to}`);
  }

  // 用户行为监控
  public logUserAction(action: string, data?: any) {
    this.info('USER_ACTION', action, data);
  }

  // 性能监控
  public logPerformance(name: string, duration: number, data?: any) {
    if (duration > 1000) {
      this.warn('PERFORMANCE', `${name} 执行缓慢: ${duration}ms`, data);
    } else {
      this.debug('PERFORMANCE', `${name}: ${duration}ms`, data);
    }
  }
}

// 创建全局实例
export const apiLogger = new ApiLogger();

// 导出类型和常量
export { ApiLogger };

// 全局日志函数（简化调用）
export const log = {
  debug: (category: string, message: string, data?: any) => apiLogger.debug(category, message, data),
  info: (category: string, message: string, data?: any) => apiLogger.info(category, message, data),
  warn: (category: string, message: string, data?: any) => apiLogger.warn(category, message, data),
  error: (category: string, message: string, data?: any) => apiLogger.error(category, message, data),
};

export default apiLogger;
