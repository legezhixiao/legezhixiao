import React, { useState } from 'react'; // useEffect保留用于未来的生命周期功能
import { useRxDB, useUser, useProjects, useChapters, useWritingStats } from '../hooks/useRxDB';
// import { DatabaseControls, SyncStatusIndicator } from '../components/RxDBProvider';

const RxDBTestPage: React.FC = () => {
  const { isInitialized } = useRxDB(); // syncState保留用于未来的同步状态显示
  const [testUserId] = useState('test_user_123');
  const [testProjectId, setTestProjectId] = useState<string>('');
  
  // 使用自定义 hooks
  const { user, createUser } = useUser(testUserId); // updateUser保留用于未来的用户更新功能
  const { projects, createProject } = useProjects(testUserId); // updateProject保留用于未来的项目更新功能
  const { chapters, createChapter, updateChapter } = useChapters(testProjectId);
  const { stats } = useWritingStats(testUserId);

  // 创建测试用户
  const handleCreateTestUser = async () => {
    try {
      await createUser({
        username: 'test_user',
        email: 'test@example.com',
        preferences: {
          theme: 'light',
          fontSize: 14,
          autoSave: true,
          language: 'zh-CN',
          timezone: 'Asia/Shanghai'
        },
        writingStats: {
          totalWords: 0,
          totalChapters: 0,
          totalProjects: 0,
          writingStreak: 0,
          lastActiveDate: new Date().toISOString()
        },
        achievements: [],
        socialLinks: []
      });
      console.log('✅ 测试用户创建成功');
    } catch (error) {
      console.error('❌ 创建测试用户失败:', error);
    }
  };

  // 创建测试项目
  const handleCreateTestProject = async () => {
    try {
      const project = await createProject({
        userId: testUserId,
        title: '测试小说项目',
        description: '这是一个用于测试RXDB功能的示例项目',
        genre: '科幻',
        tags: ['测试', 'RXDB', '示例'],
        status: 'writing',
        visibility: 'private',
        wordCountGoal: 50000,
        currentWordCount: 0,
        deadlines: [],
        collaborators: [],
        settings: {
          autoBackup: true,
          versionControl: true,
          commentingEnabled: true,
          suggestionsEnabled: true
        },
        metadata: {
          language: 'zh-CN',
          targetAudience: '成年人',
          estimatedLength: 50000,
          publicationPlan: '网络发布'
        },
        chapterOrder: []
      });
      setTestProjectId(project.id);
      console.log('✅ 测试项目创建成功:', project);
    } catch (error) {
      console.error('❌ 创建测试项目失败:', error);
    }
  };

  // 创建测试章节
  const handleCreateTestChapter = async () => {
    if (!testProjectId) {
      alert('请先创建项目');
      return;
    }

    try {
      await createChapter({
        projectId: testProjectId,
        userId: testUserId,
        title: '第一章：开始',
        content: '这是测试章节的内容。它包含了一些示例文字来测试RXDB的存储和同步功能。在这个章节中，我们将验证数据的持久化、实时更新和离线支持等特性。',
        summary: '测试章节的简要描述',
        orderIndex: 0,
        status: 'draft',
        tags: ['测试', '开篇'],
        notes: [],
        comments: [],
        revisions: [],
        wordCount: 42,
        characterCount: 126,
        readingTime: 1,
        aiAnalysis: {
          sentiment: 0.5,
          complexity: 0.3,
          suggestions: ['增加更多描述', '完善角色设定'],
          keywords: ['测试', 'RXDB', '功能'],
          lastAnalyzed: new Date().toISOString()
        }
      });
      console.log('✅ 测试章节创建成功');
    } catch (error) {
      console.error('❌ 创建测试章节失败:', error);
    }
  };

  // 更新章节内容
  const handleUpdateChapterContent = async () => {
    if (chapters.length === 0) {
      alert('请先创建章节');
      return;
    }

    try {
      const chapter = chapters[0];
      const updatedContent = chapter.content + '\n\n这是新增的内容，用于测试实时更新功能。更新时间：' + new Date().toLocaleString();
      
      await updateChapter(chapter.id, {
        content: updatedContent,
        status: 'in-progress'
      });
      console.log('✅ 章节内容更新成功');
    } catch (error) {
      console.error('❌ 更新章节失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            RXDB 功能测试页面
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            测试前端RXDB数据库的各项功能，包括数据创建、更新、同步等
          </p>
        </div>

        {/* 状态指示器 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">数据库状态</h3>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isInitialized ? '已初始化' : '未初始化'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">同步状态</h3>
            {/* <SyncStatusIndicator /> */}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">连接状态</h3>
            {/* <ConnectionStatus /> */}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">测试操作</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleCreateTestUser}
              disabled={!isInitialized}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              创建测试用户
            </button>
            
            <button
              onClick={handleCreateTestProject}
              disabled={!isInitialized || !user}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              创建测试项目
            </button>
            
            <button
              onClick={handleCreateTestChapter}
              disabled={!testProjectId}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              创建测试章节
            </button>
            
            <button
              onClick={handleUpdateChapterContent}
              disabled={chapters.length === 0}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              更新章节内容
            </button>
          </div>
        </div>

        {/* 数据展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 用户信息 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">用户信息</h3>
            {user ? (
              <div className="space-y-2 text-sm">
                <div><strong>用户名:</strong> {user.username}</div>
                <div><strong>邮箱:</strong> {user.email}</div>
                <div><strong>主题:</strong> {user.preferences.theme}</div>
                <div><strong>自动保存:</strong> {user.preferences.autoSave ? '开启' : '关闭'}</div>
                <div><strong>创建时间:</strong> {new Date(user.createdAt).toLocaleString()}</div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">暂无用户数据</p>
            )}
          </div>

          {/* 项目列表 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">项目列表 ({projects.length})</h3>
            <div className="space-y-3">
              {projects.map(project => (
                <div key={project.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div className="font-medium text-gray-900 dark:text-white">{project.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{project.description}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    状态: {project.status} | 字数: {project.currentWordCount}/{project.wordCountGoal}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">暂无项目数据</p>
              )}
            </div>
          </div>

          {/* 章节列表 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">章节列表 ({chapters.length})</h3>
            <div className="space-y-3">
              {chapters.map(chapter => (
                <div key={chapter.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div className="font-medium text-gray-900 dark:text-white">{chapter.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{chapter.summary}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    状态: {chapter.status} | 字数: {chapter.wordCount} | 阅读时间: {chapter.readingTime}分钟
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 max-h-20 overflow-y-auto">
                    {chapter.content.substring(0, 200)}...
                  </div>
                </div>
              ))}
              {chapters.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">暂无章节数据</p>
              )}
            </div>
          </div>

          {/* 写作统计 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">写作统计</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalWords}</div>
                <div className="text-gray-600 dark:text-gray-400">总字数</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalChapters}</div>
                <div className="text-gray-600 dark:text-gray-400">总章节</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalProjects}</div>
                <div className="text-gray-600 dark:text-gray-400">总项目</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.currentStreak}</div>
                <div className="text-gray-600 dark:text-gray-400">连续天数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 数据库管理 */}
        <div className="mt-8">
          {/* <DatabaseControls /> */}
        </div>
      </div>
    </div>
  );
};

export default RxDBTestPage;
