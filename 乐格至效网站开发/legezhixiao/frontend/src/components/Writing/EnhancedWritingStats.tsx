import React, { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Progress, Space, Typography, Button, Badge, message } from 'antd'
import { 
  EditOutlined, 
  ClockCircleOutlined, 
  TrophyOutlined,
  FireOutlined,
  AimOutlined,
  BarChartOutlined,
  CalendarOutlined,
  BookOutlined,
  LineChartOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
// 文件已清空
const { Text } = Typography

interface WritingSession {
  date: string
  wordCount: number
  duration: number // 分钟
}

interface EnhancedWritingStatsProps {
  currentWordCount: number
  totalWordCount: number
  targetWordCount: number
  sessionTime: number // 分钟
  projectId: string
}

const EnhancedWritingStats: React.FC<EnhancedWritingStatsProps> = ({
  currentWordCount,
  totalWordCount,
  targetWordCount,
  sessionTime,
  projectId
}) => {
  // 状态管理
  const [todayWordCount, setTodayWordCount] = useState(0)
  const [weekWordCount, setWeekWordCount] = useState(0)
  const [monthWordCount, setMonthWordCount] = useState(0)
  const [writingStreak, setWritingStreak] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(1000)
  const [weeklyGoal, setWeeklyGoal] = useState(7000)
  const [avgWordsPerMinute, setAvgWordsPerMinute] = useState(0)
  const [recentSessions, setRecentSessions] = useState<WritingSession[]>([])
  const [bestDay, setBestDay] = useState({ date: '', count: 0 })
  const [showGoalSettings, setShowGoalSettings] = useState(false)

  // 保存目标设置到localStorage
  const saveGoals = (daily: number, weekly: number) => {
    // localStorage.setItem(`writing_goals_${projectId}`, JSON.stringify({daily, weekly}))
    setDailyGoal(daily)
    setWeeklyGoal(weekly)
    message.success('目标设置已保存')
  }

  // 模拟数据加载（基于projectId）
  useEffect(() => {
    const loadWritingStats = async () => {
      try {
        // 基于projectId加载项目特定的统计数据
        console.log(`加载项目 ${projectId} 的统计数据`)
        
        // 模拟从localStorage获取项目特定的目标设置
        const savedGoals = localStorage.getItem(`writing_goals_${projectId}`)
        if (savedGoals) {
          const goals = JSON.parse(savedGoals)
          setDailyGoal(goals.daily || 1000)
          setWeeklyGoal(goals.weekly || 7000)
        }
        
        // 今日字数
        setTodayWordCount(1250)
        
        // 本周字数
        setWeekWordCount(5800)
        
        // 本月字数
        setMonthWordCount(18500)
        
        // 连续写作天数
        setWritingStreak(12)
        
        // 平均每分钟字数
        setAvgWordsPerMinute(Math.floor(currentWordCount / Math.max(sessionTime, 1)))
        
        // 最佳写作日
        setBestDay({ date: '2024-01-15', count: 2800 })
        
        // 最近写作记录
        setRecentSessions([
          { date: '2024-01-20', wordCount: 1200, duration: 45 },
          { date: '2024-01-19', wordCount: 800, duration: 30 },
          { date: '2024-01-18', wordCount: 1500, duration: 60 },
          { date: '2024-01-17', wordCount: 950, duration: 35 },
          { date: '2024-01-16', wordCount: 1100, duration: 40 }
        ])
      } catch (error) {
        console.error('加载写作统计失败:', error)
      }
    }

    loadWritingStats()
  }, [currentWordCount, sessionTime, projectId])

  // 计算完成百分比
  const progressPercent = Math.min((totalWordCount / targetWordCount) * 100, 100)
  const dailyProgress = Math.min((todayWordCount / dailyGoal) * 100, 100)
  const weeklyProgress = Math.min((weekWordCount / weeklyGoal) * 100, 100)

  // 计算预计完成时间
  const calculateEstimatedCompletion = () => {
    const remainingWords = targetWordCount - totalWordCount
    const avgDailyWords = weekWordCount / 7
    
    if (avgDailyWords <= 0) return '无法估算'
    
    const daysRemaining = Math.ceil(remainingWords / avgDailyWords)
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + daysRemaining)
    
    return completionDate.toLocaleDateString('zh-CN')
  }

  // 获取进度状态
  const getProgressStatus = (percent: number) => {
    if (percent >= 100) return 'success'
    if (percent >= 80) return 'active'
    if (percent >= 50) return 'normal'
    return 'exception'
  }

  return (
    <div style={{ padding: '16px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 当前会话统计 */}
        <Card 
          title={
            <Space>
              <EditOutlined />
              <span>当前写作会话</span>
              <Badge 
                status="processing" 
                text="进行中" 
                style={{ marginLeft: '8px' }}
              />
            </Space>
          }
          size="small"
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="会话字数"
                value={currentWordCount}
                prefix={<EditOutlined />}
                suffix="字"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="会话时长"
                value={sessionTime}
                prefix={<ClockCircleOutlined />}
                suffix="分钟"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="写作速度"
                value={avgWordsPerMinute}
                prefix={<LineChartOutlined />}
                suffix="字/分钟"
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 今日目标进度 */}
        <Card 
          title={
            <Space>
              <AimOutlined />
              <span>今日写作目标</span>
              {dailyProgress >= 100 && (
                <Badge 
                  status="success" 
                  text="已完成" 
                  style={{ marginLeft: '8px' }}
                />
              )}
            </Space>
          }
          extra={
            <Button 
              type="text" 
              size="small" 
              onClick={() => setShowGoalSettings(!showGoalSettings)}
            >
              设置目标
            </Button>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>今日进度: {todayWordCount} / {dailyGoal} 字</Text>
              <Text type="secondary">{dailyProgress.toFixed(1)}%</Text>
            </div>
            <Progress 
              percent={dailyProgress} 
              status={getProgressStatus(dailyProgress)}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              还需 {Math.max(0, dailyGoal - todayWordCount)} 字完成今日目标
            </Text>
            
            {/* 目标设置面板 */}
            {showGoalSettings && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#f5f5f5', 
                borderRadius: '6px' 
              }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>每日目标:</Text>
                    <Space>
                      <Button 
                        size="small" 
                        onClick={() => saveGoals(Math.max(500, dailyGoal - 250), weeklyGoal)}
                      >
                        -250
                      </Button>
                      <Text style={{ minWidth: '60px', textAlign: 'center' }}>{dailyGoal}字</Text>
                      <Button 
                        size="small" 
                        onClick={() => saveGoals(dailyGoal + 250, weeklyGoal)}
                      >
                        +250
                      </Button>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>每周目标:</Text>
                    <Space>
                      <Button 
                        size="small" 
                        onClick={() => saveGoals(dailyGoal, Math.max(1000, weeklyGoal - 1000))}
                      >
                        -1000
                      </Button>
                      <Text style={{ minWidth: '60px', textAlign: 'center' }}>{weeklyGoal}字</Text>
                      <Button 
                        size="small" 
                        onClick={() => saveGoals(dailyGoal, weeklyGoal + 1000)}
                      >
                        +1000
                      </Button>
                    </Space>
                  </div>
                </Space>
              </div>
            )}
          </Space>
        </Card>

        {/* 项目总体进度 */}
        <Card 
          title={
            <Space>
              <BookOutlined />
              <span>项目总进度</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="已完成字数"
                  value={totalWordCount}
                  suffix={`/ ${targetWordCount.toLocaleString()}`}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="完成度"
                  value={progressPercent}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    fontSize: '16px',
                    color: progressPercent >= 100 ? '#52c41a' : '#1890ff'
                  }}
                />
              </Col>
            </Row>
            
            <Progress 
              percent={progressPercent} 
              status={getProgressStatus(progressPercent)}
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
              style={{ marginTop: '8px' }}
            />
            
            <Text type="secondary" style={{ fontSize: '12px' }}>
              预计完成时间: {calculateEstimatedCompletion()}
            </Text>
          </Space>
        </Card>

        {/* 写作统计 */}
        <Card 
          title={
            <Space>
              <BarChartOutlined />
              <span>写作统计</span>
            </Space>
          }
          size="small"
        >
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="本周字数"
                value={weekWordCount}
                prefix={<CalendarOutlined />}
                suffix="字"
                valueStyle={{ fontSize: '14px' }}
              />
              <Progress 
                percent={weeklyProgress} 
                size="small" 
                status={getProgressStatus(weeklyProgress)}
                style={{ marginTop: '4px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="本月字数"
                value={monthWordCount}
                prefix={<EditOutlined />}
                suffix="字"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="连续天数"
                value={writingStreak}
                prefix={<FireOutlined />}
                suffix="天"
                valueStyle={{ 
                  fontSize: '14px',
                  color: writingStreak >= 7 ? '#f5222d' : '#1890ff'
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最佳单日"
                value={bestDay.count}
                prefix={<TrophyOutlined />}
                suffix="字"
                valueStyle={{ fontSize: '14px', color: '#faad14' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 最近写作记录 */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined />
              <span>最近写作记录</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {recentSessions.map((session, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: index === 0 ? '#f6ffed' : '#fafafa',
                borderRadius: '6px',
                border: index === 0 ? '1px solid #b7eb8f' : '1px solid #e8e8e8'
              }}>
                <Space>
                  <Text style={{ fontSize: '12px' }}>{session.date}</Text>
                  {index === 0 && <Badge status="success" text="今日" />}
                </Space>
                <Space>
                  <Text style={{ fontSize: '12px' }}>
                    {session.wordCount} 字
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {session.duration}分钟
                  </Text>
                </Space>
              </div>
            ))}
          </Space>
        </Card>

        {/* 目标设置 */}
        <Card 
          title={
            <Space>
              <CheckCircleOutlined />
              <span>写作目标</span>
            </Space>
          }
          size="small"
          extra={
            <Button type="link" size="small">
              设置目标
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>日目标</Text>
              <Text>{dailyGoal.toLocaleString()} 字</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>周目标</Text>
              <Text>{weeklyGoal.toLocaleString()} 字</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>项目目标</Text>
              <Text>{targetWordCount.toLocaleString()} 字</Text>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default EnhancedWritingStats
