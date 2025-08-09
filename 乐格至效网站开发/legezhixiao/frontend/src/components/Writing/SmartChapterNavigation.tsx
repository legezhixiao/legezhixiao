import React, { useState, useEffect } from 'react'
import { 
  Tree, 
  Button, 
  Input, 
  Dropdown, 
  Space, 
  Modal, 
  Form, 
  message,
  Badge,
  Typography,
  Divider,
  Progress,
  Tooltip,
  Card
  // Collapse // 预设功能组件
} from 'antd'
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined,
  FileTextOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  BookOutlined,
  FileOutlined,
  CopyOutlined,
  DragOutlined
  // BranchesOutlined, // 预设功能
  // DatabaseOutlined // 预设功能
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import KnowledgeGraphIntegration from './KnowledgeGraphIntegration'

const { Search } = Input
const { Text } = Typography
// const { Panel } = Collapse // 预设功能组件

interface Chapter {
  id: string
  title: string
  type: 'volume' | 'chapter'
  status: 'draft' | 'writing' | 'completed' | 'reviewing'
  wordCount: number
  targetWordCount: number
  parentId?: string
  order: number
  createdAt: string
  updatedAt: string
  notes?: string
  tags?: string[]
  // AI内容约束字段
  aiGenerated?: boolean
  contentConstraints?: {
    themeCompliance: number      // 主题符合度 (0-100)
    characterConsistency: number // 角色一致性 (0-100)
    plotContinuity: number       // 情节连续性 (0-100)
    styleConsistency: number     // 文风一致性 (0-100)
    qualityScore: number         // 整体质量分数 (0-100)
  }
  constraintViolations?: Array<{
    type: 'theme' | 'character' | 'plot' | 'style' | 'length'
    severity: 'low' | 'medium' | 'high'
    message: string
    suggestion: string
  }>
}

interface SmartChapterNavigationProps {
  projectId: string
  currentChapterId?: string
  onChapterSelect: (chapterId: string) => void
  onChapterCreate?: (chapter: Partial<Chapter>) => void
  onChapterUpdate?: (chapterId: string, updates: Partial<Chapter>) => void
  onChapterDelete?: (chapterId: string) => void
}

const SmartChapterNavigation: React.FC<SmartChapterNavigationProps> = ({
  projectId,
  currentChapterId,
  onChapterSelect,
  onChapterCreate,
  onChapterUpdate,
  onChapterDelete
}) => {
  // 状态管理
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [form] = Form.useForm()

  // 章节状态配置
  const statusConfig = {
    draft: { color: '#d9d9d9', text: '草稿', icon: <FileOutlined /> },
    writing: { color: '#1890ff', text: '编写中', icon: <EditOutlined /> },
    completed: { color: '#52c41a', text: '已完成', icon: <CheckCircleOutlined /> },
    reviewing: { color: '#faad14', text: '审阅中', icon: <ClockCircleOutlined /> }
  }

  // AI内容约束验证函数
  // AI内容验证函数 - 预设功能
  /* const validateAIContent = (chapter: Chapter): boolean => {
    if (!chapter.aiGenerated || !chapter.contentConstraints) return true
    
    const constraints = chapter.contentConstraints
    const minThreshold = 70 // 最低质量阈值
    
    // 检查各项约束指标
    const violations = []
    if (constraints.themeCompliance < minThreshold) {
      violations.push({
        type: 'theme' as const,
        severity: 'high' as const,
        message: '内容与主题偏离过大',
        suggestion: '请调整内容使其更符合故事主题'
      })
    }
    
    if (constraints.characterConsistency < minThreshold) {
      violations.push({
        type: 'character' as const,
        severity: 'medium' as const,
        message: '角色行为不一致',
        suggestion: '请检查角色对话和行为是否符合人物设定'
      })
    }
    
    if (constraints.plotContinuity < minThreshold) {
      violations.push({
        type: 'plot' as const,
        severity: 'high' as const,
        message: '情节连续性问题',
        suggestion: '请确保情节发展符合前文逻辑'
      })
    }
    
    // 更新章节的约束违规记录
    chapter.constraintViolations = violations
    
    return violations.length === 0
  } */

  // 获取约束状态显示
  const getConstraintStatusIcon = (chapter: Chapter) => {
    if (!chapter.aiGenerated) return null
    
    const hasViolations = chapter.constraintViolations && chapter.constraintViolations.length > 0
    if (hasViolations) {
      const highSeverity = chapter.constraintViolations?.some(v => v.severity === 'high')
      return (
        <Tooltip title="AI内容存在约束违规">
          <ExclamationCircleOutlined 
            style={{ 
              color: highSeverity ? '#ff4d4f' : '#faad14',
              marginLeft: '4px'
            }} 
          />
        </Tooltip>
      )
    }
    
    return (
      <Tooltip title="AI内容通过约束检查">
        <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '4px' }} />
      </Tooltip>
    )
  }

  // 模拟章节数据
  useEffect(() => {
    const mockChapters: Chapter[] = [
      {
        id: 'vol1',
        title: '第一卷：起源',
        type: 'volume',
        status: 'writing',
        wordCount: 0,
        targetWordCount: 100000,
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-20'
      },
      {
        id: 'ch1',
        title: '第一章：觉醒',
        type: 'chapter',
        status: 'completed',
        wordCount: 3500,
        targetWordCount: 3000,
        parentId: 'vol1',
        order: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
        notes: '主角觉醒异能的关键章节',
        tags: ['重要', '转折点']
      },
      {
        id: 'ch2',
        title: '第二章：初试身手',
        type: 'chapter',
        status: 'writing',
        wordCount: 1200,
        targetWordCount: 2800,
        parentId: 'vol1',
        order: 2,
        createdAt: '2024-01-05',
        updatedAt: '2024-01-20',
        notes: '展示主角能力，引出主要冲突'
      },
      {
        id: 'ch3',
        title: '第三章：遭遇',
        type: 'chapter',
        status: 'draft',
        wordCount: 0,
        targetWordCount: 3200,
        parentId: 'vol1',
        order: 3,
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20'
      },
      {
        id: 'vol2',
        title: '第二卷：成长',
        type: 'volume',
        status: 'draft',
        wordCount: 0,
        targetWordCount: 120000,
        order: 2,
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20'
      }
    ]
    
    setChapters(mockChapters)
    setFilteredChapters(mockChapters)
    
    // 默认展开所有卷
    const volumeIds = mockChapters.filter(c => c.type === 'volume').map(c => c.id)
    setExpandedKeys(volumeIds)
    
    // 设置当前选中章节
    if (currentChapterId) {
      setSelectedKeys([currentChapterId])
    }
  }, [projectId, currentChapterId])

  // 搜索过滤
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredChapters(chapters)
      return
    }

    const filtered = chapters.filter(chapter =>
      chapter.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      chapter.notes?.toLowerCase().includes(searchValue.toLowerCase()) ||
      chapter.tags?.some(tag => tag.toLowerCase().includes(searchValue.toLowerCase()))
    )
    setFilteredChapters(filtered)
  }, [searchValue, chapters])

  // 构建树形数据
  const buildTreeData = (): DataNode[] => {
    const volumeMap = new Map<string, DataNode>()

    // 先处理卷
    filteredChapters
      .filter(c => c.type === 'volume')
      .sort((a, b) => a.order - b.order)
      .forEach(volume => {
        const progress = volume.targetWordCount > 0 
          ? (volume.wordCount / volume.targetWordCount) * 100 
          : 0

        const node: DataNode = {
          key: volume.id,
          title: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <FolderOutlined style={{ color: statusConfig[volume.status].color }} />
                <Text strong>{volume.title}</Text>
                <Badge 
                  status={volume.status === 'completed' ? 'success' : volume.status === 'writing' ? 'processing' : 'default'} 
                  text={statusConfig[volume.status].text}
                />
              </Space>
              <Space>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {volume.wordCount.toLocaleString()}字 ({progress.toFixed(1)}%)
                </Text>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'add', icon: <PlusOutlined />, label: '添加章节' },
                      { key: 'edit', icon: <EditOutlined />, label: '编辑卷' },
                      { key: 'delete', icon: <DeleteOutlined />, label: '删除卷', danger: true }
                    ],
                    onClick: ({ key }) => handleVolumeAction(key, volume)
                  }}
                  trigger={['click']}
                >
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<MoreOutlined />} 
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                </Dropdown>
              </Space>
            </div>
          ),
          children: []
        }
        
        volumeMap.set(volume.id, node)
      })

    // 再处理章节
    filteredChapters
      .filter(c => c.type === 'chapter')
      .sort((a, b) => a.order - b.order)
      .forEach(chapter => {
        const progress = chapter.targetWordCount > 0 
          ? (chapter.wordCount / chapter.targetWordCount) * 100 
          : 0

        const node: DataNode = {
          key: chapter.id,
          title: (
            <div style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  {statusConfig[chapter.status].icon}
                  <Text 
                    style={{ 
                      fontWeight: currentChapterId === chapter.id ? 'bold' : 'normal',
                      color: currentChapterId === chapter.id ? '#1890ff' : 'inherit'
                    }}
                  >
                    {chapter.title}
                  </Text>
                  {/* AI内容约束状态指示器 */}
                  {getConstraintStatusIcon(chapter)}
                  {chapter.tags && chapter.tags.length > 0 && (
                    <Space size={2}>
                      {chapter.tags.map(tag => (
                        <Badge key={tag} count={tag} style={{ backgroundColor: '#f50' }} />
                      ))}
                    </Space>
                  )}
                </Space>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'edit', icon: <EditOutlined />, label: '编辑章节' },
                      { key: 'copy', icon: <CopyOutlined />, label: '复制章节' },
                      { key: 'delete', icon: <DeleteOutlined />, label: '删除章节', danger: true }
                    ],
                    onClick: ({ key }) => handleChapterAction(key, chapter)
                  }}
                  trigger={['click']}
                >
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<MoreOutlined />} 
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>
              
              <div style={{ marginTop: '4px' }}>
                <Progress 
                  percent={Math.min(progress, 100)} 
                  size="small" 
                  status={progress >= 100 ? 'success' : 'active'}
                  strokeColor={statusConfig[chapter.status].color}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {chapter.wordCount} / {chapter.targetWordCount} 字
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {progress.toFixed(1)}%
                  </Text>
                </div>
              </div>
              
              {chapter.notes && (
                <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                  {chapter.notes}
                </Text>
              )}
            </div>
          ),
          isLeaf: true
        }

        // 添加到对应的卷中
        if (chapter.parentId && volumeMap.has(chapter.parentId)) {
          const volume = volumeMap.get(chapter.parentId)!
          if (!volume.children) volume.children = []
          volume.children.push(node)
        }
      })

    return Array.from(volumeMap.values())
  }

  // 处理卷操作
  const handleVolumeAction = (action: string, volume: Chapter) => {
    switch (action) {
      case 'add':
        setShowAddModal(true)
        form.setFieldsValue({ parentId: volume.id, type: 'chapter' })
        break
      case 'edit':
        setEditingChapter(volume)
        setShowEditModal(true)
        form.setFieldsValue(volume)
        break
      case 'delete':
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除卷"${volume.title}"吗？这将同时删除该卷下的所有章节。`,
          icon: <ExclamationCircleOutlined />,
          okText: '删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => handleDelete(volume.id)
        })
        break
    }
  }

  // 处理章节操作
  const handleChapterAction = (action: string, chapter: Chapter) => {
    switch (action) {
      case 'edit':
        setEditingChapter(chapter)
        setShowEditModal(true)
        form.setFieldsValue(chapter)
        break
      case 'copy':
        handleCopyChapter(chapter)
        break
      case 'delete':
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除章节"${chapter.title}"吗？`,
          icon: <ExclamationCircleOutlined />,
          okText: '删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => handleDelete(chapter.id)
        })
        break
    }
  }

  // 复制章节
  const handleCopyChapter = (chapter: Chapter) => {
    const newChapter: Chapter = {
      ...chapter,
      id: `${chapter.id}_copy_${Date.now()}`,
      title: `${chapter.title} (副本)`,
      status: 'draft',
      wordCount: 0,
      order: chapter.order + 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setChapters(prev => [...prev, newChapter])
    message.success('章节已复制')
  }

  // 删除章节/卷
  const handleDelete = (id: string) => {
    setChapters(prev => prev.filter(c => c.id !== id && c.parentId !== id))
    onChapterDelete?.(id)
    message.success('删除成功')
  }

  // 添加新章节/卷
  const handleAdd = async (values: any) => {
    try {
      const newChapter: Chapter = {
        id: `${values.type}_${Date.now()}`,
        ...values,
        wordCount: 0,
        order: chapters.filter(c => c.parentId === values.parentId).length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setChapters(prev => [...prev, newChapter])
      onChapterCreate?.(newChapter)
      setShowAddModal(false)
      form.resetFields()
      message.success('添加成功')
    } catch (error) {
      message.error('添加失败')
    }
  }

  // 编辑章节/卷
  const handleEdit = async (values: any) => {
    if (!editingChapter) return
    
    try {
      const updatedChapter = {
        ...editingChapter,
        ...values,
        updatedAt: new Date().toISOString()
      }
      
      setChapters(prev => prev.map(c => c.id === editingChapter.id ? updatedChapter : c))
      onChapterUpdate?.(editingChapter.id, values)
      setShowEditModal(false)
      setEditingChapter(null)
      form.resetFields()
      message.success('编辑成功')
    } catch (error) {
      message.error('编辑失败')
    }
  }

  // 选择章节
  const handleSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string
    if (key && chapters.find(c => c.id === key && c.type === 'chapter')) {
      setSelectedKeys([key])
      onChapterSelect(key)
    }
  }

  // 计算总体统计
  const getTotalStats = () => {
    const totalChapters = chapters.filter(c => c.type === 'chapter').length
    const completedChapters = chapters.filter(c => c.type === 'chapter' && c.status === 'completed').length
    const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0)
    const targetWords = chapters.reduce((sum, c) => sum + c.targetWordCount, 0)
    
    return {
      totalChapters,
      completedChapters,
      totalWords,
      targetWords,
      progress: targetWords > 0 ? (totalWords / targetWords) * 100 : 0
    }
  }

  const stats = getTotalStats()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部统计卡片 */}
      <Card size="small" style={{ margin: '8px', flexShrink: 0 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <BookOutlined style={{ color: '#1890ff' }} />
              <Text strong>项目进度</Text>
            </Space>
            <Text type="secondary">{stats.progress.toFixed(1)}%</Text>
          </div>
          <Progress 
            percent={Math.min(stats.progress, 100)} 
            size="small" 
            status={stats.progress >= 100 ? 'success' : 'active'}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '12px' }}>
              章节: {stats.completedChapters}/{stats.totalChapters}
            </Text>
            <Text style={{ fontSize: '12px' }}>
              字数: {stats.totalWords.toLocaleString()}
            </Text>
          </div>
        </Space>
      </Card>

      {/* 知识图谱集成 */}
      <div style={{ margin: '8px', flexShrink: 0 }}>
        <KnowledgeGraphIntegration 
          projectId={projectId}
          currentChapterId={currentChapterId}
          isVisible={false}
          onClose={() => {}}
        />
      </div>

      {/* 搜索和操作栏 */}
      <div style={{ padding: '8px', flexShrink: 0 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Search
            placeholder="搜索章节..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            size="small"
          />
          
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small"
              onClick={() => {
                setShowAddModal(true)
                form.resetFields()
              }}
            >
              新建
            </Button>
            
            <Space>
              <Tooltip title="排序">
                <Button icon={<SortAscendingOutlined />} size="small" type="text" />
              </Tooltip>
              <Tooltip title="整理">
                <Button icon={<DragOutlined />} size="small" type="text" />
              </Tooltip>
            </Space>
          </Space>
        </Space>
      </div>

      <Divider style={{ margin: '0' }} />

      {/* 章节树 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <Tree
          treeData={buildTreeData()}
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          onSelect={handleSelect}
          onExpand={(expandedKeys: React.Key[]) => setExpandedKeys(expandedKeys as string[])}
          showLine={{ showLeafIcon: false }}
          blockNode
        />
      </div>

      {/* 添加章节/卷模态框 */}
      <Modal
        title="添加新内容"
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item name="type" label="类型" initialValue="chapter">
            <Button.Group>
              <Button 
                type={form.getFieldValue('type') === 'volume' ? 'primary' : 'default'}
                onClick={() => form.setFieldsValue({ type: 'volume' })}
              >
                <FolderOutlined /> 卷
              </Button>
              <Button 
                type={form.getFieldValue('type') === 'chapter' ? 'primary' : 'default'}
                onClick={() => form.setFieldsValue({ type: 'chapter' })}
              >
                <FileTextOutlined /> 章节
              </Button>
            </Button.Group>
          </Form.Item>
          
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          
          <Form.Item name="targetWordCount" label="目标字数" initialValue={3000}>
            <Input type="number" placeholder="目标字数" />
          </Form.Item>
          
          <Form.Item name="notes" label="备注">
            <Input.TextArea placeholder="章节备注或大纲" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑章节/卷模态框 */}
      <Modal
        title="编辑内容"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false)
          setEditingChapter(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleEdit} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Button.Group>
              {Object.entries(statusConfig).map(([key, config]) => (
                <Button 
                  key={key}
                  type={form.getFieldValue('status') === key ? 'primary' : 'default'}
                  onClick={() => form.setFieldsValue({ status: key })}
                >
                  {config.icon} {config.text}
                </Button>
              ))}
            </Button.Group>
          </Form.Item>
          
          <Form.Item name="targetWordCount" label="目标字数">
            <Input type="number" placeholder="目标字数" />
          </Form.Item>
          
          <Form.Item name="notes" label="备注">
            <Input.TextArea placeholder="章节备注或大纲" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SmartChapterNavigation
