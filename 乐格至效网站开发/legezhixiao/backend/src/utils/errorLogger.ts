/**
 * 增强的错误日志工具
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  code?: string | number;
  details?: any;
}

/**
 * 统一的错误日志记录函数
 */
export function logError(context: string, error: unknown, additionalInfo?: any): void {
  const timestamp = new Date().toISOString();
  const errorInfo: ErrorInfo = {
    message: 'Unknown error'
  };

  // 处理不同类型的错误
  if (error instanceof Error) {
    errorInfo.message = error.message;
    errorInfo.stack = error.stack;
    if ('code' in error) {
      errorInfo.code = (error as any).code;
    }
  } else if (typeof error === 'string') {
    errorInfo.message = error;
  } else if (error && typeof error === 'object') {
    errorInfo.message = JSON.stringify(error);
  }

  // 添加额外信息
  if (additionalInfo) {
    errorInfo.details = additionalInfo;
  }

  // 输出详细的错误信息
  console.error(`\n=== 错误发生 [${timestamp}] ===`);
  console.error(`上下文: ${context}`);
  console.error(`错误信息: ${errorInfo.message}`);
  
  if (errorInfo.code) {
    console.error(`错误代码: ${errorInfo.code}`);
  }
  
  if (errorInfo.stack) {
    console.error(`错误堆栈:`);
    console.error(errorInfo.stack);
  }
  
  if (errorInfo.details) {
    console.error(`额外信息:`);
    console.error(JSON.stringify(errorInfo.details, null, 2));
  }
  
  console.error(`=== 错误结束 ===\n`);
}

/**
 * 包装异步函数以捕获错误
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(context, error);
      throw error;
    }
  }) as T;
}

/**
 * 包装同步函数以捕获错误
 */
export function wrapSync<T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      logError(context, error);
      throw error;
    }
  }) as T;
}

/**
 * 安全的模块导入函数
 */
export function safeRequire(modulePath: string, context?: string): any {
  try {
    console.log(`🔍 正在导入模块: ${modulePath}`);
    
    // 如果是相对路径，尝试从当前工作目录解析
    let actualPath = modulePath;
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      const path = require('path');
      const caller = require.main;
      if (caller) {
        const callerDir = path.dirname(caller.filename);
        actualPath = path.resolve(callerDir, modulePath);
      }
    }
    
    const loadedModule = require(actualPath);
    console.log(`✅ 模块导入成功: ${modulePath}`);
    return loadedModule;
  } catch (error) {
    const ctx = context || `导入模块 ${modulePath}`;
    logError(ctx, error);
    throw error;
  }
}

/**
 * 启动步骤包装器
 */
export async function startupStep<T>(
  stepName: string,
  fn: () => T | Promise<T>
): Promise<T> {
  try {
    console.log(`🚀 开始步骤: ${stepName}`);
    const result = await fn();
    console.log(`✅ 步骤完成: ${stepName}`);
    return result;
  } catch (error) {
    console.log(`❌ 步骤失败: ${stepName}`);
    logError(`启动步骤: ${stepName}`, error);
    throw error;
  }
}
