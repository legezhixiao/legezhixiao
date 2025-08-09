import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Input, Card, Typography, Space, Tooltip, message } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, MinusOutlined } from '@ant-design/icons';
import './FloatingAIWindow.css';

const { TextArea } = Input;
const { Text } = Typography;

interface SimpleFloatingAIProps {
  visible: boolean;
  onClose: () => void;
  onSuggestionApply: (suggestion: string) => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const SimpleFloatingAI: React.FC<SimpleFloatingAIProps> = ({
  visible,
  onClose,
  onSuggestionApply
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 450, y: 100 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 格式化时间显示
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 拖拽功能
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // 只限制顶部，确保标题栏始终可见
    const minY = -550; // 允许窗口大部分超出顶部，但保留标题栏高度(50px)可见
    
    setPosition({
      x: newX, // X轴不限制，允许完全超出左右边界
      y: Math.max(minY, newY) // Y轴只限制顶部，确保标题栏可见
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // 将新消息添加到数组末尾（最新消息在底部）
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 模拟AI响应
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `针对您的问题"${currentInput}"，我建议您可以从以下几个角度考虑：\n\n1. 明确写作目标和主题\n2. 完善人物设定和背景\n3. 构建完整的故事框架\n4. 注意情节的逻辑性和连贯性\n\n希望这些建议对您的创作有所帮助！`,
        timestamp: new Date()
      };

      // 将AI回复添加到数组末尾
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      message.error('AI服务暂时不可用');
    } finally {
      setIsLoading(false);
    }
  };

  // 应用建议
  const handleApply = (content: string) => {
    onSuggestionApply(content);
    message.success('建议已应用');
  };

  if (!visible) return null;

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 420,
        height: isMinimized ? 50 : 600,
        zIndex: 1001,
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* 标题栏 */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Space>
          <RobotOutlined />
          <Text style={{ color: 'white', fontWeight: 'bold' }}>AI创作助手</Text>
        </Space>
        <Space>
          <Tooltip title={isMinimized ? '展开' : '最小化'}>
            <Button
              type="text"
              size="small"
              icon={<MinusOutlined />}
              onClick={() => setIsMinimized(!isMinimized)}
              style={{ color: 'white' }}
            />
          </Tooltip>
          <Tooltip title="关闭">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{ color: 'white' }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 内容区 */}
      {!isMinimized && (
        <div style={{ height: 548, display: 'flex', flexDirection: 'column' }}>
          {/* 消息列表 */}
          <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
                <RobotOutlined style={{ fontSize: 32, marginBottom: 16 }} />
                <div>向AI助手提问，获取创作建议</div>
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} style={{ marginBottom: 16 }}>
                  {message.type === 'user' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            maxWidth: '300px',
                            padding: '8px 12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '12px 12px 4px 12px',
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}
                        >
                          {message.content}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card size="small" style={{ borderRadius: 12 }}>
                      <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                        {message.content}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {formatTime(message.timestamp)}
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => handleApply(message.content)}
                        >
                          应用建议
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">AI正在思考...</Text>
              </div>
            )}
            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="向AI助手提问..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{ resize: 'none' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={isLoading}
                disabled={!input.trim()}
              />
            </Space.Compact>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleFloatingAI;
