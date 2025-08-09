import React from 'react'
import { Button, Form, Input, Alert, Typography, Result } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import type { ResetPasswordData } from '../../types'

const { Title, Text, Link } = Typography

interface ResetPasswordFormProps {
    onSwitchToLogin: () => void
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    onSwitchToLogin
}) => {
    const { resetPassword, isLoading, error, clearError } = useAuth()
    const [form] = Form.useForm()
    const [emailSent, setEmailSent] = React.useState(false)

    const handleSubmit = async (values: ResetPasswordData) => {
        try {
            clearError()
            await resetPassword(values)
            setEmailSent(true)
        } catch (err) {
            console.error('Reset password failed:', err)
        }
    }

    if (emailSent) {
        return (
            <div className="auth-form">
                <Result
                    status="success"
                    title="重置邮件已发送"
                    subTitle="我们已向您的邮箱发送了重置密码的链接，请查收邮件并按照说明操作。"
                    extra={[
                        <Button key="login" type="primary" onClick={onSwitchToLogin}>
                            返回登录
                        </Button>,
                        <Button key="resend" onClick={() => setEmailSent(false)}>
                            重新发送
                        </Button>
                    ]}
                />
            </div>
        )
    }

    return (
        <div className="auth-form">
            <div className="auth-header">
                <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
                    重置密码
                </Title>
                <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                    输入您的邮箱地址，我们将发送重置链接
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
                name="resetPassword"
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

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        size="large"
                    >
                        发送重置邮件
                    </Button>
                </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link onClick={onSwitchToLogin}>
                    返回登录
                </Link>
            </div>
        </div>
    )
}

export default ResetPasswordForm
