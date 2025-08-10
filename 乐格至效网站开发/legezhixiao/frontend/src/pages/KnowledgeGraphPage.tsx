import React from 'react';
import { Card } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';
import KnowledgeGraphManager from '../components/Writing/KnowledgeGraphManager';
import { useAppStore } from '../store/appStore';

const KnowledgeGraphPage: React.FC = () => {
  const { currentProject } = useAppStore();

  // 为测试目的，如果没有当前项目，使用默认测试项目ID
  const projectId = currentProject?.id || 'test-project';
  const projectTitle = currentProject?.title || '测试项目';

  return (
    <div style={{ height: 'calc(100vh - 160px)' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BranchesOutlined />
            <span>知识图谱 - {projectTitle}</span>
          </div>
        }
        style={{ height: '100%' }}
        bodyStyle={{ padding: 0, height: 'calc(100% - 57px)' }}
      >
        <KnowledgeGraphManager 
          projectId={projectId}
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
