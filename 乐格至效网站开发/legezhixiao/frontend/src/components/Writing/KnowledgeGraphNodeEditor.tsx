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
  Tag, 
  Row,
  Col,
  Divider,
  message
} from 'antd';
import { SaveOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { GraphNode, GraphRelationship } from '../../services/knowledgeGraphService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface KnowledgeGraphNodeEditorProps {
  node?: GraphNode;
  isVisible: boolean;
  onSave: (node: Partial<GraphNode>) => Promise<void>;
  onDelete?: (nodeId: string) => Promise<void>;
  onCancel: () => void;
  availableRelationships?: GraphRelationship[];
  connectedNodes?: GraphNode[];
}

const NODE_TYPES = [
  { value: 'CHARACTER', label: '角色', color: '#ff6b6b' },
  { value: 'LOCATION', label: '地点', color: '#4ecdc4' },
  { value: 'EVENT', label: '事件', color: '#45b7d1' },
  { value: 'PLOT_POINT', label: '情节点', color: '#96ceb4' },
  { value: 'ITEM', label: '物品', color: '#ffeaa7' },
  { value: 'CONCEPT', label: '概念', color: '#dda0dd' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '活跃' },
  { value: 'archived', label: '已归档' },
  { value: 'deprecated', label: '已废弃' }
];

const KnowledgeGraphNodeEditor: React.FC<KnowledgeGraphNodeEditorProps> = ({
  node,
  isVisible,
  onSave,
  onDelete,
  onCancel,
  availableRelationships = [],
  connectedNodes = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const isEditMode = !!node;

  useEffect(() => {
    if (node) {
      form.setFieldsValue({
        name: node.name,
        type: node.type,
        description: node.description || '',
        importance: node.importance || 50,
        status: node.status || 'active'
      });
      setTags(node.tags || []);
    } else {
      form.resetFields();
      setTags([]);
    }
  }, [node, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const nodeData: Partial<GraphNode> = {
        ...values,
        tags,
        properties: {
          ...node?.properties,
          lastModified: new Date().toISOString()
        }
      };

      if (isEditMode && node) {
        nodeData.id = node.id;
        nodeData.projectId = node.projectId;
      }

      await onSave(nodeData);
      message.success(isEditMode ? '节点更新成功' : '节点创建成功');
      onCancel();
    } catch (error) {
      console.error('保存节点失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!node || !onDelete) return;

    try {
      setLoading(true);
      await onDelete(node.id);
      message.success('节点删除成功');
      onCancel();
    } catch (error) {
      console.error('删除节点失败:', error);
      message.error('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (removedTag: string) => {
    setTags(tags.filter(tag => tag !== removedTag));
  };

  const getTypeColor = (type: string) => {
    return NODE_TYPES.find(t => t.value === type)?.color || '#95a5a6';
  };

  if (!isVisible) return null;

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEditMode && node && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: getTypeColor(node.type)
              }}
            />
          )}
          <Title level={4} style={{ margin: 0 }}>
            {isEditMode ? `编辑节点: ${node?.name}` : '创建新节点'}
          </Title>
        </div>
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
          type: 'CHARACTER',
          importance: 50,
          status: 'active'
        }}
      >
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="name"
              label="节点名称"
              rules={[{ required: true, message: '请输入节点名称' }]}
            >
              <Input placeholder="输入节点名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="type"
              label="节点类型"
              rules={[{ required: true, message: '请选择节点类型' }]}
            >
              <Select>
                {NODE_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: type.color
                        }}
                      />
                      {type.label}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="描述"
        >
          <TextArea 
            rows={4} 
            placeholder="描述节点的详细信息、特征、背景等"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="importance"
              label="重要性"
            >
              <Slider
                min={0}
                max={100}
                marks={{
                  0: '低',
                  50: '中',
                  100: '高'
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

        <Divider />

        <div>
          <Text strong>标签</Text>
          <div style={{ marginTop: 8, marginBottom: 12 }}>
            {tags.map(tag => (
              <Tag
                key={tag}
                closable
                onClose={() => removeTag(tag)}
                style={{ marginBottom: 4 }}
              >
                {tag}
              </Tag>
            ))}
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="添加标签"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onPressEnter={addTag}
            />
            <Button 
              icon={<PlusOutlined />} 
              onClick={addTag}
              disabled={!newTag || tags.includes(newTag)}
            >
              添加
            </Button>
          </Space.Compact>
        </div>

        {isEditMode && connectedNodes.length > 0 && (
          <>
            <Divider />
            <div>
              <Text strong>关联节点 ({connectedNodes.length})</Text>
              <div style={{ marginTop: 8 }}>
                {connectedNodes.map(connectedNode => (
                  <Tag
                    key={connectedNode.id}
                    color={getTypeColor(connectedNode.type)}
                    style={{ marginBottom: 4 }}
                  >
                    {connectedNode.name}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}

        {isEditMode && availableRelationships.length > 0 && (
          <>
            <Divider />
            <div>
              <Text strong>关系 ({availableRelationships.length})</Text>
              <div style={{ marginTop: 8 }}>
                {availableRelationships.map(rel => (
                  <div key={rel.id} style={{ marginBottom: 4 }}>
                    <Tag color="blue">{rel.type}</Tag>
                    <Text type="secondary">强度: {rel.strength || 50}</Text>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Form>
    </Card>
  );
};

export default KnowledgeGraphNodeEditor;
