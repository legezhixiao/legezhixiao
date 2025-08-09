import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Slider, 
  Button, 
  Space, 
  Card, 
  Typography, 
  Row,
  Col,
  message,
  Divider
} from 'antd';
import { SaveOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { GraphNode, GraphRelationship } from '../../services/knowledgeGraphService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface KnowledgeGraphRelationshipEditorProps {
  relationship?: GraphRelationship;
  nodes: GraphNode[];
  isVisible: boolean;
  onSave: (relationship: Partial<GraphRelationship>) => Promise<void>;
  onDelete?: (relationshipId: string) => Promise<void>;
  onCancel: () => void;
  preselectedNodes?: { startNodeId?: string; endNodeId?: string };
}

const RELATIONSHIP_TYPES = [
  { value: 'contains', label: '包含', description: '一个实体包含另一个实体' },
  { value: 'belongs_to', label: '属于', description: '实体归属关系' },
  { value: 'interacts_with', label: '互动', description: '实体间的互动关系' },
  { value: 'causes', label: '导致', description: '因果关系' },
  { value: 'occurs_at', label: '发生于', description: '事件在某地发生' },
  { value: 'occurs_during', label: '发生在', description: '时间关系' },
  { value: 'related_to', label: '相关', description: '一般关联关系' },
  { value: 'loves', label: '喜爱', description: '情感关系-喜爱' },
  { value: 'hates', label: '憎恨', description: '情感关系-憎恨' },
  { value: 'fears', label: '恐惧', description: '情感关系-恐惧' },
  { value: 'allies', label: '盟友', description: '同盟关系' },
  { value: 'enemies', label: '敌人', description: '敌对关系' },
  { value: 'parent_of', label: '父母', description: '亲属关系-父母' },
  { value: 'child_of', label: '子女', description: '亲属关系-子女' },
  { value: 'sibling_of', label: '兄弟姐妹', description: '亲属关系-兄弟姐妹' },
  { value: 'owns', label: '拥有', description: '所有权关系' },
  { value: 'created_by', label: '创造', description: '创造关系' },
  { value: 'destroyed_by', label: '毁灭', description: '毁灭关系' },
  { value: 'influences', label: '影响', description: '影响关系' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: '活跃' },
  { value: 'past', label: '过去' },
  { value: 'potential', label: '潜在' },
  { value: 'deprecated', label: '已废弃' }
];

const KnowledgeGraphRelationshipEditor: React.FC<KnowledgeGraphRelationshipEditorProps> = ({
  relationship,
  nodes,
  isVisible,
  onSave,
  onDelete,
  onCancel,
  preselectedNodes
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const isEditMode = !!relationship;

  useEffect(() => {
    if (relationship) {
      form.setFieldsValue({
        startNodeId: relationship.startNodeId,
        endNodeId: relationship.endNodeId,
        type: relationship.type,
        description: relationship.description || '',
        strength: relationship.strength || 50,
        status: relationship.status || 'active'
      });
    } else {
      form.setFieldsValue({
        startNodeId: preselectedNodes?.startNodeId,
        endNodeId: preselectedNodes?.endNodeId,
        strength: 50,
        status: 'active'
      });
    }
  }, [relationship, preselectedNodes, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const relationshipData: Partial<GraphRelationship> = {
        ...values,
        properties: {
          ...relationship?.properties,
          lastModified: new Date().toISOString()
        }
      };

      if (isEditMode && relationship) {
        relationshipData.id = relationship.id;
      }

      await onSave(relationshipData);
      message.success(isEditMode ? '关系更新成功' : '关系创建成功');
      onCancel();
    } catch (error) {
      console.error('保存关系失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!relationship || !onDelete) return;

    try {
      setLoading(true);
      await onDelete(relationship.id);
      message.success('关系删除成功');
      onCancel();
    } catch (error) {
      console.error('删除关系失败:', error);
      message.error('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const swapNodes = () => {
    const startNode = form.getFieldValue('startNodeId');
    const endNode = form.getFieldValue('endNodeId');
    form.setFieldsValue({
      startNodeId: endNode,
      endNodeId: startNode
    });
  };

  const getNodeDisplay = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return nodeId;
    return `${node.name} (${node.type})`;
  };

  // const getNodesByType = (type: string) => {
  //   return nodes.filter(node => node.type === type);
  // }; // 预设类型筛选功能

  const groupedNodes = nodes.reduce((acc, node) => {
    if (!acc[node.type]) {
      acc[node.type] = [];
    }
    acc[node.type].push(node);
    return acc;
  }, {} as Record<string, GraphNode[]>);

  if (!isVisible) return null;

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          {isEditMode ? '编辑关系' : '创建新关系'}
        </Title>
      }
      extra={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          {isEditMode && onDelete && (
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={loading}
            >
              删除
            </Button>
          )}
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
          >
            保存
          </Button>
        </Space>
      }
      style={{ maxWidth: 600, margin: '0 auto' }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          strength: 50,
          status: 'active'
        }}
      >
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              name="startNodeId"
              label="起始节点"
              rules={[{ required: true, message: '请选择起始节点' }]}
            >
              <Select
                placeholder="选择起始节点"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {Object.entries(groupedNodes).map(([type, typeNodes]) => (
                  <Select.OptGroup key={type} label={type}>
                    {typeNodes.map(node => (
                      <Option key={node.id} value={node.id}>
                        {node.name}
                      </Option>
                    ))}
                  </Select.OptGroup>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
            <Button 
              icon={<SwapOutlined />} 
              onClick={swapNodes}
              title="交换节点"
            />
          </Col>
          <Col span={10}>
            <Form.Item
              name="endNodeId"
              label="目标节点"
              rules={[{ required: true, message: '请选择目标节点' }]}
            >
              <Select
                placeholder="选择目标节点"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {Object.entries(groupedNodes).map(([type, typeNodes]) => (
                  <Select.OptGroup key={type} label={type}>
                    {typeNodes.map(node => (
                      <Option key={node.id} value={node.id}>
                        {node.name}
                      </Option>
                    ))}
                  </Select.OptGroup>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="type"
          label="关系类型"
          rules={[{ required: true, message: '请选择关系类型' }]}
        >
          <Select
            placeholder="选择关系类型"
            showSearch
            optionFilterProp="children"
          >
            {RELATIONSHIP_TYPES.map(type => (
              <Option key={type.value} value={type.value}>
                <div>
                  <Text strong>{type.label}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {type.description}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="详细描述"
        >
          <TextArea 
            rows={3} 
            placeholder="描述这个关系的具体情况、背景、重要性等"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="strength"
              label="关系强度"
            >
              <Slider
                min={0}
                max={100}
                marks={{
                  0: '弱',
                  50: '中',
                  100: '强'
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="状态"
            >
              <Select>
                {STATUS_OPTIONS.map(status => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 预览关系 */}
        <Divider />
        <div>
          <Text strong>关系预览:</Text>
          <div style={{ 
            marginTop: 8, 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            textAlign: 'center'
          }}>
            <Form.Item dependencies={['startNodeId', 'type', 'endNodeId']} noStyle>
              {({ getFieldValue }) => {
                const startNodeId = getFieldValue('startNodeId');
                const endNodeId = getFieldValue('endNodeId');
                const type = getFieldValue('type');
                const relationshipType = RELATIONSHIP_TYPES.find(t => t.value === type);
                
                return (
                  <Text>
                    {startNodeId ? getNodeDisplay(startNodeId) : '[ 起始节点 ]'}
                    <Text strong style={{ margin: '0 8px' }}>
                      {relationshipType ? relationshipType.label : '[ 关系 ]'}
                    </Text>
                    {endNodeId ? getNodeDisplay(endNodeId) : '[ 目标节点 ]'}
                  </Text>
                );
              }}
            </Form.Item>
          </div>
        </div>
      </Form>
    </Card>
  );
};

export default KnowledgeGraphRelationshipEditor;
