/**
 * 自动初始化项目ID和测试数据
 * 在服务启动时调用
 */
import ProjectArangoDB from '../models/ProjectArangoDB';
import { logger } from '../utils/logger';

const DEFAULT_PROJECT_ID = 'test-project';
const DEFAULT_USER_ID = 'test-user';

export async function autoInitProjectAndTestData() {
  try {
    // 检查是否存在默认项目
    const project = await ProjectArangoDB.findById(DEFAULT_PROJECT_ID);
    if (!project) {
      logger.info('未检测到默认项目，正在自动创建...');
      await ProjectArangoDB.create({
        _key: DEFAULT_PROJECT_ID,
        title: '测试项目',
        description: '自动初始化的测试项目',
        userId: DEFAULT_USER_ID,
        status: 'active',
        tags: ['auto-init', 'test'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      logger.info('默认项目已自动创建');
    } else {
      logger.info('默认项目已存在，无需初始化');
    }
    // 可扩展：自动插入测试用户、知识图谱节点等
  } catch (error) {
    logger.error('自动初始化项目/测试数据失败:', error);
  }
}
