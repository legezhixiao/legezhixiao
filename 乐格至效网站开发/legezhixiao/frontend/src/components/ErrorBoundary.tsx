import { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Result } from 'antd'
import { apiLogger, log } from '../utils/apiLogger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
    
    // 记录错误边界组件初始化
    log.info('ErrorBoundary', '错误边界组件已初始化')
  }

  static getDerivedStateFromError(error: Error): State {
    // 生成错误ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 记录错误
    log.error('ErrorBoundary', `捕获到React错误: ${error.message}`, {
      errorId,
      name: error.name,
      message: error.message,
      stack: error.stack
    })

    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    const errorId = this.state.errorId || `error_${Date.now()}`
    
    // 详细记录错误信息
    apiLogger.logComponentError('ErrorBoundary', error, errorInfo)
    
    // 记录组件堆栈
    log.error('ErrorBoundary', '组件错误详细信息', {
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })

    this.setState({ error, errorInfo, errorId })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="应用程序出现错误"
          subTitle={`错误ID: ${this.state.errorId} - ${this.state.error?.message || '未知错误'}`}
          extra={[
            <Button 
              type="primary" 
              key="reload" 
              onClick={() => {
                log.info('ErrorBoundary', '用户点击重新加载页面')
                window.location.reload()
              }}
            >
              重新加载页面
            </Button>,
            <Button 
              key="retry"
              onClick={() => {
                log.info('ErrorBoundary', '用户点击重试，重置错误状态')
                this.setState({ 
                  hasError: false, 
                  error: undefined, 
                  errorInfo: undefined,
                  errorId: undefined 
                })
              }}
            >
              重试
            </Button>,
            <Button 
              key="console" 
              onClick={() => {
                log.info('ErrorBoundary', '用户查看控制台错误信息')
                console.log('Error:', this.state.error, this.state.errorInfo)
              }}
            >
              查看控制台
            </Button>,
            <Button 
              key="copy"
              onClick={() => {
                const errorReport = {
                  errorId: this.state.errorId,
                  error: this.state.error?.message,
                  stack: this.state.error?.stack,
                  componentStack: this.state.errorInfo?.componentStack,
                  url: window.location.href,
                  timestamp: new Date().toISOString()
                }
                navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
                log.info('ErrorBoundary', '错误信息已复制到剪贴板')
                alert('错误信息已复制到剪贴板')
              }}
            >
              复制错误信息
            </Button>
          ]}
        >
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h4>错误详情:</h4>
            <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
            {this.state.errorInfo && (
              <>
                <h4>组件堆栈:</h4>
                <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        </Result>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
