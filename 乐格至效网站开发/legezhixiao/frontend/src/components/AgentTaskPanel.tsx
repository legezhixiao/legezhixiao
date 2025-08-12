import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, Row, Col, Input, Button, Select, Space, Typography, List, Tag, 
  Tabs, Slider, Switch, Modal, Form, Checkbox, Alert 
} from 'antd';
import { 
  BulbOutlined, FileTextOutlined, PlayCircleOutlined,
  SaveOutlined, CopyOutlined
} from '@ant-design/icons';
import { getJasperAIService, JasperTemplate, BrandVoice, JasperRequest, JasperResponse } from '../services/jasperAIService';
import KnowledgeGraphVisualization from './KnowledgeGraphVisualization';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface GenerationHistory {
  id: string;
  template: JasperTemplate;
  brandVoice?: BrandVoice;
  inputs: Record<string, any>;
  result: JasperResponse;
  timestamp: Date;
}

const AgentTaskPanel: React.FC = () => {
  // 核心状态
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedBrandVoice, setSelectedBrandVoice] = useState<string>('classical_literature');
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 工具和设置
  const [useTools, setUseTools] = useState(true);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [outputLength, setOutputLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [customInstructions, setCustomInstructions] = useState('');
  
  // UI 状态
  const [activeTab, setActiveTab] = useState('templates');
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [form] = Form.useForm();
  
  // 知识图谱相关状态
  const [knowledgeGraphData, setKnowledgeGraphData] = useState<any>(null);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [toolResults, setToolResults] = useState<any[]>([]);
  
  const jasperService = useRef(getJasperAIService());
  const [templates, setTemplates] = useState<JasperTemplate[]>([]);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [availableTools, setAvailableTools] = useState<any[]>([]);

  // 初始化数据
  useEffect(() => {
    setTemplates(jasperService.current.getTemplates());
    setBrandVoices(jasperService.current.getBrandVoices());
    setAvailableTools(jasperService.current.getAvailableTools());
  }, []);

  // 模板变化时更新输入字段和推荐工具
  useEffect(() => {
    if (selectedTemplate) {
      const template = jasperService.current.getTemplate(selectedTemplate);
      if (template) {
        // 重置输入
        setInputs({});
        form.resetFields();
        
        // 推荐工具
        const recommendedTools = jasperService.current.recommendTools(selectedTemplate, inputs);
        setSelectedTools(recommendedTools);
      }
    }
  }, [selectedTemplate, form]);

  // 处理输入变化
  const handleInputChange = (field: string, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    form.setFieldsValue({ [field]: value });
  };

  // 主要生成方法
  const handleGenerate = async () => {
    if (!selectedTemplate) {
      Modal.warning({ title: '请选择一个模板' });
      return;
    }

    const template = jasperService.current.getTemplate(selectedTemplate);
    if (!template) return;

    // 验证必填字段
    const missingFields = template.requiredFields.filter(field => !inputs[field]?.trim());
    if (missingFields.length > 0) {
      Modal.warning({ 
        title: '请填写必填字段', 
        content: `缺少字段: ${missingFields.join(', ')}` 
      });
      return;
    }

    setIsGenerating(true);
    setToolResults([]); // 重置工具结果
    
    try {
      const request: JasperRequest = {
        templateId: selectedTemplate,
        brandVoiceId: selectedBrandVoice,
        inputs,
        useTools,
        selectedTools: useTools ? selectedTools : [],
        customInstructions: customInstructions || undefined,
        outputLength
      };

      const response = await jasperService.current.generate(request);
      setGeneratedContent(response.content);

      // 处理工具结果
      if (response.toolResults && Object.keys(response.toolResults).length > 0) {
        const toolResultsArray = Object.entries(response.toolResults).map(([toolId, result]) => ({
          toolId,
          ...result
        }));
        setToolResults(toolResultsArray);
        
        // 检查是否有知识图谱相关的工具结果
        const kgResult = Object.entries(response.toolResults).find(([toolId, _]) => 
          toolId === 'knowledge_graph' || 
          toolId === 'create_knowledge_graph'
        );
        
        if (kgResult && kgResult[1].success && kgResult[1].data) {
          setKnowledgeGraphData(kgResult[1].data);
          setShowKnowledgeGraph(true);
        }
      }

      // 添加到历史记录
      const historyItem: GenerationHistory = {
        id: response.id,
        template: response.template,
        brandVoice: response.brandVoice,
        inputs: { ...inputs },
        result: response,
        timestamp: new Date()
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // 保留最近10条

    } catch (error) {
      Modal.error({
        title: '生成失败',
        content: (error as Error).message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制内容
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      Modal.success({ title: '已复制到剪贴板' });
    } catch (error) {
      Modal.error({ title: '复制失败' });
    }
  };

  // 保存为草稿
  const handleSave = () => {
    const draft = {
      template: selectedTemplate,
      brandVoice: selectedBrandVoice,
      inputs,
      content: generatedContent,
      timestamp: new Date()
    };
    
    const drafts = JSON.parse(localStorage.getItem('jasper_drafts') || '[]');
    drafts.unshift(draft);
    localStorage.setItem('jasper_drafts', JSON.stringify(drafts.slice(0, 20)));
    
    Modal.success({ title: '已保存为草稿' });
  };

  // 渲染模板选择
  const renderTemplateSelector = () => {
    const categorizedTemplates = templates.reduce((acc, template) => {
      if (!acc[template.category]) acc[template.category] = [];
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, JasperTemplate[]>);

    const categoryNames: Record<string, string> = {
      novel: '📖 小说创作',
      character: '👤 角色设定',
      scene: '🎨 场景描写',
      dialogue: '💬 对话创作',
      marketing: '📢 营销文案',
      blog: '📝 博客文章'
    };

    return (
      <Card title="选择创作模板" size="small" style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择一个模板开始创作"
          style={{ width: '100%', marginBottom: 16 }}
          value={selectedTemplate}
          onChange={setSelectedTemplate}
          showSearch
          optionFilterProp="label"
        >
          {Object.entries(categorizedTemplates).map(([category, templates]) => (
            <Select.OptGroup key={category} label={categoryNames[category] || category}>
              {templates.map(template => (
                <Option key={template.id} value={template.id} label={template.name}>
                  <Space>
                    <span>{template.icon}</span>
                    <span>{template.name}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {template.description}
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>

        {selectedTemplate && (
          <Alert
            message={jasperService.current.getTemplate(selectedTemplate)?.description}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </Card>
    );
  };

  // 渲染输入表单
  const renderInputForm = () => {
    const template = jasperService.current.getTemplate(selectedTemplate);
    if (!template) return null;

    const allFields = [...template.requiredFields, ...template.optionalFields];

    return (
      <Card title="填写创作信息" size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          {allFields.map(field => {
            const isRequired = template.requiredFields.includes(field);
            const fieldLabels: Record<string, string> = {
              outline: '章节大纲',
              concept: '基本概念',
              location: '场景位置',
              scene: '对话场景',
              characters: '相关角色',
              background: '故事背景',
              previous_context: '前情提要',
              word_count: '字数要求',
              style: '写作风格',
              tone: '情感基调',
              role: '角色作用',
              age_range: '年龄范围',
              gender: '性别',
              occupation: '职业身份',
              time: '时间设定',
              weather: '天气环境',
              atmosphere: '氛围要求',
              plot_context: '情节背景',
              purpose: '对话目的',
              emotion: '情感氛围',
              context: '背景信息',
              character_details: '角色详情',
              current_plot: '当前情节',
              issues: '存在问题',
              goals: '优化目标'
            };

            return (
              <Form.Item
                key={field}
                label={
                  <Space>
                    <span>{fieldLabels[field] || field}</span>
                    {isRequired && <Text type="danger">*</Text>}
                  </Space>
                }
                name={field}
                rules={isRequired ? [{ required: true, message: `请填写${fieldLabels[field] || field}` }] : []}
              >
                {field.includes('count') ? (
                  <Slider
                    min={100}
                    max={2000}
                    step={50}
                    marks={{ 100: '100', 500: '500', 1000: '1000', 2000: '2000' }}
                    onChange={(value) => handleInputChange(field, value)}
                    value={inputs[field] || 500}
                  />
                ) : (
                  <TextArea
                    placeholder={`请输入${fieldLabels[field] || field}...`}
                    rows={field === 'outline' || field === 'current_plot' ? 4 : 2}
                    value={inputs[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                  />
                )}
              </Form.Item>
            );
          })}
        </Form>
      </Card>
    );
  };

  // 渲染高级设置
  const renderAdvancedSettings = () => (
    <Card title="高级设置" size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>写作风格：</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={selectedBrandVoice}
            onChange={setSelectedBrandVoice}
          >
            {brandVoices.map(voice => (
              <Option key={voice.id} value={voice.id}>
                <Space direction="vertical" size="small">
                  <Text strong>{voice.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {voice.description}
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong>输出长度：</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={outputLength}
            onChange={setOutputLength}
          >
            <Option value="short">简短 (200-400字)</Option>
            <Option value="medium">中等 (400-800字)</Option>
            <Option value="long">详细 (800-1500字)</Option>
          </Select>
        </div>

        <div>
          <Space align="center">
            <Switch
              checked={useTools}
              onChange={setUseTools}
            />
            <Text>启用外部工具增强</Text>
          </Space>
          {useTools && (
            <div style={{ marginTop: 8 }}>
              <Checkbox.Group
                value={selectedTools}
                onChange={setSelectedTools}
                style={{ width: '100%' }}
              >
                <Space direction="vertical">
                  {availableTools.map(tool => (
                    <Checkbox key={tool.id} value={tool.id}>
                      <Space>
                        <Text>{tool.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {tool.description}
                        </Text>
                      </Space>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>
          )}
        </div>

        <div>
          <Text strong>自定义指令：</Text>
          <TextArea
            placeholder="添加特殊要求或指令..."
            rows={2}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </Card>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <Space>
            🎨 Jasper AI 创作工作台
            <Tag color="blue">专业版</Tag>
          </Space>
        </Title>
        <Text type="secondary">
          基于模板的智能内容创作平台，支持多种写作风格和外部工具集成
        </Text>
      </div>

      <Row gutter={16}>
        {/* 左侧：配置面板 */}
        <Col span={10}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
            <TabPane tab="🎯 模板选择" key="templates">
              {renderTemplateSelector()}
              {selectedTemplate && renderInputForm()}
            </TabPane>
            
            <TabPane tab="⚙️ 高级设置" key="settings">
              {renderAdvancedSettings()}
            </TabPane>
            
            <TabPane tab="📚 历史记录" key="history">
              <Card title="生成历史" size="small">
                <List
                  size="small"
                  dataSource={history}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          size="small"
                          onClick={() => setGeneratedContent(item.result.content)}
                        >
                          查看
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <span>{item.template.icon}</span>
                            <Text>{item.template.name}</Text>
                            <Tag>{item.brandVoice?.name}</Tag>
                          </Space>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.timestamp.toLocaleString()} · {item.result.metadata.wordCount}字
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </TabPane>
          </Tabs>

          {/* 生成按钮 */}
          <Card size="small">
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={isGenerating}
                onClick={handleGenerate}
                disabled={!selectedTemplate}
                size="large"
              >
                {isGenerating ? 'AI 创作中...' : '开始创作'}
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 右侧：结果显示 */}
        <Col span={14}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                创作结果
                {generatedContent && (
                  <Tag color="success">
                    {generatedContent.length} 字
                  </Tag>
                )}
              </Space>
            }
            size="small"
            extra={
              generatedContent && (
                <Space>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(generatedContent)}
                  >
                    复制
                  </Button>
                  <Button
                    type="text"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                  >
                    保存
                  </Button>
                </Space>
              )
            }
          >
            {generatedContent ? (
              <div>
                <div
                  style={{
                    minHeight: 400,
                    maxHeight: 600,
                    overflow: 'auto',
                    padding: 16,
                    backgroundColor: '#fafafa',
                    borderRadius: 6,
                    lineHeight: 1.8,
                    fontSize: 14,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {generatedContent}
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  backgroundColor: '#fafafa',
                  borderRadius: 6,
                  border: '2px dashed #d9d9d9'
                }}
              >
                <Space direction="vertical" align="center">
                  <BulbOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                  <Text type="secondary">选择模板并填写信息，开始您的AI创作之旅</Text>
                </Space>
              </div>
            )}
          </Card>

          {/* 创作统计 */}
          {generatedContent && (
            <Card title="📊 创作统计" size="small" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                      {generatedContent.length}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>总字数</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                      {generatedContent.split('\n\n').filter(p => p.trim()).length}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>段落数</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                      {Math.ceil(generatedContent.length / 300)}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>预计阅读时间(分)</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
                      {selectedTools.length}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>使用工具数</div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* 工具测试区 */}
          <Card title="🔧 工具测试" size="small" style={{ marginTop: 16 }}>
            <Space wrap>
              <Button 
                type="primary"
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const testTool = jasperService.current.getTool('create_knowledge_graph');
                    if (testTool) {
                      const result = await testTool.execute({
                        content: generatedContent || '这是一个测试内容，包含角色李明、地点北京、时间2024年等信息。',
                        projectId: 'default',
                        type: 'document'
                      });
                      
                      if (result.success && result.data) {
                        setKnowledgeGraphData(result.data);
                        setShowKnowledgeGraph(true);
                        Modal.success({ title: '知识图谱生成成功' });
                      } else {
                        Modal.error({ title: '生成失败', content: result.error });
                      }
                    }
                  } catch (error) {
                    Modal.error({ title: '测试失败', content: (error as Error).message });
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                loading={isGenerating}
              >
                测试知识图谱生成
              </Button>
              
              <Button 
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const testTool = jasperService.current.getTool('knowledge_graph');
                    if (testTool) {
                      const result = await testTool.execute({
                        entity: '李明',
                        projectId: 'default'
                      });
                      
                      if (result.success) {
                        Modal.info({ 
                          title: '查询结果', 
                          content: <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        });
                      } else {
                        Modal.error({ title: '查询失败', content: result.error });
                      }
                    }
                  } catch (error) {
                    Modal.error({ title: '查询失败', content: (error as Error).message });
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                loading={isGenerating}
              >
                测试知识图谱查询
              </Button>
            </Space>
          </Card>

          {/* 工具结果展示 */}
          {toolResults.length > 0 && (
            <Card title="工具执行结果" style={{ marginTop: 16 }}>
              {toolResults.map((toolResult, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <h4>工具: {toolResult.toolId}</h4>
                  <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(toolResult, null, 2)}
                  </pre>
                </div>
              ))}
            </Card>
          )}

          {/* 知识图谱可视化 */}
          {showKnowledgeGraph && knowledgeGraphData && (
            <div style={{ marginTop: 16 }}>
              <KnowledgeGraphVisualization 
                data={knowledgeGraphData}
                width={800}
                height={500}
                onNodeClick={(node) => {
                  Modal.info({
                    title: `节点详情: ${node.name}`,
                    content: (
                      <div>
                        <p><strong>类型:</strong> {node.type}</p>
                        <p><strong>ID:</strong> {node.id}</p>
                        {node.properties && (
                          <div>
                            <strong>属性:</strong>
                            <pre style={{ marginTop: '8px', background: '#f5f5f5', padding: '8px' }}>
                              {JSON.stringify(node.properties, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )
                  });
                }}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AgentTaskPanel;