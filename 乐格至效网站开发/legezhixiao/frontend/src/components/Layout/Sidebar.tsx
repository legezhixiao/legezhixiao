import React from 'react'
import { Layout, Menu } from 'antd'
import { 
  ProjectOutlined,
  EditOutlined,
  SettingOutlined,
  TeamOutlined,
  GlobalOutlined,
  BookOutlined,
  BulbOutlined,
  BranchesOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentProject } = useAppStore()

  const menuItems = [
    {
      key: '/',
      icon: <ProjectOutlined />,
      label: '小说管理',
    },
    ...(currentProject ? [
      {
        key: `/project/${currentProject.id}/write`,
        icon: <EditOutlined />,
        label: '写作界面',
      },
      {
        key: 'project-tools',
        icon: <BookOutlined />,
        label: '创作工具',
        children: [
          {
            key: `/project/${currentProject.id}/creative-tools`,
            icon: <BulbOutlined />,
            label: 'AI创作工具箱',
          },
          {
            key: `/project/${currentProject.id}/characters`,
            icon: <TeamOutlined />,
            label: '角色管理',
          },
          {
            key: `/project/${currentProject.id}/knowledge-graph`,
            icon: <BranchesOutlined />,
            label: '知识图谱',
          },
          {
            key: `/project/${currentProject.id}/world`,
            icon: <GlobalOutlined />,
            label: '世界构建',
          },
        ],
      },
      {
        key: `/project/${currentProject.id}/settings`,
        icon: <SettingOutlined />,
        label: '小说设置',
      },
    ] : []),
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key)
    }
  }

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed}
      style={{
        background: '#fafafa',
        borderRight: '1px solid #e8e8e8',
        boxShadow: '2px 0 8px rgba(24, 144, 255, 0.05)'
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname === '/' || location.pathname === '/projects' ? '/' : location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ 
          height: '100%', 
          borderRight: 0,
          paddingTop: '8px',
          background: 'transparent'
        }}
        theme="light"
        className="tech-menu"
      />
    </Sider>
  )
}

export default Sidebar
