import React from 'react'
import { Statistic, Row, Col } from 'antd'
import { ClockCircleOutlined, EditOutlined, TagOutlined } from '@ant-design/icons'

interface WritingStatsProps {
  wordCount: number
  targetWords: number
  sessionTime: number // 分钟
}

const WritingStats: React.FC<WritingStatsProps> = ({ 
  wordCount, 
  targetWords, 
  sessionTime 
}) => {
  const progress = Math.round((wordCount / targetWords) * 100)

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <Row gutter={16}>
      <Col>
        <Statistic
          title="当前字数"
          value={wordCount}
          prefix={<EditOutlined style={{ color: '#1890ff' }} />}
          valueStyle={{ 
            fontSize: '16px', 
            color: '#1890ff',
            fontFamily: 'JetBrains Mono, Courier New, monospace',
            fontWeight: 'bold'
          }}
          className="tech-stat-number"
        />
      </Col>
      <Col>
        <Statistic
          title="完成度"
          value={progress}
          suffix="%"
          prefix={<TagOutlined style={{ color: progress >= 100 ? '#52c41a' : '#13c2c2' }} />}
          valueStyle={{ 
            fontSize: '16px', 
            color: progress >= 100 ? '#52c41a' : '#13c2c2',
            fontFamily: 'JetBrains Mono, Courier New, monospace',
            fontWeight: 'bold'
          }}
          className="tech-stat-number"
        />
      </Col>
      <Col>
        <Statistic
          title="本次时长"
          value={formatTime(sessionTime)}
          prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
          valueStyle={{ 
            fontSize: '16px',
            color: '#722ed1',
            fontFamily: 'JetBrains Mono, Courier New, monospace',
            fontWeight: 'bold'
          }}
          className="tech-stat-number"
        />
      </Col>
    </Row>
  )
}

export default WritingStats
