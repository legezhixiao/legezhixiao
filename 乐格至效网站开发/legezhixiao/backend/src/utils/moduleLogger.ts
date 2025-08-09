import { logger } from '../utils/logger';

// 日志上下文类型
interface LogContext {
  traceId?: string;
  module: string;
  function: string;
  userId?: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

/**
 * 增强日志工具类
 * 提供统一的日志记录接口，支持上下文信息
 */
export class ModuleLogger {
  private moduleName: string;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  /**
   * 构建日志消息
   */
  private buildLogMessage(level: string, message: string, context: Partial<LogContext> = {}): any {
    return {
      message,
      module: this.moduleName,
      function: context.function || 'unknown',
      traceId: context.traceId,
      userId: context.userId,
      projectId: context.projectId,
      timestamp: new Date().toISOString(),
      level,
      ...context.metadata
    };
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error, context: Partial<LogContext> = {}) {
    const logData = this.buildLogMessage('error', message, context);
    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    logger.error(logData);
  }

  /**
   * 警告日志
   */
  warn(message: string, context: Partial<LogContext> = {}) {
    logger.warn(this.buildLogMessage('warn', message, context));
  }

  /**
   * 信息日志
   */
  info(message: string, context: Partial<LogContext> = {}) {
    logger.info(this.buildLogMessage('info', message, context));
  }

  /**
   * 调试日志
   */
  debug(message: string, context: Partial<LogContext> = {}) {
    logger.debug(this.buildLogMessage('debug', message, context));
  }

  /**
   * 性能监控日志
   */
  performance(operation: string, duration: number, context: Partial<LogContext> = {}) {
    const logData = this.buildLogMessage('info', `性能监控: ${operation}`, context);
    logData.performance = {
      operation,
      duration: `${duration}ms`,
      isSlowOperation: duration > 1000
    };
    
    if (duration > 1000) {
      logger.warn(logData);
    } else {
      logger.info(logData);
    }
  }

  /**
   * 业务事件日志
   */
  businessEvent(event: string, data: Record<string, any>, context: Partial<LogContext> = {}) {
    const logData = this.buildLogMessage('info', `业务事件: ${event}`, context);
    logData.businessEvent = {
      event,
      data
    };
    logger.info(logData);
  }

  /**
   * 数据库操作日志
   */
  dbOperation(operation: string, table: string, duration?: number, context: Partial<LogContext> = {}) {
    const logData = this.buildLogMessage('debug', `数据库操作: ${operation}`, context);
    logData.database = {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined
    };
    logger.debug(logData);
  }

  /**
   * API调用日志
   */
  apiCall(url: string, method: string, statusCode: number, duration: number, context: Partial<LogContext> = {}) {
    const logLevel = statusCode >= 400 ? 'error' : 'info';
    const logData = this.buildLogMessage(logLevel, `API调用: ${method} ${url}`, context);
    logData.api = {
      url,
      method,
      statusCode,
      duration: `${duration}ms`
    };
    logger.log(logLevel, logData);
  }
}

/**
 * 模块日志管理器
 */
export class LoggerManager {
  private static instances: Map<string, ModuleLogger> = new Map();

  /**
   * 获取模块日志实例
   */
  static getLogger(moduleName: string): ModuleLogger {
    if (!this.instances.has(moduleName)) {
      this.instances.set(moduleName, new ModuleLogger(moduleName));
    }
    return this.instances.get(moduleName)!;
  }

  /**
   * 记录系统启动事件
   */
  static systemStart(version: string, environment: string) {
    logger.info('系统启动', {
      event: 'SYSTEM_START',
      version,
      environment,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      nodeVersion: process.version
    });
  }

  /**
   * 记录系统关闭事件
   */
  static systemShutdown(reason: string) {
    logger.info('系统关闭', {
      event: 'SYSTEM_SHUTDOWN',
      reason,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}

// 导出常用模块日志实例
export const controllerLogger = LoggerManager.getLogger('Controller');
export const serviceLogger = LoggerManager.getLogger('Service');
export const middlewareLogger = LoggerManager.getLogger('Middleware');
export const dbLogger = LoggerManager.getLogger('Database');
export const aiLogger = LoggerManager.getLogger('AI');
