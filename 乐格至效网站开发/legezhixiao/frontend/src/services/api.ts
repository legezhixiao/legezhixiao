/**
 * API客户端配置
 * 提供统一的HTTP请求接口
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * API客户端
 * 使用Vite代理转发到后端，自动添加认证头
 */
class ApiClient {
  private baseURL = '/api';

  // 获取认证头
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      headers: this.getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  }

  async post<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  }

  async put<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (response.status === 204) {
      return {
        data: null as T,
        status: response.status,
        statusText: response.statusText
      };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  }
}

export const api = new ApiClient();
