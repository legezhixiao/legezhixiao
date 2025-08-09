import React from 'react';
import { Card, Typography } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';
import KnowledgeGraphManager from '../components/Writing/KnowledgeGraphManager';
import { useAppStore } from '../store/appStore';

const { Title } = Typography;

const KnowledgeGraphPage: React.FC = () => {
  const { currentProject } = useAppStore();

  if (!currentProject) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <BranchesOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
          <Title level={4} type="secondary">请先选择一个项目</Title>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 160px)' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BranchesOutlined />
            <span>知识图谱 - {currentProject.title}</span>
          </div>
        }
        style={{ height: '100%' }}
        bodyStyle={{ padding: 0, height: 'calc(100% - 57px)' }}
      >
        <KnowledgeGraphManager 
          projectId={currentProject.id}
          onNodeSelect={(node) => {
            console.log('Selected node:', node);
          }}
          onRelationshipSelect={(relationship) => {
            console.log('Selected relationship:', relationship);
          }}
        />
      </Card>
    </div>
  );
};

export default KnowledgeGraphPage;
