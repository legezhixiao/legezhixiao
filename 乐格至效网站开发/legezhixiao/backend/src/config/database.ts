/**
 * 数据库配置
 * 现在使用ArangoDB作为主要数据库，通过适配器提供兼容性
 */

import databaseAdapter, { DatabaseAdapter } from './databaseAdapter';

// 导出适配器实例以保持向后兼容性
export const databaseConfig: DatabaseAdapter = databaseAdapter;
export default databaseAdapter;

// 保持现有的初始化接口
export const connectDatabase = async () => {
  await databaseAdapter.initialize();
};

export const disconnectDatabase = async () => {
  await databaseAdapter.disconnect();
};
