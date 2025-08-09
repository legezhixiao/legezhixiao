import {
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons'
import { Button, Layout, Space, Typography } from 'antd'
import { useAppStore } from '../../store/appStore'
import UserMenu from '../Auth/UserMenu'

const { Header } = Layout
const { Title } = Typography

const AppHeader: React.FC = () => {
    const { sidebarCollapsed, setSidebarCollapsed, currentProject } = useAppStore()

    return (
        <Header
            style={{
                background: '#fff',
                padding: '0 16px',
                borderBottom: '1px solid #f0f0f0',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative'
            }}
        >
            <Space align="center" style={{ position: 'relative', zIndex: 1 }}>
                <Button
                    type="text"
                    icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    style={{
                        fontSize: '16px',
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(19, 194, 194, 0.1))'
                        e.currentTarget.style.borderColor = 'rgba(24, 144, 255, 0.3)'
                        e.currentTarget.style.boxShadow = '0 0 8px rgba(24, 144, 255, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                />
                {currentProject && (
                    <div style={{
                        marginLeft: '16px',
                        fontSize: '14px',
                        color: '#1890ff',
                        fontWeight: '500',
                        maxWidth: '200px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        正在编辑：{currentProject.title}
                    </div>
                )}
            </Space>

            {/* 居中的标题 */}
            <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1,
                textAlign: 'center'
            }}>
                <Title
                    level={4}
                    style={{
                        margin: 0,
                        background: 'linear-gradient(45deg, #1890ff, #13c2c2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        position: 'relative',
                        lineHeight: 1
                    }}
                >
                    乐格至效
                    {/* 小的装饰元素 */}
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-8px',
                        width: '4px',
                        height: '4px',
                        background: 'linear-gradient(45deg, #1890ff, #13c2c2)',
                        borderRadius: '50%',
                        animation: 'glow 2s ease-in-out infinite alternate'
                    }} />
                </Title>
            </div>

            <Space style={{ position: 'relative', zIndex: 1 }}>
                <UserMenu placement="bottomRight" />
            </Space>
        </Header>
    )
}

export default AppHeader
