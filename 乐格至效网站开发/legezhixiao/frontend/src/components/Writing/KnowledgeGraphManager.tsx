import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Input, 
  Select, 
  Row, 
  Col, 
  Modal, 
  List, 
  Tag, 
  Typography,
  message,
  Statistic,
  Progress,
  Tooltip,
  Switch,
  Drawer
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  SettingOutlined, 
  ExportOutlined,
  BranchesOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { 
  GraphNode, 
  GraphRelationship, 
  GraphData,
  GraphAnalytics,
  knowledgeGraphService 
} from '../../services/knowledgeGraphService';
import KnowledgeGraphVisualization from './KnowledgeGraphVisualization';
import KnowledgeGraphNodeEditor from './KnowledgeGraphNodeEditor';
import KnowledgeGraphRelationshipEditor from './KnowledgeGraphRelationshipEditor';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface KnowledgeGraphManagerProps {
  projectId: string;
  onNodeSelect?: (node: GraphNode) => void;
  onRelationshipSelect?: (relationship: GraphRelationship) => void;
}

const KnowledgeGraphManager: React.FC<KnowledgeGraphManagerProps> = ({
  projectId,
  onNodeSelect,
  onRelationshipSelect
}) => {
  // 状态管理
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], relationships: [] });
  const [filteredData, setFilteredData] = useState<GraphData>({ nodes: [], relationships: [] });
  const [analytics, setAnalytics] = useState<GraphAnalytics>({
    totalNodes: 0,
    totalRelationships: 0,
    nodesByType: {},
    relationshipsByType: {},
    centralNodes: [],
    isolatedNodes: [],
    strongestRelationships: []
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<GraphRelationship | null>(null);
  
  // 模态框状态
  const [nodeEditorVisible, setNodeEditorVisible] = useState(false);
  const [relationshipEditorVisible, setRelationshipEditorVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // 节点类型定义
  const nodeTypes = [
    { value: 'CHARACTER', label: '角色', color: '#1890ff' },
    { value: 'LOCATION', label: '地点', color: '#52c41a' },
    { value: 'ITEM', label: '物品', color: '#faad14' },
    { value: 'EVENT', label: '事件', color: '#f5222d' },
    { value: 'CONCEPT', label: '概念', color: '#722ed1' },
    { value: 'ORGANIZATION', label: '组织', color: '#13c2c2' }
  ];

  // 加载图数据
  const loadGraphData = async () => {
    try {
      setLoading(true);
      const data = await knowledgeGraphService.getProjectGraph(projectId);
      setGraphData(data);
    } catch (error) {
      console.error('加载图数据失败:', error);
      message.error('加载图数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载分析数据
  const loadAnalytics = async () => {
    try {
      const data = await knowledgeGraphService.getAnalytics(projectId);
      setAnalytics(data);
    } catch (error) {
      console.error('加载分析数据失败:', error);
      setAnalytics({
        totalNodes: 0,
        totalRelationships: 0,
        nodesByType: {},
        relationshipsByType: {},
        centralNodes: [],
        isolatedNodes: [],
        strongestRelationships: []
      });
    }
  };

  // 过滤数据
  const filterData = () => {
    if (!graphData || !graphData.nodes || !graphData.relationships) {
      setFilteredData({ nodes: [], relationships: [] });
      return;
    }

    let filtered = { ...graphData };

    // 按搜索词过滤
    if (searchTerm) {
      filtered.nodes = filtered.nodes.filter(node =>
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 按节点类型过滤
    if (selectedNodeType !== 'all') {
      filtered.nodes = filtered.nodes.filter(node => node.type === selectedNodeType);
    }

    // 过滤相关的关系
    const nodeIds = new Set(filtered.nodes.map(node => node.id));
    filtered.relationships = filtered.relationships.filter(rel =>
      nodeIds.has(rel.startNodeId) && nodeIds.has(rel.endNodeId)
    );

    setFilteredData(filtered);
  };

  // 创建节点
  const handleCreateNode = () => {
    setSelectedNode(null);
    setNodeEditorVisible(true);
  };

  // 编辑节点
  const handleEditNode = (node: GraphNode) => {
    setSelectedNode(node);
    setNodeEditorVisible(true);
    onNodeSelect?.(node);
  };

  // 保存节点
  const handleSaveNode = async (nodeData: Partial<GraphNode>) => {
    try {
      if (selectedNode) {
        // 更新节点
        await knowledgeGraphService.updateNode(selectedNode.id, nodeData);
        message.success('节点更新成功');
      } else {
        // 创建新节点
        await knowledgeGraphService.createNode({
          ...nodeData,
          projectId
        } as GraphNode);
        message.success('节点创建成功');
      }
      setNodeEditorVisible(false);
      await loadGraphData();
      await loadAnalytics();
    } catch (error) {
      console.error('保存节点失败:', error);
      message.error('保存节点失败');
    }
  };

  // 删除节点
  const handleDeleteNode = async (nodeId: string) => {
    try {
      await knowledgeGraphService.deleteNode(nodeId);
      message.success('节点删除成功');
      setNodeEditorVisible(false);
      setSelectedNode(null);
      await loadGraphData();
      await loadAnalytics();
    } catch (error) {
      console.error('删除节点失败:', error);
      message.error('删除节点失败');
    }
  };

  // 创建关系
  const handleCreateRelationship = () => {
    setSelectedRelationship(null);
    setRelationshipEditorVisible(true);
  };

  // 编辑关系
  const handleEditRelationship = (relationship: GraphRelationship) => {
    setSelectedRelationship(relationship);
    setRelationshipEditorVisible(true);
    onRelationshipSelect?.(relationship);
  };

  // 保存关系
  const handleSaveRelationship = async (relationshipData: Partial<GraphRelationship>) => {
    try {
      if (selectedRelationship) {
        // 更新关系
        await knowledgeGraphService.updateRelationship(
          selectedRelationship.id, 
          relationshipData
        );
        message.success('关系更新成功');
      } else {
        // 创建新关系
        await knowledgeGraphService.createRelationship(
          relationshipData as GraphRelationship
        );
        message.success('关系创建成功');
      }
      setRelationshipEditorVisible(false);
      await loadGraphData();
      await loadAnalytics();
    } catch (error) {
      console.error('保存关系失败:', error);
      message.error('保存关系失败');
    }
  };

  // 删除关系
  const handleDeleteRelationship = async (relationshipId: string) => {
    try {
      await knowledgeGraphService.deleteRelationship(relationshipId);
      message.success('关系删除成功');
      setRelationshipEditorVisible(false);
      setSelectedRelationship(null);
      await loadGraphData();
      await loadAnalytics();
    } catch (error) {
      console.error('删除关系失败:', error);
      message.error('删除关系失败');
    }
  };

  // 导出图数据
  const handleExport = async () => {
    try {
      const data = await knowledgeGraphService.exportGraph(projectId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-graph-${projectId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('导出成功');
      setExportModalVisible(false);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 获取节点类型颜色
  const getNodeTypeColor = (type: string) => {
    return nodeTypes.find(t => t.value === type)?.color || '#666';
  };

  // 获取连接的节点
  const getConnectedNodes = (nodeId: string): GraphNode[] => {
    if (!filteredData?.relationships || !filteredData?.nodes) return [];
    
    const connectedNodeIds = new Set<string>();
    
    filteredData.relationships.forEach(rel => {
      if (rel.startNodeId === nodeId) {
        connectedNodeIds.add(rel.endNodeId);
      } else if (rel.endNodeId === nodeId) {
        connectedNodeIds.add(rel.startNodeId);
      }
    });

    return filteredData.nodes.filter(node => connectedNodeIds.has(node.id));
  };

  // 获取节点的关系
  const getNodeRelationships = (nodeId: string): GraphRelationship[] => {
    if (!filteredData?.relationships) return [];
    
    return filteredData.relationships.filter(rel => 
      rel.startNodeId === nodeId || rel.endNodeId === nodeId
    );
  };

  // 初始化
  useEffect(() => {
    if (projectId) {
      loadGraphData();
      loadAnalytics();
    }
  }, [projectId]);

  // 过滤数据
  useEffect(() => {
    filterData();
  }, [graphData, searchTerm, selectedNodeType]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 8 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索节点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 200 }}
                allowClear
                prefix={<SearchOutlined />}
              />
              <Select
                value={selectedNodeType}
                onChange={setSelectedNodeType}
                style={{ width: 120 }}
              >
                <Option value="all">所有类型</Option>
                {nodeTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateNode}
              >
                新建节点
              </Button>
              <Button
                icon={<BranchesOutlined />}
                onClick={handleCreateRelationship}
              >
                新建关系
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={() => setAnalyticsVisible(true)}
              >
                分析
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                导出
              </Button>
              <Tooltip title="配置图谱显示选项">
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => {
                    // 这里可以添加设置功能，比如图形布局选项、显示选项等
                    Modal.info({
                      title: '图谱设置',
                      content: '设置功能开发中...'
                    });
                  }}
                >
                  设置
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要内容区域 */}
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        {/* 图形可视化 */}
        <Card 
          style={{ flex: 1 }} 
          bodyStyle={{ padding: 0, height: '100%' }}
          loading={loading}
        >
          <KnowledgeGraphVisualization
            nodes={filteredData?.nodes || []}
            relationships={filteredData?.relationships || []}
            onNodeSelect={handleEditNode}
            onRelationshipSelect={handleEditRelationship}
            selectedNodeId={selectedNode?.id}
            selectedRelationshipId={selectedRelationship?.id}
          />
        </Card>

        {/* 侧边栏 */}
        <Card style={{ width: 300 }} title="图谱信息">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Statistic 
              title="节点数" 
              value={filteredData?.nodes?.length || 0} 
              suffix={`/ ${graphData?.nodes?.length || 0}`}
            />
            <Statistic 
              title="关系数" 
              value={filteredData?.relationships?.length || 0}
              suffix={`/ ${graphData?.relationships?.length || 0}`}
            />
            
            {/* 显示选项 */}
            <div style={{ marginBottom: 16, padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
              <Space>
                <span>显示节点标签:</span>
                <Switch 
                  defaultChecked={true}
                  onChange={(checked) => {
                    // 这里可以控制图谱中节点标签的显示/隐藏
                    console.log('节点标签显示:', checked);
                  }}
                />
                <span>显示关系标签:</span>
                <Switch 
                  defaultChecked={true}
                  onChange={(checked) => {
                    // 这里可以控制图谱中关系标签的显示/隐藏
                    console.log('关系标签显示:', checked);
                  }}
                />
              </Space>
            </div>
            
            {/* 节点列表 */}
            <div>
              <Title level={5}>节点列表</Title>
              <List
                size="small"
                dataSource={filteredData.nodes.slice(0, 10)}
                renderItem={(node) => (
                  <List.Item
                    actions={[
                      <Tooltip title="查看节点详情">
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<EyeOutlined />}
                          onClick={() => {
                            const connectedNodes = getConnectedNodes(node.id);
                            const relationships = getNodeRelationships(node.id);
                            Modal.info({
                              title: `节点详情: ${node.name}`,
                              content: (
                                <div>
                                  <p><strong>类型:</strong> {node.type}</p>
                                  <p><strong>描述:</strong> {node.description || '无'}</p>
                                  <p><strong>关联节点数:</strong> {connectedNodes.length}</p>
                                  <p><strong>关系数:</strong> {relationships.length}</p>
                                  {connectedNodes.length > 0 && (
                                    <div>
                                      <strong>关联节点:</strong>
                                      <ul>
                                        {connectedNodes.slice(0, 5).map(n => (
                                          <li key={n.id}>{n.name} ({n.type})</li>
                                        ))}
                                        {connectedNodes.length > 5 && <li>...还有{connectedNodes.length - 5}个节点</li>}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ),
                              width: 600
                            });
                          }}
                        />
                      </Tooltip>,
                      <Tooltip title="编辑节点">
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<EditOutlined />}
                          onClick={() => handleEditNode(node)}
                        />
                      </Tooltip>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={getNodeTypeColor(node.type)}>
                            {nodeTypes.find(t => t.value === node.type)?.label || node.type}
                          </Tag>
                          {node.name}
                        </Space>
                      }
                      description={node.description}
                    />
                  </List.Item>
                )}
              />
              {(filteredData?.nodes?.length || 0) > 10 && (
                <Text type="secondary">还有 {(filteredData?.nodes?.length || 0) - 10} 个节点...</Text>
              )}
            </div>
          </Space>
        </Card>
      </div>

      {/* 节点编辑器 */}
      <KnowledgeGraphNodeEditor
        isVisible={nodeEditorVisible}
        node={selectedNode || undefined}
        onSave={handleSaveNode}
        onDelete={selectedNode ? () => handleDeleteNode(selectedNode.id) : undefined}
        onCancel={() => setNodeEditorVisible(false)}
      />

      {/* 关系编辑器 */}
      <KnowledgeGraphRelationshipEditor
        isVisible={relationshipEditorVisible}
        relationship={selectedRelationship || undefined}
        nodes={graphData?.nodes || []}
        onSave={handleSaveRelationship}
        onDelete={selectedRelationship ? () => handleDeleteRelationship(selectedRelationship.id) : undefined}
        onCancel={() => setRelationshipEditorVisible(false)}
      />

      {/* 分析抽屉 */}
      <Drawer
        title="知识图谱分析"
        placement="right"
        width={500}
        open={analyticsVisible}
        onClose={() => setAnalyticsVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 基础统计 */}
          <Card size="small" title="基础统计">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="总节点数" value={analytics.totalNodes} />
              </Col>
              <Col span={12}>
                <Statistic title="总关系数" value={analytics.totalRelationships} />
              </Col>
            </Row>
          </Card>

          {/* 节点类型分布 */}
          <Card size="small" title="节点类型分布">
            {analytics.nodesByType && Object.entries(analytics.nodesByType).map(([type, count]) => (
              <div key={type} style={{ marginBottom: 8 }}>
                <Text>{nodeTypes.find(t => t.value === type)?.label || type}</Text>
                <Progress
                  percent={analytics.totalNodes > 0 ? (count / analytics.totalNodes) * 100 : 0}
                  format={() => `${count}`}
                />
              </div>
            ))}
          </Card>

          {/* 中心节点 */}
          {analytics?.centralNodes && analytics.centralNodes.length > 0 && (
            <Card size="small" title="中心节点">
              <List
                size="small"
                dataSource={analytics.centralNodes.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.node.name}
                      description={`连接数: ${item.connections}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* 孤立节点 */}
          {analytics?.isolatedNodes && analytics.isolatedNodes.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Title level={5}>孤立节点 ({analytics.isolatedNodes.length})</Title>
              <div>
                {analytics.isolatedNodes.slice(0, 5).map(node => (
                  <Tag key={node.id} style={{ marginBottom: 4 }}>
                    {node.name}
                  </Tag>
                ))}
                {analytics.isolatedNodes.length > 5 && (
                  <Text type="secondary">还有 {analytics.isolatedNodes.length - 5} 个...</Text>
                )}
              </div>
            </div>
          )}
        </Space>
      </Drawer>

      {/* 导出模态框 */}
      <Modal
        title="导出知识图谱"
        open={exportModalVisible}
        onOk={handleExport}
        onCancel={() => setExportModalVisible(false)}
        okText="导出"
        cancelText="取消"
      >
        <p>将导出当前项目的完整知识图谱数据（包括所有节点和关系）。</p>
        <p>导出格式：JSON</p>
      </Modal>
    </div>
  );
};

export default KnowledgeGraphManager;
