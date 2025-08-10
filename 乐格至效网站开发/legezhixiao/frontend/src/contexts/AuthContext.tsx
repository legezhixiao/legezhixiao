import React, { createContext, useContext, useEffect, useState } from 'react'
import { message } from 'antd'
import type { User, AuthState, LoginCredentials, RegisterData, ResetPasswordData } from '../types'
import authService from '../services/authService'

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>
    register: (data: RegisterData) => Promise<void>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
    updateProfile: (updates: Partial<User>) => Promise<void>
    resetPassword: (data: ResetPasswordData) => Promise<void>
    clearError: () => void
    hasPermission: (permission: string) => boolean
    hasFeature: (feature: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null
    })

    // 初始化认证状态
    useEffect(() => {
        const initAuth = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true }))

                if (authService.isAuthenticated()) {
                    const user = authService.getCurrentUser()
                    if (user) {
                        // 刷新用户信息
                        const refreshedUser = await authService.refreshUser()
                        setState({
                            user: refreshedUser,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        })
                        return
                    }
                }

                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null
                })
            } catch (error) {
                console.error('Auth initialization failed:', error)
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: error instanceof Error ? error.message : '认证初始化失败'
                })
            }
        }

        initAuth()
    }, [])

    // 登录
    const login = async (credentials: LoginCredentials) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const { user } = await authService.login(credentials)
            
            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null
            })

            // 显示成功消息
            message.success(`欢迎回来，${user.username}！`)
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : '登录失败'
            }))
            throw error
        }
    }

    // 注册
    const register = async (data: RegisterData) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const { user } = await authService.register(data)
            
            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null
            })
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : '注册失败'
            }))
            throw error
        }
    }

    // 登出
    const logout = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true }))
            
            await authService.logout()
            
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            })
        } catch (error) {
            console.error('Logout failed:', error)
            // 即使登出失败，也要清除本地状态
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            })
        }
    }

    // 刷新用户信息
    const refreshUser = async () => {
        try {
            if (!state.isAuthenticated) {
                throw new Error('用户未登录')
            }

            const user = await authService.refreshUser()
            setState(prev => ({
                ...prev,
                user,
                error: null
            }))
        } catch (error) {
            console.error('Refresh user failed:', error)
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : '刷新用户信息失败'
            }))
            throw error
        }
    }

    // 更新用户资料
    const updateProfile = async (updates: Partial<User>) => {
        try {
            if (!state.user) {
                throw new Error('用户未登录')
            }

            const updatedUser = await authService.updateProfile(updates)
            setState(prev => ({
                ...prev,
                user: updatedUser,
                error: null
            }))
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更新资料失败'
            setState(prev => ({
                ...prev,
                error: errorMessage
            }))
            throw error
        }
    }

    // 重置密码
    const resetPassword = async (data: ResetPasswordData) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))
            
            await authService.resetPassword(data)
            
            setState(prev => ({ ...prev, isLoading: false }))
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : '重置密码失败'
            }))
            throw error
        }
    }

    // 清除错误
    const clearError = () => {
        setState(prev => ({ ...prev, error: null }))
    }

    // 检查权限
    const hasPermission = (permission: string): boolean => {
        if (!state.user) return false
        return authService.hasPermission(permission)
    }

    // 检查功能
    const hasFeature = (feature: string): boolean => {
        if (!state.user) return false
        return authService.hasFeature(feature)
    }

    const contextValue: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        resetPassword,
        clearError,
        hasPermission,
        hasFeature
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider
