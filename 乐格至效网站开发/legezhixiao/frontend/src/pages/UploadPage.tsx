import React from 'react';
import { Card, Typography, Row, Col, Alert, Space } from 'antd';
import { BookOutlined, CloudUploadOutlined, FileTextOutlined } from '@ant-design/icons';
import NovelFileUpload from '../components/Upload/NovelFileUpload';

const { Title, Paragraph } = Typography;

const UploadPage: React.FC = () => {
  const handleUploadSuccess = (result: any) => {
    console.log('上传成功:', result);
    // 可以跳转到项目页面或刷新项目列表
  };

  const handleUploadError = (error: string) => {
    console.error('上传失败:', error);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CloudUploadOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
          <Title level={1}>小说文件上传</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            将您的小说文件上传到平台，系统将自动解析内容并识别章节结构
          </Paragraph>
        </div>

        {/* 功能说明 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 16 }} />
                <Title level={4}>多格式支持</Title>
                <Paragraph type="secondary">
                  支持 TXT、Markdown、Word、PDF 等多种常见文档格式
                </Paragraph>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <BookOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>智能解析</Title>
                <Paragraph type="secondary">
                  自动识别章节结构，统计字数，生成内容摘要
                </Paragraph>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <CloudUploadOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 16 }} />
                <Title level={4}>灵活导入</Title>
                <Paragraph type="secondary">
                  可创建新项目或导入到现有项目，支持追加和替换模式
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 使用提示 */}
        <Alert
          message="使用提示"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>• <strong>文件格式：</strong>支持 .txt、.md、.docx、.pdf、.html、.json、.rtf 格式</div>
              <div>• <strong>文件大小：</strong>单个文件最大支持 50MB</div>
              <div>• <strong>章节识别：</strong>系统会自动识别"第X章"、"Chapter X"等章节标识</div>
              <div>• <strong>导入模式：</strong>可选择创建新项目或导入到现有项目</div>
              <div>• <strong>安全保障：</strong>文件仅用于内容解析，解析完成后自动删除</div>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 32 }}
        />

        {/* 上传组件 */}
        <NovelFileUpload
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />

        {/* 底部说明 */}
        <div style={{ textAlign: 'center', marginTop: 48, color: '#999' }}>
          <Paragraph type="secondary">
            上传的文件将被安全处理，仅用于内容解析和项目创建，不会存储原始文件
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
