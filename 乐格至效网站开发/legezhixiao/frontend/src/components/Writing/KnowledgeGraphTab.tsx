import React, { useState } from 'react';
import { Button, Card, Space, Typography, Alert } from 'antd';
import { DatabaseOutlined, BranchesOutlined } from '@ant-design/icons';
import KnowledgeGraphManager from './KnowledgeGraphManager';

const { Title } = Typography;

interface KnowledgeGraphTabProps {
  projectId: string;
}

/**
 * 知识图谱标签页组件
 * 在工作空间的标签页中展示知识图谱功能
 */
const KnowledgeGraphTab: React.FC<KnowledgeGraphTabProps> = ({ projectId }) => {
  const [showFullManager, setShowFullManager] = useState(false);

  if (showFullManager) {
    return (
      <div style={{ height: 'calc(100vh - 300px)', marginTop: '-16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
          padding: '0 8px'
        }}>
          <Title level={5} style={{ margin: 0 }}>知识图谱管理器</Title>
          <Button size="small" onClick={() => setShowFullManager(false)}>
            返回概览
          </Button>
        </div>
        <KnowledgeGraphManager 
          projectId={projectId}
          onNodeSelect={(node) => {
            console.log('Selected node:', node);
          }}
          onRelationshipSelect={(relationship) => {
            console.log('Selected relationship:', relationship);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      {/* 知识图谱入口 */}
      <Card 
        size="small" 
        title={
          <Space>
            <BranchesOutlined />
            <span>知识图谱</span>
          </Space>
        }
      >
        <Alert
          message="智能知识图谱"
          description="可视化管理小说中的角色、地点、事件等元素，自动发现关联关系，提供智能写作建议。"
          type="info"
          showIcon
          style={{ marginBottom: '12px' }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>主要功能：</strong>
            <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
              <li>角色关系网络可视化</li>
              <li>情节线索追踪</li>
              <li>智能连接推荐</li>
              <li>故事一致性检查</li>
            </ul>
          </div>
          
          <Button 
            type="primary" 
            size="small"
            icon={<DatabaseOutlined />}
            onClick={() => setShowFullManager(true)}
            block
          >
            打开知识图谱管理器
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default KnowledgeGraphTab;