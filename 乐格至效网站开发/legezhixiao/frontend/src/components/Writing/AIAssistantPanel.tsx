import {
    BulbOutlined,
    EditOutlined,
    ExpandAltOutlined,
    RobotOutlined,
    SendOutlined,
    ThunderboltOutlined
} from '@ant-design/icons'
import { Button, Card, Divider, Input, List, Space, Tag, Typography } from 'antd'
import React, { useState } from 'react'

const { Text, Paragraph } = Typography
const { TextArea } = Input

interface AISuggestion {
    id: string
    type: 'continuation' | 'rewrite' | 'expansion' | 'character' | 'plot'
    content: string
    confidence: number
}

interface AIAssistantPanelProps {
    onSuggestionApply: (suggestion: string) => void
    currentContent: string
    isGenerating: boolean
}

// 模拟AI建议数据
const mockSuggestions: AISuggestion[] = [
    {
        id: '1',
        type: 'continuation',
        content: '主角走进了古老的图书馆，书架上的古籍散发着神秘的光芒...',
        confidence: 0.92,
    },
    {
        id: '2',
        type: 'character',
        content: '可以考虑让主角的性格更加复杂一些，比如内心的矛盾和成长。',
        confidence: 0.85,
    },
    {
        id: '3',
        type: 'plot',
        content: '这里可以埋下一个伏笔，暗示主角的真实身份。',
        confidence: 0.78,
    },
]

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
    onSuggestionApply,
    currentContent,
    isGenerating,
}) => {
    const [suggestions] = useState<AISuggestion[]>(mockSuggestions)
    const [userPrompt, setUserPrompt] = useState('')
    const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions')

    const getSuggestionIcon = (type: AISuggestion['type']) => {
        switch (type) {
            case 'continuation': return <EditOutlined />
            case 'rewrite': return <ThunderboltOutlined />
            case 'expansion': return <ExpandAltOutlined />
            case 'character': return <RobotOutlined />
            case 'plot': return <BulbOutlined />
            default: return <BulbOutlined />
        }
    }

    const getSuggestionTypeText = (type: AISuggestion['type']) => {
        switch (type) {
            case 'continuation': return '续写建议'
            case 'rewrite': return '改写建议'
            case 'expansion': return '扩写建议'
            case 'character': return '角色建议'
            case 'plot': return '情节建议'
            default: return '其他建议'
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return 'green'
        if (confidence >= 0.7) return 'orange'
        return 'red'
    }

    const handleSendPrompt = async () => {
        if (!userPrompt.trim()) return

        // TODO: 发送用户提示到AI服务
        console.log('用户提示:', userPrompt)
        setUserPrompt('')
    }

    const handleGenerateSuggestions = async () => {
        // TODO: 基于当前内容生成新建议
        console.log('生成新建议，当前内容长度:', currentContent.length)
    }

    return (
        <Card
            title={
                <Space>
                    <RobotOutlined />
                    AI 助手
                </Space>
            }
            size="small"
            style={{
                height: '100%',
                borderRadius: 0,
                borderRight: 0,
                borderTop: 0,
                borderBottom: 0
            }}
            extra={
                <Button
                    type="text"
                    icon={<ThunderboltOutlined />}
                    size="small"
                    loading={isGenerating}
                    onClick={handleGenerateSuggestions}
                />
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
                {/* 标签页切换 */}
                <div style={{ marginBottom: '12px' }}>
                    <Button.Group size="small" style={{ width: '100%' }}>
                        <Button
                            type={activeTab === 'suggestions' ? 'primary' : 'default'}
                            onClick={() => setActiveTab('suggestions')}
                            style={{ flex: 1 }}
                        >
                            智能建议
                        </Button>
                        <Button
                            type={activeTab === 'chat' ? 'primary' : 'default'}
                            onClick={() => setActiveTab('chat')}
                            style={{ flex: 1 }}
                        >
                            对话助手
                        </Button>
                    </Button.Group>
                </div>

                {activeTab === 'suggestions' ? (
                    /* 建议列表 */
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <List
                            size="small"
                            dataSource={suggestions}
                            renderItem={(suggestion) => (
                                <List.Item
                                    style={{
                                        padding: '8px 0',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}
                                    actions={[
                                        <Button
                                            key="apply"
                                            type="primary"
                                            size="small"
                                            onClick={() => onSuggestionApply(suggestion.content)}
                                        >
                                            应用
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={getSuggestionIcon(suggestion.type)}
                                        title={
                                            <Space>
                                                <Text strong style={{ fontSize: '12px' }}>
                                                    {getSuggestionTypeText(suggestion.type)}
                                                </Text>
                                                <Tag
                                                    color={getConfidenceColor(suggestion.confidence)}
                                                >
                                                    {Math.round(suggestion.confidence * 100)}%
                                                </Tag>
                                            </Space>
                                        }
                                        description={
                                            <Paragraph
                                                style={{
                                                    fontSize: '12px',
                                                    margin: 0,
                                                    color: '#666'
                                                }}
                                                ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                                            >
                                                {suggestion.content}
                                            </Paragraph>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                ) : (
                    /* 对话界面 */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflow: 'auto', marginBottom: '12px' }}>
                            {/* TODO: 聊天历史 */}
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                与AI助手对话，获取写作建议...
                            </Text>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        <Space.Compact style={{ width: '100%' }}>
                            <TextArea
                                placeholder="向AI助手提问..."
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                onPressEnter={(e) => {
                                    if (!e.shiftKey) {
                                        e.preventDefault()
                                        handleSendPrompt()
                                    }
                                }}
                                rows={2}
                                style={{ resize: 'none' }}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSendPrompt}
                                loading={isGenerating}
                            />
                        </Space.Compact>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default AIAssistantPanel
