/**
 * 简化的数据库适配器 - 用于测试启动
 * 提供基本的接口兼容性，允许后端服务启动
 */

export class DatabaseAdapter {
  private isConnected: boolean = false;

  constructor() {
    console.log('📊 DatabaseAdapter initialized (简化模式)');
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔗 Initializing database connection (模拟)');
      // 模拟初始化延迟
      await new Promise(resolve => setTimeout(resolve, 100));
      this.isConnected = true;
      console.log('✅ Database initialized successfully (模拟)');
    } catch (error) {
      console.error('❌ Database initialization failed (模拟)', error);
      throw error;
    }
  }

  getConnectionStatus(): any {
    return {
      connected: this.isConnected,
      status: this.isConnected ? 'connected' : 'disconnected',
      type: 'mock',
      database: 'legezhixiao-mock',
      message: 'Database running in mock mode'
    };
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting from database (模拟)');
    this.isConnected = false;
    console.log('✅ Database disconnected (模拟)');
  }

  // 健康检查方法
  isHealthy(): boolean {
    return this.isConnected;
  }

  // 获取数据库信息
  getDatabaseInfo(): any {
    return {
      type: 'mock',
      version: '1.0.0',
      collections: [],
      status: this.isConnected ? 'ready' : 'not ready'
    };
  }
}

// 导出单例实例
const databaseAdapter = new DatabaseAdapter();
export default databaseAdapter;
