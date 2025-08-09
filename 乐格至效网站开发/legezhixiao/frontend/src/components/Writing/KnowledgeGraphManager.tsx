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
  const [analytics, setAnalytics] = useState<GraphAnalytics | null>(null);
  // const [loading, setLoading] = useState(false); // 保留用于未来功能
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<GraphRelationship | null>(null);
  
  // 模态框状态
  const [nodeEditorVisible, setNodeEditorVisible] = useState(false);
  const [relationshipEditorVisible, setRelationshipEditorVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  // const [importModalVisible, setImportModalVisible] = useState(false); // 预设导入功能
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  
  // 设置状态
  const [showNodeList, setShowNodeList] = useState(true);
  // const [autoLayout, setAutoLayout] = useState(true); // 预设自动布局功能

  const nodeTypes = [
    { value: 'all', label: '全部', color: '#666' },
    { value: 'CHARACTER', label: '角色', color: '#ff6b6b' },
    { value: 'LOCATION', label: '地点', color: '#4ecdc4' },
    { value: 'EVENT', label: '事件', color: '#45b7d1' },
    { value: 'PLOT_POINT', label: '情节点', color: '#96ceb4' },
    { value: 'ITEM', label: '物品', color: '#ffeaa7' },
    { value: 'CONCEPT', label: '概念', color: '#dda0dd' }
  ];

  // 加载图数据
  const loadGraphData = async () => {
    try {
      // setLoading(true); // 暂时禁用loading状态，保留功能
      const data = await knowledgeGraphService.getProjectGraph(projectId);
      setGraphData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('加载知识图谱失败:', error);
      message.error('加载知识图谱失败');
    } finally {
      // setLoading(false); // 暂时禁用loading状态，保留功能
    }
  };

  // 加载分析数据
  const loadAnalytics = async () => {
    try {
      const data = await knowledgeGraphService.getAnalytics(projectId);
      setAnalytics(data);
    } catch (error) {
      console.error('加载分析数据失败:', error);
    }
  };

  // 过滤数据
  const filterData = () => {
    let filteredNodes = graphData.nodes;
    let filteredRelationships = graphData.relationships;

    // 按类型过滤
    if (selectedNodeType !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.type === selectedNodeType);
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      filteredRelationships = filteredRelationships.filter(rel => 
        nodeIds.has(rel.startNodeId) && nodeIds.has(rel.endNodeId)
      );
    }

    // 按搜索词过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.name.toLowerCase().includes(term) ||
        (node.description && node.description.toLowerCase().includes(term)) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(term)))
      );
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      filteredRelationships = filteredRelationships.filter(rel => 
        nodeIds.has(rel.startNodeId) && nodeIds.has(rel.endNodeId)
      );
    }

    setFilteredData({ nodes: filteredNodes, relationships: filteredRelationships });
  };

  // 处理节点选择
  const handleNodeSelect = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedRelationship(null);
    onNodeSelect?.(node);
  };

  // 处理关系选择
  const handleRelationshipSelect = (relationship: GraphRelationship) => {
    setSelectedRelationship(relationship);
    setSelectedNode(null);
    onRelationshipSelect?.(relationship);
  };

  // 创建节点
  const handleCreateNode = () => {
    setSelectedNode(null);
    setNodeEditorVisible(true);
  };

  // 编辑节点
  const handleEditNode = (node?: GraphNode) => {
    setSelectedNode(node || selectedNode);
    setNodeEditorVisible(true);
  };

  // 创建关系
  const handleCreateRelationship = () => {
    setSelectedRelationship(null);
    setRelationshipEditorVisible(true);
  };

  // 编辑关系
  const handleEditRelationship = (relationship?: GraphRelationship) => {
    setSelectedRelationship(relationship || selectedRelationship);
    setRelationshipEditorVisible(true);
  };

  // 保存节点
  const handleSaveNode = async (nodeData: Partial<GraphNode>) => {
    try {
      if (selectedNode) {
        await knowledgeGraphService.updateNode(selectedNode.id, nodeData);
        message.success('节点更新成功');
      } else {
        await knowledgeGraphService.createNode({
          ...nodeData as Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>,
          projectId
        });
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

  // 保存关系
  const handleSaveRelationship = async (relationshipData: Partial<GraphRelationship>) => {
    try {
      if (selectedRelationship) {
        await knowledgeGraphService.updateRelationship(selectedRelationship.id, relationshipData);
        message.success('关系更新成功');
      } else {
        await knowledgeGraphService.createRelationship(
          relationshipData as Omit<GraphRelationship, 'id' | 'createdAt' | 'updatedAt'>
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
                prefix={<SearchOutlined />}
              />
              
              <Select
                value={selectedNodeType}
                onChange={setSelectedNodeType}
                style={{ width: 120 }}
              >
                {nodeTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: type.color
                        }}
                      />
                      {type.label}
                    </div>
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
                创建节点
              </Button>
              
              <Button 
                icon={<BranchesOutlined />}
                onClick={handleCreateRelationship}
                disabled={filteredData.nodes.length < 2}
              >
                创建关系
              </Button>
              
              <Button 
                icon={<BranchesOutlined />}
                onClick={() => setAnalyticsDrawerVisible(true)}
              >
                分析
              </Button>
              
              <Button 
                icon={<ExportOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                导出
              </Button>
              
              <Button 
                icon={<SettingOutlined />}
                onClick={() => {/* 设置面板 */}}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要内容 */}
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        {/* 侧边栏 */}
        {showNodeList && (
          <Card 
            title="节点列表" 
            size="small"
            style={{ width: 300, height: '100%', overflow: 'auto' }}
            extra={
              <Switch
                size="small"
                checked={showNodeList}
                onChange={setShowNodeList}
                checkedChildren={<EyeOutlined />}
                unCheckedChildren={<EyeOutlined />}
              />
            }
          >
            <List
              size="small"
              dataSource={filteredData.nodes}
              renderItem={node => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedNode?.id === node.id ? '#f0f0f0' : 'transparent',
                    padding: '8px',
                    borderRadius: '4px'
                  }}
                  onClick={() => handleNodeSelect(node)}
                  actions={[
                    <Tooltip title="编辑">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNode(node);
                        }}
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getNodeTypeColor(node.type)
                        }}
                      />
                    }
                    title={node.name}
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {node.type}
                        </Text>
                        {node.importance && (
                          <div style={{ marginTop: 2 }}>
                            <Progress 
                              percent={node.importance} 
                              size="small" 
                              showInfo={false}
                              strokeColor={getNodeTypeColor(node.type)}
                            />
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 主可视化区域 */}
        <div style={{ flex: 1 }}>
          <KnowledgeGraphVisualization
            nodes={filteredData.nodes}
            relationships={filteredData.relationships}
            onNodeSelect={handleNodeSelect}
            onRelationshipSelect={handleRelationshipSelect}
            selectedNodeId={selectedNode?.id}
            selectedRelationshipId={selectedRelationship?.id}
          />
        </div>

        {/* 详情面板 */}
        {(selectedNode || selectedRelationship) && (
          <Card
            title={selectedNode ? '节点详情' : '关系详情'}
            size="small"
            style={{ width: 300, height: '100%', overflow: 'auto' }}
            extra={
              <Button 
                type="primary" 
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  if (selectedNode) {
                    handleEditNode();
                  } else if (selectedRelationship) {
                    handleEditRelationship();
                  }
                }}
              >
                编辑
              </Button>
            }
          >
            {selectedNode && (
              <div>
                <Title level={5}>{selectedNode.name}</Title>
                <Tag color={getNodeTypeColor(selectedNode.type)}>
                  {selectedNode.type}
                </Tag>
                
                {selectedNode.importance && (
                  <div style={{ margin: '8px 0' }}>
                    <Text>重要性: </Text>
                    <Progress 
                      percent={selectedNode.importance} 
                      size="small"
                      strokeColor={getNodeTypeColor(selectedNode.type)}
                    />
                  </div>
                )}
                
                {selectedNode.description && (
                  <div style={{ margin: '8px 0' }}>
                    <Text strong>描述:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{selectedNode.description}</Text>
                    </div>
                  </div>
                )}
                
                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div style={{ margin: '8px 0' }}>
                    <Text strong>标签:</Text>
                    <div style={{ marginTop: 4 }}>
                      {selectedNode.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ margin: '8px 0' }}>
                  <Text strong>关联节点 ({getConnectedNodes(selectedNode.id).length}):</Text>
                  <div style={{ marginTop: 4 }}>
                    {getConnectedNodes(selectedNode.id).map(node => (
                      <Tag 
                        key={node.id} 
                        color={getNodeTypeColor(node.type)}
                        style={{ marginBottom: 4, cursor: 'pointer' }}
                        onClick={() => handleNodeSelect(node)}
                      >
                        {node.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {selectedRelationship && (
              <div>
                <Title level={5}>关系详情</Title>
                <Tag color="blue">{selectedRelationship.type}</Tag>
                
                {selectedRelationship.strength && (
                  <div style={{ margin: '8px 0' }}>
                    <Text>强度: </Text>
                    <Progress 
                      percent={selectedRelationship.strength} 
                      size="small"
                      strokeColor="#1890ff"
                    />
                  </div>
                )}
                
                {selectedRelationship.description && (
                  <div style={{ margin: '8px 0' }}>
                    <Text strong>描述:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{selectedRelationship.description}</Text>
                    </div>
                  </div>
                )}
                
                <div style={{ margin: '8px 0' }}>
                  <Text strong>连接:</Text>
                  <div style={{ marginTop: 4 }}>
                    {(() => {
                      const startNode = filteredData.nodes.find(n => n.id === selectedRelationship.startNodeId);
                      const endNode = filteredData.nodes.find(n => n.id === selectedRelationship.endNodeId);
                      return (
                        <div>
                          <Tag 
                            color={startNode ? getNodeTypeColor(startNode.type) : 'default'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => startNode && handleNodeSelect(startNode)}
                          >
                            {startNode?.name || '未知节点'}
                          </Tag>
                          <Text> → </Text>
                          <Tag 
                            color={endNode ? getNodeTypeColor(endNode.type) : 'default'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => endNode && handleNodeSelect(endNode)}
                          >
                            {endNode?.name || '未知节点'}
                          </Tag>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* 节点编辑器 */}
      <Modal
        title={selectedNode ? '编辑节点' : '创建节点'}
        open={nodeEditorVisible}
        onCancel={() => setNodeEditorVisible(false)}
        footer={null}
        width={700}
      >
        <KnowledgeGraphNodeEditor
          node={selectedNode ?? undefined}
          isVisible={nodeEditorVisible}
          onSave={handleSaveNode}
          onDelete={selectedNode ? handleDeleteNode : undefined}
          onCancel={() => setNodeEditorVisible(false)}
          connectedNodes={selectedNode ? getConnectedNodes(selectedNode.id) : []}
          availableRelationships={selectedNode ? getNodeRelationships(selectedNode.id) : []}
        />
      </Modal>

      {/* 关系编辑器 */}
      <Modal
        title={selectedRelationship ? '编辑关系' : '创建关系'}
        open={relationshipEditorVisible}
        onCancel={() => setRelationshipEditorVisible(false)}
        footer={null}
        width={700}
      >
        <KnowledgeGraphRelationshipEditor
          relationship={selectedRelationship ?? undefined}
          nodes={filteredData.nodes}
          isVisible={relationshipEditorVisible}
          onSave={handleSaveRelationship}
          onDelete={selectedRelationship ? handleDeleteRelationship : undefined}
          onCancel={() => setRelationshipEditorVisible(false)}
          preselectedNodes={
            selectedNode ? { startNodeId: selectedNode.id } : undefined
          }
        />
      </Modal>

      {/* 分析抽屉 */}
      <Drawer
        title="知识图谱分析"
        placement="right"
        onClose={() => setAnalyticsDrawerVisible(false)}
        open={analyticsDrawerVisible}
        width={400}
      >
        {analytics && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="总节点数" value={analytics.totalNodes} />
              </Col>
              <Col span={12}>
                <Statistic title="总关系数" value={analytics.totalRelationships} />
              </Col>
            </Row>
            
            <div style={{ marginTop: 24 }}>
              <Title level={5}>节点分布</Title>
              {Object.entries(analytics.nodesByType).map(([type, count]) => (
                <div key={type} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{type}</span>
                    <span>{count}</span>
                  </div>
                  <Progress 
                    percent={(count / analytics.totalNodes) * 100}
                    showInfo={false}
                    strokeColor={getNodeTypeColor(type)}
                  />
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 24 }}>
              <Title level={5}>中心节点</Title>
              <List
                size="small"
                dataSource={analytics.centralNodes.slice(0, 5)}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.node.name}
                      description={`${item.connections} 个连接`}
                    />
                  </List.Item>
                )}
              />
            </div>
            
            {analytics.isolatedNodes.length > 0 && (
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
          </div>
        )}
      </Drawer>

      {/* 导出模态框 */}
      <Modal
        title="导出知识图谱"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={handleExport}
      >
        <p>确定要导出当前项目的知识图谱数据吗？</p>
        <p>导出的文件将包含所有节点和关系信息，可用于备份或迁移。</p>
      </Modal>
    </div>
  );
};

export default KnowledgeGraphManager;
