import React, { useState } from 'react'
import { Avatar, Dropdown, Typography, Space, Badge, Button } from 'antd'
import {
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    CrownOutlined,
    BellOutlined,
    EditOutlined
} from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from './AuthModal'
import UserProfileModal from './UserProfileModal'
import type { MenuProps } from 'antd'

const { Text } = Typography

interface UserMenuProps {
    placement?: 'bottomRight' | 'bottomLeft'
}

const UserMenu: React.FC<UserMenuProps> = ({ placement = 'bottomRight' }) => {
    const { user, isAuthenticated, logout } = useAuth()
    const [authModalVisible, setAuthModalVisible] = useState(false)
    const [profileModalVisible, setProfileModalVisible] = useState(false)

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    // 未登录时显示登录按钮
    if (!isAuthenticated || !user) {
        return (
            <>
                <Button type="primary" onClick={() => setAuthModalVisible(true)}>
                    登录 / 注册
                </Button>
                <AuthModal
                    visible={authModalVisible}
                    onClose={() => setAuthModalVisible(false)}
                />
            </>
        )
    }

    // 获取用户头像
    const getUserAvatar = () => {
        if (user.avatar) {
            return <Avatar src={user.avatar} size="large" />
        }
        return (
            <Avatar
                size="large"
                style={{
                    backgroundColor: user.role === 'admin' ? '#722ed1' : '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
        )
    }

    // 获取订阅徽章
    const getSubscriptionBadge = () => {
        switch (user.subscription) {
            case 'premium':
                return <CrownOutlined style={{ color: '#faad14' }} />
            case 'enterprise':
                return <CrownOutlined style={{ color: '#722ed1' }} />
            default:
                return null
        }
    }

    // 菜单项
    const menuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: (
                <Space>
                    <div>
                        <div style={{ fontWeight: 500 }}>{user.displayName}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            @{user.username}
                        </Text>
                        {getSubscriptionBadge() && (
                            <div style={{ marginTop: 4 }}>
                                {getSubscriptionBadge()}
                                <Text type="secondary" style={{ fontSize: '11px', marginLeft: 4 }}>
                                    {user.subscription.toUpperCase()}
                                </Text>
                            </div>
                        )}
                    </div>
                </Space>
            ),
            onClick: () => setProfileModalVisible(true)
        },
        {
            type: 'divider'
        },
        {
            key: 'writing-stats',
            icon: <EditOutlined />,
            label: (
                <div>
                    <div>创作统计</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {user.profile.writingStats.totalWords.toLocaleString()} 字 · {user.profile.writingStats.totalProjects} 小说
                    </Text>
                </div>
            )
        },
        {
            key: 'notifications',
            icon: (
                <Badge count={0} size="small">
                    <BellOutlined />
                </Badge>
            ),
            label: '通知'
        },
        {
            type: 'divider'
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: '账户设置'
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout
        }
    ]

    return (
        <>
            <Dropdown
                menu={{ items: menuItems }}
                placement={placement}
                trigger={['click']}
                arrow
            >
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {getUserAvatar()}
                </div>
            </Dropdown>

            <UserProfileModal
                visible={profileModalVisible}
                onClose={() => setProfileModalVisible(false)}
            />
        </>
    )
}

export default UserMenu
