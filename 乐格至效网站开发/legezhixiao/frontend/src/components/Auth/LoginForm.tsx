import React from 'react'
import { Button, Form, Input, Checkbox, Alert, Typography, Divider, Space } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import type { LoginCredentials } from '../../types'
import './AuthModal.css'

const { Title, Text, Link } = Typography

interface LoginFormProps {
    onSwitchToRegister: () => void
    onSwitchToReset: () => void
    onSuccess?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({
    onSwitchToRegister,
    onSwitchToReset,
    onSuccess
}) => {
    const { login, isLoading, error, clearError } = useAuth()
    const [form] = Form.useForm()

    const handleSubmit = async (values: LoginCredentials) => {
        try {
            clearError()
            await login(values)
            onSuccess?.()
        } catch (err) {
            // 错误已经在 AuthContext 中处理
            console.error('Login failed:', err)
        }
    }

    return (
        <div className="auth-form">
            <div className="auth-header">
                <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
                    欢迎回来
                </Title>
                <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                    登录到您的乐阁之晓账户
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
                name="login"
                onFinish={handleSubmit}
                layout="vertical"
                requiredMark={false}
                size="large"
            >
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
                        { min: 6, message: '密码至少6位字符' }
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请输入密码"
                        autoComplete="current-password"
                    />
                </Form.Item>

                <Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                            <Checkbox>记住我</Checkbox>
                        </Form.Item>
                        <Link onClick={onSwitchToReset}>
                            忘记密码？
                        </Link>
                    </div>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        size="large"
                    >
                        登录
                    </Button>
                </Form.Item>
            </Form>

            <Divider>
                <Text type="secondary">还没有账户？</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
                <Space>
                    <Text type="secondary">还没有账户？</Text>
                    <Link onClick={onSwitchToRegister}>
                        立即注册
                    </Link>
                </Space>
            </div>

            {/* 演示账户提示 */}
            <div className="demo-accounts" style={{ marginTop: 24, padding: 16, backgroundColor: '#f6f6f6', borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                    演示账户：
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    管理员：admin@legezhixiao.com
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    密码：任意密码（演示模式）
                </Text>
            </div>
        </div>
    )
}

export default LoginForm
