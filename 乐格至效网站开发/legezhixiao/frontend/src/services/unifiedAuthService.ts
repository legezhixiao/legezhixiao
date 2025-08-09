/**
 * 统一认证服务
 * 提供用户认证、授权和会话管理的统一接口
 */

import { sessionManager } from './sessionManager';

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
  displayName?: string;
  avatar?: string;
  role: 'user' | 'premium' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  preferences: UserPreferences;
  subscription?: SubscriptionInfo;
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

export interface SubscriptionInfo {
  plan: 'free' | 'basic' | 'premium' | 'pro';
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  features: string[];
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: 'sms' | 'email' | 'app';
  backupCodes?: string[];
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private currentUser: UserProfile | null = null;
  private authToken: AuthToken | null = null;
  private authListeners: Function[] = [];

  constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    try {
      // 调用实际的登录API
      const response = await this.callLoginAPI(credentials);
      
      // 保存认证信息
      this.authToken = response.token;
      this.currentUser = response.user;
      
      // 保存到本地存储
      if (credentials.rememberMe) {
        this.saveAuthToStorage();
      }
      
      // 启动会话管理
      await sessionManager.login({
        username: credentials.username,
        password: credentials.password
      });
      
      // 通知监听器
      this.notifyAuthChange('login', this.currentUser);
      
      return this.currentUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 用户注册
   */
  async register(registerData: RegisterData): Promise<UserProfile> {
    try {
      // 验证注册数据
      this.validateRegisterData(registerData);
      
      // 调用注册API
      await this.callRegisterAPI(registerData);
      
      // 自动登录
      return await this.login({
        username: registerData.username,
        password: registerData.password
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      // 调用登出API
      if (this.authToken) {
        await this.callLogoutAPI(this.authToken.accessToken);
      }
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // 清理本地状态
      this.currentUser = null;
      this.authToken = null;
      this.clearAuthStorage();
      
      // 停止会话管理
      await sessionManager.logout();
      
      // 通知监听器
      this.notifyAuthChange('logout', null);
    }
  }

  /**
   * 刷新认证令牌
   */
  async refreshToken(): Promise<AuthToken> {
    if (!this.authToken || !this.authToken.refreshToken) {
      throw new Error('没有可用的刷新令牌');
    }

    try {
      const response = await this.callRefreshTokenAPI(this.authToken.refreshToken);
      this.authToken = response.token;
      this.saveAuthToStorage();
      return this.authToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      throw this.handleAuthError(error);
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null && !this.isTokenExpired();
  }

  /**
   * 检查用户权限
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;

    // 根据用户角色检查权限
    const rolePermissions = this.getRolePermissions(this.currentUser.role);
    return rolePermissions.includes(permission);
  }

  /**
   * 检查是否有特定角色
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * 更新用户资料
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.currentUser) {
      throw new Error('用户未登录');
    }

    try {
      const response = await this.callUpdateProfileAPI(this.currentUser.id, updates);
      this.currentUser = { ...this.currentUser, ...response.user };
      this.saveAuthToStorage();
      this.notifyAuthChange('profile-updated', this.currentUser);
      return this.currentUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 更改密码
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未登录');
    }

    try {
      await this.callChangePasswordAPI(this.currentUser.id, currentPassword, newPassword);
    } catch (error) {
      console.error('Password change failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 请求密码重置
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.callPasswordResetRequestAPI(email);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 确认密码重置
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      await this.callPasswordResetConfirmAPI(token, newPassword);
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 启用两步验证
   */
  async enableTwoFactorAuth(method: 'sms' | 'email' | 'app'): Promise<TwoFactorAuth> {
    if (!this.currentUser) {
      throw new Error('用户未登录');
    }

    try {
      const response = await this.callEnableTwoFactorAPI(this.currentUser.id, method);
      return response.twoFactorAuth;
    } catch (error) {
      console.error('Two-factor auth enable failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 禁用两步验证
   */
  async disableTwoFactorAuth(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未登录');
    }

    try {
      await this.callDisableTwoFactorAPI(this.currentUser.id);
    } catch (error) {
      console.error('Two-factor auth disable failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 验证两步验证码
   */
  async verifyTwoFactorCode(code: string): Promise<boolean> {
    if (!this.currentUser) {
      throw new Error('用户未登录');
    }

    try {
      const response = await this.callVerifyTwoFactorAPI(this.currentUser.id, code);
      return response.valid;
    } catch (error) {
      console.error('Two-factor verification failed:', error);
      return false;
    }
  }

  /**
   * 获取用户订阅信息
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    if (!this.currentUser) {
      return null;
    }

    try {
      const response = await this.callGetSubscriptionAPI(this.currentUser.id);
      return response.subscription;
    } catch (error) {
      console.error('Get subscription failed:', error);
      return null;
    }
  }

  /**
   * 获取认证令牌
   */
  getAuthToken(): string | null {
    return this.authToken?.accessToken || null;
  }

  /**
   * 添加认证状态监听器
   */
  addAuthListener(callback: Function): void {
    this.authListeners.push(callback);
  }

  /**
   * 移除认证状态监听器
   */
  removeAuthListener(callback: Function): void {
    const index = this.authListeners.indexOf(callback);
    if (index !== -1) {
      this.authListeners.splice(index, 1);
    }
  }

  // 私有方法

  private initializeFromStorage(): void {
    try {
      const authData = localStorage.getItem('auth_data');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.user && parsed.token && !this.isTokenExpired(parsed.token)) {
          this.currentUser = parsed.user;
          this.authToken = parsed.token;
        } else {
          this.clearAuthStorage();
        }
      }
    } catch (error) {
      console.error('Failed to initialize from storage:', error);
      this.clearAuthStorage();
    }
  }

  private saveAuthToStorage(): void {
    if (this.currentUser && this.authToken) {
      const authData = {
        user: this.currentUser,
        token: this.authToken,
        timestamp: Date.now()
      };
      localStorage.setItem('auth_data', JSON.stringify(authData));
    }
  }

  private clearAuthStorage(): void {
    localStorage.removeItem('auth_data');
  }

  private isTokenExpired(token?: AuthToken): boolean {
    const tokenToCheck = token || this.authToken;
    if (!tokenToCheck) return true;

    const now = Math.floor(Date.now() / 1000);
    return now >= tokenToCheck.expiresIn;
  }

  private validateRegisterData(data: RegisterData): void {
    if (!data.username || data.username.length < 3) {
      throw new Error('用户名至少需要3个字符');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('请输入有效的邮箱地址');
    }

    if (!data.password || data.password.length < 8) {
      throw new Error('密码至少需要8个字符');
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('密码确认不匹配');
    }

    if (!data.acceptTerms) {
      throw new Error('请接受服务条款');
    }
  }

  private getRolePermissions(role: string): string[] {
    const permissions: { [key: string]: string[] } = {
      user: ['read', 'write', 'create_project', 'edit_project'],
      premium: ['read', 'write', 'create_project', 'edit_project', 'ai_assistant', 'export'],
      admin: ['read', 'write', 'create_project', 'edit_project', 'ai_assistant', 'export', 'manage_users', 'system_config']
    };

    return permissions[role] || [];
  }

  private notifyAuthChange(event: string, user: UserProfile | null): void {
    this.authListeners.forEach(callback => {
      try {
        callback(event, user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  private handleAuthError(error: any): AuthError {
    // 统一错误处理和格式化
    const authError: AuthError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || '认证失败',
      details: error.details
    };

    return authError;
  }

  // Mock API 方法 (实际使用时替换为真实API)

  private async callLoginAPI(credentials: LoginCredentials): Promise<{ user: UserProfile; token: AuthToken }> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟登录验证
    if (credentials.username === 'demo' && credentials.password === 'password') {
      const user: UserProfile = {
        id: `user_${Date.now()}`,
        username: credentials.username,
        email: 'demo@example.com',
        displayName: '演示用户',
        role: 'premium',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          notifications: {
            email: true,
            push: true,
            writingReminders: true,
            goalAchievements: true,
            systemUpdates: false,
            weeklyDigest: true
          },
          privacy: {
            profileVisibility: 'private',
            shareWritingStats: false,
            allowDataCollection: false,
            enableAnalytics: false
          },
          writing: {
            autoSave: true,
            autoBackup: true,
            spellCheck: true,
            grammarCheck: true,
            aiAssistance: true,
            dailyGoal: 1000,
            preferredGenre: ['奇幻', '科幻']
          }
        },
        subscription: {
          plan: 'premium',
          status: 'active',
          startDate: new Date().toISOString(),
          autoRenew: true,
          features: ['ai_assistant', 'unlimited_projects', 'export_formats', 'priority_support']
        }
      };

      const token: AuthToken = {
        accessToken: `access_${Date.now()}`,
        refreshToken: `refresh_${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
        scope: 'read write'
      };

      return { user, token };
    } else {
      throw new Error('用户名或密码错误');
    }
  }

  private async callRegisterAPI(data: RegisterData): Promise<{ user: UserProfile }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟注册成功
    const user: UserProfile = {
      id: `user_${Date.now()}`,
      username: data.username,
      email: data.email,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        notifications: {
          email: true,
          push: true,
          writingReminders: true,
          goalAchievements: true,
          systemUpdates: true,
          weeklyDigest: true
        },
        privacy: {
          profileVisibility: 'private',
          shareWritingStats: false,
          allowDataCollection: false,
          enableAnalytics: false
        },
        writing: {
          autoSave: true,
          autoBackup: true,
          spellCheck: true,
          grammarCheck: true,
          aiAssistance: true,
          dailyGoal: 500,
          preferredGenre: []
        }
      }
    };

    return { user };
  }

  private async callLogoutAPI(token: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async callRefreshTokenAPI(refreshToken: string): Promise<{ token: AuthToken }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const token: AuthToken = {
      accessToken: `access_${Date.now()}`,
      refreshToken: refreshToken,
      tokenType: 'Bearer',
      expiresIn: Math.floor(Date.now() / 1000) + 3600,
      scope: 'read write'
    };

    return { token };
  }

  private async callUpdateProfileAPI(userId: string, updates: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!this.currentUser) {
      throw new Error('用户不存在');
    }

    const user = { ...this.currentUser, ...updates };
    return { user };
  }

  private async callChangePasswordAPI(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // 模拟密码验证和更新
  }

  private async callPasswordResetRequestAPI(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async callPasswordResetConfirmAPI(token: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async callEnableTwoFactorAPI(userId: string, method: string): Promise<{ twoFactorAuth: TwoFactorAuth }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const twoFactorAuth: TwoFactorAuth = {
      enabled: true,
      method: method as any,
      backupCodes: ['123456', '789012', '345678']
    };

    return { twoFactorAuth };
  }

  private async callDisableTwoFactorAPI(userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async callVerifyTwoFactorAPI(userId: string, code: string): Promise<{ valid: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { valid: code === '123456' };
  }

  private async callGetSubscriptionAPI(userId: string): Promise<{ subscription: SubscriptionInfo }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const subscription: SubscriptionInfo = {
      plan: 'premium',
      status: 'active',
      startDate: new Date().toISOString(),
      autoRenew: true,
      features: ['ai_assistant', 'unlimited_projects', 'export_formats']
    };

    return { subscription };
  }
}

// 创建单例实例
export const unifiedAuthService = UnifiedAuthService.getInstance();
