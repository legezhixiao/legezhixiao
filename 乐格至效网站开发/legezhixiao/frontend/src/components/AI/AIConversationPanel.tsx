import React, { useState, useRef, useEffect } from 'react'
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Divider,
  Select,
  Dropdown,
  MenuProps,
  Tag,
  Badge,
  Empty,
  Tooltip,
  Modal,
  message
} from 'antd'
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  HistoryOutlined,
  BookOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useAI } from '../../contexts/AIContext'
import { useAppStore } from '../../store/appStore'
import type { AIConversation } from '../../types'

const { Text, Paragraph } = Typography
const { TextArea } = Input

interface AIConversationPanelProps {
  className?: string
  style?: React.CSSProperties
  defaultProject?: string
  defaultChapter?: string
}

const AIConversationPanel: React.FC<AIConversationPanelProps> = ({
  className,
  style,
  defaultProject,
  defaultChapter
}) => {
  const [inputValue, setInputValue] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    conversations,
    currentConversation,
    isGenerating,
    currentProjectId,
    currentChapterId,
    createConversation,
    switchConversation,
    deleteConversation,
    sendMessage,
    setProjectContext,
    updateConversationProject
  } = useAI()

  const { projects } = useAppStore()

  // 初始化小说上下文
  useEffect(() => {
    if (defaultProject && !currentProjectId) {
      setProjectContext(defaultProject, defaultChapter)
    }
  }, [defaultProject, defaultChapter, currentProjectId, setProjectContext])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) return

    // 如果没有当前对话，创建新的
    if (!currentConversation) {
      const title = inputValue.length > 20 ? inputValue.slice(0, 20) + '...' : inputValue
      createConversation(title, currentProjectId || undefined, currentChapterId || undefined)
    }

    await sendMessage(inputValue)
    setInputValue('')
    inputRef.current?.focus()
  }

  // 创建新对话
  const handleNewConversation = () => {
    const title = `新对话 ${new Date().toLocaleTimeString()}`
    createConversation(title, currentProjectId || undefined, currentChapterId || undefined)
    setShowHistory(false)
  }

  // 小说选择变更
  const handleProjectChange = (projectId: string | null) => {
    setProjectContext(projectId, null)
    
    if (currentConversation && currentConversation.projectId !== projectId) {
      updateConversationProject(currentConversation.id, projectId)
    }
  }

  // 章节选择变更
  const handleChapterChange = (chapterId: string | null) => {
    setProjectContext(currentProjectId, chapterId)
  }

  // 删除对话确认
  const handleDeleteConversation = (conversationId: string) => {
    Modal.confirm({
      title: '删除对话',
      content: '确定要删除这个对话吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteConversation(conversationId)
        message.success('对话已删除')
      }
    })
  }

  // 编辑对话标题
  const handleEditTitle = (conversation: AIConversation) => {
    setEditingTitle(conversation.id)
    setNewTitle(conversation.title)
  }

  const handleSaveTitle = () => {
    // TODO: 实现标题更新逻辑
    setEditingTitle(null)
    setNewTitle('')
    message.success('标题已更新')
  }

  // 获取当前小说信息
  const currentProject = currentProjectId ? projects.find(p => p.id === currentProjectId) : null
  const currentChapterObj = currentProject?.chapters.find(c => c.id === currentChapterId)

  // 对话操作菜单
  const getConversationMenuItems = (conversation: AIConversation): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑标题',
      onClick: () => handleEditTitle(conversation)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除对话',
      danger: true,
      onClick: () => handleDeleteConversation(conversation.id)
    }
  ]

  return (
    <div className={className} style={style}>
      <Card
        title={
          <Space>
            <RobotOutlined />
            <span>AI 写作助手</span>
            {currentProject && (
              <Tag color="blue" icon={<BookOutlined />}>
                {currentProject.title}
              </Tag>
            )}
            {currentChapterObj && (
              <Tag color="green" icon={<FileTextOutlined />}>
                {currentChapterObj.title}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="对话历史">
              <Button 
                icon={<HistoryOutlined />}
                onClick={() => setShowHistory(!showHistory)}
              />
            </Tooltip>
            <Tooltip title="新对话">
              <Button 
                icon={<PlusOutlined />}
                onClick={handleNewConversation}
              />
            </Tooltip>
          </Space>
        }
        size="small"
      >
        {/* 小说和章节选择 */}
        <Space wrap style={{ marginBottom: 16, width: '100%' }}>
          <Select
            placeholder="选择小说"
            value={currentProjectId}
            onChange={handleProjectChange}
            style={{ minWidth: 120 }}
            allowClear
          >
            {projects.map(project => (
              <Select.Option key={project.id} value={project.id}>
                <Space>
                  <BookOutlined />
                  {project.title}
                </Space>
              </Select.Option>
            ))}
          </Select>

          {currentProject && (
            <Select
              placeholder="选择章节"
              value={currentChapterId}
              onChange={handleChapterChange}
              style={{ minWidth: 120 }}
              allowClear
            >
              {currentProject.chapters.map(chapter => (
                <Select.Option key={chapter.id} value={chapter.id}>
                  <Space>
                    <FileTextOutlined />
                    {chapter.title}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          )}
        </Space>

        {/* 对话历史面板 */}
        {showHistory && (
          <>
            <Card
              title="对话历史"
              size="small"
              style={{ marginBottom: 16 }}
              bodyStyle={{ padding: '8px 0' }}
            >
              {conversations.length > 0 ? (
                <List
                  size="small"
                  dataSource={conversations}
                  renderItem={conversation => (
                    <List.Item
                      style={{ 
                        padding: '8px 16px',
                        background: currentConversation?.id === conversation.id ? '#f0f8ff' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => switchConversation(conversation.id)}
                      actions={[
                        <Dropdown
                          menu={{ items: getConversationMenuItems(conversation) }}
                          trigger={['click']}
                        >
                          <Button type="text" icon={<SettingOutlined />} size="small" />
                        </Dropdown>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge dot={conversation.isActive}>
                            <Avatar size="small" icon={<HistoryOutlined />} />
                          </Badge>
                        }
                        title={
                          editingTitle === conversation.id ? (
                            <Input
                              size="small"
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                              onPressEnter={handleSaveTitle}
                              onBlur={handleSaveTitle}
                              autoFocus
                            />
                          ) : (
                            <Text ellipsis style={{ maxWidth: 200 }}>
                              {conversation.title}
                            </Text>
                          )
                        }
                        description={
                          <Space size={4}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {conversation.messages.length} 条消息
                            </Text>
                            {conversation.projectId && (
                              <Tag color="blue">
                                {projects.find(p => p.id === conversation.projectId)?.title}
                              </Tag>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无对话历史" />
              )}
            </Card>
            <Divider />
          </>
        )}

        {/* 消息列表 */}
        <div style={{ height: 300, overflowY: 'auto', marginBottom: 16 }}>
          {currentConversation?.messages.length ? (
            <List
              dataSource={currentConversation.messages}
              renderItem={message => (
                <List.Item style={{ padding: '8px 0', border: 'none' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        style={{ 
                          backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a' 
                        }}
                      />
                    }
                    title={
                      <Text strong>
                        {message.role === 'user' ? '你' : 'AI助手'}
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          {message.timestamp.toLocaleTimeString()}
                        </Text>
                      </Text>
                    }
                    description={
                      <div style={{ marginTop: 4 }}>
                        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Paragraph>
                        {message.metadata?.suggestedChanges && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>建议:</Text>
                            {message.metadata.suggestedChanges.map((suggestion, index) => (
                              <Tag key={index} style={{ marginTop: 4 }}>
                                {suggestion}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              description={
                <Space direction="vertical">
                  <Text type="secondary">开始与AI助手对话</Text>
                  {currentProject && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      当前小说: {currentProject.title}
                    </Text>
                  )}
                </Space>
              } 
              image={<RobotOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            />
          )}
          {isGenerating && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Text type="secondary">AI正在思考中...</Text>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={
              currentProject 
                ? `询问关于《${currentProject.title}》的写作问题...`
                : '询问写作相关问题...'
            }
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isGenerating}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating}
            loading={isGenerating}
          >
            发送
          </Button>
        </Space.Compact>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Shift + Enter 换行，Enter 发送
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default AIConversationPanel
