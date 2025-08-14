import React, { useEffect, useState } from 'react';
import { Card } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';
import G6Graph from '../components/G6Graph';
import { convertToG6Data } from '../types/g6';
import { useAppStore } from '../store/appStore';
import { knowledgeGraphService } from '../services/knowledgeGraphService';

const KnowledgeGraphPage: React.FC = () => {
  const { currentProject } = useAppStore();

  // 为测试目的，如果没有当前项目，使用默认测试项目ID
  // 容错：确保 projectId 有效，默认用 test-project
  const projectId = currentProject?.id || 'test-project';
  const projectTitle = currentProject?.title || '测试项目';

  // 后端数据状态
  const [graphData, setGraphData] = useState<any>({ nodes: [], relationships: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    knowledgeGraphService.getProjectGraph(projectId)
      .then((data) => {
        // 容错：如果 data 结构异常，给出默认空结构
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.relationships)) {
          setGraphData({ nodes: [], relationships: [] });
        } else {
          setGraphData(data);
        }
      })
      .catch(() => {
        // 容错：接口异常时也不白屏
        setGraphData({ nodes: [], relationships: [] });
      })
      .finally(() => setLoading(false));
  }, [projectId]);

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
        loading={loading}
      >
        {/* 容错：无数据时给出提示 */}
        {graphData.nodes.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>
            暂无知识图谱数据，请先在后端添加节点或切换到有效项目。
          </div>
        ) : (
          <G6Graph data={convertToG6Data(graphData)} width={800} height={600} />
        )}
      </Card>
    </div>
  );
};

export default KnowledgeGraphPage;
