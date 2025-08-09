import { SettingOutlined } from '@ant-design/icons'
import { Button, Card, Form, Modal, Radio, Space, message, Typography } from 'antd'
import React, { useState, useEffect } from 'react'
import AIServiceManager, { AIServiceConfig } from '../../services/aiService'

const { Text } = Typography

interface AIConfigModalProps {
    visible: boolean
    onClose: () => void
}

// SiliconFlow 提供的模型列表
const SILICONFLOW_MODELS = [
    { 
        label: 'DeepSeek-V3 (推荐)', 
        value: 'deepseek-ai/DeepSeek-V3',
        description: '高性能版本，综合能力强，中文理解优秀'
    },
    { 
        label: 'DeepSeek-V2.5', 
        value: 'deepseek-ai/DeepSeek-V2.5',
        description: '稳定版本，性能可靠'
    },
    { 
        label: 'Qwen2.5-72B', 
        value: 'Qwen/Qwen2.5-72B-Instruct',
        description: '阿里通义千问，中文支持优秀'
    },
    { 
        label: 'Qwen2.5-32B', 
        value: 'Qwen/Qwen2.5-32B-Instruct',
        description: '中等规模模型，响应速度快'
    },
    { 
        label: 'Llama3.1-70B', 
        value: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        description: 'Meta开源模型，多语言支持'
    }
]

const AIConfigModal: React.FC<AIConfigModalProps> = ({ visible, onClose }) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [testingConnection, setTestingConnection] = useState(false)

    // 加载保存的配置
    useEffect(() => {
        if (visible) {
            // 加载保存的配置
            const savedConfig = localStorage.getItem('ai-service-config')
            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig)
                    // 只设置模型选择，其他配置由系统管理
                    form.setFieldsValue({
                        model: config.model || 'deepseek-ai/DeepSeek-V3-Pro'
                    })
                } catch (error) {
                    console.error('加载AI配置失败:', error)
                }
            } else {
                // 设置默认模型
                form.setFieldsValue({
                    model: 'deepseek-ai/DeepSeek-V3-Pro'
                })
            }
        }
    }, [visible, form])

    // 保存配置
    const handleSave = async (values: any) => {
        setLoading(true)
        try {
            // 直接使用硬编码的API密钥
            const config: AIServiceConfig = {
                provider: 'siliconflow',
                apiKey: 'sk-mjithqmjwccqgffouexthbavtnvftwkqjludpcxhrmeztcib',
                customApiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
                model: values.model
            }

            // 保存到localStorage（不包含敏感信息）
            localStorage.setItem('ai-service-config', JSON.stringify({
                provider: config.provider,
                model: config.model,
                customApiUrl: config.customApiUrl
            }))
            
            // 更新AI服务配置
            AIServiceManager.updateConfig(config)
            
            message.success('AI模型配置保存成功')
            onClose()
        } catch (error) {
            console.error('保存配置失败:', error)
            message.error('保存配置失败')
        } finally {
            setLoading(false)
        }
    }

    // 测试连接
    const handleTestConnection = async () => {
        setTestingConnection(true)
        try {
            const values = form.getFieldsValue()
            console.log('🧪 开始测试连接...')
            console.log('- 选择的模型:', values.model)
            
            const config: AIServiceConfig = {
                provider: 'siliconflow',
                apiKey: 'sk-mjithqmjwccqgffouexthbavtnvftwkqjludpcxhrmeztcib',
                customApiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
                model: values.model
            }
            
            console.log('🔧 配置信息:')
            console.log('- 提供商:', config.provider)
            console.log('- API URL:', config.customApiUrl)
            console.log('- 模型:', config.model)
            console.log('- 密钥状态:', config.apiKey ? '已设置' : '未设置')

            const aiService = AIServiceManager.getInstance(config)
            const response = await aiService.generateResponse({
                message: '你好，请回复"连接测试成功"',
                type: 'general'
            })

            console.log('📝 AI响应:', response)

            if (response.text && response.text !== '抱歉，AI服务暂时不可用。请检查网络连接或API配置，稍后再试。') {
                message.success(`AI服务连接成功！当前模型：${values.model}`)
            } else {
                message.error('AI服务连接失败，请稍后重试')
            }
        } catch (error) {
            console.error('🚨 测试连接失败:', error)
            message.error('连接测试失败，请检查网络连接')
        } finally {
            setTestingConnection(false)
        }
    }

    return (
        <Modal
            title={
                <Space>
                    <SettingOutlined />
                    AI模型设置
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
            >
                <Card title="选择AI模型" size="small" style={{ marginBottom: 16 }}>
                    <Form.Item
                        name="model"
                        label="AI模型"
                        rules={[{ required: true, message: '请选择AI模型' }]}
                    >
                        <Radio.Group style={{ width: '100%' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {SILICONFLOW_MODELS.map(model => (
                                    <Radio key={model.value} value={model.value} style={{ 
                                        display: 'flex', 
                                        alignItems: 'flex-start', 
                                        padding: '8px', 
                                        border: '1px solid #d9d9d9', 
                                        borderRadius: '6px',
                                        margin: 0,
                                        height: 'auto'
                                    }}>
                                        <div style={{ marginLeft: '8px', flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                                                {model.label}
                                            </div>
                                            <Text type="secondary" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                                {model.description}
                                            </Text>
                                        </div>
                                    </Radio>
                                ))}
                            </div>
                        </Radio.Group>
                    </Form.Item>
                </Card>

                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose}>
                        取消
                    </Button>
                    <Button
                        onClick={handleTestConnection}
                        loading={testingConnection}
                    >
                        测试连接
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                    >
                        保存设置
                    </Button>
                </Space>
            </Form>
        </Modal>
    )
}

export default AIConfigModal
