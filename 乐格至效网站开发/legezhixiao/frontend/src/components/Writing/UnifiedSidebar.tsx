import React, { useState } from 'react'
import { 
  Tabs, 
  Space, 
  Button, 
  Typography, 
  Badge, 
  Collapse, 
  Divider,
  Card,
  Statistic,
  Row,
  Col,
  Progress,
  Tooltip
} from 'antd'
import { 
  BookOutlined,
  BarChartOutlined,
  BulbOutlined,
  AimOutlined,
  PlusOutlined
} from '@ant-design/icons'
// import SmartChapterNavigation from './SmartChapterNavigation' // 组件已删除

const { Text } = Typography
const { Panel } = Collapse

interface UnifiedSidebarProps {
  // projectId: string, // 暂未使用
  // currentChapterId?: string, // 暂未使用
  wordCount: number,
  targetWordCount?: number,
  writingTime: number,
  // onChapterSelect?: (chapterId: string) => void, // 暂未使用
  // onChapterCreate?: () => void, // 暂未使用
  // onChapterUpdate?: (chapterId: string, data: any) => void, // 暂未使用
  // onChapterDelete?: (chapterId: string) => void, // 暂未使用
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  targetWordCount = 10000
}) => {
  const [activeTab, setActiveTab] = useState('chapters')

  // 统计数据
  const [todayWordCount] = useState(1250)
  const [weekWordCount] = useState(5800)
  const [monthWordCount] = useState(18500)
  const [writingStreak] = useState(12)
  const [dailyGoal] = useState(1000)
  const [weeklyGoal] = useState(7000)
  const [currentWordCount] = useState(856)
  const [sessionTime] = useState(45)
  const totalWordCount = monthWordCount

  // 计算进度
  const progressPercent = Math.min((totalWordCount / targetWordCount) * 100, 100)
  const dailyProgress = Math.min((todayWordCount / dailyGoal) * 100, 100)
  const weeklyProgress = Math.min((weekWordCount / weeklyGoal) * 100, 100)
  const avgWordsPerMinute = Math.floor(currentWordCount / Math.max(sessionTime, 1))

  // AI建议数据 - 已移除，功能转移到可拖拽AI助手中
  // const aiSuggestions = [...] 

  // 写作提醒
  const writingReminders = [
    { time: '14:30', content: '记得在第三章加入伏笔' },
    { time: '15:00', content: '检查人物对话的一致性' },
    { time: '16:00', content: '完成今日写作目标还需500字' }
  ]

  // 快速工具已移至可拖拽AI助手中
  // const quickTools = [...]

  // 渲染章节导航标签页
  const renderChaptersTab = () => (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <Typography.Text type="secondary">
        章节导航功能正在开发中...
      </Typography.Text>
    </div>
  )

  // 渲染统计标签页
  const renderStatsTab = () => (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 当前会话统计 */}
        <Card size="small" title="当前会话">
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Statistic
                title="会话字数"
                value={currentWordCount}
                suffix="字"
                valueStyle={{ fontSize: '16px', color: '#1890ff' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="时长"
                value={sessionTime}
                suffix="分钟"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="速度"
                value={avgWordsPerMinute}
                suffix="字/分"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 今日目标 */}
        <Card 
          size="small" 
          title={
            <Space>
              <AimOutlined />
              <span>今日目标</span>
              {dailyProgress >= 100 && (
                <Badge status="success" text="已完成" />
              )}
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: '12px' }}>进度: {todayWordCount} / {dailyGoal} 字</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>{dailyProgress.toFixed(1)}%</Text>
            </div>
            <Progress 
              percent={dailyProgress} 
              size="small" 
              status={dailyProgress >= 100 ? 'success' : 'active'}
            />
          </Space>
        </Card>

        {/* 项目总进度 */}
        <Card size="small" title="项目进度">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: '12px' }}>{totalWordCount.toLocaleString()} / {targetWordCount.toLocaleString()} 字</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>{progressPercent.toFixed(1)}%</Text>
            </div>
            <Progress 
              percent={progressPercent} 
              size="small" 
              strokeColor={{ from: '#108ee9', to: '#87d068' }}
            />
          </Space>
        </Card>

        {/* 写作统计 */}
        <Card size="small" title="写作统计">
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic
                title="本周"
                value={weekWordCount}
                suffix="字"
                valueStyle={{ fontSize: '12px' }}
              />
              <Progress percent={weeklyProgress} size="small" />
            </Col>
            <Col span={12}>
              <Statistic
                title="本月"
                value={monthWordCount}
                suffix="字"
                valueStyle={{ fontSize: '12px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="连续"
                value={writingStreak}
                suffix="天"
                valueStyle={{ fontSize: '12px', color: '#f5222d' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="最佳"
                value={2800}
                suffix="字"
                valueStyle={{ fontSize: '12px', color: '#faad14' }}
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  )

  // AI助手功能已移至可拖拽AI助手窗口
  // const renderAITab = () => {...} 

  // 渲染提醒标签页
  const renderRemindersTab = () => (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 写作提醒 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Text strong>写作提醒</Text>
            <Button type="text" size="small" icon={<PlusOutlined />}>
              添加
            </Button>
          </div>
          
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {writingReminders.map((reminder, index) => (
              <Card key={index} size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text style={{ fontSize: '10px', color: '#fa8c16' }}>{reminder.time}</Text>
                    <br />
                    <Text style={{ fontSize: '11px' }}>{reminder.content}</Text>
                  </div>
                  <Button type="text" size="small" style={{ padding: 0 }}>
                    ✓
                  </Button>
                </div>
              </Card>
            ))}
          </Space>
        </div>

        <Divider />

        {/* 项目洞察 */}
        <div>
          <Text strong style={{ marginBottom: '12px', display: 'block' }}>项目洞察</Text>
          
          <Collapse size="small" ghost>
            <Panel 
              header={<Text style={{ fontSize: '12px' }}>角色分析</Text>} 
              key="characters"
            >
              <div style={{ fontSize: '11px' }}>
                <Text strong>主要角色：</Text> 3个<br />
                <Text strong>配角：</Text> 8个<br />
                <Text strong>发展不足：</Text> 李明 (需要更多背景故事)
              </div>
            </Panel>
            
            <Panel 
              header={<Text style={{ fontSize: '12px' }}>情节节奏</Text>} 
              key="plot"
            >
              <div style={{ fontSize: '11px' }}>
                <Text strong>当前节奏：</Text> 中等<br />
                <Text strong>建议：</Text> 在第5章加入高潮冲突
              </div>
            </Panel>
            
            <Panel 
              header={<Text style={{ fontSize: '12px' }}>文体风格</Text>} 
              key="style"
            >
              <div style={{ fontSize: '11px' }}>
                <Text strong>词汇丰富度：</Text> 良好<br />
                <Text strong>句式变化：</Text> 需要改进<br />
                <Text strong>情感表达：</Text> 优秀
              </div>
            </Panel>
          </Collapse>
        </div>
      </Space>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="small"
        style={{ height: '100%' }}
        items={[
          {
            key: 'chapters',
            label: (
              <Tooltip title="章节导航">
                <Space>
                  <BookOutlined />
                  <span>章节</span>
                </Space>
              </Tooltip>
            ),
            children: renderChaptersTab()
          },
          {
            key: 'stats',
            label: (
              <Tooltip title="写作统计">
                <Space>
                  <BarChartOutlined />
                  <span>统计</span>
                </Space>
              </Tooltip>
            ),
            children: renderStatsTab()
          },
          {
            key: 'reminders',
            label: (
              <Tooltip title="提醒和洞察">
                <Space>
                  <BulbOutlined />
                  <span>提醒</span>
                  <Badge count={writingReminders.length} size="small" />
                </Space>
              </Tooltip>
            ),
            children: renderRemindersTab()
          }
        ]}
      />
    </div>
  )
}

export default UnifiedSidebar
