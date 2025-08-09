import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { message } from 'antd';
import { rxdbService } from '../services/rxdbService';

interface RxDBContextType {
  db: any;
  isInitialized: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  retryConnection: () => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const RxDBContext = createContext<RxDBContextType | undefined>(undefined);

export const useRxDB = (): RxDBContextType => {
  const context = useContext(RxDBContext);
  if (context === undefined) {
    throw new Error('useRxDB必须在RxDBProvider内部使用');
  }
  return context;
};

interface RxDBProviderProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export const RxDBProvider: React.FC<RxDBProviderProps> = ({ 
  children, 
  onError 
}) => {
  const [db, setDb] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('正在初始化RxDB数据库...');
      
      // 等待数据库初始化完成 - rxdbService在构造函数中自动初始化
      const initSubscription = rxdbService.isInitialized().subscribe((initialized) => {
        if (initialized) {
          const database = rxdbService.getDatabase();
          setDb(database);
          setIsInitialized(true);
          setIsConnected(true);
          setIsLoading(false);
          
          console.log('RxDB数据库初始化成功');
          message.success('数据库连接成功');
          
          initSubscription.unsubscribe();
        }
      });
      
      // 设置超时
      setTimeout(() => {
        if (!isInitialized) {
          initSubscription.unsubscribe();
          setError('数据库初始化超时');
          setIsLoading(false);
          message.error('数据库连接超时');
        }
      }, 10000); // 10秒超时
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '数据库初始化失败';
      console.error('RxDB初始化失败:', err);
      
      setError(errorMessage);
      setIsInitialized(false);
      setIsConnected(false);
      setIsLoading(false);
      
      message.error(`数据库连接失败: ${errorMessage}`);
      
      // 调用错误回调
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  const retryConnection = async (): Promise<void> => {
    console.log('重试数据库连接...');
    await initializeDatabase();
  };

  const resetDatabase = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('正在重置数据库...');
      
      // 关闭现有连接
      const currentDb = rxdbService.getDatabase();
      if (currentDb && typeof currentDb.remove === 'function') {
        await currentDb.remove();
      }
      
      // 重新初始化
      await initializeDatabase();
      
      message.success('数据库重置成功');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '数据库重置失败';
      console.error('数据库重置失败:', err);
      
      setError(errorMessage);
      setIsLoading(false);
      message.error(`数据库重置失败: ${errorMessage}`);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) {
        await initializeDatabase();
      }
    };

    init();

    return () => {
      isMounted = false;
      // 清理资源 - 组件卸载时关闭数据库连接
      if (db && typeof db.destroy === 'function') {
        db.destroy().catch(console.error);
      }
    };
  }, []);

  const contextValue: RxDBContextType = {
    db,
    isInitialized,
    isConnected,
    isLoading,
    error,
    retryConnection,
    resetDatabase,
  };

  return (
    <RxDBContext.Provider value={contextValue}>
      {children}
    </RxDBContext.Provider>
  );
};

export default RxDBProvider;
