import React, { useState } from 'react';
import { Button, Card, Space, Typography, Alert, Modal } from 'antd';
import { DatabaseOutlined, BranchesOutlined, BookOutlined } from '@ant-design/icons';
import KnowledgeGraphManager from './KnowledgeGraphManager';

const { Title, Paragraph } = Typography;

interface KnowledgeGraphIntegrationProps {
  isVisible: boolean;
  onClose: () => void;
  currentProjectId?: string;
  projectId?: string;
  currentChapterId?: string;
}

/**
 * 知识图谱集成组件
 * 用于在小说写作界面中集成知识图谱功能
 */
const KnowledgeGraphIntegration: React.FC<KnowledgeGraphIntegrationProps> = ({
  projectId,
  currentProjectId
}) => {
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleOpenKnowledgeGraph = () => {
    setShowKnowledgeGraph(true);
  };

  const handleCloseKnowledgeGraph = () => {
    setShowKnowledgeGraph(false);
  };

  return (
    <>
      {/* 知识图谱入口 */}
      <Card 
        size="small" 
        title={
          <Space>
            <BranchesOutlined />
            <span>知识图谱</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="link" 
              size="small" 
              onClick={() => setShowGuide(true)}
            >
              使用指南
            </Button>
            <Button 
              type="primary" 
              size="small"
              icon={<DatabaseOutlined />}
              onClick={handleOpenKnowledgeGraph}
            >
              打开图谱
            </Button>
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
        </Space>
      </Card>

      {/* 知识图谱管理器 */}
      <Modal
        title="知识图谱管理"
        open={showKnowledgeGraph}
        onCancel={handleCloseKnowledgeGraph}
        footer={null}
        width="100vw"
        style={{ top: 0, paddingBottom: 0 }}
        bodyStyle={{ height: '100vh', padding: 0 }}
        destroyOnClose
      >
        <KnowledgeGraphManager
          projectId={projectId || currentProjectId || ''}
        />
      </Modal>

      {/* 使用指南 */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            <span>知识图谱使用指南</span>
          </Space>
        }
        open={showGuide}
        onCancel={() => setShowGuide(false)}
        footer={[
          <Button key="close" onClick={() => setShowGuide(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ padding: '16px' }}>
          <Title level={4}>快速开始</Title>
          
          <Paragraph>
            <strong>1. 数据库配置</strong>
            <br />
            首次使用需要配置ArangoDB数据库连接。系统使用原生安装的ArangoDB服务：
          </Paragraph>
          
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
            {`# 安装ArangoDB (Ubuntu/Debian)
sudo apt install arangodb3

# 启动服务
sudo systemctl start arangodb3
sudo systemctl enable arangodb3`}
          </pre>

          <Paragraph>
            <strong>2. 创建知识节点</strong>
            <br />
            支持多种节点类型：角色(CHARACTER)、地点(LOCATION)、事件(EVENT)、概念(CONCEPT)、主题(THEME)、组织(ORGANIZATION)、情节点(PLOT_POINT)、时间线(TIMELINE)
          </Paragraph>

          <Paragraph>
            <strong>3. 建立关系连接</strong>
            <br />
            通过拖拽连接节点，或使用智能推荐功能自动发现潜在关系。支持多种关系类型：认识、相关、喜欢、讨厌、家人、导师、冲突、联盟等。
          </Paragraph>

          <Paragraph>
            <strong>4. 图谱分析</strong>
            <br />
            使用路径查找功能分析角色间的关系链，利用智能推荐发现新的故事线索。
          </Paragraph>

          <Title level={4}>高级功能</Title>
          
          <Paragraph>
            <strong>• 智能推荐：</strong>基于已有关系和属性相似性，推荐可能的新连接
            <br />
            <strong>• 路径分析：</strong>查找任意两个节点间的最短关系路径
            <br />
            <strong>• 一致性检查：</strong>检测故事逻辑矛盾和遗漏
            <br />
            <strong>• 协作编辑：</strong>支持多人同时编辑知识图谱
          </Paragraph>

          <Alert
            message="提示"
            description="知识图谱会自动保存您的修改。建议在写作过程中及时添加新的角色和事件，保持图谱的实时性。"
            type="info"
            style={{ marginTop: '16px' }}
          />
        </div>
      </Modal>
    </>
  );
};

export default KnowledgeGraphIntegration;
