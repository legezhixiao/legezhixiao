// 使用相对路径，通过Vite代理转发到后端
const API_BASE_URL = '/api';
import { handleTokenExpired, handleError } from '../utils/errorHandler';
// 文件已清空
export interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    fileInfo: {
      originalName: string;
      size: number;
      mimetype: string;
    };
    analysis: {
      totalWords: number;
      estimatedChapters: number;
      summary: string;
      chaptersPreview: Array<{
        title: string;
        order: number;
        wordCount: number;
        preview: string;
      }>;
    };
    importOptions: {
      canCreateProject: boolean;
      canImportToExisting: boolean;
      suggestedProjectName: string;
    };
  };
}

export interface ImportToNewProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: {
      id: string;
      title: string;
      description: string;
      genre: string;
      currentWordCount: number;
      chapterCount: number;
    };
    chapters: Array<{
      id: string;
      title: string;
      order: number;
      wordCount: number;
      status: string;
    }>;
    statistics: {
      totalWords: number;
      totalChapters: number;
      importedFrom: string;
    };
  };
}

export interface ImportToExistingProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: {
      id: string;
      title: string;
      currentWordCount: number;
      chapterCount: number;
    };
    importedChapters: Array<{
      id: string;
      title: string;
      order: number;
      wordCount: number;
      status: string;
    }>;
    statistics: {
      importMode: 'append' | 'replace';
      newWords: number;
      newChapters: number;
      totalWords: number;
      totalChapters: number;
      importedFrom: string;
    };
  };
}

export interface SupportedFormats {
  mimeTypes: string[];
  extensions: string[];
  maxSize: number;
  maxSizeMB: number;
}

export class FileUploadService {
  
  // 处理响应并检查令牌过期
  private static async handleResponse(response: Response, errorMessage: string = '请求失败'): Promise<any> {
    // 处理令牌过期或无效的情况
    if (response.status === 401) {
      // 清除过期的令牌
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      sessionStorage.removeItem('current_user');
      
      // 使用统一的错误处理
      const error = await response.json().catch(() => ({ error: '访问令牌已过期，请重新登录' }));
      handleTokenExpired();
      throw new Error(error.error || '访问令牌已过期，请重新登录');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `${errorMessage}: ${response.status}` }));
      const errorMsg = error.error || `${errorMessage}: ${response.status}`;
      handleError(errorMsg);
      throw new Error(errorMsg);
    }
    
    return response.json();
  }
  
  // 通用请求方法
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    return this.handleResponse(response, '请求失败');
  }
  
  // 获取支持的文件格式
  static async getSupportedFormats(): Promise<SupportedFormats> {
    return this.request<SupportedFormats>('/upload/formats', {
      method: 'GET'
    });
  }

  // 上传并解析文件（预览模式）
  static async parseFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('novel', file);

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/upload/parse`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    return this.handleResponse(response, '文件解析失败');
  }

  // 批量解析多个文件
  static async parseMultipleFiles(files: File[]): Promise<{
    files: Array<{
      file: { originalName: string; size: number };
      success: boolean;
      analysis?: any;
      error?: string;
    }>;
    totalFiles: number;
    successCount: number;
    errorCount: number;
  }> {
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const analysis = await this.parseFile(file);
        results.push({
          file: { originalName: file.name, size: file.size },
          success: true,
          analysis: analysis.data?.analysis
        });
        successCount++;
      } catch (error) {
        results.push({
          file: { originalName: file.name, size: file.size },
          success: false,
          error: error instanceof Error ? error.message : '解析失败'
        });
        errorCount++;
      }
    }

    return {
      files: results,
      totalFiles: files.length,
      successCount,
      errorCount
    };
  }

  // 导入到新项目
  static async importToNewProject(
    file: File,
    projectData: {
      projectTitle?: string;
      projectDescription?: string;
      genre?: string;
    }
  ): Promise<ImportToNewProjectResponse> {
    const formData = new FormData();
    formData.append('novel', file);
    
    if (projectData.projectTitle) {
      formData.append('projectTitle', projectData.projectTitle);
    }
    if (projectData.projectDescription) {
      formData.append('projectDescription', projectData.projectDescription);
    }
    if (projectData.genre) {
      formData.append('genre', projectData.genre);
    }

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/upload/import/new-project`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    return this.handleResponse(response, '导入到新项目失败');
  }

  // 导入到现有项目
  static async importToExistingProject(
    file: File,
    projectId: string,
    importMode: 'append' | 'replace' = 'append'
  ): Promise<ImportToExistingProjectResponse> {
    const formData = new FormData();
    formData.append('novel', file);
    formData.append('projectId', projectId);
    formData.append('importMode', importMode);

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/upload/import/existing-project`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    return this.handleResponse(response, '导入到现有项目失败');
  }

  // 验证文件格式 - 客户端同步版本
  static validateFile(file: File): { valid: boolean; error?: string } {
    // 支持的文件格式配置
    const supportedFormats = {
      extensions: ['.txt', '.md', '.docx', '.pdf', '.html', '.rtf'],
      mimeTypes: [
        'text/plain',
        'text/markdown',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf',
        'text/html',
        'application/rtf',
        'text/rtf'
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
      maxSizeMB: 50
    };
    
    // 检查文件大小
    if (file.size > supportedFormats.maxSize) {
      return {
        valid: false,
        error: `文件大小超过限制 (${supportedFormats.maxSizeMB}MB)`
      };
    }

    // 检查文件扩展名
    const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!supportedFormats.extensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `不支持的文件扩展名。支持的扩展名: ${supportedFormats.extensions.join(', ')}`
      };
    }

    return { valid: true };
  }

  // 验证文件格式 - 异步版本（使用服务器端配置）
  static async validateFileAsync(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      const formats = await this.getSupportedFormats();
      
      // 检查文件大小
      if (file.size > formats.maxSize) {
        return {
          valid: false,
          error: `文件大小超过限制 (${formats.maxSizeMB}MB)`
        };
      }

      // 检查文件类型
      if (!formats.mimeTypes.includes(file.type)) {
        return {
          valid: false,
          error: `不支持的文件类型。支持的格式: ${formats.extensions.join(', ')}`
        };
      }

      // 检查文件扩展名
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!formats.extensions.includes(fileExtension)) {
        return {
          valid: false,
          error: `不支持的文件扩展名。支持的扩展名: ${formats.extensions.join(', ')}`
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: '文件验证失败'
      };
    }
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取文件图标
  static getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'txt':
        return '📄';
      case 'md':
        return '📝';
      case 'docx':
      case 'doc':
        return '📘';
      case 'pdf':
        return '📕';
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      case 'rtf':
        return '📃';
      default:
        return '📄';
    }
  }
}
