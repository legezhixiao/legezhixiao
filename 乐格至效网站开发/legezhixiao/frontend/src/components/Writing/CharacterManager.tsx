import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Avatar,
  message,
  Popconfirm,
  Drawer,
  Row,
  Col,
  Typography,
  Divider,
  InputNumber,
  Empty,
  Switch
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  TeamOutlined,
  TrophyOutlined,
  BookOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useAppStore } from '../../store/appStore'
import type { Character, CharacterType } from '../../types'

const { TextArea } = Input
const { Option } = Select
const { Title, Text, Paragraph } = Typography

const characterTypeMap: Record<CharacterType, { label: string; color: string; icon: React.ReactNode }> = {
  protagonist: { label: '主角', color: '#f50', icon: <TrophyOutlined /> },
  antagonist: { label: '反派', color: '#722ed1', icon: <EyeOutlined /> },
  supporting: { label: '配角', color: '#1890ff', icon: <TeamOutlined /> },
  minor: { label: '次要角色', color: '#52c41a', icon: <UserOutlined /> },
  background: { label: '背景角色', color: '#8c8c8c', icon: <BookOutlined /> }
}

const importanceMap: Record<number, { label: string; color: string }> = {
  1: { label: '核心', color: '#f50' },
  2: { label: '重要', color: '#fa8c16' },
  3: { label: '一般', color: '#1890ff' },
  4: { label: '次要', color: '#52c41a' },
  5: { label: '背景', color: '#8c8c8c' }
}

interface CharacterManagerProps {
  projectId: string
}

const CharacterManager: React.FC<CharacterManagerProps> = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState<CharacterType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card')
  const [form] = Form.useForm()
  const { currentProject, updateProject } = useAppStore()

  const characters = currentProject?.characters || []

  // 筛选角色
  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         character.alias?.toLowerCase().includes(searchText.toLowerCase())
    const matchesType = selectedType === 'all' || character.type === selectedType
    return matchesSearch && matchesType
  })

  // 按重要性排序
  const sortedCharacters = filteredCharacters.sort((a, b) => (a.importance || 5) - (b.importance || 5))

  const handleAdd = () => {
    setEditingCharacter(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (character: Character) => {
    setEditingCharacter(character)
    form.setFieldsValue(character)
    setIsModalVisible(true)
  }

  const handleView = (character: Character) => {
    setSelectedCharacter(character)
    setIsDetailVisible(true)
  }

  const handleDelete = async (characterId: string) => {
    if (!currentProject) return

    const updatedCharacters = characters.filter(c => c.id !== characterId)
    const updatedProject = {
      ...currentProject,
      characters: updatedCharacters
    }

    await updateProject(currentProject.id, updatedProject)
    message.success('角色删除成功')
  }

  const handleSubmit = async (values: any) => {
    if (!currentProject) return

    try {
      const characterData: Character = {
        id: editingCharacter?.id || Date.now().toString(),
        projectId: currentProject.id,
        name: values.name,
        alias: values.alias,
        type: values.type,
        importance: values.importance || 3,
        age: values.age,
        gender: values.gender,
        occupation: values.occupation,
        appearance: values.appearance,
        personality: values.personality,
        background: values.background,
        relationships: values.relationships,
        createdAt: editingCharacter?.createdAt || new Date(),
        updatedAt: new Date()
      }

      let updatedCharacters
      if (editingCharacter) {
        updatedCharacters = characters.map(c => 
          c.id === editingCharacter.id ? characterData : c
        )
      } else {
        updatedCharacters = [...characters, characterData]
      }

      const updatedProject = {
        ...currentProject,
        characters: updatedCharacters
      }

      await updateProject(currentProject.id, updatedProject)
      message.success(`角色${editingCharacter ? '更新' : '创建'}成功`)
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  // 统计数据
  const stats = {
    total: characters.length,
    protagonist: characters.filter(c => c.type === 'protagonist').length,
    antagonist: characters.filter(c => c.type === 'antagonist').length,
    supporting: characters.filter(c => c.type === 'supporting').length,
    minor: characters.filter(c => c.type === 'minor').length,
    background: characters.filter(c => c.type === 'background').length
  }

  // 渲染角色卡片
  const renderCharacterCard = (character: Character) => (
    <Card
      key={character.id}
      hoverable
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 16 }}
      actions={[
        <Button
          key="view"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleView(character)}
        >
          查看
        </Button>,
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEdit(character)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个角色吗？"
          onConfirm={() => handleDelete(character.id)}
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
          <Avatar 
            size={48} 
            icon={characterTypeMap[character.type]?.icon} 
            style={{ backgroundColor: characterTypeMap[character.type]?.color }}
          />
        }
        title={
          <Space>
            <Text strong>{character.name}</Text>
            {character.alias && <Text type="secondary">({character.alias})</Text>}
          </Space>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space wrap>
              <Tag color={characterTypeMap[character.type]?.color}>
                {characterTypeMap[character.type]?.label}
              </Tag>
              <Tag color={importanceMap[character.importance || 5]?.color}>
                {importanceMap[character.importance || 5]?.label}
              </Tag>
            </Space>
            {character.age && <Text type="secondary">年龄：{character.age}岁</Text>}
            {character.occupation && <Text type="secondary">职业：{character.occupation}</Text>}
            {character.personality && (
              <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                {character.personality}
              </Paragraph>
            )}
          </Space>
        }
      />
    </Card>
  )

  // 表格列定义
  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: (_: any, record: Character) => (
        <Avatar 
          icon={characterTypeMap[record.type]?.icon} 
          style={{ backgroundColor: characterTypeMap[record.type]?.color }}
        />
      )
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Character) => (
        <Space direction="vertical" size="small">
          <Text strong>{name}</Text>
          {record.alias && <Text type="secondary" style={{ fontSize: '12px' }}>别名：{record.alias}</Text>}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: CharacterType) => (
        <Tag color={characterTypeMap[type]?.color} icon={characterTypeMap[type]?.icon}>
          {characterTypeMap[type]?.label}
        </Tag>
      )
    },
    {
      title: '重要性',
      dataIndex: 'importance',
      key: 'importance',
      render: (importance: number) => (
        <Tag color={importanceMap[importance || 5]?.color}>
          {importanceMap[importance || 5]?.label}
        </Tag>
      )
    },
    {
      title: '基本信息',
      key: 'basic',
      render: (_: any, record: Character) => (
        <Space direction="vertical" size="small">
          {record.age && <Text>年龄：{record.age}岁</Text>}
          {record.gender && <Text>性别：{record.gender}</Text>}
          {record.occupation && <Text>职业：{record.occupation}</Text>}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: Character) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
              <div>总角色数</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f50' }}>{stats.protagonist}</div>
              <div>主角</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>{stats.antagonist}</div>
              <div>反派</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>{stats.supporting}</div>
              <div>配角</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>{stats.minor}</div>
              <div>次要</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#8c8c8c' }}>{stats.background}</div>
              <div>背景</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card
        title="角色管理"
        extra={
          <Space>
            <Input
              placeholder="搜索角色名称或别名"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 120 }}
              placeholder="筛选类型"
            >
              <Option value="all">全部类型</Option>
              {Object.entries(characterTypeMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.label}
                </Option>
              ))}
            </Select>
            <Switch
              checkedChildren="卡片"
              unCheckedChildren="表格"
              checked={viewMode === 'card'}
              onChange={(checked) => setViewMode(checked ? 'card' : 'table')}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加角色
            </Button>
          </Space>
        }
      >
        {sortedCharacters.length === 0 ? (
          <Empty
            description="暂无角色数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              创建第一个角色
            </Button>
          </Empty>
        ) : viewMode === 'card' ? (
          <Row gutter={[16, 16]}>
            {sortedCharacters.map(character => (
              <Col xs={24} sm={12} md={8} lg={6} key={character.id}>
                {renderCharacterCard(character)}
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={sortedCharacters}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 创建/编辑角色模态框 */}
      <Modal
        title={editingCharacter ? '编辑角色' : '创建角色'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色姓名"
                name="name"
                rules={[{ required: true, message: '请输入角色姓名' }]}
              >
                <Input placeholder="请输入角色姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="别名/昵称"
                name="alias"
              >
                <Input placeholder="请输入别名或昵称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="角色类型"
                name="type"
                rules={[{ required: true, message: '请选择角色类型' }]}
              >
                <Select placeholder="请选择角色类型">
                  {Object.entries(characterTypeMap).map(([key, value]) => (
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
            <Col span={8}>
              <Form.Item
                label="重要程度"
                name="importance"
              >
                <Select placeholder="请选择重要程度" defaultValue={3}>
                  {Object.entries(importanceMap).map(([key, value]) => (
                    <Option key={key} value={Number(key)}>
                      {value.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="年龄"
                name="age"
              >
                <InputNumber min={0} max={999} placeholder="年龄" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="性别"
                name="gender"
              >
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="职业"
                name="occupation"
              >
                <Input placeholder="请输入职业" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="外貌描述"
            name="appearance"
          >
            <TextArea rows={3} placeholder="描述角色的外貌特征..." />
          </Form.Item>

          <Form.Item
            label="性格特点"
            name="personality"
          >
            <TextArea rows={3} placeholder="描述角色的性格特点..." />
          </Form.Item>

          <Form.Item
            label="背景故事"
            name="background"
          >
            <TextArea rows={4} placeholder="描述角色的背景故事..." />
          </Form.Item>

          <Form.Item
            label="人物关系"
            name="relationships"
          >
            <TextArea rows={3} placeholder="描述与其他角色的关系..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色详情抽屉 */}
      <Drawer
        title="角色详情"
        placement="right"
        size="large"
        open={isDetailVisible}
        onClose={() => setIsDetailVisible(false)}
      >
        {selectedCharacter && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                icon={characterTypeMap[selectedCharacter.type]?.icon}
                style={{ backgroundColor: characterTypeMap[selectedCharacter.type]?.color }}
              />
              <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
                {selectedCharacter.name}
              </Title>
              {selectedCharacter.alias && (
                <Text type="secondary">别名：{selectedCharacter.alias}</Text>
              )}
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Tag color={characterTypeMap[selectedCharacter.type]?.color} icon={characterTypeMap[selectedCharacter.type]?.icon}>
                    {characterTypeMap[selectedCharacter.type]?.label}
                  </Tag>
                  <Tag color={importanceMap[selectedCharacter.importance || 5]?.color}>
                    {importanceMap[selectedCharacter.importance || 5]?.label}
                  </Tag>
                </Space>
              </div>
            </div>

            <Divider />

            <Row gutter={[16, 16]}>
              {selectedCharacter.age && (
                <Col span={12}>
                  <Text strong>年龄：</Text>
                  <Text>{selectedCharacter.age}岁</Text>
                </Col>
              )}
              {selectedCharacter.gender && (
                <Col span={12}>
                  <Text strong>性别：</Text>
                  <Text>{selectedCharacter.gender}</Text>
                </Col>
              )}
              {selectedCharacter.occupation && (
                <Col span={24}>
                  <Text strong>职业：</Text>
                  <Text>{selectedCharacter.occupation}</Text>
                </Col>
              )}
            </Row>

            {selectedCharacter.appearance && (
              <>
                <Divider />
                <Title level={5}>外貌描述</Title>
                <Paragraph>{selectedCharacter.appearance}</Paragraph>
              </>
            )}

            {selectedCharacter.personality && (
              <>
                <Divider />
                <Title level={5}>性格特点</Title>
                <Paragraph>{selectedCharacter.personality}</Paragraph>
              </>
            )}

            {selectedCharacter.background && (
              <>
                <Divider />
                <Title level={5}>背景故事</Title>
                <Paragraph>{selectedCharacter.background}</Paragraph>
              </>
            )}

            {selectedCharacter.relationships && (
              <>
                <Divider />
                <Title level={5}>人物关系</Title>
                <Paragraph>{selectedCharacter.relationships}</Paragraph>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default CharacterManager
