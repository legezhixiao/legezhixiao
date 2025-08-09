// Mock版本的useRxDB Hook - 用于App.full.tsx编译
// 提供基础的接口而不实现复杂的RxDB功能

export const useRxDB = () => {
  return {
    isInitialized: true,
    syncState: 'idle' as const,
    error: null,
    forceSync: () => Promise.resolve(),
    clearCache: () => Promise.resolve(),
    exportData: () => Promise.resolve(''),
    importData: (_data: string) => Promise.resolve()
  }
}

export const useUser = (_userId: string) => {
  return {
    user: {
      username: 'test_user',
      email: 'test@example.com',
      preferences: {
        theme: 'light',
        autoSave: true
      },
      createdAt: new Date().toISOString()
    },
    createUser: (_userData: any) => Promise.resolve(),
    updateUser: (_userData: any) => Promise.resolve()
  }
}

export const useProjects = (_userId: string) => {
  return {
    projects: [
      {
        id: 'test-project-1',
        title: '测试小说',
        description: '这是一个测试小说项目',
        status: 'active',
        currentWordCount: 1250,
        wordCountGoal: 50000
      }
    ],
    createProject: (_projectData: any) => Promise.resolve({
      id: 'new-project-' + Date.now(),
      title: _projectData.title || '新建项目',
      description: _projectData.description || '',
      status: 'active',
      currentWordCount: 0,
      wordCountGoal: 50000
    }),
    updateProject: (_projectData: any) => Promise.resolve()
  }
}

export const useChapters = (_projectId: string) => {
  return {
    chapters: [
      {
        id: 'test-chapter-1',
        title: '第一章：开始',
        summary: '故事的开始',
        status: 'active',
        wordCount: 1250,
        readingTime: 5,
        content: '这是第一章的内容，讲述了故事的开始...'
      }
    ],
    createChapter: (_chapterData: any) => Promise.resolve({
      id: 'new-chapter-' + Date.now(),
      title: _chapterData.title || '新章节',
      summary: _chapterData.summary || '',
      status: 'active',
      wordCount: 0,
      readingTime: 0,
      content: ''
    }),
    updateChapter: (_chapterId: string, _chapterData: any) => Promise.resolve()
  }
}

export const useWritingStats = (_userId: string) => {
  return {
    stats: {
      totalWords: 125000,
      todayWords: 1250,
      weekWords: 8500,
      monthWords: 32000,
      totalChapters: 15,
      totalProjects: 3,
      currentStreak: 7,
      recentSessions: []
    }
  }
}
