import React from 'react'
import { Typography, Card } from 'antd'

const { Title, Text } = Typography

interface CreativeToolsManagerProps {
  projectId?: string;
}

const CreativeToolsManager: React.FC<CreativeToolsManagerProps> = () => {
  return (
    <Card>
      <Title level={3}>创意工具</Title>
      <Text type="secondary">创意工具功能正在开发中...</Text>
    </Card>
  )
}

export default CreativeToolsManager