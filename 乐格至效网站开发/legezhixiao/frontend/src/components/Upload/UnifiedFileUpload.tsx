import React, { useState } from 'react';
import {
  Upload,
  Button,
  Modal,
  Typography,
  Space,
  Alert,
  Progress,
  Tag,
  List,
  Card,
  message,
  Row,
  Col,
  Radio
} from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { FileUploadService } from '../../services/fileUploadService';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface FileResult {
  file: File;
  id: string;
  status: 'pending' | 'parsing' | 'success' | 'error';
  progress: number;
  analysis?: any;
  error?: string;
}

interface UnifiedFileUploadProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  mode?: 'single' | 'multiple';
  title?: string;
  compact?: boolean; // 紧凑模式，用于嵌入其他组件
}

const UnifiedFileUpload: React.FC<UnifiedFileUploadProps> = ({
  visible,
  onCancel,
  onSuccess,
  onError,
  mode = 'single',
  title = '文件上传',
  compact = false
}) => {
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>(mode);
  const [fileResults, setFileResults] = useState<FileResult[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (files: File[]) => {
    const newFileResults: FileResult[] = files.map(file => {
      const fileId = `${file.name}_${Date.now()}_${Math.random()}`;
      return {
        file,
        id: fileId,
        status: 'pending' as const,
        progress: 0
      };
    });

    if (uploadMode === 'single') {
      setFileResults(newFileResults.slice(0, 1)); // 只保留第一个文件
    } else {
      setFileResults(prev => [...prev, ...newFileResults]);
    }
  };

  const handleUpload = async () => {
    const pendingFiles = fileResults.filter(fr => fr.status === 'pending');
    if (pendingFiles.length === 0) {
      message.warning('没有待处理的文件');
      return;
    }

    setUploading(true);

    try {
      // 更新状态为解析中
      setFileResults(prev => prev.map(fr => 
        fr.status === 'pending' ? { ...fr, status: 'parsing' as const, progress: 0 } : fr
      ));

      if (uploadMode === 'single') {
        // 单文件处理
        const fileResult = pendingFiles[0];
        try {
          // 模拟进度更新
          for (let progress = 0; progress <= 100; progress += 25) {
            setFileResults(prev => prev.map(fr => 
              fr.id === fileResult.id ? { ...fr, progress } : fr
            ));
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          const analysis = await FileUploadService.parseFile(fileResult.file);

          setFileResults(prev => prev.map(fr => 
            fr.id === fileResult.id 
              ? { ...fr, status: 'success' as const, progress: 100, analysis: analysis.data?.analysis }
              : fr
          ));

          if (onSuccess) {
            onSuccess({
              fileName: fileResult.file.name,
              fileSize: fileResult.file.size,
              analyzedAt: new Date().toISOString(),
              content: analysis.data?.analysis?.summary || '',
              chapterCount: analysis.data?.analysis?.estimatedChapters || 0,
              wordCount: analysis.data?.analysis?.totalWords || 0,
              mode: 'single'
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '文件解析失败';
          setFileResults(prev => prev.map(fr => 
            fr.id === fileResult.id 
              ? { ...fr, status: 'error' as const, error: errorMessage }
              : fr
          ));
          if (onError) {
            onError(errorMessage);
          }
        }
      } else {
        // 多文件批量处理
        const files = pendingFiles.map(fr => fr.file);
        
        try {
          const batchResult = await FileUploadService.parseMultipleFiles(files);
          
          // 更新所有文件状态
          setFileResults(prev => prev.map(fr => {
            if (fr.status === 'parsing') {
              const fileData = batchResult.files?.find((f: any) => f.file.originalName === fr.file.name);
              if (fileData && fileData.success) {
                return { ...fr, status: 'success' as const, progress: 100, analysis: fileData.analysis };
              } else {
                return { ...fr, status: 'error' as const, error: fileData?.error || '解析失败' };
              }
            }
            return fr;
          }));

          // 准备成功回调的数据
          const successfulFiles = batchResult.files?.filter((f: any) => f.success).map((f: any) => ({
            fileName: f.file.originalName,
            fileSize: f.file.size,
            analyzedAt: new Date().toISOString(),
            content: f.analysis?.summary || '',
            chapterCount: f.analysis?.estimatedChapters || 0,
            wordCount: f.analysis?.totalWords || 0
          })) || [];

          if (onSuccess && successfulFiles.length > 0) {
            onSuccess(successfulFiles);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '批量处理失败';
          setFileResults(prev => prev.map(fr => 
            fr.status === 'parsing' ? { ...fr, status: 'error' as const, error: errorMessage } : fr
          ));
          if (onError) {
            onError(errorMessage);
          }
        }
      }

    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFileResults(prev => prev.filter(fr => fr.id !== fileId));
  };

  const uploadProps: UploadProps = {
    multiple: uploadMode === 'multiple',
    accept: '.txt,.md,.docx,.pdf,.html,.rtf',
    beforeUpload: (file) => {
      try {
        const validation = FileUploadService.validateFile(file);
        if (!validation.valid) {
          message.error(`文件 "${file.name}" 验证失败: ${validation.error || '未知错误'}`);
          return Upload.LIST_IGNORE;
        }
        return false;
      } catch (error) {
        message.error(`文件 "${file.name}" 验证失败: ${error instanceof Error ? error.message : '验证过程中发生错误'}`);
        return Upload.LIST_IGNORE;
      }
    },
    onChange: (info) => {
      const files = info.fileList
        .filter(f => f.status !== 'error')
        .map(f => f.originFileObj as File)
        .filter(Boolean);
      
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    showUploadList: false,
  };

  const getFileStatusIcon = (fileResult: FileResult) => {
    switch (fileResult.status) {
      case 'pending':
        return <FileTextOutlined style={{ color: '#faad14' }} />;
      case 'parsing':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <FileTextOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const supportedFormats = [
    { ext: '.txt', name: '纯文本', color: '#1890ff' },
    { ext: '.md', name: 'Markdown', color: '#52c41a' },
    { ext: '.docx', name: 'Word文档', color: '#722ed1' },
    { ext: '.pdf', name: 'PDF文档', color: '#fa541c' },
    { ext: '.html', name: 'HTML', color: '#13c2c2' },
    { ext: '.rtf', name: 'RTF', color: '#eb2f96' }
  ];

  const renderContent = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {!compact && (
        <div>
          <Title level={4}>{title}</Title>
          <Text type="secondary">
            上传文档文件，AI将自动解析内容并提供智能建议
          </Text>
        </div>
      )}

      {/* 上传模式选择 */}
      {!compact && (
        <Card size="small" style={{ background: '#fafafa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>选择上传模式：</Text>
            <Radio.Group 
              value={uploadMode} 
              onChange={(e) => {
                setUploadMode(e.target.value);
                setFileResults([]); // 清空文件列表
              }}
            >
              <Radio.Button value="single">单文件上传</Radio.Button>
              <Radio.Button value="multiple">多文件批量上传</Radio.Button>
            </Radio.Group>
          </Space>
        </Card>
      )}

      {/* 支持格式展示 */}
      <Card size="small" style={{ background: '#fafafa' }}>
        <Text strong>支持的文件格式：</Text>
        <div style={{ marginTop: 8 }}>
          {supportedFormats.map(format => (
            <Tag key={format.ext} color={format.color} style={{ margin: '2px 4px' }}>
              {format.ext} {format.name}
            </Tag>
          ))}
        </div>
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
          每个文件最大50MB
          {uploadMode === 'multiple' && '，最多同时上传10个文件'}
        </Text>
      </Card>

      {/* 文件上传区域 */}
      <Dragger {...uploadProps} style={{ padding: compact ? '16px' : '20px' }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: compact ? '32px' : '48px', color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text" style={{ fontSize: compact ? '14px' : '16px' }}>
          点击或拖拽文件到此区域上传
        </p>
        <p className="ant-upload-hint" style={{ color: '#666' }}>
          {uploadMode === 'single' ? '选择单个文件' : '支持批量选择多个文件'}
        </p>
      </Dragger>

      {/* 文件列表 */}
      {fileResults.length > 0 && (
        <Card title="文件列表" size={compact ? 'small' : 'default'}>
          <List
            size={compact ? 'small' : 'default'}
            dataSource={fileResults}
            renderItem={(fileResult) => (
              <List.Item
                key={fileResult.id}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeFile(fileResult.id)}
                    disabled={fileResult.status === 'parsing'}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={getFileStatusIcon(fileResult)}
                  title={
                    <Space>
                      <Text strong>{fileResult.file.name}</Text>
                      <Tag style={{ fontSize: '12px' }}>
                        {fileResult.file.size ? `${(fileResult.file.size / 1024).toFixed(1)} KB` : '未知大小'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      {fileResult.status === 'parsing' && (
                        <Text type="secondary">正在解析文件...</Text>
                      )}
                      {fileResult.status === 'success' && fileResult.analysis && (
                        <Text type="secondary">
                          📖 {fileResult.analysis.estimatedChapters || 0} 章节 · 
                          📝 {fileResult.analysis.totalWords?.toLocaleString() || 0} 字
                        </Text>
                      )}
                      {fileResult.status === 'error' && (
                        <Text type="danger">{fileResult.error}</Text>
                      )}
                      {fileResult.status === 'pending' && (
                        <Text type="secondary">等待处理</Text>
                      )}
                    </div>
                  }
                />
                {fileResult.status === 'parsing' && (
                  <div style={{ marginTop: 8 }}>
                    <Progress percent={fileResult.progress} size="small" />
                  </div>
                )}
              </List.Item>
            )}
          />
          
          <Row justify="space-between" style={{ marginTop: 16 }}>
            <Col>
              <Text type="secondary">
                共 {fileResults.length} 个文件 · 
                成功 {fileResults.filter(fr => fr.status === 'success').length} · 
                失败 {fileResults.filter(fr => fr.status === 'error').length}
              </Text>
            </Col>
            <Col>
              <Space>
                <Button 
                  onClick={() => setFileResults([])}
                  disabled={uploading}
                  size={compact ? 'small' : 'middle'}
                >
                  清空列表
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleUpload}
                  loading={uploading}
                  disabled={fileResults.filter(fr => fr.status === 'pending').length === 0}
                  size={compact ? 'small' : 'middle'}
                >
                  开始解析
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 解析结果统计 */}
      {fileResults.filter(fr => fr.status === 'success').length > 0 && (
        <Alert
          type="success"
          message="文件解析完成"
          description={
            <div>
              <Text>
                成功解析 {fileResults.filter(fr => fr.status === 'success').length} 个文件，
                总计 {fileResults.reduce((total, fr) => total + (fr.analysis?.totalWords || 0), 0).toLocaleString()} 字，
                {fileResults.reduce((total, fr) => total + (fr.analysis?.estimatedChapters || 0), 0)} 个章节
              </Text>
            </div>
          }
          style={{ marginTop: 16 }}
        />
      )}
    </Space>
  );

  if (compact) {
    return renderContent();
  }

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      destroyOnClose
    >
      {renderContent()}
    </Modal>
  );
};

export default UnifiedFileUpload;
