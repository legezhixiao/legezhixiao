import { message, Modal } from 'antd';
import { authService } from '../services/authService';

export class ErrorHandler {
  /**
   * 处理API错误，特别是令牌过期的情况
   */
  static handleError(error: Error | string, context?: string): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // 检查是否是令牌过期错误
    if (errorMessage.includes('访问令牌已过期') || errorMessage.includes('令牌过期')) {
      this.handleTokenExpired();
      return;
    }

    // 检查是否是权限错误
    if (errorMessage.includes('未授权') || errorMessage.includes('401')) {
      this.handleUnauthorized();
      return;
    }

    // 其他错误的通用处理
    const displayMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    message.error(displayMessage);
    
    // 记录错误到控制台
    console.error('应用错误:', error, '上下文:', context);
  }

  /**
   * 处理令牌过期的情况
   */
  static handleTokenExpired(): void {
    Modal.warning({
      title: '登录已过期',
      content: '您的登录状态已过期，请重新登录以继续使用。',
      okText: '重新登录',
      onOk: () => {
        // 清除认证状态并跳转到登录页
        authService.logout();
        window.location.href = '/login';
      }
    });
  }

  /**
   * 处理未授权的情况
   */
  static handleUnauthorized(): void {
    Modal.warning({
      title: '访问被拒绝',
      content: '您没有权限执行此操作，请重新登录或联系管理员。',
      okText: '重新登录',
      onOk: () => {
        authService.logout();
        window.location.href = '/login';
      }
    });
  }

  /**
   * 处理文件上传错误
   */
  static handleFileUploadError(error: Error | string): void {
    this.handleError(error, '文件上传失败');
  }

  /**
   * 处理网络错误
   */
  static handleNetworkError(error: Error | string): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      message.error('网络连接失败，请检查网络设置后重试');
    } else {
      this.handleError(error, '网络请求失败');
    }
  }
}

/**
 * 全局错误处理器的简化接口
 */
export const handleError = ErrorHandler.handleError.bind(ErrorHandler);
export const handleTokenExpired = ErrorHandler.handleTokenExpired.bind(ErrorHandler);
export const handleFileUploadError = ErrorHandler.handleFileUploadError.bind(ErrorHandler);
export const handleNetworkError = ErrorHandler.handleNetworkError.bind(ErrorHandler);
