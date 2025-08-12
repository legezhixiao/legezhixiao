import type {
    User,
    LoginCredentials,
    RegisterData,
    ResetPasswordData,
    ChangePasswordData
} from '../types'
import {
    UserRole,
    SubscriptionTier
} from '../types'

import { api } from './api'

// API 基础 URL
const API_BASE_URL = '/auth'

// 本地存储键
const CURRENT_USER_KEY = 'current_user'
const ACCESS_TOKEN_KEY = 'access_token'

class AuthService {
    constructor() {
        // 异步初始化认证状态
        this.initializeAuth()
    }

    // 初始化认证状态
    private async initializeAuth() {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
        const user = localStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem(CURRENT_USER_KEY)
        
        if (token && user) {
            // 验证令牌是否有效
            const isValid = await this.isTokenValid(token)
            if (!isValid) {
                // 令牌无效，清除本地存储
                this.logout()
            }
        }
    }

    // 验证令牌有效性 - 向后端发送验证请求
    private async isTokenValid(token: string): Promise<boolean> {
        try {
            const response = await fetch('/api/auth/verify-token', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            return response.ok
        } catch (error) {
            console.error('令牌验证失败:', error)
            return false
        }
    }

    // 用户注册
    async register(data: RegisterData): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post(`${API_BASE_URL}/register`, data)
            
            const { user, token } = response.data
            
            return { user, token }
        } catch (error) {
            console.error('注册失败:', error)
            throw error
        }
    }

    // 用户登录
    async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post(`${API_BASE_URL}/login`, credentials)
            
            // 后端返回格式：{ success: true, data: { user, accessToken, refreshToken } }
            const { user, accessToken } = response.data.data
            
            // 存储认证信息
            if (credentials.rememberMe) {
                localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
            } else {
                sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
                sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
            }
            
            return { user, token: accessToken }
        } catch (error) {
            console.error('登录失败:', error)
            throw error
        }
    }

    // 用户登出
    async logout(): Promise<void> {
        try {
            const token = localStorage.getItem(ACCESS_TOKEN_KEY)
            if (token) {
                // 通知后端登出
                await api.post(`${API_BASE_URL}/logout`)
            }
        } catch (error) {
            console.error('登出请求失败:', error)
        } finally {
            // 无论后端请求是否成功都清除本地存储
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            localStorage.removeItem(CURRENT_USER_KEY)
            sessionStorage.removeItem(ACCESS_TOKEN_KEY)
            sessionStorage.removeItem(CURRENT_USER_KEY)
        }
    }

    // 获取当前用户
    getCurrentUser(): User | null {
        const userStr = localStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem(CURRENT_USER_KEY)
        if (userStr) {
            try {
                const user = JSON.parse(userStr)
                // 转换日期字符串为Date对象
                if (user.createdAt) user.createdAt = new Date(user.createdAt)
                if (user.lastLoginAt) user.lastLoginAt = new Date(user.lastLoginAt)
                return user
            } catch (error) {
                console.error('解析用户数据失败:', error)
                return null
            }
        }
        return null
    }

    // 检查认证状态（同步方法，仅检查token存在性）
    isAuthenticated(): boolean {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
        return token !== null
    }

    // 异步验证认证状态（包含服务器验证）
    async validateAuthentication(): Promise<boolean> {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
        if (!token) return false
        
        return await this.isTokenValid(token)
    }

    // 刷新用户信息
    async refreshUser(): Promise<User> {
        try {
            const response = await api.get(`${API_BASE_URL}/me`)
            const user = response.data.user
            
            // 更新本地存储（保持原有的存储方式）
            if (localStorage.getItem(CURRENT_USER_KEY)) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
            } else {
                sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
            }
            
            return user
        } catch (error) {
            console.error('刷新用户信息失败:', error)
            throw error
        }
    }

    // 更新用户资料
    async updateProfile(updates: Partial<User>): Promise<User> {
        try {
            const response = await api.put(`${API_BASE_URL}/profile`, updates)
            const updatedUser = response.data
            
            // 更新本地存储（保持原有的存储方式）
            if (localStorage.getItem(CURRENT_USER_KEY)) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))
            } else {
                sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))
            }
            
            return updatedUser
        } catch (error) {
            console.error('更新用户资料失败:', error)
            throw error
        }
    }

    // 修改密码
    async changePassword(data: ChangePasswordData): Promise<void> {
        try {
            await api.post(`${API_BASE_URL}/change-password`, data)
        } catch (error) {
            console.error('修改密码失败:', error)
            throw error
        }
    }

    // 重置密码
    async resetPassword(data: ResetPasswordData): Promise<void> {
        try {
            await api.post(`${API_BASE_URL}/reset-password`, data)
        } catch (error) {
            console.error('重置密码失败:', error)
            throw error
        }
    }

    // 发送密码重置邮件
    async forgotPassword(email: string): Promise<void> {
        try {
            await api.post(`${API_BASE_URL}/forgot-password`, { email })
        } catch (error) {
            console.error('发送重置密码邮件失败:', error)
            throw error
        }
    }

    // 验证邮箱
    async verifyEmail(token: string): Promise<void> {
        try {
            await api.post(`${API_BASE_URL}/verify-email`, { token })
        } catch (error) {
            console.error('邮箱验证失败:', error)
            throw error
        }
    }

    // 重新发送验证邮件
    async resendVerificationEmail(): Promise<void> {
        try {
            await api.post(`${API_BASE_URL}/resend-verification`)
        } catch (error) {
            console.error('重发验证邮件失败:', error)
            throw error
        }
    }

    // 获取访问令牌
    getToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
    }

    // 检查令牌是否过期并自动清理
    async checkTokenAndCleanup(): Promise<boolean> {
        const token = this.getToken();
        if (!token) return false;

        const isValid = await this.isTokenValid(token);
        if (!isValid) {
            // 令牌无效或过期，清除存储
            this.logout();
            return false;
        }
        return true;
    }

    // 安全的API请求包装器，自动处理令牌过期
    async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
        const token = this.getToken();
        if (!token) {
            throw new Error('用户未登录');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // 如果返回401，说明令牌过期
        if (response.status === 401) {
            this.logout();
            throw new Error('访问令牌已过期，请重新登录');
        }

        return response;
    }

    // 检查用户角色
    hasRole(role: UserRole): boolean {
        const user = this.getCurrentUser()
        return user?.role === role
    }

    // 检查用户权限
    hasPermission(permission: string): boolean {
        const user = this.getCurrentUser()
        if (!user) return false

        // 管理员有所有权限
        if (user.role === UserRole.ADMIN) return true

        // 根据角色检查权限
        switch (user.role) {
            case UserRole.PREMIUM:
                return ['read', 'write', 'moderate'].includes(permission)
            case UserRole.USER:
                return ['read', 'write'].includes(permission)
            default:
                return false
        }
    }

    // 检查订阅功能
    hasFeature(feature: string): boolean {
        const user = this.getCurrentUser()
        if (!user) return false

        switch (user.subscription) {
            case SubscriptionTier.ENTERPRISE:
                return true // 企业版拥有所有功能
            case SubscriptionTier.PREMIUM:
                return ['unlimited_projects', 'ai_suggestions', 'export_advanced', 'collaboration'].includes(feature)
            case SubscriptionTier.BASIC:
                return ['ai_suggestions', 'export_basic'].includes(feature)
            case SubscriptionTier.FREE:
            default:
                return ['basic_editing'].includes(feature)
        }
    }
}

export const authService = new AuthService()
export default authService
