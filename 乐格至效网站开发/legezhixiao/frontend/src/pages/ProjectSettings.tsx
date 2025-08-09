import React from 'react'
import { Card, Form, Input, Select, Switch, Slider, Button, Space, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { TextArea } = Input
const { Option } = Select

const ProjectSettings: React.FC = () => {
  const { currentProject, preferences } = useAppStore()
  const [form] = Form.useForm()

  const handleSave = async (values: any) => {
    try {
      // TODO: 保存小说设置
      console.log('保存设置:', values)
      message.success('设置已保存')
    } catch (error) {
      message.error('保存失败')
    }
  }

  if (!currentProject) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>请先选择一个小说</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px',
      background: '#fafafa',
      minHeight: '100vh'
    }}>
      <div className="tech-card" style={{ 
        padding: '24px',
        marginBottom: '24px',
        position: 'relative'
      }}>
        {/* 页面标题装饰 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '60px',
          height: '4px',
          background: 'linear-gradient(90deg, #1890ff, #13c2c2)',
          borderRadius: '2px'
        }} />
        
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          小说设置
          <span style={{
            background: 'linear-gradient(45deg, #1890ff, #13c2c2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginLeft: '8px'
          }}>
            {currentProject.title}
          </span>
        </h1>
        
        <p style={{ color: '#666', margin: 0 }}>
          配置您的小说参数和个人偏好设置
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          title: currentProject.title,
          description: currentProject.description,
          genre: currentProject.genre,
          targetWords: currentProject.targetWords,
          autoSave: preferences.autoSave,
          autoSaveInterval: preferences.autoSaveInterval,
          enableAISuggestions: preferences.enableAISuggestions,
          constraintLevel: preferences.constraintLevel,
          editorTheme: preferences.editorTheme,
          fontSize: preferences.fontSize,
          wordWrap: preferences.wordWrap,
        }}
        onFinish={handleSave}
      >
        <Card title="小说信息" style={{ marginBottom: '16px' }}>
          <Form.Item
            label="小说名称"
            name="title"
            rules={[{ required: true, message: '请输入小说名称' }]}
          >
            <Input placeholder="请输入小说名称" />
          </Form.Item>

          <Form.Item
            label="小说描述"
            name="description"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入小说描述" 
              showCount 
              maxLength={500} 
            />
          </Form.Item>

          <Form.Item
            label="作品类型"
            name="genre"
          >
            <Select mode="multiple" placeholder="选择作品类型（可多选）">
              <Option value="fantasy">玄幻</Option>
              <Option value="scifi">科幻</Option>
              <Option value="romance">言情</Option>
              <Option value="historical">历史</Option>
              <Option value="martial">武侠</Option>
              <Option value="mystery">悬疑</Option>
              <Option value="urban">都市</Option>
              <Option value="game">游戏</Option>
              <Option value="thriller">惊悚</Option>
              <Option value="comedy">喜剧</Option>
              <Option value="drama">剧情</Option>
              <Option value="adventure">冒险</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="目标字数"
            name="targetWords"
          >
            <Input type="number" placeholder="请输入目标字数" addonAfter="字" />
          </Form.Item>
        </Card>

        <Card title="编辑器设置" style={{ marginBottom: '16px' }}>
          <Form.Item
            label="编辑器主题"
            name="editorTheme"
          >
            <Select>
              <Option value="vs-light">浅色主题</Option>
              <Option value="vs-dark">深色主题</Option>
              <Option value="hc-black">高对比度</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="字体大小"
            name="fontSize"
          >
            <Slider
              min={12}
              max={20}
              marks={{
                12: '12px',
                14: '14px',
                16: '16px',
                18: '18px',
                20: '20px',
              }}
            />
          </Form.Item>

          <Form.Item
            label="自动换行"
            name="wordWrap"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Card title="AI助手设置" style={{ marginBottom: '16px' }}>
          <Form.Item
            label="启用AI建议"
            name="enableAISuggestions"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="约束级别"
            name="constraintLevel"
          >
            <Select>
              <Option value="relaxed">宽松</Option>
              <Option value="moderate">适中</Option>
              <Option value="strict">严格</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="自动保存设置" style={{ marginBottom: '16px' }}>
          <Form.Item
            label="启用自动保存"
            name="autoSave"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="自动保存间隔"
            name="autoSaveInterval"
          >
            <Slider
              min={10}
              max={300}
              step={10}
              marks={{
                10: '10s',
                30: '30s',
                60: '1m',
                120: '2m',
                300: '5m',
              }}
              disabled={!form.getFieldValue('autoSave')}
            />
          </Form.Item>
        </Card>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              保存设置
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ProjectSettings
