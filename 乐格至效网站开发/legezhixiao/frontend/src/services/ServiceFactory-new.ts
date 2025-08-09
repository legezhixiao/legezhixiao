/**
 * 乐格至效 - 服务工厂类
 * 
 * 统一管理Mock服务和真实服务的切换
 * 根据环境配置自动选择合适的服务实现
 */

// 导入配置管理器
import { getServiceModeConfig } from '../config';

// 导入真实服务
import { realAuthService } from './realAuthService';
import { realArangoDBService } from './realArangoDBService';

/**
 * 服务工厂类
 * 根据环境配置自动选择Mock或真实服务
 */
class ServiceFactory {
  private static instance: ServiceFactory;
  private config = getServiceModeConfig();

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取服务工厂实例
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * 获取认证服务
   */
  public getAuthService() {
    if (this.config.useMockAuth) {
      console.log('🔧 使用Mock认证服务');
      return {
        // Mock认证服务
        login: async (credentials: any) => {
          console.log('Mock: 用户登录', credentials);
          await new Promise(resolve => setTimeout(resolve, 500)); // 模拟延迟
          const user = {
            id: 'mock-user-id',
            username: credentials.username || 'mockuser',
            email: credentials.email || 'mock@example.com',
            token: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
          };
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', user.token);
          return { success: true, user, token: user.token };
        },
        
        logout: async () => {
          console.log('Mock: 用户登出');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        },
        
        register: async (userData: any) => {
          console.log('Mock: 用户注册', userData);
          await new Promise(resolve => setTimeout(resolve, 800)); // 模拟延迟
          const user = {
            id: 'mock-user-id-' + Date.now(),
            username: userData.username,
            email: userData.email,
            token: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
          };
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', user.token);
          return { success: true, user, token: user.token };
        },
        
        refreshToken: async () => {
          console.log('Mock: 刷新Token');
          const newToken = 'mock-refreshed-token-' + Date.now();
          localStorage.setItem('token', newToken);
          return { success: true, token: newToken };
        },
        
        getCurrentUser: () => {
          const userStr = localStorage.getItem('user');
          return userStr ? JSON.parse(userStr) : null;
        },
        
        updateUserPreferences: async (preferences: any) => {
          console.log('Mock: 更新用户偏好设置', preferences);
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.preferences = { ...user.preferences, ...preferences };
            localStorage.setItem('user', JSON.stringify(user));
            return { success: true, user };
          }
          return { success: false, error: '用户未登录' };
        },
        
        isAuthenticated: () => {
          return !!localStorage.getItem('token');
        },
      };
    } else {
      console.log('🚀 使用真实认证服务');
      return realAuthService;
    }
  }

  /**
   * 获取数据库服务
   */
  public getDatabaseService() {
    if (this.config.useMockDB) {
      console.log('🔧 使用Mock数据库服务');
      // 使用localStorage模拟数据库
      const mockStorage = {
        users: JSON.parse(localStorage.getItem('mock_users') || '{}'),
        projects: JSON.parse(localStorage.getItem('mock_projects') || '{}'),
        chapters: JSON.parse(localStorage.getItem('mock_chapters') || '{}'),
      };

      const saveToStorage = () => {
        localStorage.setItem('mock_users', JSON.stringify(mockStorage.users));
        localStorage.setItem('mock_projects', JSON.stringify(mockStorage.projects));
        localStorage.setItem('mock_chapters', JSON.stringify(mockStorage.chapters));
      };

      return {
        // 连接管理
        connect: async () => {
          console.log('Mock: 数据库连接成功');
          return true;
        },
        disconnect: async () => {
          console.log('Mock: 数据库断开连接');
        },
        
        // 用户操作
        createUser: async (userData: any) => {
          const id = 'user-' + Date.now();
          const user = { id, ...userData, createdAt: new Date().toISOString() };
          mockStorage.users[id] = user;
          saveToStorage();
          console.log('Mock: 创建用户', user);
          return user;
        },
        
        getUserById: async (id: string) => {
          const user = mockStorage.users[id] || null;
          console.log('Mock: 获取用户', id, user);
          return user;
        },
        
        updateUser: async (id: string, userData: any) => {
          if (mockStorage.users[id]) {
            mockStorage.users[id] = { ...mockStorage.users[id], ...userData, updatedAt: new Date().toISOString() };
            saveToStorage();
            console.log('Mock: 更新用户', id, mockStorage.users[id]);
            return mockStorage.users[id];
          }
          return null;
        },
        
        deleteUser: async (id: string) => {
          if (mockStorage.users[id]) {
            delete mockStorage.users[id];
            saveToStorage();
            console.log('Mock: 删除用户', id);
            return true;
          }
          return false;
        },
        
        // 项目操作
        createProject: async (projectData: any) => {
          const id = 'project-' + Date.now();
          const project = { id, ...projectData, createdAt: new Date().toISOString() };
          mockStorage.projects[id] = project;
          saveToStorage();
          console.log('Mock: 创建项目', project);
          return project;
        },
        
        getProjectById: async (id: string) => {
          const project = mockStorage.projects[id] || null;
          console.log('Mock: 获取项目', id, project);
          return project;
        },
        
        getUserProjects: async (userId: string) => {
          const userProjects = Object.values(mockStorage.projects).filter((p: any) => p.userId === userId);
          console.log('Mock: 获取用户项目', userId, userProjects);
          return userProjects;
        },
        
        updateProject: async (id: string, projectData: any) => {
          if (mockStorage.projects[id]) {
            mockStorage.projects[id] = { ...mockStorage.projects[id], ...projectData, updatedAt: new Date().toISOString() };
            saveToStorage();
            console.log('Mock: 更新项目', id, mockStorage.projects[id]);
            return mockStorage.projects[id];
          }
          return null;
        },
        
        deleteProject: async (id: string) => {
          if (mockStorage.projects[id]) {
            delete mockStorage.projects[id];
            saveToStorage();
            console.log('Mock: 删除项目', id);
            return true;
          }
          return false;
        },
        
        // 章节操作
        createChapter: async (chapterId: string, chapterData: any) => {
          const chapter = { id: chapterId, ...chapterData, createdAt: new Date().toISOString() };
          mockStorage.chapters[chapterId] = chapter;
          saveToStorage();
          console.log('Mock: 创建章节', chapter);
          return chapter;
        },
        
        getChapter: async (chapterId: string) => {
          const chapter = mockStorage.chapters[chapterId] || null;
          console.log('Mock: 获取章节', chapterId, chapter);
          return chapter;
        },
        
        getProjectChapters: async (projectId: string) => {
          const projectChapters = Object.values(mockStorage.chapters)
            .filter((c: any) => c.projectId === projectId)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          console.log('Mock: 获取项目章节', projectId, projectChapters);
          return projectChapters;
        },
        
        updateChapter: async (chapterId: string, chapterData: any) => {
          if (mockStorage.chapters[chapterId]) {
            mockStorage.chapters[chapterId] = { ...mockStorage.chapters[chapterId], ...chapterData, updatedAt: new Date().toISOString() };
            saveToStorage();
            console.log('Mock: 更新章节', chapterId, mockStorage.chapters[chapterId]);
            return mockStorage.chapters[chapterId];
          }
          return null;
        },
        
        deleteChapter: async (chapterId: string) => {
          if (mockStorage.chapters[chapterId]) {
            delete mockStorage.chapters[chapterId];
            saveToStorage();
            console.log('Mock: 删除章节', chapterId);
            return true;
          }
          return false;
        },
      };
    } else {
      console.log('🚀 使用真实数据库服务');
      return realArangoDBService;
    }
  }

  /**
   * 获取AI服务
   */
  public getAIService(): any {
    if (this.config.useMockAI) {
      console.log('🔧 使用Mock AI服务');
      return {
        generateText: async (prompt: string, options?: any) => {
          console.log('Mock AI: 生成文本', prompt, options);
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 模拟1-3秒延迟
          
          // 根据提示内容生成不同的响应
          if (prompt.includes('小说') || prompt.includes('故事')) {
            return `基于您的要求"${prompt}"，这里是一个精彩的故事开头：

在这个充满奇迹与冒险的世界里，主人公踏上了一段前所未有的旅程。阳光透过古老的森林洒下斑驳的光影，远处传来神秘的呼唤声...

[这是AI模拟生成的内容，实际使用时将调用真实的AI服务]`;
          } else if (prompt.includes('角色') || prompt.includes('人物')) {
            return `根据您的角色设定"${prompt}"，这个角色具有以下特点：

性格特征：勇敢而富有智慧，具有强烈的正义感
外貌特征：高挑的身材，深邃的眼眸，充满决心的神情
技能特长：精通剑术，具有敏锐的洞察力
成长背景：来自一个古老的家族，承载着特殊的使命

[这是AI模拟生成的内容]`;
          } else {
            return `根据您的提示"${prompt}"生成的内容：

这是一段由AI智能生成的文本内容。在实际应用中，这里将会是根据您的具体需求量身定制的高质量内容。

[Mock AI服务 - 模拟响应]`;
          }
        },
        
        generateOutline: async (requirements: any) => {
          console.log('Mock AI: 生成大纲', requirements);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return {
            title: requirements.title || '未命名小说',
            genre: requirements.genre || '奇幻冒险',
            outline: {
              mainPlot: '主要情节线：主人公发现自己的特殊身份，踏上拯救世界的冒险旅程',
              subPlots: [
                '感情线：与重要角色的情感发展',
                '成长线：从普通人到英雄的转变',
                '悬疑线：揭开家族秘密的真相'
              ],
              chapters: [
                { 
                  id: 1, 
                  title: '第一章：觉醒', 
                  summary: '主人公发现自己的特殊能力，生活发生巨变',
                  keyEvents: ['神秘事件发生', '能力觉醒', '遇到导师']
                },
                { 
                  id: 2, 
                  title: '第二章：启程', 
                  summary: '踏上冒险之旅，遇到同伴',
                  keyEvents: ['离开家乡', '结识伙伴', '第一次战斗']
                },
                { 
                  id: 3, 
                  title: '第三章：试炼', 
                  summary: '面临重大挑战，团队磨合',
                  keyEvents: ['困难考验', '内部矛盾', '突破成长']
                },
                { 
                  id: 4, 
                  title: '第四章：真相', 
                  summary: '揭开背后的秘密，准备最终对决',
                  keyEvents: ['真相大白', '敌人现身', '决战准备']
                }
              ]
            },
            characters: [
              { name: '主角', role: '英雄', description: '拥有特殊能力的年轻人' },
              { name: '导师', role: '智者', description: '指引主角成长的长者' },
              { name: '伙伴', role: '同伴', description: '与主角并肩作战的朋友' },
              { name: '反派', role: '对手', description: '阻碍主角的强大敌人' }
            ]
          };
        },
        
        analyzeCharacter: async (characterData: any) => {
          console.log('Mock AI: 分析角色', characterData);
          await new Promise(resolve => setTimeout(resolve, 800));
          return {
            name: characterData.name || '未命名角色',
            analysis: {
              personality: {
                core: ['勇敢', '善良', '智慧'],
                positive: ['坚韧不拔', '富有同情心', '善于思考'],
                negative: ['有时过于冲动', '容易相信他人', '承担过多责任'],
                mbti: 'ENFJ - 主人公型人格'
              },
              background: {
                origin: '来自普通家庭，但拥有不凡的命运',
                motivation: '保护重要的人，维护世界和平',
                fears: '失去所爱之人，无法承担责任',
                goals: '成为真正的英雄，完成使命'
              },
              relationships: {
                family: '与家人关系深厚，是动力源泉',
                friends: '重视友谊，愿意为朋友牺牲',
                romantic: '情感真挚，但容易陷入纠结',
                enemies: '即使对敌人也保持基本的尊重'
              },
              developmentArc: {
                start: '迷茫的普通人，对自己缺乏信心',
                middle: '逐渐觉醒，学会运用自己的能力',
                end: '成熟的英雄，能够承担重大责任',
                keyMoments: [
                  '能力觉醒的震撼',
                  '第一次失败的挫折',
                  '重要抉择的考验',
                  '最终成长的蜕变'
                ]
              }
            },
            suggestions: [
              '可以增加一些角色的弱点和缺陷，让角色更加立体',
              '考虑添加一些特殊的习惯或口头禅，增加角色的识别度',
              '可以设计一些只有这个角色才有的独特技能或知识',
              '建议为角色设计一个标志性的物品或装备'
            ]
          };
        },
        
        generateDialogue: async (context: any) => {
          console.log('Mock AI: 生成对话', context);
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          const characters = context.characters || ['角色A', '角色B'];
          const situation = context.situation || '日常对话';
          const mood = context.mood || 'neutral';
          
          let dialogue = `# ${situation}\n\n`;
          
          if (mood === 'tense') {
            dialogue += `**${characters[0]}**："我们必须做出决定，时间不多了。"\n\n`;
            dialogue += `**${characters[1]}**："你确定这样做是对的吗？一旦开始就没有回头路了。"\n\n`;
            dialogue += `**${characters[0]}**："有些事情总要有人去做，不是吗？"\n\n`;
            dialogue += `**${characters[1]}**："...我明白了。那就一起吧。"`;
          } else if (mood === 'happy') {
            dialogue += `**${characters[0]}**："太好了！我们终于成功了！"\n\n`;
            dialogue += `**${characters[1]}**："是啊，这都多亏了大家的努力。"\n\n`;
            dialogue += `**${characters[0]}**："现在我们可以好好庆祝一下了！"\n\n`;
            dialogue += `**${characters[1]}**："哈哈，你说得对！"`;
          } else {
            dialogue += `**${characters[0]}**："最近怎么样？"\n\n`;
            dialogue += `**${characters[1]}**："还不错，你呢？"\n\n`;
            dialogue += `**${characters[0]}**："也挺好的，有什么新的计划吗？"\n\n`;
            dialogue += `**${characters[1]}**："正在考虑一些新的想法..."`;
          }
          
          dialogue += '\n\n[这是AI模拟生成的对话内容]';
          
          return dialogue;
        },
        
        improveText: async (text: string, type: string) => {
          console.log('Mock AI: 改进文本', text, type);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          let improvedText = '';
          
          switch (type) {
            case 'grammar':
              improvedText = `[语法优化版本]\n\n${text}\n\n[已修正语法错误，优化句式结构]`;
              break;
            case 'style':
              improvedText = `[文风优化版本]\n\n${text.replace(/。/g, '，增添了更多的细节描述。').replace(/，增添了更多的细节描述，增添了更多的细节描述/g, '，增添了生动的描述')}\n\n[已优化文字风格，使表达更加生动]`;
              break;
            case 'expand':
              improvedText = `[扩展版本]\n\n${text}\n\n在这个基础上，我们可以进一步展开：故事的背景更加丰富，人物的内心活动得到了深入的描绘，情节的发展也更加跌宕起伏。整个场景仿佛活了过来，读者能够身临其境地感受到其中的情感波动。\n\n[已扩展内容，增加了细节和深度]`;
              break;
            default:
              improvedText = `[优化版本]\n\n${text}\n\n[已根据${type}类型进行优化处理]`;
          }
          
          return improvedText;
        }
      };
    } else {
      console.log('🚀 使用真实AI服务');
      // TODO: 实现真实AI服务
      // 暂时返回Mock版本以避免错误
      return this.getAIService();
    }
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    this.config = getServiceModeConfig();
  }

  /**
   * 获取当前配置状态
   */
  public getConfigStatus() {
    return {
      useMockAuth: this.config.useMockAuth,
      useMockDB: this.config.useMockDB,
      useMockAI: this.config.useMockAI,
    };
  }
}

// 创建全局单例实例
const serviceFactory = ServiceFactory.getInstance();

// 在开发环境打印配置信息
if (process.env.NODE_ENV === 'development') {
  console.group('🏭 乐格至效 - 服务工厂配置');
  const status = serviceFactory.getConfigStatus();
  console.log('认证服务:', status.useMockAuth ? '🔧 Mock' : '🚀 真实');
  console.log('数据库服务:', status.useMockDB ? '🔧 Mock' : '🚀 真实');  
  console.log('AI服务:', status.useMockAI ? '🔧 Mock' : '🚀 真实');
  console.groupEnd();
}

// 导出服务工厂实例和便捷方法
export default serviceFactory;

// 导出便捷的服务获取方法
export const getAuthService = () => serviceFactory.getAuthService();
export const getDatabaseService = () => serviceFactory.getDatabaseService();
export const getAIService = () => serviceFactory.getAIService();

// 导出配置状态检查方法
export const getServiceConfigStatus = () => serviceFactory.getConfigStatus();
