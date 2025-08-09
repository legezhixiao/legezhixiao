import React from 'react';
import { Spin, Alert, Button, Progress, Skeleton, Card } from 'antd';
import { LoadingOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface LoadingStatesProps {
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
  progress?: number;
  showProgress?: boolean;
  size?: 'small' | 'default' | 'large';
  tip?: string;
  children?: React.ReactNode;
  type?: 'spin' | 'skeleton' | 'card' | 'inline';
  skeletonRows?: number;
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({
  loading = false,
  error = null,
  retry,
  progress,
  showProgress = false,
  size = 'default',
  tip = '加载中...',
  children,
  type = 'spin',
  skeletonRows = 3,
}) => {
  // 错误状态
  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        action={
          retry ? (
            <Button
              size="small"
              danger
              icon={<ReloadOutlined />}
              onClick={retry}
            >
              重试
            </Button>
          ) : undefined
        }
        style={{ margin: '16px 0' }}
      />
    );
  }

  // 加载状态
  if (loading) {
    // 进度条类型
    if (showProgress && typeof progress === 'number') {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Progress
            type="circle"
            percent={progress}
            status={progress === 100 ? 'success' : 'active'}
            format={(percent) => `${percent}%`}
          />
          <div style={{ marginTop: '16px', color: '#666' }}>
            {tip}
          </div>
        </div>
      );
    }

    // 骨架屏类型
    if (type === 'skeleton') {
      return (
        <div style={{ padding: '16px' }}>
          <Skeleton active paragraph={{ rows: skeletonRows }} />
        </div>
      );
    }

    // 卡片类型
    if (type === 'card') {
      return (
        <Card style={{ margin: '16px 0' }}>
          <Skeleton active />
        </Card>
      );
    }

    // 内联类型
    if (type === 'inline') {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Spin 
            size={size} 
            indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 24 : size === 'small' ? 12 : 16 }} spin />}
          />
          <span style={{ color: '#666', fontSize: '14px' }}>{tip}</span>
        </div>
      );
    }

    // 默认 spin 类型
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin 
          size={size} 
          indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 40 : size === 'small' ? 16 : 24 }} spin />}
        />
        <div style={{ color: '#666' }}>{tip}</div>
      </div>
    );
  }

  // 正常状态，渲染子组件
  return <>{children}</>;
};

// 预设的加载组件
export const PageLoading: React.FC<{ tip?: string }> = ({ tip = '页面加载中...' }) => (
  <LoadingStates loading type="spin" size="large" tip={tip} />
);

export const ComponentLoading: React.FC<{ tip?: string }> = ({ tip = '组件加载中...' }) => (
  <LoadingStates loading type="skeleton" tip={tip} />
);

export const InlineLoading: React.FC<{ tip?: string; size?: 'small' | 'default' | 'large' }> = ({ 
  tip = '加载中...', 
  size = 'small' 
}) => (
  <LoadingStates loading type="inline" size={size} tip={tip} />
);

export const CardLoading: React.FC<{ tip?: string }> = ({ tip = '内容加载中...' }) => (
  <LoadingStates loading type="card" tip={tip} />
);

// 带进度的加载组件
export const ProgressLoading: React.FC<{ 
  progress: number; 
  tip?: string;
  showPercent?: boolean;
}> = ({ 
  progress, 
  tip = '处理中...', 
  showPercent = true 
}) => (
  <LoadingStates 
    loading 
    showProgress 
    progress={progress} 
    tip={showPercent ? `${tip} ${progress}%` : tip} 
  />
);

// 错误重试组件
export const ErrorRetry: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <LoadingStates error={error} retry={onRetry} />
);

// 条件加载包装组件
export const ConditionalLoading: React.FC<{
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  type?: 'spin' | 'skeleton' | 'card' | 'inline';
  tip?: string;
}> = ({ loading, error, onRetry, children, type = 'spin', tip }) => (
  <LoadingStates
    loading={loading}
    error={error}
    retry={onRetry}
    type={type}
    tip={tip}
  >
    {children}
  </LoadingStates>
);

export default LoadingStates;
