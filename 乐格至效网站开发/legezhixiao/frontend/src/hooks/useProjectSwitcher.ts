import { useEditor } from '../contexts/EditorContext'
import { message } from 'antd'

export const useProjectSwitcher = () => {
    const { sessionManager, setCurrentProjectId, setCurrentProjectTitle } = useEditor()

    const switchToProject = (projectId: string, projectTitle?: string) => {
        const title = projectTitle || `小说 ${projectId}`
        
        // 更新当前小说
        setCurrentProjectId(projectId)
        setCurrentProjectTitle(title)
        
        // 获取小说会话（如果不存在会自动创建）
        // 注意：sessionManager没有getProjectSession方法，这里模拟创建一个临时会话
        const session = {
            projectId,
            title,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        message.success(`已切换到 ${title}`)
        
        return session
    }

    const createNewProject = (projectTitle: string) => {
        const projectId = `project_${Date.now()}`
        return switchToProject(projectId, projectTitle)
    }

    const getAllProjects = () => {
        return sessionManager.getSessionSummaries()
    }

    const deleteProject = (projectId: string) => {
        sessionManager.deleteProjectSession(projectId)
        message.success('小说已删除')
    }

    const searchAcrossProjects = (query: string) => {
        return sessionManager.searchMessages(query)
    }

    return {
        switchToProject,
        createNewProject,
        getAllProjects,
        deleteProject,
        searchAcrossProjects
    }
}
