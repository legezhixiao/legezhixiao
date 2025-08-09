import React, { useState } from 'react'
import {
  Upload,
  Card,
  Typography,
  Space,
  Alert,
  Progress,
  Tag,
  List,
  Divider,
  message
} from 'antd'
import {
  InboxOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { FileUploadService } from '../../services/fileUploadService'

const { Dragger } = Upload
const { Title, Text, Paragraph } = Typography

interface ProjectFileImportProps {
  onFileAnalyzed?: (fileData: any) => void
  onError?: (error: string) => void
}

const ProjectFileImport: React.FC<ProjectFileImportProps> = ({ 
  onFileAnalyzed, 
  onError 
}) => {
  const [analyzing, setAnalyzing] = useState(false)
  const [fileInfo, setFileInfo] = useState<any>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const supportedFormats = [
    { ext: '.txt', name: '纯文本文件', icon: '📄' },
    { ext: '.md', name: 'Markdown文件', icon: '📝' },
    { ext: '.docx', name: 'Word文档', icon: '📘' },
    { ext: '.pdf', name: 'PDF文档', icon: '📕' },
    { ext: '.html', name: 'HTML文件', icon: '🌐' },
    { ext: '.json', name: 'JSON格式', icon: '⚙️' },
    { ext: '.rtf', name: 'RTF格式', icon: '📋' }
  ]

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.txt,.md,.docx,.pdf,.html,.json,.rtf',
    beforeUpload: async (file) => {
      setAnalyzing(true)
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type
      })

      try {
        // 调用文件解析API
        const analysisData = await FileUploadService.parseFile(file)
        
        setAnalysisResult(analysisData)
        message.success('文件解析成功！')
        
        // 传递解析结果给父组件
        if (onFileAnalyzed) {
          onFileAnalyzed({
            file: fileInfo,
            analysis: analysisData
          })
        }
      } catch (error) {
        console.error('文件解析失败:', error)
        const errorMsg = error instanceof Error ? error.message : '文件解析失败'
        message.error(errorMsg)
        if (onError) {
          onError(errorMsg)
        }
      } finally {
        setAnalyzing(false)
      }
      
      return false // 阻止默认上传
    },
    showUploadList: false
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={4} style={{ marginBottom: 8 }}>
          📚 导入现有小说文件
        </Title>
        <Paragraph type="secondary">
          如果您已有小说文稿，可以导入文件自动创建项目和章节结构
        </Paragraph>
      </div>

      {!analysisResult && (
        <Dragger {...uploadProps} style={{ padding: '20px' }}>
          <p className="ant-upload-drag-icon">
            {analyzing ? <LoadingOutlined style={{ fontSize: 48 }} spin /> : <InboxOutlined style={{ fontSize: 48 }} />}
          </p>
          <p className="ant-upload-text">
            {analyzing ? '正在解析文件...' : '点击或拖拽文件到此区域进行导入'}
          </p>
          <p className="ant-upload-hint">
            支持单个文件上传，系统将自动识别章节结构
          </p>
        </Dragger>
      )}

      {analyzing && fileInfo && (
        <Card size="small">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <div>
                <Text strong>{fileInfo.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatFileSize(fileInfo.size)}
                </Text>
              </div>
            </div>
            <Progress type="circle" size={30} percent={60} showInfo={false} />
          </div>
        </Card>
      )}

      {analysisResult && (
        <Card 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span>文件解析完成</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>文件信息：</Text>
              <div style={{ marginTop: 4 }}>
                <Text>{fileInfo?.name}</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {formatFileSize(fileInfo?.size || 0)}
                </Tag>
              </div>
            </div>

            <div>
              <Text strong>内容统计：</Text>
              <div style={{ marginTop: 4, display: 'flex', gap: 16 }}>
                <Tag color="green">
                  📝 {analysisResult.totalWords?.toLocaleString() || 0} 字
                </Tag>
                <Tag color="blue">
                  📚 {analysisResult.chapters?.length || 0} 章节
                </Tag>
              </div>
            </div>

            {analysisResult.chapters && analysisResult.chapters.length > 0 && (
              <div>
                <Text strong>章节预览：</Text>
                <List
                  size="small"
                  dataSource={analysisResult.chapters.slice(0, 3)}
                  style={{ marginTop: 8 }}
                  renderItem={(chapter: any, index) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <Text>
                        {index + 1}. {chapter.title}
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({chapter.wordCount} 字)
                        </Text>
                      </Text>
                    </List.Item>
                  )}
                  footer={
                    analysisResult.chapters.length > 3 && (
                      <Text type="secondary">
                        ...还有 {analysisResult.chapters.length - 3} 个章节
                      </Text>
                    )
                  }
                />
              </div>
            )}

            <Alert
              message="导入提示"
              description="文件内容将作为项目的初始内容，您稍后可以继续编辑和完善。"
              type="info"
              showIcon
            />
          </Space>
        </Card>
      )}

      <Divider orientation="left">
        <Text type="secondary">支持的文件格式</Text>
      </Divider>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {supportedFormats.map(format => (
          <Tag key={format.ext} color="default">
            {format.icon} {format.ext} - {format.name}
          </Tag>
        ))}
      </div>
    </Space>
  )
}

export default ProjectFileImport
