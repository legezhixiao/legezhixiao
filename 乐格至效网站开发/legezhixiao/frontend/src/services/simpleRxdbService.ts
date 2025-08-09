// 简化的RxDB服务用于测试
import { 
  createRxDatabase, 
  RxDatabase, 
  addRxPlugin
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { BehaviorSubject } from 'rxjs';

// 在开发模式下添加插件 - 使用 process.env 替代 import.meta.env
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

// 简单的测试schema
const testSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 100 }
  },
  required: ['id', 'name']
};

class SimpleRxDBService {
  private database: RxDatabase | null = null;
  private isInitialized$ = new BehaviorSubject<boolean>(false);

  constructor() {
    console.log('🔄 SimpleRxDBService: 构造函数调用');
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🔄 SimpleRxDBService: 开始初始化数据库...');
      
      this.database = await createRxDatabase({
        name: 'simple_test_db',
        storage: getRxStorageDexie(),
        ignoreDuplicate: true
      });
      
      console.log('✅ SimpleRxDBService: 数据库创建成功');

      // 添加简单集合
      await this.database.addCollections({
        test_collection: {
          schema: testSchema
        }
      });

      console.log('✅ SimpleRxDBService: 集合添加成功');
      this.isInitialized$.next(true);
      console.log('✅ SimpleRxDBService: 初始化完成');
      
    } catch (error) {
      console.error('❌ SimpleRxDBService: 初始化失败:', error);
      this.isInitialized$.next(false);
    }
  }

  isInitialized() {
    return this.isInitialized$.asObservable();
  }

  getSyncState() {
    return new BehaviorSubject('idle').asObservable();
  }
}

export const simpleRxdbService = new SimpleRxDBService();
