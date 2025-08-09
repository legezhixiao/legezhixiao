import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
    AppState,
    Chapter,
    NovelProject,
    UserPreferences
} from '../types'

interface AppStore extends AppState {
    // 小说相关
    projects: NovelProject[]
    setCurrentProject: (project: NovelProject | null) => void
    setCurrentChapter: (chapter: Chapter | null) => void
    addProject: (project: NovelProject) => void
    updateProject: (projectId: string, updates: Partial<NovelProject>) => void
    deleteProject: (projectId: string) => void

    // UI 状态
    setSidebarCollapsed: (collapsed: boolean) => void
    setTheme: (theme: 'light' | 'dark') => void
    setOnlineStatus: (isOnline: boolean) => void

    // 用户偏好
    preferences: UserPreferences
    updatePreferences: (preferences: Partial<UserPreferences>) => void
}

const defaultPreferences: UserPreferences = {
    autoSave: true,
    autoSaveInterval: 30,
    enableAISuggestions: true,
    constraintLevel: 'medium',
    editorTheme: 'vs-light',
    fontSize: 14,
    wordWrap: true,
    theme: 'light',
    lineHeight: 1.6
}

export const useAppStore = create<AppStore>()(
    persist(
        immer((set) => ({
            // 初始状态
            projects: [],
            currentProject: null,
            currentChapter: null,
            sidebarCollapsed: false,
            theme: 'light',
            isOnline: navigator.onLine,
            preferences: defaultPreferences,

            // 小说相关actions
            addProject: (project) =>
                set((state) => {
                    state.projects.push(project)
                }),

            updateProject: (projectId, updates) =>
                set((state) => {
                    const index = state.projects.findIndex(p => p.id === projectId)
                    if (index !== -1) {
                        state.projects[index] = { ...state.projects[index], ...updates }
                        // 如果更新的是当前小说，也更新当前小说状态
                        if (state.currentProject?.id === projectId) {
                            state.currentProject = state.projects[index]
                        }
                    }
                }),

            deleteProject: (projectId) =>
                set((state) => {
                    state.projects = state.projects.filter(p => p.id !== projectId)
                    // 如果删除的是当前小说，清空当前小说状态
                    if (state.currentProject?.id === projectId) {
                        state.currentProject = null
                        state.currentChapter = null
                    }
                }),

            setCurrentProject: (project) =>
                set((state) => {
                    state.currentProject = project
                    // 切换小说时清空当前章节
                    state.currentChapter = null
                }),

            setCurrentChapter: (chapter) =>
                set((state) => {
                    state.currentChapter = chapter
                }),

            // UI状态actions
            setSidebarCollapsed: (collapsed) =>
                set((state) => {
                    state.sidebarCollapsed = collapsed
                }),

            setTheme: (theme) =>
                set((state) => {
                    state.theme = theme
                }),

            setOnlineStatus: (isOnline) =>
                set((state) => {
                    state.isOnline = isOnline
                }),

            // 用户偏好actions
            updatePreferences: (newPreferences) =>
                set((state) => {
                    state.preferences = { ...state.preferences, ...newPreferences }
                }),
        })),
        {
            name: 'legezhixiao-app-store',
            // 持久化项目数据、用户偏好和UI状态
            partialize: (state) => ({
                projects: state.projects,
                currentProject: state.currentProject,
                currentChapter: state.currentChapter,
                sidebarCollapsed: state.sidebarCollapsed,
                theme: state.theme,
                preferences: state.preferences,
            }),
        }
    )
)

// 监听网络状态变化
window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true)
})

window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false)
})
