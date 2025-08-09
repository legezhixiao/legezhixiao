import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Drawer,
  Row,
  Col,
  Typography,
  Divider,
  Tabs,
  Timeline,
  Empty,
  DatePicker
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  PictureOutlined,
  FileTextOutlined,
  BookOutlined,
  GlobalOutlined,
  HomeOutlined,
  CalendarOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useAppStore } from '../../store/appStore'
import type { WorldSetting, TimelineEvent } from '../../types'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select
const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

const settingTypeMap = {
  location: { label: '地理位置', color: '#52c41a', icon: <EnvironmentOutlined /> },
  culture: { label: '文化背景', color: '#1890ff', icon: <GlobalOutlined /> },
  politics: { label: '政治制度', color: '#fa541c', icon: <BookOutlined /> },
  technology: { label: '科技水平', color: '#722ed1', icon: <PictureOutlined /> },
  magic: { label: '魔法体系', color: '#eb2f96', icon: <FileTextOutlined /> },
  society: { label: '社会结构', color: '#13c2c2', icon: <HomeOutlined /> },
  economy: { label: '经济体系', color: '#fa8c16', icon: <CalendarOutlined /> },
  other: { label: '其他设定', color: '#8c8c8c', icon: <BookOutlined /> }
}

interface WorldBuildingManagerProps {
  projectId: string
}

const WorldBuildingManager: React.FC<WorldBuildingManagerProps> = () => {
  const [activeTab, setActiveTab] = useState('settings')
  const [isSettingModalVisible, setIsSettingModalVisible] = useState(false)
  const [isTimelineModalVisible, setIsTimelineModalVisible] = useState(false)
  const [isSettingDetailVisible, setIsSettingDetailVisible] = useState(false)
  const [editingSetting, setEditingSetting] = useState<WorldSetting | null>(null)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [selectedSetting, setSelectedSetting] = useState<WorldSetting | null>(null)
  const [settingForm] = Form.useForm()
  const [timelineForm] = Form.useForm()
  const { currentProject, updateProject } = useAppStore()

  const worldBuilding = currentProject?.worldBuilding || {
    id: currentProject?.id + '_worldbuilding' || 'temp_worldbuilding',
    projectId: currentProject?.id || 'temp',
    settings: [],
    timeline: [],
    maps: []
  }

  // 按类型分组设定
  const groupedSettings = worldBuilding.settings.reduce((acc, setting) => {
    const type = setting.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(setting)
    return acc
  }, {} as Record<string, WorldSetting[]>)

  // 按时间排序的时间线事件
  const sortedEvents = [...worldBuilding.timeline].sort((a, b) => {
    if (a.date && b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    return a.order - b.order
  })

  const handleAddSetting = () => {
    setEditingSetting(null)
    settingForm.resetFields()
    setIsSettingModalVisible(true)
  }

  const handleEditSetting = (setting: WorldSetting) => {
    setEditingSetting(setting)
    settingForm.setFieldsValue(setting)
    setIsSettingModalVisible(true)
  }

  const handleViewSetting = (setting: WorldSetting) => {
    setSelectedSetting(setting)
    setIsSettingDetailVisible(true)
  }

  const handleDeleteSetting = async (settingId: string) => {
    if (!currentProject) return

    const updatedSettings = worldBuilding.settings.filter(s => s.id !== settingId)
    const updatedWorldBuilding = {
      ...worldBuilding,
      settings: updatedSettings
    }
    const updatedProject = {
      ...currentProject,
      worldBuilding: updatedWorldBuilding
    }

    await updateProject(currentProject.id, updatedProject)
    message.success('设定删除成功')
  }

  const handleSettingSubmit = async (values: any) => {
    if (!currentProject) return

    try {
      const settingData: WorldSetting = {
        id: editingSetting?.id || Date.now().toString(),
        name: values.name,
        type: values.type,
        description: values.description,
        details: values.details,
        importance: values.importance || 3,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        images: editingSetting?.images || [],
        relatedCharacters: values.relatedCharacters ? values.relatedCharacters.split(',').map((char: string) => char.trim()) : [],
        createdAt: editingSetting?.createdAt || new Date(),
        updatedAt: new Date()
      }

      let updatedSettings
      if (editingSetting) {
        updatedSettings = worldBuilding.settings.map(s => 
          s.id === editingSetting.id ? settingData : s
        )
      } else {
        updatedSettings = [...worldBuilding.settings, settingData]
      }

      const updatedWorldBuilding = {
        ...worldBuilding,
        settings: updatedSettings
      }
      const updatedProject = {
        ...currentProject,
        worldBuilding: updatedWorldBuilding
      }

      await updateProject(currentProject.id, updatedProject)
      message.success(`设定${editingSetting ? '更新' : '创建'}成功`)
      setIsSettingModalVisible(false)
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleAddTimelineEvent = () => {
    setEditingEvent(null)
    timelineForm.resetFields()
    setIsTimelineModalVisible(true)
  }

  const handleEditTimelineEvent = (event: TimelineEvent) => {
    setEditingEvent(event)
    timelineForm.setFieldsValue({
      ...event,
      date: event.date ? dayjs(event.date) : undefined
    })
    setIsTimelineModalVisible(true)
  }

  const handleDeleteTimelineEvent = async (eventId: string) => {
    if (!currentProject) return

    const updatedTimeline = worldBuilding.timeline.filter(e => e.id !== eventId)
    const updatedWorldBuilding = {
      ...worldBuilding,
      timeline: updatedTimeline
    }
    const updatedProject = {
      ...currentProject,
      worldBuilding: updatedWorldBuilding
    }

    await updateProject(currentProject.id, updatedProject)
    message.success('事件删除成功')
  }

  const handleTimelineSubmit = async (values: any) => {
    if (!currentProject) return

    try {
      const eventData: TimelineEvent = {
        id: editingEvent?.id || Date.now().toString(),
        title: values.title,
        description: values.description,
        date: values.date ? values.date.toDate() : null,
        order: values.order || 0,
        importance: values.importance || 3,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        relatedCharacters: values.relatedCharacters ? values.relatedCharacters.split(',').map((char: string) => char.trim()) : [],
        createdAt: editingEvent?.createdAt || new Date(),
        updatedAt: new Date()
      }

      let updatedTimeline
      if (editingEvent) {
        updatedTimeline = worldBuilding.timeline.map(e => 
          e.id === editingEvent.id ? eventData : e
        )
      } else {
        updatedTimeline = [...worldBuilding.timeline, eventData]
      }

      const updatedWorldBuilding = {
        ...worldBuilding,
        timeline: updatedTimeline
      }
      const updatedProject = {
        ...currentProject,
        worldBuilding: updatedWorldBuilding
      }

      await updateProject(currentProject.id, updatedProject)
      message.success(`事件${editingEvent ? '更新' : '创建'}成功`)
      setIsTimelineModalVisible(false)
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  // 渲染设定卡片
  const renderSettingCard = (setting: WorldSetting) => (
    <Card
      key={setting.id}
      hoverable
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 16 }}
      actions={[
        <Button
          key="view"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewSetting(setting)}
        >
          查看
        </Button>,
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditSetting(setting)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个设定吗？"
          onConfirm={() => handleDeleteSetting(setting.id)}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Popconfirm>
      ]}
    >
      <Card.Meta
        avatar={
          <div style={{ 
            width: 48, 
            height: 48, 
            backgroundColor: settingTypeMap[setting.type || 'other']?.color,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            {settingTypeMap[setting.type || 'other']?.icon}
          </div>
        }
        title={
          <Space>
            <Text strong>{setting.name}</Text>
            <Tag color={settingTypeMap[setting.type || 'other']?.color}>
              {settingTypeMap[setting.type || 'other']?.label}
            </Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {setting.description && (
              <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                {setting.description}
              </Paragraph>
            )}
            {setting.tags && setting.tags.length > 0 && (
              <Space wrap>
                {setting.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            )}
          </Space>
        }
      />
    </Card>
  )

  const settingsTabContent = (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSetting}>
          添加设定
        </Button>
      </div>
      
      {worldBuilding.settings.length === 0 ? (
        <Empty
          description="暂无世界设定"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSetting}>
            创建第一个设定
          </Button>
        </Empty>
      ) : (
        <div>
          {Object.entries(groupedSettings).map(([type, settings]) => (
            <div key={type} style={{ marginBottom: 24 }}>
              <Title level={4}>
                <Space>
                  {settingTypeMap[type as keyof typeof settingTypeMap]?.icon}
                  {settingTypeMap[type as keyof typeof settingTypeMap]?.label}
                  <Tag color={settingTypeMap[type as keyof typeof settingTypeMap]?.color}>{settings.length}</Tag>
                </Space>
              </Title>
              <Row gutter={[16, 16]}>
                {settings.map(setting => (
                  <Col xs={24} sm={12} md={8} lg={6} key={setting.id}>
                    {renderSettingCard(setting)}
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const timelineTabContent = (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTimelineEvent}>
          添加事件
        </Button>
      </div>
      
      {worldBuilding.timeline.length === 0 ? (
        <Empty
          description="暂无时间线事件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTimelineEvent}>
            创建第一个事件
          </Button>
        </Empty>
      ) : (
        <Timeline mode="left">
          {sortedEvents.map(event => (
            <Timeline.Item
              key={event.id}
              color={
                event.importance === 1 ? 'red' :
                event.importance === 2 ? 'orange' :
                event.importance === 3 ? 'blue' : 'green'
              }
              label={event.date ? dayjs(event.date).format('YYYY-MM-DD') : `序号 ${event.order}`}
            >
              <Card size="small" style={{ marginBottom: 8 }}>
                <Card.Meta
                  title={
                    <Space>
                      <Text strong>{event.title}</Text>
                      <Tag color={
                        event.importance === 1 ? 'red' :
                        event.importance === 2 ? 'orange' :
                        event.importance === 3 ? 'blue' : 'green'
                      }>
                        {
                          event.importance === 1 ? '关键' :
                          event.importance === 2 ? '重要' :
                          event.importance === 3 ? '一般' : '次要'
                        }
                      </Tag>
                    </Space>
                  }
                  description={event.description}
                />
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditTimelineEvent(event)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个事件吗？"
                      onConfirm={() => handleDeleteTimelineEvent(event.id)}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
    </div>
  )

  return (
    <div>
      <Card title="世界观构建">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={
            <Space>
              <GlobalOutlined />
              世界设定
            </Space>
          } key="settings">
            {settingsTabContent}
          </TabPane>
          
          <TabPane tab={
            <Space>
              <HistoryOutlined />
              时间线
            </Space>
          } key="timeline">
            {timelineTabContent}
          </TabPane>
          
          <TabPane tab={
            <Space>
              <EnvironmentOutlined />
              地图资料
            </Space>
          } key="maps">
            <Empty
              description="地图功能开发中..."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建/编辑设定模态框 */}
      <Modal
        title={editingSetting ? '编辑设定' : '创建设定'}
        open={isSettingModalVisible}
        onCancel={() => setIsSettingModalVisible(false)}
        onOk={() => settingForm.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={settingForm}
          layout="vertical"
          onFinish={handleSettingSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="设定名称"
                name="name"
                rules={[{ required: true, message: '请输入设定名称' }]}
              >
                <Input placeholder="请输入设定名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="设定类型"
                name="type"
                rules={[{ required: true, message: '请选择设定类型' }]}
              >
                <Select placeholder="请选择设定类型">
                  {Object.entries(settingTypeMap).map(([key, value]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {value.icon}
                        {value.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="重要程度"
                name="importance"
              >
                <Select placeholder="请选择重要程度" defaultValue={3}>
                  <Option value={1}>关键</Option>
                  <Option value={2}>重要</Option>
                  <Option value={3}>一般</Option>
                  <Option value={4}>次要</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="简要描述"
            name="description"
          >
            <TextArea rows={3} placeholder="简要描述这个设定..." />
          </Form.Item>

          <Form.Item
            label="详细内容"
            name="details"
          >
            <TextArea rows={6} placeholder="详细描述设定的各个方面..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="标签"
                name="tags"
                tooltip="多个标签请用逗号分隔"
              >
                <Input placeholder="例如：魔法,古代,神秘" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="相关角色"
                name="relatedCharacters"
                tooltip="多个角色请用逗号分隔"
              >
                <Input placeholder="例如：主角,反派,导师" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 创建/编辑时间线事件模态框 */}
      <Modal
        title={editingEvent ? '编辑事件' : '创建事件'}
        open={isTimelineModalVisible}
        onCancel={() => setIsTimelineModalVisible(false)}
        onOk={() => timelineForm.submit()}
        width={700}
        destroyOnClose
      >
        <Form
          form={timelineForm}
          layout="vertical"
          onFinish={handleTimelineSubmit}
        >
          <Form.Item
            label="事件标题"
            name="title"
            rules={[{ required: true, message: '请输入事件标题' }]}
          >
            <Input placeholder="请输入事件标题" />
          </Form.Item>

          <Form.Item
            label="事件描述"
            name="description"
          >
            <TextArea rows={4} placeholder="描述事件的详细情况..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="事件日期"
                name="date"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="排序序号"
                name="order"
                tooltip="用于没有具体日期的事件排序"
              >
                <Input type="number" placeholder="序号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="重要程度"
                name="importance"
              >
                <Select defaultValue={3} placeholder="选择重要程度">
                  <Option value={1}>关键</Option>
                  <Option value={2}>重要</Option>
                  <Option value={3}>一般</Option>
                  <Option value={4}>次要</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="标签"
                name="tags"
                tooltip="多个标签请用逗号分隔"
              >
                <Input placeholder="例如：战争,转折,重要" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="相关角色"
                name="relatedCharacters"
                tooltip="多个角色请用逗号分隔"
              >
                <Input placeholder="例如：主角,反派,导师" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 设定详情抽屉 */}
      <Drawer
        title="设定详情"
        placement="right"
        size="large"
        open={isSettingDetailVisible}
        onClose={() => setIsSettingDetailVisible(false)}
      >
        {selectedSetting && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                backgroundColor: settingTypeMap[selectedSetting.type || 'other']?.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                margin: '0 auto 16px'
              }}>
                {settingTypeMap[selectedSetting.type || 'other']?.icon}
              </div>
              <Title level={3} style={{ marginBottom: 8 }}>
                {selectedSetting.name}
              </Title>
              <Tag color={settingTypeMap[selectedSetting.type || 'other']?.color}>
                {settingTypeMap[selectedSetting.type || 'other']?.label}
              </Tag>
            </div>

            {selectedSetting.description && (
              <>
                <Title level={5}>简要描述</Title>
                <Paragraph>{selectedSetting.description}</Paragraph>
                <Divider />
              </>
            )}

            {selectedSetting.details && (
              <>
                <Title level={5}>详细内容</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{selectedSetting.details}</Paragraph>
                <Divider />
              </>
            )}

            {selectedSetting.tags && selectedSetting.tags.length > 0 && (
              <>
                <Title level={5}>标签</Title>
                <Space wrap>
                  {selectedSetting.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
                <Divider />
              </>
            )}

            {selectedSetting.relatedCharacters && selectedSetting.relatedCharacters.length > 0 && (
              <>
                <Title level={5}>相关角色</Title>
                <Space wrap>
                  {selectedSetting.relatedCharacters.map(char => (
                    <Tag key={char} color="blue">{char}</Tag>
                  ))}
                </Space>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default WorldBuildingManager
