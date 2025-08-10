import {
    BulbOutlined,
    CloseOutlined,
    ExpandOutlined,
    MinusOutlined,
    SendOutlined,
    SettingOutlined,
    CopyOutlined,
    CheckOutlined,
    RobotOutlined,
    ClearOutlined,
    ThunderboltOutlined,
    EditOutlined,
    FileTextOutlined,
    HistoryOutlined,
    ProjectOutlined
} from '@ant-design/icons'
import { 
    Button, 
    Input, 
    Space, 
    Tag, 
    Typography, 
    message, 
    Tooltip, 
    Card, 
    Avatar,
    List,
    Empty,
    Badge
} from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import AIServiceManager from '../../services/aiService'
import { setupPresetConfig } from '../../services/presetConfig'
import AIConfigModal from './AIConfigModal'
import SessionHistoryModal from './SessionHistoryModal'
import { useEditor } from '../../contexts/EditorContext'
import AIThinkingIndicator from './AIThinkingIndicator'
import './FloatingAIWindow.css'
// 文件已清空
const { Title, Text } = Typography
const { TextArea } = Input

interface FloatingAIWindowProps {
    visible: boolean
    onClose: () => void
    content: string
    onSuggestionApply: (suggestion: string) => void
    isWritingPage?: boolean
}

interface AISuggestion {
    id: string
    type: 'continuation' | 'improvement' | 'correction' | 'general'
    text: string
    confidence: number
    reason: string
    timestamp: Date
}

interface ChatMessage {
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: Date
    aiType?: 'continuation' | 'improvement' | 'correction' | 'general'
    confidence?: number
    reason?: string
}

interface QuickAction {
    label: string
    prompt: string
    type: 'continuation' | 'improvement' | 'correction' | 'general'
    icon: React.ReactNode
    color: string
}

const FloatingAIWindow: React.FC<FloatingAIWindowProps> = ({
    visible,
    onClose,
    onSuggestionApply,
    isWritingPage = false
}) => {
    // 编辑器上下文和会话管理
    const { 
        sessionManager, 
        currentProjectId, 
        setCurrentProjectId, 
        currentProjectTitle, 
        setCurrentProjectTitle 
    } = useEditor()
    const { id: routeProjectId } = useParams<{ id: string }>()

    // 位置和大小状态
    const [position, setPosition] = useState({ x: window.innerWidth - 450, y: 100 })
    const [size, setSize] = useState({ width: 420, height: 650 })
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [resizeDirection, setResizeDirection] = useState<string>('')
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [isMinimized, setIsMinimized] = useState(false)
    const [isMaximized, setIsMaximized] = useState(false)

    // AI交互状态
    const [userInput, setUserInput] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showConfigModal, setShowConfigModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<string>('general')
    const [sessionsCount, setSessionsCount] = useState(0)

    // 快捷操作
    const quickActions: QuickAction[] = [
        { 
            label: '续写', 
            prompt: '请帮我续写这段内容', 
            type: 'continuation',
            icon: <EditOutlined />,
            color: '#1890ff'
        },
        { 
            label: '优化', 
            prompt: '请帮我优化这段文字', 
            type: 'improvement',
            icon: <ThunderboltOutlined />,
            color: '#52c41a'
        },
        { 
            label: '检查', 
            prompt: '请检查这段文字是否有问题', 
            type: 'correction',
            icon: <FileTextOutlined />,
            color: '#fa8c16'
        },
        { 
            label: '创意', 
            prompt: '给我一些创作灵感和建议', 
            type: 'general',
            icon: <BulbOutlined />,
            color: '#eb2f96'
        }
    ]

    const windowRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // 初始化配置
    useEffect(() => {
        setupPresetConfig()
        // 确保窗口顶部可见，但允许其他部分超出屏幕
        const minVisibleHeight = 30
        const maxY = window.innerHeight - minVisibleHeight
        setPosition(prev => ({
            x: prev.x, // X轴不限制
            y: Math.min(prev.y, maxY) // 只确保顶部可见
        }))
    }, [size])

    // 小说检测和会话加载
    useEffect(() => {
        const loadProjectData = async () => {
            // 检测当前小说ID（从URL路由获取或使用默认值）
            const projectId = routeProjectId || 'default'
            const projectTitle = routeProjectId ? `小说 ${routeProjectId}` : '通用会话'
            
            // 更新小说上下文
            if (currentProjectId !== projectId) {
                setCurrentProjectId(projectId)
                setCurrentProjectTitle(projectTitle)
                
                // 加载该小说的会话历史
                const projectMessages = await sessionManager.getProjectMessages(projectId)
                // 转换消息格式
                const chatMessages: ChatMessage[] = projectMessages.map(msg => ({
                    id: msg.id,
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                    timestamp: new Date(msg.timestamp),
                    type: msg.type === 'user' ? 'user' : 'ai'
                }));
                setChatMessages(chatMessages)
            }
            
            // 更新会话数量
            await updateSessionsCount()
        }
        loadProjectData()
    }, [routeProjectId, currentProjectId, sessionManager, setCurrentProjectId, setCurrentProjectTitle])

    // 当会话窗口可见时，确保加载当前小说的消息
    useEffect(() => {
        if (visible && currentProjectId) {
            const loadMessages = async () => {
                const projectMessages = await sessionManager.getProjectMessages(currentProjectId);
                // 转换消息格式
                const chatMessages: ChatMessage[] = projectMessages.map(msg => ({
                  id: msg.id,
                  role: msg.type === 'user' ? 'user' : 'assistant',
                  content: msg.content,
                  timestamp: new Date(msg.timestamp),
                  type: msg.type === 'user' ? 'user' : 'ai'
                }));
                setChatMessages(chatMessages);
            };
            loadMessages();
        }
    }, [visible, currentProjectId, sessionManager])

    // 更新会话数量
    const updateSessionsCount = async () => {
        try {
            const sessions = await sessionManager.getSessionSummaries()
            setSessionsCount(sessions.length)
        } catch (error) {
            console.error('获取会话数量失败:', error)
            setSessionsCount(0)
        }
    }

    // 获取所有小说的会话数量
    const getAllSessionsCount = () => {
        return sessionsCount
    }

    // 检测窗口是否超出屏幕边界
    const isOutOfBounds = () => {
        const padding = 50 // 允许的边界缓冲区
        return position.x < -size.width + padding || 
               position.x > window.innerWidth - padding ||
               position.y < -size.height + 30 || // 保持标题栏可见
               position.y > window.innerHeight - padding
    }

    // 复制文本功能
    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            message.success('已复制到剪贴板')
            setTimeout(() => setCopiedId(null), 2000)
        } catch (error) {
            message.error('复制失败')
        }
    }

    // 应用建议
    const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
        onSuggestionApply(suggestion.text)
        message.success('建议已应用')
    }, [onSuggestionApply])

    // 快捷操作
    const handleQuickAction = (action: QuickAction) => {
        setUserInput(action.prompt)
        setSelectedType(action.type)
        // 自动聚焦到输入框
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }

    // 清空对话
    const handleClearChat = () => {
        setChatMessages([])
        setUserInput('')
        
        // 清空当前小说的会话记录
        if (currentProjectId) {
            sessionManager.deleteProjectSession(currentProjectId)
        }
        
        message.success('当前小说的对话已清空')
    }

    // 发送消息给AI
    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim()) {
            message.warning('请输入内容')
            return
        }

        // 确保有当前小说ID
        const projectId = currentProjectId || 'default'
        const projectTitle = currentProjectTitle || '通用会话'

        // 先添加用户消息到聊天记录
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: userInput.trim(),
            timestamp: new Date()
        }
        
        // 保存用户消息到会话管理器
        sessionManager.saveProjectMessage(projectId, {
            ...userMessage,
            role: 'user' as const
        }, projectTitle)
        
        setChatMessages(prev => [userMessage, ...prev])
        const currentInput = userInput.trim()
        setUserInput('')

        setIsLoading(true)
        try {
            const savedConfig = localStorage.getItem('ai-service-config')
            let config: any = { provider: 'siliconflow' }
            if (savedConfig) {
                config = JSON.parse(savedConfig)
            }

            const aiService = AIServiceManager.getInstance(config)
            
            // 根据选择的类型或自动检测类型
            let requestType = selectedType as any
            if (requestType === 'general') {
                if (currentInput.includes('续写') || currentInput.includes('继续')) {
                    requestType = 'continuation'
                } else if (currentInput.includes('改进') || currentInput.includes('优化')) {
                    requestType = 'improvement'
                } else if (currentInput.includes('修正') || currentInput.includes('检查')) {
                    requestType = 'correction'
                }
            }

            const response = await aiService.generateResponse({
                message: currentInput,
                type: requestType,
                maxTokens: 800
            })

            // 添加AI回复到聊天记录
            const aiMessage: ChatMessage = {
                id: response.id,
                type: 'ai',
                content: response.text,
                timestamp: new Date(),
                aiType: response.type,
                confidence: response.confidence,
                reason: response.reason
            }

            // 保存AI消息到会话管理器
            sessionManager.saveProjectMessage(projectId, {
                ...aiMessage,
                role: 'assistant' as const
            }, projectTitle)

            setChatMessages(prev => [aiMessage, ...prev])
            
            setSelectedType('general')
        } catch (error) {
            console.error('发送消息失败:', error)
            
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'ai',
                content: '抱歉，AI服务暂时不可用。请检查AI配置或稍后再试。您可以点击设置按钮配置AI服务。',
                timestamp: new Date(),
                aiType: 'general',
                confidence: 0,
                reason: '服务错误'
            }
            
            // 保存错误消息到会话管理器
            sessionManager.saveProjectMessage(projectId, {
                ...errorMessage,
                role: 'assistant' as const
            }, projectTitle)
            
            setChatMessages(prev => [errorMessage, ...prev])
        } finally {
            setIsLoading(false)
        }
    }, [userInput, selectedType, sessionManager, currentProjectId, currentProjectTitle])

    // 拖拽功能
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // 如果正在调整大小，不触发拖拽
        if (isResizing) return
        
        if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
            e.preventDefault()
            setIsDragging(true)
            const rect = windowRef.current?.getBoundingClientRect()
            if (rect) {
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                })
            }
        }
    }, [isResizing])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        
        // 允许窗口拖拽超出屏幕边界，但保持顶部可见（至少显示标题栏的一半）
        const minVisibleHeight = 30 // 标题栏最小可见高度
        const minY = -size.height + minVisibleHeight // 允许窗口大部分超出顶部，但保持标题栏可见
        
        setPosition({
            x: newX, // X轴不限制，允许完全超出左右边界
            y: Math.max(minY, newY) // Y轴只限制顶部，确保标题栏可见
        })
    }, [isDragging, dragOffset, size])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    // 双击标题栏将窗口拖回屏幕内
    const handleDoubleClick = useCallback(() => {
        const padding = 20
        const newX = Math.max(padding, Math.min(position.x, window.innerWidth - size.width - padding))
        const newY = Math.max(padding, Math.min(position.y, window.innerHeight - size.height - padding))
        
        // 如果窗口位置需要调整，则移动到合适位置
        if (newX !== position.x || newY !== position.y) {
            setPosition({ x: newX, y: newY })
        }
    }, [position, size])

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    // 窗口大小调整功能
    const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        setResizeDirection(direction)
        
        const rect = windowRef.current?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.right,
                y: e.clientY - rect.bottom
            })
        }
    }, [])

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !windowRef.current) return
        
        const rect = windowRef.current.getBoundingClientRect()
        const minWidth = 320
        const minHeight = 400
        // 移除最大尺寸限制，允许窗口调整到更大尺寸
        const maxWidth = Math.max(minWidth, window.innerWidth + 200) // 允许超出屏幕
        const maxHeight = Math.max(minHeight, window.innerHeight + 200) // 允许超出屏幕

        let newWidth = size.width
        let newHeight = size.height
        let newX = position.x
        let newY = position.y

        if (resizeDirection.includes('right')) {
            newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left))
        }
        if (resizeDirection.includes('left')) {
            const deltaX = rect.left - e.clientX
            newWidth = Math.max(minWidth, Math.min(maxWidth, size.width + deltaX))
            newX = e.clientX // 移除左边界限制
        }
        if (resizeDirection.includes('bottom')) {
            newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top))
        }
        if (resizeDirection.includes('top')) {
            const deltaY = rect.top - e.clientY
            newHeight = Math.max(minHeight, Math.min(maxHeight, size.height + deltaY))
            const minVisibleHeight = 30
            newY = Math.max(-newHeight + minVisibleHeight, e.clientY) // 只限制顶部可见
        }

        setSize({ width: newWidth, height: newHeight })
        if (resizeDirection.includes('left') || resizeDirection.includes('top')) {
            setPosition({ x: newX, y: newY })
        }
    }, [isResizing, resizeDirection, size, position])

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false)
        setResizeDirection('')
    }, [])

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove)
            document.addEventListener('mouseup', handleResizeEnd)
            return () => {
                document.removeEventListener('mousemove', handleResizeMove)
                document.removeEventListener('mouseup', handleResizeEnd)
            }
        }
    }, [isResizing, handleResizeMove, handleResizeEnd])

    // 切换最大化
    const toggleMaximize = () => {
        if (isMaximized) {
            setSize({ width: 420, height: 650 })
            // 恢复到右侧位置，但允许部分超出屏幕
            setPosition({ x: window.innerWidth - 450, y: 100 })
            setIsMaximized(false)
        } else {
            // 最大化时占据大部分屏幕，但留出边距
            setSize({ width: Math.min(800, window.innerWidth - 40), height: window.innerHeight - 40 })
            setPosition({ x: 20, y: 20 })
            setIsMaximized(true)
        }
    }

    // 获取建议类型的显示信息
    const getSuggestionInfo = (type: string) => {
        switch (type) {
            case 'continuation': return { text: '续写', color: '#1890ff', icon: <EditOutlined /> }
            case 'improvement': return { text: '优化', color: '#52c41a', icon: <ThunderboltOutlined /> }
            case 'correction': return { text: '检查', color: '#fa8c16', icon: <FileTextOutlined /> }
            default: return { text: 'AI助手', color: '#eb2f96', icon: <BulbOutlined /> }
        }
    }

    // 格式化时间
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    if (!visible) return null

    return (
        <>
            <div
                ref={windowRef}
                className={`window-container ${isResizing ? 'resizing-window' : ''} ${isDragging ? 'dragging' : ''} ${isOutOfBounds() ? 'window-out-of-bounds' : ''}`}
                style={{
                    position: 'fixed',
                    left: position.x,
                    top: position.y,
                    width: size.width,
                    height: isMinimized ? 45 : size.height,
                    zIndex: 1001,
                    boxShadow: isDragging || isResizing 
                        ? '0 20px 60px rgba(0, 0, 0, 0.25)' 
                        : '0 12px 40px rgba(0, 0, 0, 0.15)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#ffffff',
                    border: `1px solid ${isDragging || isResizing ? '#1890ff' : 'rgba(0, 0, 0, 0.06)'}`,
                    userSelect: 'none',
                    transform: isDragging ? 'scale(1.02)' : isResizing ? 'scale(1.01)' : 'scale(1)',
                    transition: isDragging || isResizing ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: isResizing ? 'auto' : 'default'
                }}
            >
                {/* 标题栏 */}
                <div
                    ref={headerRef}
                    className="window-header"
                    onMouseDown={handleMouseDown}
                    onDoubleClick={handleDoubleClick}
                    style={{
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <Space>
                        <Avatar 
                            size={28} 
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                            icon={<RobotOutlined />} 
                        />
                        <div>
                            <Space>
                                <Title level={5} style={{ margin: 0, color: 'white', fontSize: '14px' }}>
                                    AI创作助手
                                </Title>
                                {currentProjectId && currentProjectId !== 'default' && (
                                    <Badge 
                                        count={<ProjectOutlined style={{ color: 'white', fontSize: '10px' }} />} 
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                    />
                                )}
                            </Space>
                            {!isMinimized && (
                                <Text style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                                    {currentProjectTitle} • {isWritingPage ? '写作模式' : '创作模式'} • DeepSeek-V3
                                </Text>
                            )}
                        </div>
                    </Space>

                    <Space size={4}>
                        <Tooltip title={`小说会话历史 (${getAllSessionsCount()}个小说)`}>
                            <Badge 
                                count={getAllSessionsCount()} 
                                size="small"
                                className="session-badge"
                                style={{ fontSize: '10px' }}
                                offset={[2, -2]}
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<HistoryOutlined />}
                                    onClick={() => setShowHistoryModal(true)}
                                    className="history-button-enhanced"
                                    style={{ 
                                        color: 'white', 
                                        border: '1px solid rgba(255, 255, 255, 0.4)',
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontWeight: 500
                                    }}
                                >
                                    历史
                                </Button>
                            </Badge>
                        </Tooltip>
                        <Tooltip title="AI配置">
                            <Button
                                type="text"
                                size="small"
                                icon={<SettingOutlined />}
                                onClick={() => setShowConfigModal(true)}
                                style={{ color: 'white', border: 'none' }}
                            />
                        </Tooltip>
                        <Tooltip title={isMinimized ? '展开' : '最小化'}>
                            <Button
                                type="text"
                                size="small"
                                icon={<MinusOutlined />}
                                onClick={() => setIsMinimized(!isMinimized)}
                                style={{ color: 'white', border: 'none' }}
                            />
                        </Tooltip>
                        <Tooltip title={isMaximized ? '还原' : '最大化'}>
                            <Button
                                type="text"
                                size="small"
                                icon={<ExpandOutlined />}
                                onClick={toggleMaximize}
                                style={{ color: 'white', border: 'none' }}
                            />
                        </Tooltip>
                        <Tooltip title="关闭">
                            <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={onClose}
                                style={{ color: 'white', border: 'none' }}
                            />
                        </Tooltip>
                    </Space>
                </div>

                {/* 主要内容 */}
                {!isMinimized && (
                    <div style={{
                        height: size.height - 45,
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#fafafa'
                    }}>
                        {/* 快捷操作区 */}
                        <div style={{ 
                            padding: '16px',
                            background: 'white',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            <Text strong style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
                                快捷操作
                            </Text>
                            <Space wrap size={[8, 8]}>
                                {quickActions.map((action) => (
                                    <Button
                                        key={action.type}
                                        size="small"
                                        icon={action.icon}
                                        onClick={() => handleQuickAction(action)}
                                        style={{
                                            borderColor: action.color,
                                            color: selectedType === action.type ? 'white' : action.color,
                                            background: selectedType === action.type ? action.color : 'transparent',
                                            borderRadius: '16px',
                                            height: '28px',
                                            fontSize: '11px'
                                        }}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </Space>
                        </div>

                        {/* 对话历史区 */}
                        <div style={{
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                padding: '8px 16px',
                                background: 'white',
                                borderBottom: '1px solid #f0f0f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                                    对话记录 ({chatMessages.length})
                                </Text>
                                {chatMessages.length > 0 && (
                                    <Tooltip title="清空对话">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ClearOutlined />}
                                            onClick={handleClearChat}
                                            style={{ color: '#999' }}
                                        />
                                    </Tooltip>
                                )}
                            </div>

                            <div style={{
                                flex: 1,
                                overflow: 'auto',
                                padding: '8px'
                            }}>
                                <AIThinkingIndicator
                                    visible={isLoading}
                                    position="inline"
                                    compact={true}
                                />                                {chatMessages.length === 0 && !isLoading ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span style={{ color: '#999', fontSize: '12px' }}>
                                                还没有对话记录<br />
                                                使用快捷操作或直接输入问题开始对话
                                            </span>
                                        }
                                        style={{ padding: '40px 20px' }}
                                    />
                                ) : (
                                    <List
                                        dataSource={[...chatMessages].reverse()}
                                        renderItem={(message) => {
                                            if (message.type === 'user') {
                                                // 用户消息样式
                                                return (
                                                    <div
                                                        key={message.id}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                            marginBottom: '8px'
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                maxWidth: '80%',
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '12px 12px 4px 12px',
                                                                fontSize: '12px',
                                                                lineHeight: '1.4'
                                                            }}
                                                        >
                                                            <div>{message.content}</div>
                                                            <div style={{ 
                                                                fontSize: '10px', 
                                                                opacity: 0.8, 
                                                                marginTop: '4px',
                                                                textAlign: 'right'
                                                            }}>
                                                                {formatTime(message.timestamp)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            } else {
                                                // AI消息样式
                                                const info = getSuggestionInfo(message.aiType || 'general')
                                                return (
                                                    <Card
                                                        key={message.id}
                                                        size="small"
                                                        style={{
                                                            marginBottom: '8px',
                                                            borderRadius: '12px',
                                                            border: '1px solid #f0f0f0',
                                                            overflow: 'hidden'
                                                        }}
                                                        bodyStyle={{ padding: '12px' }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                            <Space size={4}>
                                                                <Tag 
                                                                    icon={info.icon} 
                                                                    color={info.color}
                                                                    style={{ 
                                                                        borderRadius: '8px',
                                                                        fontSize: '10px',
                                                                        border: 'none'
                                                                    }}
                                                                >
                                                                    {info.text}
                                                                </Tag>
                                                                <Text style={{ fontSize: '10px', color: '#999' }}>
                                                                    {formatTime(message.timestamp)}
                                                                </Text>
                                                            </Space>
                                                            <Space size={4}>
                                                                <Tooltip title="复制内容">
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={copiedId === message.id ? <CheckOutlined /> : <CopyOutlined />}
                                                                        onClick={() => handleCopy(message.content, message.id)}
                                                                        style={{ 
                                                                            color: copiedId === message.id ? '#52c41a' : '#999',
                                                                            padding: '2px 4px',
                                                                            height: '20px'
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="应用建议">
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        onClick={() => handleApplySuggestion({
                                                                            id: message.id,
                                                                            type: message.aiType || 'general',
                                                                            text: message.content,
                                                                            confidence: message.confidence || 0,
                                                                            reason: message.reason || '',
                                                                            timestamp: message.timestamp
                                                                        })}
                                                                        style={{ 
                                                                            color: '#1890ff',
                                                                            padding: '2px 8px',
                                                                            height: '20px',
                                                                            fontSize: '10px'
                                                                        }}
                                                                    >
                                                                        应用
                                                                    </Button>
                                                                </Tooltip>
                                                            </Space>
                                                        </div>
                                                        <Text style={{ 
                                                            fontSize: '12px', 
                                                            lineHeight: '1.6',
                                                            display: 'block',
                                                            whiteSpace: 'pre-wrap'
                                                        }}>
                                                            {message.content}
                                                        </Text>
                                                        {message.confidence && message.confidence > 0 && (
                                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f5f5f5' }}>
                                                                <Text style={{ 
                                                                    fontSize: '10px', 
                                                                    color: '#999'
                                                                }}>
                                                                    置信度: {Math.round(message.confidence * 100)}%
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </Card>
                                                )
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* 输入区 */}
                        <div style={{
                            padding: '16px',
                            background: 'white',
                            borderTop: '1px solid #f0f0f0'
                        }}>
                            <div style={{ marginBottom: '8px' }}>
                                <TextArea
                                    ref={inputRef}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="输入您的问题或需求..."
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    onPressEnter={(e) => {
                                        if (e.shiftKey) return
                                        e.preventDefault()
                                        handleSendMessage()
                                    }}
                                    style={{
                                        borderRadius: '12px',
                                        resize: 'none',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: '11px', color: '#999' }}>
                                    Shift + Enter 换行，Enter 发送
                                </Text>
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSendMessage}
                                    loading={isLoading}
                                    disabled={!userInput.trim()}
                                    style={{
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none'
                                    }}
                                >
                                    发送
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 窗口调整大小的边框和拖拽点 */}
                {!isMinimized && !isMaximized && (
                    <>
                        {/* 右边框 */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'right')}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                width: '4px',
                                height: '100%',
                                cursor: 'ew-resize',
                                background: 'rgba(24, 144, 255, 0.2)'
                            }}
                        />
                        
                        {/* 下边框 */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '4px',
                                cursor: 'ns-resize',
                                background: 'rgba(24, 144, 255, 0.2)'
                            }}
                        />
                        
                        {/* 右下角拖拽点 */}
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                            style={{
                                position: 'absolute',
                                right: 0,
                                bottom: 0,
                                width: '12px',
                                height: '12px',
                                cursor: 'nw-resize',
                                background: `
                                    linear-gradient(45deg, transparent 0%, transparent 30%, rgba(102, 126, 234, 0.3) 30%, rgba(102, 126, 234, 0.3) 35%, transparent 35%, transparent 45%, rgba(102, 126, 234, 0.3) 45%, rgba(102, 126, 234, 0.3) 50%, transparent 50%, transparent 60%, rgba(102, 126, 234, 0.3) 60%, rgba(102, 126, 234, 0.3) 65%, transparent 65%)
                                `,
                                borderRadius: '0 0 16px 0',
                                opacity: 0.7,
                                transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.7'
                            }}
                        />
                        
                        {/* 左边框 */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'left')}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '4px',
                                height: '100%',
                                cursor: 'ew-resize',
                                background: 'rgba(24, 144, 255, 0.2)'
                            }}
                        />
                        
                        {/* 上边框 */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'top')}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '4px',
                                cursor: 'ns-resize',
                                background: 'rgba(24, 144, 255, 0.2)'
                            }}
                        />
                        
                        {/* 左上角 */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '12px',
                                height: '12px',
                                cursor: 'nw-resize',
                                background: 'rgba(24, 144, 255, 0.1)'
                            }}
                        />
                        
                        {/* 右上角 */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                width: '12px',
                                height: '12px',
                                cursor: 'ne-resize',
                                background: 'rgba(24, 144, 255, 0.1)'
                            }}
                        />
                        
                        {/* 左下角 */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                            style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                width: '12px',
                                height: '12px',
                                cursor: 'ne-resize',
                                background: 'rgba(24, 144, 255, 0.1)'
                            }}
                        />
                    </>
                )}
            </div>

            {/* AI配置模态框 */}
            <AIConfigModal
                visible={showConfigModal}
                onClose={() => setShowConfigModal(false)}
            />

            {/* 小说会话历史模态框 */}
            <SessionHistoryModal
                visible={showHistoryModal}
                onCancel={() => setShowHistoryModal(false)}
                onSessionSelect={async (sessionId: string) => {
                    // 解析会话ID获取项目信息
                    const sessions = await sessionManager.getSessionSummaries();
                    const session = sessions.find((s: any) => s.projectId === sessionId);
                    
                    if (session) {
                        // 切换到选中的小说会话
                        setCurrentProjectId(session.projectId);
                        setCurrentProjectTitle(session.projectTitle);
                        
                        // 加载该小说的消息
                        const projectMessages = await sessionManager.getProjectMessages(session.projectId);
                        // 转换消息格式
                        const chatMessages: ChatMessage[] = projectMessages.map(msg => ({
                            id: msg.id,
                            type: msg.type === 'user' ? 'user' : 'ai',
                            content: msg.content,
                            timestamp: new Date(msg.timestamp)
                        }));
                        setChatMessages(chatMessages);
                        message.success(`已切换到 ${session.projectTitle}`);
                    }
                    
                    setShowHistoryModal(false);
                }}
            />
        </>
    )
}

export default FloatingAIWindow
