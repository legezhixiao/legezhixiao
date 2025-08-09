/**
 * 乐格至效 - 服务工厂测试
 * 
 * 测试Mock服务和真实服务的切换功能
 */

import { getAuthService, getDatabaseService, getAIService, getServiceConfigStatus } from './ServiceFactory';

/**
 * 测试服务工厂功能
 */
export class ServiceFactoryTest {
  
  /**
   * 测试认证服务
   */
  static async testAuthService() {
    console.group('🧪 测试认证服务');
    
    try {
      const authService = getAuthService();
      
      // 测试注册
      console.log('测试用户注册...');
      const registerResult = await authService.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      });
      console.log('注册结果:', registerResult);
      
      // 测试登录
      console.log('测试用户登录...');
      const loginResult = await authService.login({
        username: 'testuser',
        password: 'password123'
      });
      console.log('登录结果:', loginResult);
      
      // 测试获取当前用户
      console.log('测试获取当前用户...');
      const currentUser = authService.getCurrentUser();
      console.log('当前用户:', currentUser);
      
      // 测试认证状态
      console.log('测试认证状态...');
      const isAuth = authService.isAuthenticated();
      console.log('认证状态:', isAuth);
      
      // 测试更新用户偏好
      console.log('测试更新用户偏好...');
      const prefResult = await authService.updateUserPreferences({
        theme: 'dark',
        language: 'zh-CN'
      });
      console.log('偏好更新结果:', prefResult);
      
      // 测试Token刷新
      console.log('测试Token刷新...');
      const refreshResult = await authService.refreshToken();
      console.log('Token刷新结果:', refreshResult);
      
      // 测试登出
      console.log('测试用户登出...');
      await authService.logout();
      console.log('登出完成');
      
      console.log('✅ 认证服务测试通过');
      
    } catch (error) {
      console.error('❌ 认证服务测试失败:', error);
    }
    
    console.groupEnd();
  }
  
  /**
   * 测试数据库服务
   */
  static async testDatabaseService() {
    console.group('🧪 测试数据库服务');
    
    try {
      const dbService = getDatabaseService();
      
      // 测试连接
      console.log('测试数据库连接...');
      const connected = await dbService.connect();
      console.log('连接结果:', connected);
      
      // 测试用户操作
      console.log('测试用户CRUD操作...');
      
      // 创建用户
      const newUser = await dbService.createUser({
        username: 'testuser',
        email: 'test@example.com',
        profile: { nickname: '测试用户' }
      });
      console.log('创建用户:', newUser);
      
      // 获取用户
      const user = await dbService.getUserById(newUser.id);
      console.log('获取用户:', user);
      
      // 更新用户
      const updatedUser = await dbService.updateUser(newUser.id, {
        profile: { nickname: '更新后的用户' }
      });
      console.log('更新用户:', updatedUser);
      
      // 测试项目操作
      console.log('测试项目CRUD操作...');
      
      // 创建项目
      const newProject = await dbService.createProject({
        userId: newUser.id,
        title: '测试小说项目',
        description: '这是一个测试项目',
        genre: '奇幻冒险'
      });
      console.log('创建项目:', newProject);
      
      // 获取项目
      const project = await dbService.getProjectById(newProject.id);
      console.log('获取项目:', project);
      
      // 获取用户项目
      const userProjects = await dbService.getUserProjects(newUser.id);
      console.log('用户项目列表:', userProjects);
      
      // 测试章节操作
      console.log('测试章节CRUD操作...');
      
      // 创建章节
      const chapterId = 'chapter-' + Date.now();
      const newChapter = await dbService.createChapter(chapterId, {
        projectId: newProject.id,
        title: '第一章：开始',
        content: '这是第一章的内容...',
        order: 1
      });
      console.log('创建章节:', newChapter);
      
      // 获取章节
      const chapter = await dbService.getChapter(chapterId);
      console.log('获取章节:', chapter);
      
      // 获取项目章节
      const projectChapters = await dbService.getProjectChapters(newProject.id);
      console.log('项目章节列表:', projectChapters);
      
      // 更新章节
      const updatedChapter = await dbService.updateChapter(chapterId, {
        content: '这是更新后的第一章内容...'
      });
      console.log('更新章节:', updatedChapter);
      
      // 清理测试数据
      console.log('清理测试数据...');
      await dbService.deleteChapter(chapterId);
      await dbService.deleteProject(newProject.id);
      await dbService.deleteUser(newUser.id);
      
      // 测试断开连接
      console.log('测试数据库断开连接...');
      await dbService.disconnect();
      
      console.log('✅ 数据库服务测试通过');
      
    } catch (error) {
      console.error('❌ 数据库服务测试失败:', error);
    }
    
    console.groupEnd();
  }
  
  /**
   * 测试AI服务
   */
  static async testAIService() {
    console.group('🧪 测试AI服务');
    
    try {
      const aiService = getAIService();
      
      // 测试文本生成
      console.log('测试文本生成...');
      const generatedText = await aiService.generateText('写一个关于勇者冒险的故事开头', {
        maxLength: 200,
        style: 'fantasy'
      });
      console.log('生成的文本:', generatedText);
      
      // 测试大纲生成
      console.log('测试大纲生成...');
      const outline = await aiService.generateOutline({
        title: '星际探险者',
        genre: '科幻冒险',
        length: 'medium',
        themes: ['友谊', '成长', '探索']
      });
      console.log('生成的大纲:', outline);
      
      // 测试角色分析
      console.log('测试角色分析...');
      const characterAnalysis = await aiService.analyzeCharacter({
        name: '艾莉亚',
        age: 18,
        background: '来自偏远村庄的少女，拥有神秘的魔法天赋',
        personality: '勇敢、善良、有时冲动'
      });
      console.log('角色分析结果:', characterAnalysis);
      
      // 测试对话生成
      console.log('测试对话生成...');
      const dialogue = await aiService.generateDialogue({
        characters: ['艾莉亚', '导师马尔科'],
        situation: '第一次见面',
        mood: 'curious',
        context: '艾莉亚刚刚展现了魔法能力'
      });
      console.log('生成的对话:', dialogue);
      
      // 测试文本改进
      console.log('测试文本改进...');
      const originalText = '他走进了房间。房间很黑。他感到害怕。';
      const improvedText = await aiService.improveText(originalText, 'expand');
      console.log('原文:', originalText);
      console.log('改进后:', improvedText);
      
      console.log('✅ AI服务测试通过');
      
    } catch (error) {
      console.error('❌ AI服务测试失败:', error);
    }
    
    console.groupEnd();
  }
  
  /**
   * 运行所有测试
   */
  static async runAllTests() {
    console.log('🚀 开始服务工厂测试');
    
    // 显示当前配置状态
    const configStatus = getServiceConfigStatus();
    console.log('当前服务配置:', configStatus);
    
    // 运行各个服务测试
    await this.testAuthService();
    await this.testDatabaseService();
    await this.testAIService();
    
    console.log('🎉 所有测试完成');
  }
}

// 导出测试函数，方便在控制台中使用
(window as any).ServiceFactoryTest = ServiceFactoryTest;

console.log('📋 服务工厂测试已加载');
console.log('💡 在控制台中运行 ServiceFactoryTest.runAllTests() 开始测试');
console.log('💡 或运行单个测试：');
console.log('   ServiceFactoryTest.testAuthService()');
console.log('   ServiceFactoryTest.testDatabaseService()');
console.log('   ServiceFactoryTest.testAIService()');

export default ServiceFactoryTest;
