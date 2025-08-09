import React, { useState, useCallback } from 'react';
import {
  Upload,
  Button,
  Card,
  Typography,
  Space,
  Progress,
  Alert,
  Descriptions,
  Tag,
  Divider,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  message
} from 'antd';
import {
  InboxOutlined,
  BookOutlined,
  CheckCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { FileUploadService, FileUploadResponse, SupportedFormats } from '../../services/fileUploadService';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

interface NovelFileUploadProps {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

const NovelFileUpload: React.FC<NovelFileUploadProps> = ({ onSuccess, onError }) => {
  const [uploadStep, setUploadStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileAnalysis, setFileAnalysis] = useState<FileUploadResponse | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<SupportedFormats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importType, setImportType] = useState<'new' | 'existing'>('new');
  const [form] = Form.useForm();

  // 获取支持的格式
  React.useEffect(() => {
    FileUploadService.getSupportedFormats()
      .then(setSupportedFormats)
      .catch(console.error);
  }, []);

  // 文件上传前的验证
  const beforeUpload = useCallback(async (file: File) => {
    try {
      const validation = await FileUploadService.validateFile(file);
      if (!validation.valid) {
        message.error(validation.error);
        return false;
      }
      return true;
    } catch (error) {
      message.error('文件验证失败');
      return false;
    }
  }, []);

  // 处理文件上传
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setSelectedFile(file);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await FileUploadService.parseFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setFileAnalysis(result);
      setUploadStep('preview');
      
      message.success('文件解析成功！');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '文件上传失败');
      onError?.(error instanceof Error ? error.message : '文件上传失败');
      setUploadStep('upload');
    } finally {
      setUploading(false);
    }

    return false; // 阻止默认上传行为
  }, [onError]);

  // 处理导入
  const handleImport = async (values: any) => {
    if (!selectedFile) {
      message.error('请先上传文件');
      return;
    }

    try {
      setUploading(true);
      let result;

      if (importType === 'new') {
        result = await FileUploadService.importToNewProject(selectedFile, {
          projectTitle: values.projectTitle,
          projectDescription: values.projectDescription,
          genre: values.genre
        });
      } else {
        result = await FileUploadService.importToExistingProject(
          selectedFile,
          values.projectId,
          values.importMode
        );
      }

      message.success(result.message);
      setImportModalVisible(false);
      setUploadStep('upload');
      setFileAnalysis(null);
      setSelectedFile(null);
      form.resetFields();
      onSuccess?.(result);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入失败');
      onError?.(error instanceof Error ? error.message : '导入失败');
    } finally {
      setUploading(false);
    }
  };

  // 重置上传
  const resetUpload = () => {
    setUploadStep('upload');
    setFileAnalysis(null);
    setSelectedFile(null);
    setUploadProgress(0);
    form.resetFields();
  };

  // 上传区域
  const renderUploadArea = () => (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <BookOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3}>上传小说文件</Title>
        <Paragraph type="secondary">
          支持多种格式的小说文件，系统将自动解析内容并识别章节结构
        </Paragraph>
      </div>

      <Dragger
        name="novel"
        accept={supportedFormats?.extensions.join(',') || '.txt,.md,.docx,.pdf'}
        beforeUpload={beforeUpload}
        customRequest={({ file }) => handleUpload(file as File)}
        showUploadList={false}
        disabled={uploading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          {supportedFormats ? 
            `支持 ${supportedFormats.extensions.join(', ')} 格式，最大 ${supportedFormats.maxSizeMB}MB` :
            '支持多种文本格式文件'
          }
        </p>
      </Dragger>

      {uploading && (
        <div style={{ marginTop: 24 }}>
          <Progress
            percent={uploadProgress}
            status={uploadProgress < 100 ? 'active' : 'success'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary" style={{ marginTop: 8, display: 'block', textAlign: 'center' }}>
            {uploadProgress < 100 ? '正在解析文件...' : '解析完成！'}
          </Text>
        </div>
      )}
    </Card>
  );

  // 预览区域
  const renderPreviewArea = () => {
    if (!fileAnalysis) return null;

    const { data } = fileAnalysis;

    return (
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3}>文件解析完成</Title>
          <Text type="secondary">请确认解析结果，然后选择导入方式</Text>
        </div>

        <Alert
          message="解析成功"
          description={`成功解析文件 "${data.fileInfo.originalName}"，识别到 ${data.analysis.estimatedChapters} 个章节，共 ${data.analysis.totalWords} 字`}
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" title="文件信息">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="文件名">
                  {FileUploadService.getFileIcon(data.fileInfo.originalName)} {data.fileInfo.originalName}
                </Descriptions.Item>
                <Descriptions.Item label="文件大小">
                  {FileUploadService.formatFileSize(data.fileInfo.size)}
                </Descriptions.Item>
                <Descriptions.Item label="文件类型">
                  <Tag color="blue">{data.fileInfo.mimetype}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="内容分析">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="总字数">
                  <Text strong style={{ color: '#1890ff' }}>{data.analysis.totalWords.toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="章节数">
                  <Text strong style={{ color: '#52c41a' }}>{data.analysis.estimatedChapters}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="建议项目名">
                  {data.importOptions.suggestedProjectName}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {data.analysis.summary && (
          <Card size="small" title="内容摘要" style={{ marginTop: 16 }}>
            <Paragraph ellipsis={{ rows: 3, expandable: true }}>
              {data.analysis.summary}
            </Paragraph>
          </Card>
        )}

        {data.analysis.chaptersPreview.length > 0 && (
          <Card size="small" title="章节预览" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {data.analysis.chaptersPreview.map((chapter, index) => (
                <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong>{chapter.title}</Text>
                    <Space>
                      <Tag color="cyan">第{chapter.order}章</Tag>
                      <Tag>{chapter.wordCount}字</Tag>
                    </Space>
                  </div>
                  <Paragraph ellipsis={{ rows: 2 }} type="secondary">
                    {chapter.preview}
                  </Paragraph>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button onClick={resetUpload}>
              重新上传
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              导入小说
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  // 导入模态框
  const renderImportModal = () => (
    <Modal
      title="导入小说"
      open={importModalVisible}
      onCancel={() => setImportModalVisible(false)}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleImport}
        initialValues={{
          importType: 'new',
          importMode: 'append',
          projectTitle: fileAnalysis?.data.importOptions.suggestedProjectName,
          genre: '其他'
        }}
      >
        <Form.Item name="importType" label="导入方式">
          <Radio.Group onChange={(e) => setImportType(e.target.value)}>
            <Radio value="new">创建新项目</Radio>
            <Radio value="existing">导入到现有项目</Radio>
          </Radio.Group>
        </Form.Item>

        {importType === 'new' ? (
          <>
            <Form.Item
              name="projectTitle"
              label="项目标题"
              rules={[{ required: true, message: '请输入项目标题' }]}
            >
              <Input placeholder="输入项目标题" />
            </Form.Item>
            <Form.Item name="projectDescription" label="项目描述">
              <Input.TextArea 
                rows={3} 
                placeholder="输入项目描述（可选）"
                defaultValue={fileAnalysis?.data.analysis.summary}
              />
            </Form.Item>
            <Form.Item name="genre" label="小说类型">
              <Select placeholder="选择小说类型">
                <Option value="奇幻">奇幻</Option>
                <Option value="科幻">科幻</Option>
                <Option value="言情">言情</Option>
                <Option value="都市">都市</Option>
                <Option value="历史">历史</Option>
                <Option value="武侠">武侠</Option>
                <Option value="悬疑">悬疑</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="projectId"
              label="选择项目"
              rules={[{ required: true, message: '请选择要导入的项目' }]}
            >
              <Select placeholder="选择现有项目">
                {/* 这里应该从项目列表API获取 */}
                <Option value="project1">示例项目 1</Option>
                <Option value="project2">示例项目 2</Option>
              </Select>
            </Form.Item>
            <Form.Item name="importMode" label="导入模式">
              <Radio.Group>
                <Radio value="append">追加到末尾</Radio>
                <Radio value="replace">替换所有内容</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        )}

        <Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setImportModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={uploading}>
                确认导入
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {uploadStep === 'upload' && renderUploadArea()}
      {uploadStep === 'preview' && renderPreviewArea()}
      {renderImportModal()}
    </div>
  );
};

export default NovelFileUpload;
