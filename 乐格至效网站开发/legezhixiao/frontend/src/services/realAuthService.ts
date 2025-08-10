import { message } from 'antd';

// 真实认证服务配置
const AUTH_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  USE_MOCK: import.meta.env.VITE_USE_MOCK_AUTH === 'true' || false,
  TOKEN_STORAGE_KEY: 'auth_token',
  USER_STORAGE_KEY: 'user_profile',
  REFRESH_TOKEN_KEY: 'refresh_token',
};

// 认证相关类型定义
export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'premium' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
  subscription?: SubscriptionInfo;
  avatar?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  writing: WritingSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  writingReminders: boolean;
  goalAchievements: boolean;
  systemUpdates: boolean;
  weeklyDigest: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  shareWritingStats: boolean;
  allowDataCollection: boolean;
  enableAnalytics: boolean;
}

export interface WritingSettings {
  autoSave: boolean;
  autoBackup: boolean;
  spellCheck: boolean;
  grammarCheck: boolean;
  aiAssistance: boolean;
  dailyGoal: number;
  preferredGenre: string[];
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: UserProfile;
  token: AuthToken;
  message?: string;
}

export interface SubscriptionInfo {
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt?: string;
  features: string[];
}

// 真实认证服务类
export class RealAuthService {
  private currentUser: UserProfile | null = null;
  private currentToken: AuthToken | null = null;

  constructor() {
    this.loadStoredAuth();
  }

  // 加载存储的认证信息
  private loadStoredAuth(): void {
    try {
      const storedUser = localStorage.getItem(AUTH_CONFIG.USER_STORAGE_KEY);
      const storedToken = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);

      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.currentToken = JSON.parse(storedToken);

        // 检查token是否过期
        if (this.currentToken && new Date(this.currentToken.expiresAt) <= new Date()) {
          this.logout();
        }
      }
    } catch (error) {
      console.error('加载存储的认证信息失败:', error);
      this.clearStoredAuth();
    }
  }

  // 保存认证信息到存储
  private saveAuth(user: UserProfile, token: AuthToken): void {
    this.currentUser = user;
    this.currentToken = token;
    
    localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, JSON.stringify(token));
  }

  // 清除存储的认证信息
  private clearStoredAuth(): void {
    this.currentUser = null;
    this.currentToken = null;
    
    localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  }

  // 真实登录API调用
  private async callRealLoginAPI(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '登录请求失败' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 真实注册API调用
  private async callRealRegisterAPI(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '注册请求失败' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 真实token刷新API调用
  private async callRealRefreshTokenAPI(refreshToken: string): Promise<AuthToken> {
    const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Token刷新失败' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token;
  }

  // 真实登出API调用
  private async callRealLogoutAPI(): Promise<void> {
    if (!this.currentToken) return;

    try {
      await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentToken.accessToken}`,
        },
      });
    } catch (error) {
      console.warn('登出API调用失败:', error);
      // 即使API调用失败也继续本地登出
    }
  }

  // 公共登录方法
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    try {
      const response = await this.callRealLoginAPI(credentials);

      if (response.success) {
        this.saveAuth(response.user, response.token);
        message.success('登录成功');
        return response.user;
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录过程中发生未知错误';
      message.error(errorMessage);
      throw error;
    }
  }

  // 公共注册方法
  async register(userData: RegisterData): Promise<UserProfile> {
    try {
      // 验证密码确认
      if (userData.password !== userData.confirmPassword) {
        throw new Error('密码确认不匹配');
      }

      const response = await this.callRealRegisterAPI(userData);

      if (response.success) {
        this.saveAuth(response.user, response.token);
        message.success('注册成功，欢迎使用！');
        return response.user;
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册过程中发生未知错误';
      message.error(errorMessage);
      throw error;
    }
  }

  // 公共登出方法
  async logout(): Promise<void> {
    try {
      await this.callRealLogoutAPI();
    } catch (error) {
      console.warn('登出API调用失败:', error);
    } finally {
      this.clearStoredAuth();
      message.success('已安全退出');
    }
  }

  // 刷新token
  async refreshToken(): Promise<AuthToken> {
    if (!this.currentToken?.refreshToken) {
      throw new Error('无有效的刷新token');
    }

    try {
      const newToken = await this.callRealRefreshTokenAPI(this.currentToken.refreshToken);
      
      if (this.currentUser) {
        this.saveAuth(this.currentUser, newToken);
      }
      
      return newToken;
    } catch (error) {
      // 刷新失败，清除认证信息
      this.clearStoredAuth();
      throw error;
    }
  }

  // 获取当前用户
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  // 获取当前token
  getCurrentToken(): AuthToken | null {
    return this.currentToken;
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    return this.currentUser !== null && 
           this.currentToken !== null && 
           new Date(this.currentToken.expiresAt) > new Date();
  }

  // 获取认证头
  getAuthHeader(): Record<string, string> {
    if (this.currentToken) {
      return {
        'Authorization': `${this.currentToken.tokenType} ${this.currentToken.accessToken}`,
      };
    }
    return {};
  }

  // 更新用户偏好设置
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserProfile> {
    if (!this.currentUser || !this.currentToken) {
      throw new Error('未登录');
    }

    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '更新偏好设置失败' }));
        throw new Error(errorData.message || '更新失败');
      }

      const updatedUser = await response.json();
      this.currentUser = { ...this.currentUser, preferences: updatedUser.preferences };
      
      // 更新存储
      if (this.currentToken) {
        this.saveAuth(this.currentUser, this.currentToken);
      }

      message.success('偏好设置已更新');
      return this.currentUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新偏好设置失败';
      message.error(errorMessage);
      throw error;
    }
  }

  // 为兼容性添加别名方法
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserProfile> {
    return this.updatePreferences(preferences);
  }
}

// 创建真实认证服务实例
export const realAuthService = new RealAuthService();

// 默认导出真实服务
export default realAuthService;
