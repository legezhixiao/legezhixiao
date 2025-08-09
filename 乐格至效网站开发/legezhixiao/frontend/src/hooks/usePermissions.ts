import { useAuth } from '../contexts/AuthContext'
import { UserRole, SubscriptionTier } from '../types'

// 权限定义
export const PERMISSIONS = {
    // 基础权限
    READ: 'read',
    WRITE: 'write',
    
    // 小说权限
    CREATE_PROJECT: 'create_project',
    DELETE_PROJECT: 'delete_project',
    EXPORT_PROJECT: 'export_project',
    SHARE_PROJECT: 'share_project',
    
    // AI功能权限
    AI_BASIC: 'ai_basic',
    AI_ADVANCED: 'ai_advanced',
    AI_UNLIMITED: 'ai_unlimited',
    
    // 管理权限
    ADMIN_PANEL: 'admin_panel',
    USER_MANAGEMENT: 'user_management',
    SYSTEM_SETTINGS: 'system_settings'
} as const

// 功能定义
export const FEATURES = {
    // 小说功能
    UNLIMITED_PROJECTS: 'unlimited_projects',
    COLLABORATION: 'collaboration',
    VERSION_HISTORY: 'version_history',
    
    // 导出功能
    EXPORT_BASIC: 'export_basic',
    EXPORT_ADVANCED: 'export_advanced',
    EXPORT_PROFESSIONAL: 'export_professional',
    
    // AI功能
    AI_SUGGESTIONS: 'ai_suggestions',
    AI_GRAMMAR_CHECK: 'ai_grammar_check',
    AI_STYLE_ANALYSIS: 'ai_style_analysis',
    AI_PLOT_ASSISTANCE: 'ai_plot_assistance',
    
    // 统计功能
    ADVANCED_ANALYTICS: 'advanced_analytics',
    WRITING_INSIGHTS: 'writing_insights',
    
    // 其他功能
    CLOUD_SYNC: 'cloud_sync',
    OFFLINE_MODE: 'offline_mode',
    CUSTOM_THEMES: 'custom_themes',
    PRIORITY_SUPPORT: 'priority_support'
} as const

// 用户权限配置
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    [UserRole.USER]: [
        PERMISSIONS.READ,
        PERMISSIONS.WRITE,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.EXPORT_PROJECT,
        PERMISSIONS.AI_BASIC
    ],
    [UserRole.PREMIUM]: [
        PERMISSIONS.READ,
        PERMISSIONS.WRITE,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.DELETE_PROJECT,
        PERMISSIONS.EXPORT_PROJECT,
        PERMISSIONS.SHARE_PROJECT,
        PERMISSIONS.AI_BASIC,
        PERMISSIONS.AI_ADVANCED
    ],
    [UserRole.ADMIN]: [
        PERMISSIONS.READ,
        PERMISSIONS.WRITE,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.DELETE_PROJECT,
        PERMISSIONS.EXPORT_PROJECT,
        PERMISSIONS.SHARE_PROJECT,
        PERMISSIONS.AI_BASIC,
        PERMISSIONS.AI_ADVANCED,
        PERMISSIONS.AI_UNLIMITED,
        PERMISSIONS.ADMIN_PANEL,
        PERMISSIONS.USER_MANAGEMENT,
        PERMISSIONS.SYSTEM_SETTINGS
    ]
}

// 订阅功能配置
const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, string[]> = {
    [SubscriptionTier.FREE]: [
        FEATURES.EXPORT_BASIC
    ],
    [SubscriptionTier.BASIC]: [
        FEATURES.EXPORT_BASIC,
        FEATURES.AI_SUGGESTIONS,
        FEATURES.CLOUD_SYNC
    ],
    [SubscriptionTier.PREMIUM]: [
        FEATURES.UNLIMITED_PROJECTS,
        FEATURES.COLLABORATION,
        FEATURES.VERSION_HISTORY,
        FEATURES.EXPORT_BASIC,
        FEATURES.EXPORT_ADVANCED,
        FEATURES.AI_SUGGESTIONS,
        FEATURES.AI_GRAMMAR_CHECK,
        FEATURES.AI_STYLE_ANALYSIS,
        FEATURES.ADVANCED_ANALYTICS,
        FEATURES.CLOUD_SYNC,
        FEATURES.CUSTOM_THEMES
    ],
    [SubscriptionTier.ENTERPRISE]: [
        FEATURES.UNLIMITED_PROJECTS,
        FEATURES.COLLABORATION,
        FEATURES.VERSION_HISTORY,
        FEATURES.EXPORT_BASIC,
        FEATURES.EXPORT_ADVANCED,
        FEATURES.EXPORT_PROFESSIONAL,
        FEATURES.AI_SUGGESTIONS,
        FEATURES.AI_GRAMMAR_CHECK,
        FEATURES.AI_STYLE_ANALYSIS,
        FEATURES.AI_PLOT_ASSISTANCE,
        FEATURES.ADVANCED_ANALYTICS,
        FEATURES.WRITING_INSIGHTS,
        FEATURES.CLOUD_SYNC,
        FEATURES.OFFLINE_MODE,
        FEATURES.CUSTOM_THEMES,
        FEATURES.PRIORITY_SUPPORT
    ]
}

// 权限管理Hook
export const usePermissions = () => {
    const { user, hasPermission: authHasPermission, hasFeature: authHasFeature } = useAuth()

    // 检查用户权限
    const hasPermission = (permission: string): boolean => {
        if (!user) return false
        return authHasPermission(permission)
    }

    // 检查用户功能
    const hasFeature = (feature: string): boolean => {
        if (!user) return false
        return authHasFeature(feature)
    }

    // 检查多个权限（且关系）
    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(permission => hasPermission(permission))
    }

    // 检查多个权限（或关系）
    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(permission => hasPermission(permission))
    }

    // 检查多个功能（且关系）
    const hasAllFeatures = (features: string[]): boolean => {
        return features.every(feature => hasFeature(feature))
    }

    // 检查多个功能（或关系）
    const hasAnyFeature = (features: string[]): boolean => {
        return features.some(feature => hasFeature(feature))
    }

    // 获取用户所有权限
    const getUserPermissions = (): string[] => {
        if (!user) return []
        return ROLE_PERMISSIONS[user.role] || []
    }

    // 获取用户所有功能
    const getUserFeatures = (): string[] => {
        if (!user) return []
        return SUBSCRIPTION_FEATURES[user.subscription] || []
    }

    // 检查是否为管理员
    const isAdmin = (): boolean => {
        return user?.role === UserRole.ADMIN
    }

    // 检查是否为高级用户
    const isPremium = (): boolean => {
        return user?.role === UserRole.PREMIUM || isAdmin()
    }

    // 检查订阅状态
    const hasValidSubscription = (): boolean => {
        return user?.subscription !== SubscriptionTier.FREE
    }

    // 检查是否可以创建小说
    const canCreateProject = (): boolean => {
        if (!user) return false
        
        // 免费用户可能有小说数量限制
        if (user.subscription === SubscriptionTier.FREE) {
            // 假设免费用户最多创建3个小说
            return user.profile.writingStats.totalProjects < 3
        }
        
        return hasPermission(PERMISSIONS.CREATE_PROJECT)
    }

    // 检查是否可以使用AI功能
    const canUseAI = (): boolean => {
        return hasPermission(PERMISSIONS.AI_BASIC)
    }

    // 检查是否可以使用高级AI功能
    const canUseAdvancedAI = (): boolean => {
        return hasPermission(PERMISSIONS.AI_ADVANCED)
    }

    // 获取AI使用限制
    const getAILimits = () => {
        if (!user) return { daily: 0, monthly: 0 }
        
        switch (user.subscription) {
            case SubscriptionTier.FREE:
                return { daily: 10, monthly: 100 }
            case SubscriptionTier.BASIC:
                return { daily: 50, monthly: 1000 }
            case SubscriptionTier.PREMIUM:
                return { daily: 200, monthly: 5000 }
            case SubscriptionTier.ENTERPRISE:
                return { daily: -1, monthly: -1 } // 无限制
            default:
                return { daily: 0, monthly: 0 }
        }
    }

    return {
        // 基础检查
        hasPermission,
        hasFeature,
        hasAllPermissions,
        hasAnyPermission,
        hasAllFeatures,
        hasAnyFeature,
        
        // 用户信息
        getUserPermissions,
        getUserFeatures,
        isAdmin,
        isPremium,
        hasValidSubscription,
        
        // 功能检查
        canCreateProject,
        canUseAI,
        canUseAdvancedAI,
        getAILimits,
        
        // 用户信息
        user,
        
        // 常量
        PERMISSIONS,
        FEATURES
    }
}

export default usePermissions
