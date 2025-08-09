import { useEffect, useState } from 'react';
import { simpleRxdbService } from '../services/simpleRxdbService';

export const useSimpleRxDB = () => {
  console.log('🔄 useSimpleRxDB: Hook调用');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useSimpleRxDB: useEffect开始...');
    
    try {
      console.log('🔄 useSimpleRxDB: 订阅简化服务...');
      const subscription = simpleRxdbService.isInitialized().subscribe({
        next: (initialized) => {
          console.log(`📊 useSimpleRxDB: 初始化状态: ${initialized}`);
          setIsInitialized(initialized);
        },
        error: (err) => {
          console.error('❌ useSimpleRxDB: 订阅错误:', err);
          setError(err.message || String(err));
        }
      });

      console.log('✅ useSimpleRxDB: 订阅创建成功');

      return () => {
        console.log('🔄 useSimpleRxDB: 清理订阅');
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('❌ useSimpleRxDB: 设置订阅错误:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return {
    isInitialized,
    error
  };
};
