import React from 'react'
import { Button, Form, Input, Checkbox, Alert, Typography, Divider, Space } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import type { RegisterData } from '../../types'

const { Title, Text, Link } = Typography

interface RegisterFormProps {
    onSwitchToLogin: () => void
    onSuccess?: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({
    onSwitchToLogin,
    onSuccess
}) => {
    const { register, isLoading, error, clearError } = useAuth()
    const [form] = Form.useForm()

    const handleSubmit = async (values: RegisterData) => {
        try {
            clearError()
            await register(values)
            onSuccess?.()
        } catch (err) {
            console.error('Register failed:', err)
        }
    }

    return (
        <div className="auth-form">
            <div className="auth-header">
                <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
                    创建账户
                </Title>
                <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                    开启您的创作之旅
                </Text>
            </div>

            {error && (
                <Alert
                    message={error}
                    type="error"
                    closable
                    onClose={clearError}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form
                form={form}
                name="register"
                onFinish={handleSubmit}
                layout="vertical"
                requiredMark={false}
                size="large"
                scrollToFirstError
            >
                <Form.Item
                    name="displayName"
                    label="显示名称"
                    rules={[
                        { required: true, message: '请输入显示名称' },
                        { min: 2, message: '显示名称至少2个字符' },
                        { max: 20, message: '显示名称不能超过20个字符' }
                    ]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="请输入显示名称"
                        autoComplete="name"
                    />
                </Form.Item>

                <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                        { required: true, message: '请输入用户名' },
                        { min: 3, message: '用户名至少3个字符' },
                        { max: 20, message: '用户名不能超过20个字符' },
                        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                    ]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="请输入用户名"
                        autoComplete="username"
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="邮箱地址"
                    rules={[
                        { required: true, message: '请输入邮箱地址' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="your@email.com"
                        autoComplete="email"
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                        { required: true, message: '请输入密码' },
                        { min: 6, message: '密码至少6位字符' },
                        { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字' }
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请输入密码"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label="确认密码"
                    dependencies={['password']}
                    rules={[
                        { required: true, message: '请确认密码' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve()
                                }
                                return Promise.reject(new Error('两次输入的密码不一致'))
                            }
                        })
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请再次输入密码"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item
                    name="agreeToTerms"
                    valuePropName="checked"
                    rules={[
                        { required: true, message: '请同意用户协议和隐私政策' }
                    ]}
                >
                    <Checkbox>
                        我已阅读并同意{' '}
                        <Link href="/terms" target="_blank">用户协议</Link>
                        {' '}和{' '}
                        <Link href="/privacy" target="_blank">隐私政策</Link>
                    </Checkbox>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        size="large"
                    >
                        创建账户
                    </Button>
                </Form.Item>
            </Form>

            <Divider>
                <Text type="secondary">已有账户？</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
                <Space>
                    <Text type="secondary">已有账户？</Text>
                    <Link onClick={onSwitchToLogin}>
                        立即登录
                    </Link>
                </Space>
            </div>
        </div>
    )
}

export default RegisterForm
