/**
 * 会话历史模态框组件
 * 基于真实会话管理服务显示和管理会话历史
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  List,
  Input,
  Button,
  Space,
  Typography,
  message,
  Popconfirm,
  Empty,
  Tag,
  Spin
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  MessageOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { sessionManager, SessionSummary, ProjectMessage } from '../../services/sessionManager';

const { Search } = Input;
const { Text } = Typography;

interface SessionHistoryModalProps {
  visible: boolean;
  onCancel: () => void;
  onSessionSelect?: (sessionId: string) => void;
}

interface SearchResult {
  message: ProjectMessage;
  projectTitle: string;
}

const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  visible,
  onCancel,
  onSessionSelect
}) => {
  // 状态管理
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'search'>('sessions');

  // 加载会话列表
  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionSummaries = await sessionManager.getSessionSummaries();
      setSessions(sessionSummaries);
    } catch (error) {
      console.error('加载会话失败:', error);
      message.error('加载会话历史失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索消息
  const searchMessages = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const messages = await sessionManager.searchMessages(query.trim());
      
      // 获取项目标题信息（简化版本，实际应该从数据库获取）
      const results: SearchResult[] = messages.map(message => ({
        message,
        projectTitle: `项目 ${message.projectId.substring(0, 8)}` // 临时显示
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('搜索消息失败:', error);
      message.error('搜索失败');
    } finally {
      setSearchLoading(false);
    }
  };

  // 删除会话
  const deleteSession = async (projectId: string) => {
    try {
      await sessionManager.deleteProjectSession(projectId);
      message.success('会话删除成功');
      await loadSessions(); // 重新加载会话列表
    } catch (error) {
      console.error('删除会话失败:', error);
      message.error('删除会话失败');
    }
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchMessages(value);
  };

  // 初始化加载
  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible]);

  return (
    <Modal
      title="会话历史"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      destroyOnClose
    >
      {/* 标签页切换 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type={activeTab === 'sessions' ? 'primary' : 'default'}
            onClick={() => setActiveTab('sessions')}
            icon={<MessageOutlined />}
          >
            会话列表
          </Button>
          <Button
            type={activeTab === 'search' ? 'primary' : 'default'}
            onClick={() => setActiveTab('search')}
            icon={<SearchOutlined />}
          >
            消息搜索
          </Button>
        </Space>
      </div>

      {/* 会话列表标签页 */}
      {activeTab === 'sessions' && (
        <div>
          <Spin spinning={loading}>
            {sessions.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无会话历史"
              />
            ) : (
              <List
                dataSource={sessions}
                renderItem={(session) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        onClick={() => onSessionSelect?.(session.projectId)}
                      >
                        查看
                      </Button>,
                      <Popconfirm
                        title="确定要删除这个会话吗？"
                        onConfirm={() => deleteSession(session.projectId)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{session.projectTitle}</Text>
                          <Tag color="blue">{session.messageCount} 条消息</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">
                            最后活动: {formatTime(session.lastActivity)}
                          </Text>
                          {session.lastMessage && (
                            <div style={{ marginTop: 4 }}>
                              <Text ellipsis style={{ maxWidth: 400 }}>
                                {session.lastMessage}
                              </Text>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </div>
      )}

      {/* 消息搜索标签页 */}
      {activeTab === 'search' && (
        <div>
          <Search
            placeholder="搜索消息内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
            style={{ marginBottom: 16 }}
            enterButton
          />
          
          <Spin spinning={searchLoading}>
            {searchResults.length === 0 && searchQuery ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="未找到相关消息"
              />
            ) : searchResults.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="请输入关键词搜索消息"
              />
            ) : (
              <List
                dataSource={searchResults}
                renderItem={(result) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        onClick={() => onSessionSelect?.(result.message.projectId)}
                      >
                        查看项目
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{result.projectTitle}</Text>
                          <Tag color={result.message.type === 'user' ? 'blue' : 'green'}>
                            {result.message.type === 'user' ? '用户' : 'AI'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text>{result.message.content}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">
                              <ClockCircleOutlined /> {formatTime(result.message.timestamp)}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </div>
      )}
    </Modal>
  );
};

export default SessionHistoryModal;
