import React, { useState } from 'react'
import {
  Card,
  Tree,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Dropdown,
  Typography,
  Progress,
  Tag,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { useAppStore } from '../../store/appStore'
import type { Chapter } from '../../types'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

interface OutlineManagerProps {
  projectId: string
  onChapterSelect?: (chapter: Chapter) => void
}

interface ChapterNode extends DataNode {
  chapter: Chapter
  children?: ChapterNode[]
}

const OutlineManager: React.FC<OutlineManagerProps> = ({
  projectId,
  onChapterSelect
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()
  const { currentProject, updateProject } = useAppStore()

  const chapters = currentProject?.chapters || []

  // 章节状态配置
  const statusOptions = [
    { value: 'planning', label: '计划中', color: '#d9d9d9', icon: <ClockCircleOutlined /> },
    { value: 'writing', label: '写作中', color: '#1890ff', icon: <EditOutlined /> },
    { value: 'completed', label: '已完成', color: '#52c41a', icon: <CheckCircleOutlined /> },
    { value: 'reviewing', label: '修改中', color: '#faad14', icon: <FileTextOutlined /> }
  ]

  // 将章节列表转换为树形结构
  const convertToTreeData = (chapters: Chapter[]): ChapterNode[] => {
    const rootChapters = chapters.filter(ch => !ch.parentId)
    
    const buildTree = (parentChapters: Chapter[]): ChapterNode[] => {
      return parentChapters.map(chapter => {
        const children = chapters.filter(ch => ch.parentId === chapter.id)
        const statusConfig = statusOptions.find(s => s.value === chapter.status)
        
        return {
          key: chapter.id,
          title: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Text strong={!chapter.parentId}>{chapter.title}</Text>
                <Tag 
                  color={statusConfig?.color} 
                  icon={statusConfig?.icon}
                  style={{ margin: 0 }}
                >
                  {statusConfig?.label}
                </Tag>
                {chapter.wordCount > 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {chapter.wordCount}字
                  </Text>
                )}
              </Space>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      label: '编辑',
                      icon: <EditOutlined />
                    },
                    {
                      key: 'addChild',
                      label: '添加子章节',
                      icon: <PlusOutlined />
                    },
                    {
                      key: 'delete',
                      label: '删除',
                      icon: <DeleteOutlined />,
                      danger: true
                    }
                  ],
                  onClick: ({ key }) => handleMenuClick(key, chapter)
                }}
                trigger={['click']}
              >
                <Button 
                  type="text" 
                  size="small" 
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          ),
          chapter,
          children: children.length > 0 ? buildTree(children) : undefined
        }
      })
    }

    return buildTree(rootChapters)
  }

  const treeData = convertToTreeData(chapters)

  const handleMenuClick = (action: string, chapter: Chapter) => {
    switch (action) {
      case 'edit':
        handleEdit(chapter)
        break
      case 'addChild':
        handleAddChild(chapter)
        break
      case 'delete':
        handleDelete(chapter.id)
        break
    }
  }

  const handleAdd = () => {
    setEditingChapter(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleAddChild = (parentChapter: Chapter) => {
    setEditingChapter(null)
    form.resetFields()
    form.setFieldsValue({ parentId: parentChapter.id })
    setIsModalVisible(true)
  }

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter)
    form.setFieldsValue(chapter)
    setIsModalVisible(true)
  }

  const handleDelete = (chapterId: string) => {
    Modal.confirm({
      title: '确定要删除这个章节吗？',
      content: '删除后将无法恢复，请谨慎操作。',
      onOk: () => {
        const updatedChapters = chapters.filter(ch => 
          ch.id !== chapterId && ch.parentId !== chapterId
        )
        updateProject(projectId, { chapters: updatedChapters })
        message.success('章节删除成功')
      }
    })
  }

  const handleSubmit = async (values: any) => {
    try {
      const chapterData = {
        ...values,
        id: editingChapter?.id || Date.now().toString(),
        projectId,
        wordCount: editingChapter?.wordCount || 0,
        content: editingChapter?.content || '',
        createdAt: editingChapter?.createdAt || new Date(),
        updatedAt: new Date()
      }

      let updatedChapters
      if (editingChapter) {
        updatedChapters = chapters.map(ch => 
          ch.id === editingChapter.id ? chapterData : ch
        )
      } else {
        updatedChapters = [...chapters, chapterData]
      }

      updateProject(projectId, { chapters: updatedChapters })
      message.success(editingChapter ? '章节更新成功' : '章节创建成功')
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleTreeSelect = (selectedKeys: React.Key[], info: any) => {
    setSelectedKeys(selectedKeys)
    if (selectedKeys.length > 0 && info.selectedNodes[0]) {
      const chapter = info.selectedNodes[0].chapter
      onChapterSelect?.(chapter)
    }
  }

  // 计算统计信息
  const stats = {
    total: chapters.length,
    completed: chapters.filter(ch => ch.status === 'completed').length,
    totalWords: chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0),
    progress: chapters.length > 0 ? 
      (chapters.filter(ch => ch.status === 'completed').length / chapters.length) * 100 : 0
  }

  return (
    <div>
      <Card
        title="章节大纲"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加章节
          </Button>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="总章节"
              value={stats.total}
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总字数"
              value={stats.totalWords}
              prefix={<FileTextOutlined />}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Col>
          <Col span={6}>
            <div>
              <Text strong>完成进度</Text>
              <Progress 
                percent={Math.round(stats.progress)} 
                size="small" 
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
        </Row>

        {/* 章节树 */}
        {treeData.length > 0 ? (
          <Tree
            treeData={treeData}
            selectedKeys={selectedKeys}
            expandedKeys={expandedKeys}
            onSelect={handleTreeSelect}
            onExpand={setExpandedKeys}
            showLine
            blockNode
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <BookOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>暂无章节，点击添加按钮创建第一个章节</div>
          </div>
        )}
      </Card>

      {/* 创建/编辑章节模态框 */}
      <Modal
        title={editingChapter ? '编辑章节' : '创建章节'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="章节标题"
            rules={[{ required: true, message: '请输入章节标题' }]}
          >
            <Input placeholder="输入章节标题" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择章节状态' }]}
              >
                <Select placeholder="选择状态">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        {option.icon}
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parentId"
                label="父章节"
              >
                <Select placeholder="选择父章节（可选）" allowClear>
                  {chapters
                    .filter(ch => !ch.parentId && ch.id !== editingChapter?.id)
                    .map(chapter => (
                      <Option key={chapter.id} value={chapter.id}>
                        {chapter.title}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="章节概要"
          >
            <TextArea
              rows={4}
              placeholder="简要描述这一章的内容..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="outline"
            label="详细大纲"
          >
            <TextArea
              rows={6}
              placeholder="详细描述章节内容、情节发展、角色动向等..."
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea
              rows={3}
              placeholder="其他备注信息..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OutlineManager
