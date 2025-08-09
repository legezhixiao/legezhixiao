import {
    BookOutlined,
    ClockCircleOutlined,
    EditOutlined,
    PlusOutlined,
    SettingOutlined,
    TrophyOutlined
} from '@ant-design/icons'
import { Button, Col, Empty, Progress, Row, Space, Statistic, Typography, Tag } from 'antd'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CreateProjectModal from '../components/Writing/CreateProjectModal'
import { useAppStore } from '../store/appStore'
import { projectService } from '../services/projectService'
import { aiAgentService } from '../services/aiAgentService'
import type { NovelProject } from '../types'

const { Title, Text } = Typography

const ProjectDashboard: React.FC = () => {
    const navigate = useNavigate()
    const { projects, setCurrentProject, addProject } = useAppStore()
    const [createModalVisible, setCreateModalVisible] = useState(false)

    // 从后端同步项目数据
    useEffect(() => {
        const syncProjectsFromBackend = async () => {
            try {
                console.log('[ProjectDashboard] 从后端同步项目数据...')
                const response = await projectService.getProjects()
                console.log('[ProjectDashboard] 后端项目数据:', response)
                
                if (Array.isArray(response)) {
                    // 转换后端数据格式为前端格式
                    response.forEach((backendProject: any) => {
                        const frontendProject: NovelProject = {
                            id: backendProject.id,
                            title: backendProject.title,
                            author: backendProject.author || '匿名作者',
                            genre: backendProject.genre ? [backendProject.genre] : ['其他'],
                            description: backendProject.description || '',
                            status: backendProject.status === 'active' ? 'draft' : backendProject.status,
                            targetWords: backendProject.targetWords || 100000,
                            currentWords: backendProject.wordsCount || 0,
                            createdAt: backendProject.createdAt ? new Date(backendProject.createdAt) : new Date(),
                            updatedAt: backendProject.updatedAt ? new Date(backendProject.updatedAt) : new Date(),
                            chapters: [],
                            characters: [],
                            constraints: [],
                            settings: {
                                autoSave: true,
                                autoSaveInterval: 30,
                                theme: 'light',
                                fontSize: 14,
                                lineHeight: 1.6
                            }
                        }
                        
                        // 检查项目是否已存在，避免重复添加
                        const exists = projects.find(p => p.id === frontendProject.id)
                        if (!exists) {
                            addProject(frontendProject)
                        }
                    })
                }
            } catch (error) {
                console.error('[ProjectDashboard] 同步项目数据失败:', error)
            }
        }

        // 只在项目列表为空时从后端同步
        if (projects.length === 0) {
            syncProjectsFromBackend()
        }
    }, [projects.length, addProject])

    // 监听AI Agent的状态变化
    useEffect(() => {
        const handleAIAgentAction = (eventData: any) => {
            console.log('[ProjectDashboard] AI Agent 执行了动作:', eventData)
            // 如果创建了新项目，刷新项目列表
            if (eventData.actionType === 'create_project' && eventData.result.success) {
                // 项目已经通过AI Agent Panel的syncAIAgentResultsToStore添加到store了
                // 这里可以添加额外的处理逻辑，比如通知用户
                console.log('[ProjectDashboard] 新项目已创建:', eventData.result.project.title)
            }
        }

        aiAgentService.addEventListener('actionExecuted', handleAIAgentAction)

        return () => {
            aiAgentService.removeEventListener('actionExecuted', handleAIAgentAction)
        }
    }, [])

    const handleProjectClick = (project: NovelProject) => {
        setCurrentProject(project)
        navigate(`/project/${project.id}/write`)
    }

    const handleNewProject = () => {
        setCreateModalVisible(true)
    }

    const handleProjectCreated = (project: NovelProject) => {
        setCurrentProject(project)
        navigate(`/project/${project.id}/write`)
    }

    return (
        <div style={{
            padding: '24px',
            background: '#fafafa',
            minHeight: '100vh',
            position: 'relative'
        }}>
            {/* 欢迎区域 - 全宽度 */}
            <div
                style={{
                    marginBottom: '24px',
                    padding: '32px',
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* 小的装饰元素 */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '60px',
                    height: '4px',
                    background: 'linear-gradient(90deg, #1890ff, #13c2c2)',
                    borderRadius: '2px'
                }} />

                <Row gutter={24} align="middle">
                    <Col flex="auto">
                        <Title level={2} style={{
                            margin: 0,
                            marginBottom: '8px',
                            color: '#333'
                        }}>
                            欢迎来到
                            <span style={{
                                background: 'linear-gradient(45deg, #1890ff, #13c2c2)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                marginLeft: '8px'
                            }}>
                                乐格至效
                            </span>
                            <span style={{ color: '#333' }}> AI小说创作平台</span>
                        </Title>
                        <Text type="secondary" style={{ fontSize: '16px', color: '#666' }}>
                            让AI助力您的创作之旅，释放无限想象力
                        </Text>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleNewProject}
                            className="tech-button-enhanced"
                            style={{
                                height: '48px',
                                paddingLeft: '24px',
                                paddingRight: '24px',
                                fontSize: '16px'
                            }}
                        >
                            开始新小说
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* 统计概览 - 全宽度 */}
            <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={12} sm={6}>
                    <div className="tech-stat-card tech-hover-glow" style={{
                        padding: '24px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <Statistic
                            title="总小说数"
                            value={projects.length}
                            prefix={<BookOutlined style={{ color: 'rgba(255, 255, 255, 0.9)' }} />}
                            valueStyle={{
                                color: '#ffffff',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                fontFamily: 'JetBrains Mono, Courier New, monospace'
                            }}
                            className="tech-stat-number"
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="tech-stat-card tech-hover-glow" style={{
                        padding: '24px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <Statistic
                            title="已完成小说"
                            value={projects.filter(p => p.status === 'completed').length}
                            prefix={<TrophyOutlined style={{ color: 'rgba(255, 255, 255, 0.9)' }} />}
                            valueStyle={{
                                color: '#ffffff',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                fontFamily: 'JetBrains Mono, Courier New, monospace'
                            }}
                            className="tech-stat-number"
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="tech-stat-card tech-hover-glow" style={{
                        padding: '24px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <Statistic
                            title="总字数"
                            value={projects.reduce((total, project) => total + (project.currentWords || 0), 0)}
                            prefix={<EditOutlined style={{ color: 'rgba(255, 255, 255, 0.9)' }} />}
                            valueStyle={{
                                color: '#ffffff',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                fontFamily: 'JetBrains Mono, Courier New, monospace'
                            }}
                            formatter={(value) => `${(value as number).toLocaleString()}`}
                            className="tech-stat-number"
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="tech-stat-card tech-hover-glow" style={{
                        padding: '24px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <Statistic
                            title="进行中"
                            value={projects.filter(p => p.status === 'in_progress').length}
                            prefix={<ClockCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.9)' }} />}
                            valueStyle={{
                                color: '#ffffff',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                fontFamily: 'JetBrains Mono, Courier New, monospace'
                            }}
                            className="tech-stat-number"
                        />
                    </div>
                </Col>
            </Row>

            {/* 小说列表 - 全宽度 */}
            <div className="tech-card" style={{
                padding: '24px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <Space>
                        <BookOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                        <Title level={3} style={{
                            margin: 0,
                            color: '#333'
                        }}>
                            我的小说
                        </Title>
                    </Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleNewProject}
                        className="tech-button-enhanced"
                        style={{
                            height: '40px',
                            paddingLeft: '20px',
                            paddingRight: '20px'
                        }}
                    >
                        新建小说
                    </Button>
                </div>

                {projects.length === 0 ? (
                    <Empty
                        description="还没有小说"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleNewProject}
                            className="tech-button-enhanced"
                            style={{
                                height: '48px',
                                paddingLeft: '24px',
                                paddingRight: '24px',
                                fontSize: '16px'
                            }}
                        >
                            创建第一个小说
                        </Button>
                    </Empty>
                ) : (
                    <Row gutter={[24, 24]}>
                        {projects.map((project) => (
                            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={project.id}>
                                <div
                                    className="tech-card tech-glow"
                                    style={{
                                        height: '280px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onClick={() => handleProjectClick(project)}
                                >
                                    {/* 状态指示器 */}
                                    <div className="tech-display" style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        padding: '3px 6px',
                                        fontSize: '10px',
                                        background: project.status === 'completed' ? 'rgba(82, 196, 26, 0.08)' :
                                            project.status === 'in_progress' ? 'rgba(24, 144, 255, 0.08)' :
                                                'rgba(217, 217, 217, 0.08)',
                                        color: project.status === 'completed' ? '#52c41a' :
                                            project.status === 'in_progress' ? '#1890ff' : '#999',
                                        border: `1px solid ${project.status === 'completed' ? '#52c41a' :
                                            project.status === 'in_progress' ? '#1890ff' : '#d9d9d9'}20`,
                                        borderRadius: '4px',
                                        zIndex: 2
                                    }}>
                                        {project.status === 'completed' ? '已完成' :
                                            project.status === 'in_progress' ? '进行中' : '草稿'}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <Title level={4} style={{ margin: 0, color: '#333' }}>
                                            {project.title}
                                        </Title>
                                    </div>

                                    <Text type="secondary" style={{
                                        display: 'block',
                                        marginBottom: '16px',
                                        lineHeight: 1.6
                                    }}>
                                        {project.description}
                                    </Text>

                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                            <Text strong>类型：</Text>
                                            <Space wrap>
                                                {Array.isArray(project.genre) ? 
                                                    project.genre.map((genre, index) => (
                                                        <Tag key={index} color="blue">{genre}</Tag>
                                                    )) :
                                                    <Tag color="blue">{project.genre}</Tag>
                                                }
                                            </Space>
                                        </div>
                                        <div>
                                            <Text strong>进度：</Text>
                                            <Progress
                                                percent={Math.round(((project.currentWords || 0) / (project.targetWords || 1)) * 100)}
                                                size="small"
                                                strokeColor={{
                                                    '0%': '#1890ff',
                                                    '100%': '#13c2c2',
                                                }}
                                                showInfo={false}
                                            />
                                            <div style={{
                                                marginTop: '4px',
                                                fontSize: '11px',
                                                color: '#666',
                                                display: 'flex',
                                                justifyContent: 'space-between'
                                            }}>
                                                <span>{Math.round(((project.currentWords || 0) / (project.targetWords || 1)) * 100)}% 完成</span>
                                                <span>{(project.currentWords || 0).toLocaleString()} / {(project.targetWords || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px' }}>
                                            <ClockCircleOutlined style={{ marginRight: '4px', fontSize: '12px', color: '#8B95A1' }} />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                更新于 {project.updatedAt instanceof Date ? 
                                                    project.updatedAt.toLocaleDateString() : 
                                                    new Date(project.updatedAt).toLocaleDateString()}
                                            </Text>
                                        </div>
                                    </Space>

                                    <div style={{
                                        position: 'absolute',
                                        bottom: '12px',
                                        right: '12px',
                                        left: '12px',
                                        display: 'flex',
                                        gap: '6px'
                                    }}>
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleProjectClick(project)
                                            }}
                                            className="tech-button-enhanced"
                                            style={{
                                                flex: 1,
                                                height: '32px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            编辑
                                        </Button>
                                        <Button
                                            size="small"
                                            icon={<SettingOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigate(`/project/${project.id}/settings`)
                                            }}
                                            style={{
                                                borderColor: '#8B95A1',
                                                color: '#8B95A1',
                                                borderRadius: '4px',
                                                height: '32px'
                                            }}
                                        >
                                            设置
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* 创建小说模态框 */}
            <CreateProjectModal
                visible={createModalVisible}
                onCancel={() => setCreateModalVisible(false)}
                onSuccess={handleProjectCreated}
            />
        </div>
    )
}

export default ProjectDashboard
