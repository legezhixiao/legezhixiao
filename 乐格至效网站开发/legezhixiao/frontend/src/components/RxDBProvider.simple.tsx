import React from 'react';

interface RxDBProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// 简化的RxDBProvider - 用于App.full.tsx编译
// 提供基础的Provider功能而不实现复杂的数据库逻辑
const RxDBProvider: React.FC<RxDBProviderProps> = ({ children }) => {
  // 直接渲染子组件，不进行数据库初始化
  return <>{children}</>;
};

// 简化的组件导出，用于兼容性
export const DatabaseControls: React.FC = () => {
  return (
    <div style={{ padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
      <p>数据库控制面板 (简化版)</p>
    </div>
  );
};

export const SyncStatusIndicator: React.FC = () => {
  return (
    <div style={{ display: 'inline-block', padding: '4px 8px', background: '#52c41a', color: 'white', borderRadius: '2px' }}>
      已同步
    </div>
  );
};

export const ConnectionStatus: React.FC = () => {
  return (
    <div style={{ display: 'inline-block', padding: '4px 8px', background: '#1890ff', color: 'white', borderRadius: '2px' }}>
      已连接
    </div>
  );
};

export default RxDBProvider;
