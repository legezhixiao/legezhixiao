import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      await login({
        email: values.email,
        password: values.password
      });
      message.success('登录成功！');
    } catch (error) {
      message.error('登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  // 临时的演示登录功能
  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await login({
        email: 'demo@example.com',
        password: 'demo123'
      });
      message.success('演示登录成功！');
    } catch (error) {
      // 如果演示登录失败，我们可以创建一个临时用户状态
      message.info('正在创建演示用户...');
      // 这里可以添加创建临时用户的逻辑
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            乐格至效
          </Title>
          <Text type="secondary">AI小说创作平台</Text>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入邮箱" 
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical">
            <Button 
              type="link" 
              onClick={handleDemoLogin}
              loading={loading}
            >
              使用演示账户登录
            </Button>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              演示账户：demo / demo123
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
