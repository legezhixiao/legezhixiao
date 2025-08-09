import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Collapse, Card } from 'antd';
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 在生产环境中，可以将错误发送到错误报告服务
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误报告服务，如 Sentry、LogRocket 等
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('Error reported:', errorReport);
    
    // 示例：发送到错误报告服务
    // fetch('/api/error-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport),
    // });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback UI，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div style={{ 
          padding: '20px', 
          minHeight: '100vh', 
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card style={{ maxWidth: '800px', width: '100%' }}>
            <Result
              status="error"
              icon={<BugOutlined />}
              title="应用遇到了一个错误"
              subTitle={
                <div>
                  <Paragraph>
                    很抱歉，应用运行时遇到了意外错误。我们已经记录了这个问题，正在努力修复。
                  </Paragraph>
                  <Text code>{errorId}</Text>
                </div>
              }
              extra={[
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={this.handleReload}
                  key="reload"
                >
                  重新加载页面
                </Button>,
                <Button 
                  icon={<HomeOutlined />} 
                  onClick={this.handleGoHome}
                  key="home"
                >
                  返回首页
                </Button>,
                <Button 
                  onClick={this.handleReset}
                  key="reset"
                >
                  尝试恢复
                </Button>,
              ]}
            />

            {isDevelopment && error && (
              <Collapse style={{ marginTop: '20px' }}>
                <Panel header="错误详情 (开发模式)" key="error-details">
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>错误消息:</Text>
                    <Paragraph code copyable>
                      {error.message}
                    </Paragraph>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>错误堆栈:</Text>
                    <Paragraph>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '12px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '200px'
                      }}>
                        {error.stack}
                      </pre>
                    </Paragraph>
                  </div>

                  {errorInfo && (
                    <div>
                      <Text strong>组件堆栈:</Text>
                      <Paragraph>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '12px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {errorInfo.componentStack}
                        </pre>
                      </Paragraph>
                    </div>
                  )}
                </Panel>
              </Collapse>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
