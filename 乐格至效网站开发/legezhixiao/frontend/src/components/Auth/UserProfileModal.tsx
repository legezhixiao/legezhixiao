import React, { useState } from 'react'
import {
    Modal,
    Form,
    Input,
    Button,
    Avatar,
    Upload,
    message,
    Tabs,
    Card,
    Statistic,
    Row,
    Col,
    Typography,
    Space,
    Progress,
    Tag
} from 'antd'
import {
    EditOutlined,
    UploadOutlined,
    TrophyOutlined,
    BookOutlined,
    ClockCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../types'

const { Text } = Typography
const { TabPane } = Tabs

interface UserProfileModalProps {
    visible: boolean
    onClose: () => void
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
    visible,
    onClose
}) => {
    const { user, updateProfile, isLoading } = useAuth()
    const [form] = Form.useForm()
    const [isEditing, setIsEditing] = useState(false)

    React.useEffect(() => {
        if (visible && user) {
            form.setFieldsValue({
                displayName: user.displayName,
                bio: user.profile.bio || '',
                location: user.profile.location || '',
                website: user.profile.website || '',
                dailyGoal: user.profile.writingStats.dailyGoal
            })
        }
    }, [visible, user, form])

    const handleSubmit = async (values: any) => {
        if (!user) return

        try {
            const updates: Partial<User> = {
                displayName: values.displayName,
                profile: {
                    ...user.profile,
                    bio: values.bio,
                    location: values.location,
                    website: values.website,
                    writingStats: {
                        ...user.profile.writingStats,
                        dailyGoal: values.dailyGoal
                    }
                }
            }

            await updateProfile(updates)
            setIsEditing(false)
            message.success('资料更新成功')
        } catch (error) {
            message.error('更新失败，请重试')
        }
    }

    const handleAvatarUpload = (info: any) => {
        if (info.file.status === 'done') {
            message.success('头像上传成功')
            // 在实际应用中，这里应该更新用户头像
        } else if (info.file.status === 'error') {
            message.error('头像上传失败')
        }
    }

    if (!user) return null

    // 计算进度百分比
    const dailyProgress = Math.min((user.profile.writingStats.totalWords % user.profile.writingStats.dailyGoal) / user.profile.writingStats.dailyGoal * 100, 100)

    return (
        <Modal
            title="个人资料"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            destroyOnClose
        >
            <Tabs defaultActiveKey="profile">
                <TabPane tab="基本信息" key="profile">
                    <div style={{ padding: '20px 0' }}>
                        {/* 头像部分 */}
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <Avatar
                                size={100}
                                src={user.avatar}
                                style={{
                                    backgroundColor: user.role === 'admin' ? '#722ed1' : '#1890ff',
                                    fontSize: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {!user.avatar && user.displayName.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ marginTop: 16 }}>
                                <Upload
                                    name="avatar"
                                    showUploadList={false}
                                    onChange={handleAvatarUpload}
                                    beforeUpload={() => false} // 阻止自动上传
                                >
                                    <Button icon={<UploadOutlined />} size="small">
                                        更换头像
                                    </Button>
                                </Upload>
                            </div>
                        </div>

                        {/* 表单部分 */}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="displayName"
                                        label="显示名称"
                                        rules={[
                                            { required: true, message: '请输入显示名称' },
                                            { min: 2, message: '显示名称至少2个字符' }
                                        ]}
                                    >
                                        <Input
                                            disabled={!isEditing}
                                            placeholder="请输入显示名称"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="用户名">
                                        <Input
                                            value={user.username}
                                            disabled
                                            placeholder="用户名不可修改"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="邮箱地址">
                                <Input
                                    value={user.email}
                                    disabled
                                    placeholder="邮箱地址不可修改"
                                />
                            </Form.Item>

                            <Form.Item
                                name="bio"
                                label="个人简介"
                            >
                                <Input.TextArea
                                    disabled={!isEditing}
                                    placeholder="介绍一下自己..."
                                    rows={3}
                                    maxLength={200}
                                    showCount
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="location"
                                        label="所在地区"
                                    >
                                        <Input
                                            disabled={!isEditing}
                                            placeholder="如：北京"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="website"
                                        label="个人网站"
                                    >
                                        <Input
                                            disabled={!isEditing}
                                            placeholder="https://..."
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="dailyGoal"
                                label="每日写作目标"
                            >
                                <Input
                                    disabled={!isEditing}
                                    placeholder="字数目标"
                                    suffix="字"
                                    type="number"
                                />
                            </Form.Item>

                            <div style={{ textAlign: 'right', marginTop: 24 }}>
                                {!isEditing ? (
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        编辑资料
                                    </Button>
                                ) : (
                                    <Space>
                                        <Button onClick={() => setIsEditing(false)}>
                                            取消
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={isLoading}
                                        >
                                            保存
                                        </Button>
                                    </Space>
                                )}
                            </div>
                        </Form>
                    </div>
                </TabPane>

                <TabPane tab="创作统计" key="stats">
                    <div style={{ padding: '20px 0' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="总字数"
                                        value={user.profile.writingStats.totalWords}
                                        prefix={<EditOutlined />}
                                        suffix="字"
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="总小说"
                                        value={user.profile.writingStats.totalProjects}
                                        prefix={<BookOutlined />}
                                        suffix="个"
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="已发布"
                                        value={user.profile.writingStats.publishedProjects}
                                        prefix={<TrophyOutlined />}
                                        suffix="个"
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="连续天数"
                                        value={user.profile.writingStats.streakDays}
                                        prefix={<ClockCircleOutlined />}
                                        suffix="天"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card title="今日进度" style={{ marginTop: 16 }}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>每日写作目标</Text>
                                <Text type="secondary" style={{ float: 'right' }}>
                                    {Math.min(user.profile.writingStats.totalWords % user.profile.writingStats.dailyGoal, user.profile.writingStats.dailyGoal)} / {user.profile.writingStats.dailyGoal} 字
                                </Text>
                            </div>
                            <Progress
                                percent={dailyProgress}
                                status={dailyProgress >= 100 ? 'success' : 'active'}
                                strokeColor={{
                                    from: '#108ee9',
                                    to: '#87d068',
                                }}
                            />
                        </Card>

                        <Card title="账户信息" style={{ marginTop: 16 }}>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Text type="secondary">账户类型</Text>
                                    <div>
                                        <Tag color={user.role === 'admin' ? 'purple' : user.role === 'premium' ? 'gold' : 'blue'}>
                                            {user.role === 'admin' ? '管理员' : user.role === 'premium' ? '高级用户' : '普通用户'}
                                        </Tag>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">订阅状态</Text>
                                    <div>
                                        <Tag color={user.subscription === 'premium' || user.subscription === 'enterprise' ? 'gold' : 'default'}>
                                            {user.subscription === 'free' ? '免费版' : 
                                             user.subscription === 'basic' ? '基础版' :
                                             user.subscription === 'premium' ? '高级版' : '企业版'}
                                        </Tag>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">注册时间</Text>
                                    <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary">最后登录</Text>
                                    <div>{new Date(user.lastLoginAt).toLocaleDateString()}</div>
                                </Col>
                            </Row>
                        </Card>
                    </div>
                </TabPane>
            </Tabs>
        </Modal>
    )
}

export default UserProfileModal
