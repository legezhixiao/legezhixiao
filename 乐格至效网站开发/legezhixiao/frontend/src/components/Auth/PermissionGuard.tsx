import React from 'react'
import { Result, Button } from 'antd'
import { LockOutlined, CrownOutlined } from '@ant-design/icons'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../contexts/AuthContext'

interface PermissionGuardProps {
    children: React.ReactNode
    permissions?: string[]
    features?: string[]
    requireAll?: boolean // true: 需要所有权限/功能, false: 需要任一权限/功能
    fallback?: React.ReactNode
    showUpgrade?: boolean
}

/**
 * 权限保护组件
 * 根据用户权限和功能决定是否显示子组件
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    permissions = [],
    features = [],
    requireAll = true,
    fallback,
    showUpgrade = true
}) => {
    const { user, isAuthenticated } = useAuth()
    const {
        hasAllPermissions,
        hasAnyPermission,
        hasAllFeatures,
        hasAnyFeature,
        isPremium,
        hasValidSubscription
    } = usePermissions()

    // 未登录时的处理
    if (!isAuthenticated || !user) {
        return fallback || (
            <Result
                icon={<LockOutlined />}
                title="需要登录"
                subTitle="请先登录以访问此功能"
                extra={
                    <Button type="primary">
                        立即登录
                    </Button>
                }
            />
        )
    }

    // 检查权限
    const hasPermission = permissions.length === 0 || 
        (requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions))

    // 检查功能
    const hasFeature = features.length === 0 || 
        (requireAll ? hasAllFeatures(features) : hasAnyFeature(features))

    // 如果有权限和功能，显示内容
    if (hasPermission && hasFeature) {
        return <>{children}</>
    }

    // 如果有自定义的fallback，使用它
    if (fallback) {
        return <>{fallback}</>
    }

    // 根据缺失的权限类型显示不同的错误页面
    if (!hasPermission) {
        return (
            <Result
                icon={<LockOutlined />}
                title="权限不足"
                subTitle="您没有访问此功能的权限"
                extra={
                    showUpgrade && !isPremium() ? (
                        <Button type="primary" icon={<CrownOutlined />}>
                            升级账户
                        </Button>
                    ) : null
                }
            />
        )
    }

    if (!hasFeature) {
        return (
            <Result
                icon={<CrownOutlined />}
                title="功能限制"
                subTitle={
                    hasValidSubscription() 
                        ? "此功能在您当前的订阅计划中不可用"
                        : "此功能需要订阅高级版本"
                }
                extra={
                    showUpgrade ? (
                        <Button type="primary" icon={<CrownOutlined />}>
                            {hasValidSubscription() ? "升级订阅" : "开通高级版"}
                        </Button>
                    ) : null
                }
            />
        )
    }

    // 默认拒绝访问
    return (
        <Result
            status="403"
            title="403"
            subTitle="抱歉，您没有访问此页面的权限"
        />
    )
}

interface RequireAuthProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * 需要登录组件
 * 简化的权限检查，只检查是否登录
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ 
    children, 
    fallback 
}) => {
    return (
        <PermissionGuard fallback={fallback}>
            {children}
        </PermissionGuard>
    )
}

interface RequirePremiumProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    feature?: string
}

/**
 * 需要高级版组件
 * 检查用户是否为高级用户或拥有特定功能
 */
export const RequirePremium: React.FC<RequirePremiumProps> = ({ 
    children, 
    fallback,
    feature 
}) => {
    const { isPremium } = usePermissions()

    if (isPremium()) {
        return <>{children}</>
    }

    if (feature) {
        return (
            <PermissionGuard features={[feature]} fallback={fallback}>
                {children}
            </PermissionGuard>
        )
    }

    return (
        <PermissionGuard fallback={fallback} showUpgrade>
            {children}
        </PermissionGuard>
    )
}

interface RequireAdminProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * 需要管理员权限组件
 */
export const RequireAdmin: React.FC<RequireAdminProps> = ({ 
    children, 
    fallback 
}) => {
    const { isAdmin } = usePermissions()

    if (!isAdmin()) {
        return fallback || (
            <Result
                status="403"
                title="管理员权限"
                subTitle="此功能仅限管理员访问"
            />
        )
    }

    return <>{children}</>
}

export default PermissionGuard
