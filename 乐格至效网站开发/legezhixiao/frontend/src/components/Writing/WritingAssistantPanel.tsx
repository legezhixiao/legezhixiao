import React, { useState } from 'react'
import { Tabs, Space, Button, Typography, Badge, Collapse, List, Tag, Divider } from 'antd'
import { 
  RobotOutlined, 
  BarChartOutlined, 
  BookOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  EditOutlined,
  UserOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import EnhancedWritingStats from './EnhancedWritingStats'

const { Text } = Typography
const { Panel } = Collapse

interface WritingAssistantPanelProps {
  projectId: string
  currentWordCount: number
  totalWordCount: number
  targetWordCount: number
  sessionTime: number
}

const WritingAssistantPanel: React.FC<WritingAssistantPanelProps> = ({
  projectId,
  currentWordCount,
  totalWordCount,
  targetWordCount,
  sessionTime
}) => {
  const [activeTab, setActiveTab] = useState('stats')

  // 模拟AI建议数据
  const aiSuggestions = [
    {
      type: 'plot',
      title: '情节发展建议',
      content: '当前章节可以加入更多冲突元素，增强戏剧张力',
      priority: 'high'
    },
    {
      type: 'character',
      title: '角色发展',
      content: '主角的内心独白可以更深入一些，展现其心理变化',
      priority: 'medium'
    },
    {
      type: 'style',
      title: '写作风格',
      content: '建议增加环境描写，让场景更加生动',
      priority: 'low'
    }
  ]

  // 写作提醒
  const writingReminders = [
    { time: '14:30', content: '记得在第三章加入伏笔' },
    { time: '15:00', content: '检查人物对话的一致性' },
    { time: '16:00', content: '完成今日写作目标还需500字' }
  ]

  // 快速工具
  const quickTools = [
    { name: '角色生成器', icon: <UserOutlined />, action: () => console.log('角色生成器') },
    { name: '情节发展', icon: <BookOutlined />, action: () => console.log('情节发展') },
    { name: '场景描述', icon: <EnvironmentOutlined />, action: () => console.log('场景描述') },
    { name: '对话润色', icon: <EditOutlined />, action: () => console.log('对话润色') }
  ]

  const renderAISuggestions = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>AI写作建议</Text>
        <Button type="primary" size="small" icon={<RobotOutlined />}>
          获取建议
        </Button>
      </div>
      
      <List
        size="small"
        dataSource={aiSuggestions}
        renderItem={item => (
          <List.Item style={{ padding: '8px 12px', background: '#fafafa', marginBottom: '4px', borderRadius: '6px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '12px' }}>{item.title}</Text>
                <Tag 
                  color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'green'}
                  style={{ fontSize: '10px', margin: 0 }}
                >
                  {item.priority === 'high' ? '重要' : item.priority === 'medium' ? '中等' : '建议'}
                </Tag>
              </div>
              <Text style={{ fontSize: '11px', color: '#666' }}>{item.content}</Text>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="link" size="small" style={{ padding: 0, fontSize: '10px', height: 'auto' }}>
                  应用建议
                </Button>
              </div>
            </Space>
          </List.Item>
        )}
      />
    </Space>
  )

  const renderWritingReminders = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>写作提醒</Text>
        <Button type="text" size="small" icon={<ClockCircleOutlined />}>
          添加
        </Button>
      </div>
      
      <List
        size="small"
        dataSource={writingReminders}
        renderItem={item => (
          <List.Item style={{ padding: '6px 8px', background: '#fff7e6', marginBottom: '2px', borderRadius: '4px', border: '1px solid #ffd591' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ fontSize: '10px', color: '#fa8c16' }}>{item.time}</Text>
                <br />
                <Text style={{ fontSize: '11px' }}>{item.content}</Text>
              </div>
              <Button type="text" size="small" style={{ padding: 0, fontSize: '10px' }}>
                ✓
              </Button>
            </Space>
          </List.Item>
        )}
      />
    </Space>
  )

  const renderQuickTools = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Text strong>快速工具</Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {quickTools.map((tool, index) => (
          <Button
            key={index}
            type="default"
            size="small"
            icon={tool.icon}
            onClick={tool.action}
            style={{ 
              height: '40px', 
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            {tool.name}
          </Button>
        ))}
      </div>
    </Space>
  )

  const renderProjectInsights = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Text strong>项目洞察</Text>
      
      <Collapse size="small" ghost>
        <Panel 
          header={<Text style={{ fontSize: '12px' }}>角色分析</Text>} 
          key="characters"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ fontSize: '11px' }}>
              <Text strong>主要角色：</Text> 3个
              <br />
              <Text strong>配角：</Text> 8个
              <br />
              <Text strong>发展不足：</Text> 李明 (需要更多背景故事)
            </div>
          </Space>
        </Panel>
        
        <Panel 
          header={<Text style={{ fontSize: '12px' }}>情节节奏</Text>} 
          key="plot"
        >
          <div style={{ fontSize: '11px' }}>
            <Text strong>当前节奏：</Text> 中等
            <br />
            <Text strong>建议：</Text> 在第5章加入高潮冲突
          </div>
        </Panel>
        
        <Panel 
          header={<Text style={{ fontSize: '12px' }}>文体风格</Text>} 
          key="style"
        >
          <div style={{ fontSize: '11px' }}>
            <Text strong>词汇丰富度：</Text> 良好
            <br />
            <Text strong>句式变化：</Text> 需要改进
            <br />
            <Text strong>情感表达：</Text> 优秀
          </div>
        </Panel>
      </Collapse>
    </Space>
  )

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="small"
        style={{ height: '100%' }}
        items={[
          {
            key: 'stats',
            label: (
              <Space>
                <BarChartOutlined />
                <span>统计</span>
              </Space>
            ),
            children: (
              <EnhancedWritingStats
                currentWordCount={currentWordCount}
                totalWordCount={totalWordCount}
                targetWordCount={targetWordCount}
                sessionTime={sessionTime}
                projectId={projectId}
              />
            )
          },
          {
            key: 'ai',
            label: (
              <Space>
                <RobotOutlined />
                <span>AI助手</span>
                <Badge count={aiSuggestions.length} size="small" />
              </Space>
            ),
            children: (
              <div style={{ padding: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {renderAISuggestions()}
                  <Divider />
                  {renderQuickTools()}
                </Space>
              </div>
            )
          },
          {
            key: 'reminders',
            label: (
              <Space>
                <ClockCircleOutlined />
                <span>提醒</span>
                <Badge count={writingReminders.length} size="small" />
              </Space>
            ),
            children: (
              <div style={{ padding: '16px' }}>
                {renderWritingReminders()}
              </div>
            )
          },
          {
            key: 'insights',
            label: (
              <Space>
                <BulbOutlined />
                <span>洞察</span>
              </Space>
            ),
            children: (
              <div style={{ padding: '16px' }}>
                {renderProjectInsights()}
              </div>
            )
          }
        ]}
      />
    </div>
  )
}

export default WritingAssistantPanel
