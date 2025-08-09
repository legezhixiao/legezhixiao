import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Button,
  Steps,
  Typography,
  Row,
  Col,
  Tag,
    Card,
  message,
  Radio
} from 'antd'
import {
  BookOutlined,
  SettingOutlined,
  CheckOutlined,
  FileTextOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useAppStore } from '../../store/appStore'
import { ProjectStatus } from '../../types'
import type { NovelProject } from '../../types'
import { projectService } from '../../services/projectService'
import ProjectFileImport from './ProjectFileImport'

const { TextArea } = Input
const { Title, Text } = Typography
const { Step } = Steps

interface CreateProjectModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: (project: NovelProject) => void
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [creationMode, setCreationMode] = useState<'manual' | 'import'>('manual')
  const [importedFileData, setImportedFileData] = useState<any>(null)
  const { addProject } = useAppStore()

  // 同步表单值和本地状态
  useEffect(() => {
    const formGenres = form.getFieldValue('genre') || []
    if (JSON.stringify(formGenres) !== JSON.stringify(selectedGenres)) {
      setSelectedGenres(formGenres)
    }
  }, [form, selectedGenres])

  // 小说类型选项
  const genreOptions = [
    { value: 'fantasy', label: '玄幻', color: '#722ed1' },
    { value: 'romance', label: '言情', color: '#eb2f96' },
    { value: 'scifi', label: '科幻', color: '#1890ff' },
    { value: 'mystery', label: '悬疑', color: '#fa541c' },
    { value: 'historical', label: '历史', color: '#fadb14' },
    { value: 'urban', label: '都市', color: '#52c41a' },
    { value: 'martial', label: '武侠', color: '#f5222d' },
    { value: 'game', label: '游戏', color: '#13c2c2' },
    { value: 'thriller', label: '惊悚', color: '#000000' },
    { value: 'comedy', label: '喜剧', color: '#faad14' },
    { value: 'drama', label: '剧情', color: '#531dab' },
    { value: 'adventure', label: '冒险', color: '#389e0d' },
    { value: 'other', label: '其他', color: '#595959' }
  ]

  // 写作目标预设
  const targetPresets = [
    { words: 50000, label: '短篇小说 (5万字)' },
    { words: 100000, label: '中篇小说 (10万字)' },
    { words: 200000, label: '长篇小说 (20万字)' },
    { words: 500000, label: '超长篇 (50万字)' },
    { words: 1000000, label: '史诗级 (100万字)' }
  ]

  const handleNext = () => {
    // 确保选中的类型同步到表单
    if (selectedGenres.length > 0) {
      form.setFieldsValue({ genre: selectedGenres })
    }
    
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1)
    }).catch((errorInfo) => {
      console.log('表单验证失败:', errorInfo)
    })
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleFinish = async (values: any) => {
    console.log('开始创建小说, values:', values)
    console.log('selectedGenres:', selectedGenres)
    console.log('creationMode:', creationMode)
    console.log('importedFileData:', importedFileData)
    
    setLoading(true)
    try {
      // 确保genre是数组，如果为空则使用selectedGenres
      const genreArray = values.genre && values.genre.length > 0 ? values.genre : selectedGenres
      
      console.log('处理后的genreArray:', genreArray)
      
      if (!genreArray || genreArray.length === 0) {
        console.error('genre数组为空')
        throw new Error('请至少选择一个小说类型')
      }

      let response: any

      if (creationMode === 'import' && importedFileData) {
        // 文件导入模式：使用文件导入API
        console.log('使用文件导入模式创建项目...')
        const { FileUploadService } = await import('../../services/fileUploadService')
        
        response = await FileUploadService.importToNewProject(
          importedFileData.file,
          {
            projectTitle: values.title,
            projectDescription: values.description || '',
            genre: genreArray[0] // 后端API可能只支持单个genre
          }
        )
      } else {
        // 手动创建模式：使用普通项目创建API
        console.log('使用手动创建模式...')
        response = await projectService.createProject({
          title: values.title,
          description: values.description || '',
          genre: genreArray,
          targetWords: values.targetWords || 100000,
          author: values.author || '匿名作者',
          type: 'novel'
        })
      }

      console.log('API响应:', response)

      if (response.success && response.data) {
        // 将后端返回的小说数据转换为前端格式
        const backendProject = response.data
        const newProject: NovelProject = {
          id: backendProject.id,
          title: backendProject.title,
          author: backendProject.author || values.author || '匿名作者',
          genre: backendProject.genre ? [backendProject.genre] : genreArray,
          description: backendProject.description || '',
          status: ProjectStatus.DRAFT,
          targetWords: backendProject.targetWords || values.targetWords || 100000,
          currentWords: backendProject.wordsCount || 0,
          createdAt: new Date(backendProject.createdAt),
          updatedAt: new Date(backendProject.updatedAt),
          chapters: [],
          characters: [],
          constraints: values.constraints || [],
          settings: {
            autoSave: true,
            autoSaveInterval: 30,
            theme: 'light',
            fontSize: 14,
            lineHeight: 1.6
          }
        }

        console.log('转换后的小说对象:', newProject)
        
        // 添加到本地store
        addProject(newProject)
        console.log('小说已添加到store')
        
        // 调用成功回调
        onSuccess(newProject)
        console.log('onSuccess回调已执行')
        
        // 关闭模态框
        handleCancel()
        console.log('模态框已关闭')
        
        message.success('小说创建成功！')
      } else {
        throw new Error('服务器返回数据格式错误')
      }
      
    } catch (error) {
      console.error('创建小说失败:', error)
      message.error(`创建小说失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setCurrentStep(0)
    setSelectedGenres([])
    setCreationMode('manual')
    setImportedFileData(null)
    onCancel()
  }

  const steps = [
    {
      title: '创建方式',
      icon: <BookOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4}>选择项目创建方式</Title>
            <Text type="secondary">您可以手动创建项目，或从现有文件导入</Text>
          </div>
          
          <Radio.Group 
            value={creationMode} 
            onChange={(e) => setCreationMode(e.target.value)}
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Radio.Button 
                  value="manual" 
                  style={{ 
                    height: 'auto', 
                    padding: '20px', 
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  <div>
                    <EditOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>手动创建</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>从零开始创建新项目</div>
                  </div>
                </Radio.Button>
              </Col>
              <Col span={12}>
                <Radio.Button 
                  value="import" 
                  style={{ 
                    height: 'auto', 
                    padding: '20px', 
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  <div>
                    <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>导入文件</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>从现有文稿创建项目</div>
                  </div>
                </Radio.Button>
              </Col>
            </Row>
          </Radio.Group>

          {creationMode === 'import' && (
            <Card style={{ marginTop: 16 }}>
              <ProjectFileImport 
                onFileAnalyzed={(fileData) => {
                  setImportedFileData(fileData)
                  // 自动填充项目信息
                  if (fileData.analysis) {
                    form.setFieldsValue({
                      title: fileData.file?.name?.replace(/\.[^/.]+$/, '') || '导入的小说',
                      author: '导入用户',
                      description: `从文件"${fileData.file?.name}"导入，包含${fileData.analysis.chapters?.length || 0}个章节，共${fileData.analysis.totalWords?.toLocaleString() || 0}字。`
                    })
                  }
                }}
                onError={(error) => {
                  message.error(`文件导入失败: ${error}`)
                }}
              />
            </Card>
          )}
        </Space>
      )
    },
    {
      title: '基本信息',
      icon: <SettingOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item
            name="title"
            label="小说名称"
            rules={[{ required: true, message: '请输入小说名称' }]}
          >
            <Input size="large" placeholder="给你的小说起个响亮的名字" />
          </Form.Item>
          
          <Form.Item
            name="author"
            label="作者笔名"
          >
            <Input size="large" placeholder="输入你的笔名" />
          </Form.Item>

          <Form.Item
            name="genre"
            label="小说类型"
            rules={[{ required: true, message: '请选择至少一个小说类型' }]}
          >
            <div>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
                点击标签选择类型（可多选）：
              </Text>
              
              <div style={{ marginTop: 8 }}>
                {genreOptions.map(option => {
                  const isSelected = selectedGenres.includes(option.value)
                  return (
                    <Tag
                      key={option.value}
                      color={isSelected ? option.color : undefined}
                      style={{
                        cursor: 'pointer',
                        marginBottom: 8,
                        marginRight: 8,
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: isSelected ? `2px solid ${option.color}` : '2px dashed #d9d9d9',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        userSelect: 'none'
                      }}
                      onClick={() => {
                        let newGenres
                        if (isSelected) {
                          newGenres = selectedGenres.filter((g: string) => g !== option.value)
                        } else {
                          newGenres = [...selectedGenres, option.value]
                        }
                        setSelectedGenres(newGenres)
                        form.setFieldsValue({ genre: newGenres })
                      }}
                    >
                      {isSelected && '✓ '}
                      {option.label}
                    </Tag>
                  )
                })}
              </div>
              
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8f9fa', borderRadius: '4px', minHeight: '32px' }}>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  已选择：
                </Text>
                {selectedGenres.length > 0 ? (
                  <Space wrap style={{ marginLeft: 8 }}>
                    {selectedGenres.map((genreValue: string) => {
                      const option = genreOptions.find(opt => opt.value === genreValue)
                      return option ? (
                        <Tag key={genreValue} color={option.color} style={{ fontSize: '12px' }}>
                          {option.label}
                        </Tag>
                      ) : null
                    })}
                  </Space>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    暂无选择
                  </Text>
                )}
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="description"
            label="作品简介"
          >
            <TextArea
              rows={4}
              placeholder="简单描述你的小说故事..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Space>
      )
    },
    {
      title: '创作目标',
      icon: <SettingOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>选择写作目标</Text>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {targetPresets.map(preset => (
                <Col span={12} key={preset.words}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => form.setFieldsValue({ targetWords: preset.words })}
                    style={{ textAlign: 'center' }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                      {(preset.words / 10000).toFixed(0)}万字
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {preset.label}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <Form.Item
            name="targetWords"
            label="目标字数"
            rules={[{ required: true, message: '请设置目标字数' }]}
          >
            <InputNumber
              size="large"
              min={1000}
              max={10000000}
              step={10000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              style={{ width: '100%' }}
              addonAfter="字"
            />
          </Form.Item>

          <Form.Item
            name="constraints"
            label="写作约束"
          >
            <Select
              mode="multiple"
              size="large"
              placeholder="选择写作约束（可选）"
              options={[
                { value: 'daily_target', label: '每日字数目标' },
                { value: 'deadline', label: '完成期限' },
                { value: 'update_schedule', label: '更新计划' },
                { value: 'word_limit', label: '章节字数限制' }
              ]}
            />
          </Form.Item>
        </Space>
      )
    },
    {
      title: '确认创建',
      icon: <CheckOutlined />,
      content: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <BookOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={4}>准备就绪！</Title>
          <Text type="secondary">
            点击"创建小说"开始你的创作之旅
          </Text>
        </div>
      )
    }
  ]

  return (
    <Modal
      title="创建新小说"
      open={visible}
      onCancel={handleCancel}
      width={720}
      footer={null}
      destroyOnClose
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map(step => (
          <Step key={step.title} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ minHeight: 400 }}
      >
        <div style={{ marginBottom: 24 }}>
          {steps[currentStep].content}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button 
                type="primary" 
                loading={loading}
                onClick={() => form.submit()}
              >
                创建小说
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  )
}

export default CreateProjectModal
