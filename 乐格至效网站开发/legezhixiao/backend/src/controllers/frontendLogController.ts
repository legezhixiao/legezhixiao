import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ModuleLogger } from '../utils/moduleLogger';

const frontendLoggerModule = new ModuleLogger('FrontendLogController');

interface FrontendLogEntry {
  timestamp: string;
  level: number;
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
 * 前端日志控制器
 */
export class FrontendLogController {
  /**
   * 接收前端日志
   */
  static async receiveLogs(req: Request, res: Response): Promise<void> {
    try {
      const { logs }: { logs: FrontendLogEntry[] } = req.body;
      
      if (!logs || !Array.isArray(logs)) {
        res.status(400).json({
          success: false,
          message: '无效的日志数据'
        });
        return;
      }

      // 处理每个日志条目
      logs.forEach(logEntry => {
        try {
          const logLevel = FrontendLogController.mapLogLevel(logEntry.level);
          const logMessage = `[前端] ${logEntry.message}`;
          
          // 如果是错误日志，显示详细信息
          if (logLevel === 'error' && logEntry.error) {
            logger.error(`${logMessage} - ${logEntry.error.message}`, {
              traceId: req.traceId,
              frontend: {
                module: logEntry.module,
                function: logEntry.function,
                sessionId: logEntry.sessionId,
                url: logEntry.url,
                error: {
                  name: logEntry.error.name,
                  message: logEntry.error.message,
                  stack: logEntry.error.stack
                },
                metadata: logEntry.metadata
              }
            });
          } else {
            const contextData = {
              traceId: req.traceId,
              frontend: {
                module: logEntry.module,
                function: logEntry.function,
                sessionId: logEntry.sessionId,
                userAgent: logEntry.userAgent,
                url: logEntry.url,
                userId: logEntry.userId,
                timestamp: logEntry.timestamp,
                metadata: logEntry.metadata,
                error: logEntry.error
              }
            };

            // 根据日志级别写入后端日志
            switch (logLevel) {
              case 'debug':
                logger.debug(logMessage, contextData);
                break;
              case 'info':
                logger.info(logMessage, contextData);
                break;
              case 'warn':
                logger.warn(logMessage, contextData);
                break;
              case 'error':
                logger.error(logMessage, contextData);
                break;
              default:
                logger.info(logMessage, contextData);
            }
          }
        } catch (error) {
          frontendLoggerModule.error('处理前端日志条目失败', error as Error, {
            traceId: req.traceId,
            function: 'receiveLogs',
            metadata: { logEntry }
          });
        }
      });

      frontendLoggerModule.info('接收前端日志成功', {
        traceId: req.traceId,
        function: 'receiveLogs',
        metadata: { logCount: logs.length }
      });

      res.json({
        success: true,
        message: '日志接收成功',
        processed: logs.length
      });

    } catch (error) {
      frontendLoggerModule.error('接收前端日志失败', error as Error, {
        traceId: req.traceId,
        function: 'receiveLogs'
      });

      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 映射前端日志级别到后端日志级别
   */
  private static mapLogLevel(level: number): string {
    switch (level) {
      case 0: return 'debug';
      case 1: return 'info';
      case 2: return 'warn';
      case 3: return 'error';
      default: return 'info';
    }
  }

  /**
   * 获取前端日志统计
   */
  static async getLogStats(req: Request, res: Response) {
    try {
      // 这里可以实现日志统计逻辑
      // 比如从数据库或日志文件中统计前端错误频率等
      
      res.json({
        success: true,
        data: {
          message: '前端日志统计功能待实现'
        }
      });

    } catch (error) {
      frontendLoggerModule.error('获取前端日志统计失败', error as Error, {
        traceId: req.traceId,
        function: 'getLogStats'
      });

      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}
