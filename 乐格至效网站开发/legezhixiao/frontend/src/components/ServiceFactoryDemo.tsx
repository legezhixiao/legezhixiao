/**
 * 乐格至效 - 服务工厂使用示例
 * 
 * 展示如何在组件中使用服务工厂获取Mock或真实服务
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Divider, Tag, message } from 'antd';
import { getAuthService, getDatabaseService, getAIService, getServiceConfigStatus } from '../services/ServiceFactory';

const { Title, Paragraph, Text } = Typography;

/**
 * 服务工厂演示组件
 */
export const ServiceFactoryDemo: React.FC = () => {
  const [configStatus, setConfigStatus] = useState(getServiceConfigStatus());
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string>('');

  useEffect(() => {
    setConfigStatus(getServiceConfigStatus());
  }, []);

  /**
   * 测试认证服务
   */
  const testAuthService = async () => {
    setLoading('auth');
    try {
      const authService = getAuthService();
      
      // 测试登录
      const loginResult = await authService.login({
        username: 'demo-user',
        password: 'demo-password'
      });
      
      // 获取当前用户
      const currentUser = authService.getCurrentUser();
      
      // 检查认证状态
      const isAuthenticated = authService.isAuthenticated();
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        auth: {
          loginResult,
          currentUser,
          isAuthenticated,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      message.success('认证服务测试完成');
    } catch (error) {
      message.error('认证服务测试失败: ' + (error as Error).message);
    } finally {
      setLoading('');
    }
  };

  /**
   * 测试数据库服务
   */
  const testDatabaseService = async () => {
    setLoading('database');
    try {
      const dbService = getDatabaseService();
      
      // 测试连接
      const connected = await dbService.connect();
      
      // 创建测试用户
      const testUser = await dbService.createUser({
        username: 'demo-user-' + Date.now(),
        email: 'demo@example.com',
        passwordHash: 'demo-hash',
        displayName: '演示用户',
        role: 'user',
        status: 'active',
        preferences: {
          theme: 'light',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          notifications: {
            email: true,
            push: false,
            sms: false
          },
          privacy: {
            profileVisible: true,
            emailVisible: false
          },
          writing: {
            autoSave: true,
            spellCheck: true,
            wordCountGoal: 2000
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // 创建测试项目
      const testProject = await dbService.createProject({
        userId: testUser.id,
        title: '演示项目',
        description: '这是一个演示项目',
        genre: '演示',
        metadata: {
          tags: ['demo'],
          categories: ['演示'],
          customFields: {
            isDemo: true
          }
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        visibility: 'private',
        settings: {
          wordCountGoal: 50000,
          targetAudience: 'general',
          writingStyle: 'narrative',
          contentRating: 'general',
          publishingPlan: 'draft'
        },
        stats: {
          totalWords: 0,
          totalChapters: 0,
          averageWordsPerChapter: 0,
          lastUpdated: new Date().toISOString()
        }
      });
      
      setTestResults(prev => ({
        ...prev,
        database: {
          connected,
          testUser,
          testProject,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      message.success('数据库服务测试完成');
    } catch (error) {
      message.error('数据库服务测试失败: ' + (error as Error).message);
    } finally {
      setLoading('');
    }
  };

  /**
   * 测试AI服务
   */
  const testAIService = async () => {
    setLoading('ai');
    try {
      const aiService = getAIService();
      
      // 测试文本生成
      const generatedText = await aiService.generateText('写一个简短的故事开头');
      
      // 测试大纲生成
      const outline = await aiService.generateOutline({
        title: '演示小说',
        genre: '科幻'
      });
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        ai: {
          generatedText,
          outline,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      message.success('AI服务测试完成');
    } catch (error) {
      message.error('AI服务测试失败: ' + (error as Error).message);
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🏭 服务工厂演示</Title>
      
      <Paragraph>
        服务工厂允许根据环境配置自动选择Mock服务或真实服务，无需修改业务代码。
      </Paragraph>

      {/* 当前配置状态 */}
      <Card title="📋 当前服务配置" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="small">
          <div>
            <Text strong>认证服务: </Text>
            <Tag color={configStatus.useMockAuth ? 'orange' : 'green'}>
              {configStatus.useMockAuth ? '🔧 Mock服务' : '🚀 真实服务'}
            </Tag>
          </div>
          <div>
            <Text strong>数据库服务: </Text>
            <Tag color={configStatus.useMockDB ? 'orange' : 'green'}>
              {configStatus.useMockDB ? '🔧 Mock服务' : '🚀 真实服务'}
            </Tag>
          </div>
          <div>
            <Text strong>AI服务: </Text>
            <Tag color={configStatus.useMockAI ? 'orange' : 'green'}>
              {configStatus.useMockAI ? '🔧 Mock服务' : '🚀 真实服务'}
            </Tag>
          </div>
        </Space>
      </Card>

      {/* 服务测试按钮 */}
      <Card title="🧪 服务测试" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            loading={loading === 'auth'}
            onClick={testAuthService}
          >
            测试认证服务
          </Button>
          <Button 
            type="primary" 
            loading={loading === 'database'}
            onClick={testDatabaseService}
          >
            测试数据库服务
          </Button>
          <Button 
            type="primary" 
            loading={loading === 'ai'}
            onClick={testAIService}
          >
            测试AI服务
          </Button>
        </Space>
      </Card>

      {/* 测试结果展示 */}
      {Object.keys(testResults).length > 0 && (
        <Card title="📊 测试结果">
          {testResults.auth && (
            <>
              <Title level={4}>认证服务结果</Title>
              <Paragraph>
                <Text strong>测试时间: </Text>{testResults.auth.timestamp}<br/>
                <Text strong>登录状态: </Text>
                <Tag color={testResults.auth.isAuthenticated ? 'green' : 'red'}>
                  {testResults.auth.isAuthenticated ? '已认证' : '未认证'}
                </Tag><br/>
                <Text strong>当前用户: </Text>
                <Text code>{JSON.stringify(testResults.auth.currentUser, null, 2)}</Text>
              </Paragraph>
              <Divider />
            </>
          )}

          {testResults.database && (
            <>
              <Title level={4}>数据库服务结果</Title>
              <Paragraph>
                <Text strong>测试时间: </Text>{testResults.database.timestamp}<br/>
                <Text strong>连接状态: </Text>
                <Tag color={testResults.database.connected ? 'green' : 'red'}>
                  {testResults.database.connected ? '已连接' : '连接失败'}
                </Tag><br/>
                <Text strong>测试用户: </Text>
                <Text code>{JSON.stringify(testResults.database.testUser, null, 2)}</Text><br/>
                <Text strong>测试项目: </Text>
                <Text code>{JSON.stringify(testResults.database.testProject, null, 2)}</Text>
              </Paragraph>
              <Divider />
            </>
          )}

          {testResults.ai && (
            <>
              <Title level={4}>AI服务结果</Title>
              <Paragraph>
                <Text strong>测试时间: </Text>{testResults.ai.timestamp}<br/>
                <Text strong>生成的文本: </Text><br/>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  margin: '8px 0',
                  whiteSpace: 'pre-wrap'
                }}>
                  {testResults.ai.generatedText}
                </div>
                <Text strong>生成的大纲: </Text><br/>
                <Text code>{JSON.stringify(testResults.ai.outline, null, 2)}</Text>
              </Paragraph>
            </>
          )}
        </Card>
      )}

      {/* 使用说明 */}
      <Card title="💡 使用说明" style={{ marginTop: '24px' }}>
        <Paragraph>
          <Title level={4}>在组件中使用服务工厂:</Title>
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
{`import { getAuthService, getDatabaseService, getAIService } from '../services/ServiceFactory';

// 在组件中使用
const MyComponent = () => {
  const authService = getAuthService();
  const dbService = getDatabaseService();
  const aiService = getAIService();
  
  // 服务会根据环境配置自动选择Mock或真实实现
  const handleLogin = async () => {
    const result = await authService.login(credentials);
    // ...
  };
};`}
          </pre>
        </Paragraph>
        
        <Paragraph>
          <Title level={4}>环境配置文件 (.env.development):</Title>
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
{`# 服务模式配置 (true=使用Mock, false=使用真实服务)
VITE_USE_MOCK_AUTH=false
VITE_USE_MOCK_DB=false  
VITE_USE_MOCK_AI=true`}
          </pre>
        </Paragraph>
      </Card>
    </div>
  );
};

export default ServiceFactoryDemo;
