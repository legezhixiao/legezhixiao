import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { 
  aiAgentService, 
  AIAgentResponse, 
  AIAgentContext, 
  AIAgentExecutedAction 
} from '../services/aiAgentService'
import { useAppStore } from '../store/appStore'
import { Character } from '../types'

export interface UseAIAgentResult {
  // 状态
  isProcessing: boolean
  context: AIAgentContext
  lastResponse: AIAgentResponse | null
  actionHistory: AIAgentExecutedAction[]
  
  // 方法
  processUserInput: (input: string) => Promise<AIAgentResponse | null>
  executeAction: (actionType: string, params: any) => Promise<any>
  updateContext: (updates: Partial<AIAgentContext>) => void
  clearHistory: () => void
  getAvailableActions: () => string[]
  
  // 快捷方法
  createCharacter: (characterData: any) => Promise<any>
  continueWriting: () => Promise<any>
  analyzeCurrentChapter: () => Promise<any>
  suggestNextAction: () => Promise<string[]>
}

export const useAIAgent = (): UseAIAgentResult => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [context, setContext] = useState<AIAgentContext>(aiAgentService.getContext())
  const [lastResponse, setLastResponse] = useState<AIAgentResponse | null>(null)
  const [actionHistory, setActionHistory] = useState<AIAgentExecutedAction[]>([])

  const { 
    currentProject, 
    currentChapter, 
    addProject,
    updateProject,
    setCurrentChapter
  } = useAppStore()

  // 从当前项目中获取角色列表
  const characters: Character[] = currentProject?.characters || []

  // 同步项目状态到AI Agent上下文
  useEffect(() => {
    const newContext = {
      currentProject: currentProject || undefined,
      currentChapter: currentChapter || undefined,
      currentCharacters: characters,
      userInput: context.userInput,
      conversationHistory: context.conversationHistory
    }
    
    aiAgentService.updateContext(newContext)
    setContext(newContext)
  }, [currentProject, currentChapter, characters, context.userInput, context.conversationHistory])

  // 处理用户输入
  const processUserInput = useCallback(async (input: string): Promise<AIAgentResponse | null> => {
    if (isProcessing) {
      message.warning('AI助手正在处理中，请稍候...')
      return null
    }

    setIsProcessing(true)
    
    try {
      const response = await aiAgentService.processUserInput(input)
      
      // 更新状态
      setLastResponse(response)
      if (response.context) {
        setContext(response.context)
      }
      if (response.actions) {
        setActionHistory(prev => [...prev, ...response.actions!])
        // 根据执行的动作更新UI状态
        await handleActionResults(response.actions)
        // 显示成功消息
        if (response.actions.length > 0) {
          message.success(`已执行 ${response.actions.length} 个动作`)
        }
      }
      
      return response
    } catch (error) {
      message.error(`AI助手处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      console.error('AI Agent处理失败:', error)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing])

  // 处理动作执行结果，更新前端状态
  const handleActionResults = async (actions: AIAgentExecutedAction[]) => {
    for (const action of actions) {
      if (!action.success) continue

      switch (action.actionType) {
        case 'create_project':
          if (action.result.project) {
            addProject(action.result.project)
            message.success(`项目 "${action.result.project.title}" 创建成功`)
          }
          break

        case 'create_character':
          if (action.result.character && currentProject) {
            const updatedProject = {
              ...currentProject,
              characters: [...(currentProject.characters || []), action.result.character]
            }
            updateProject(currentProject.id, updatedProject)
            message.success(`角色 "${action.result.character.name}" 创建成功`)
          }
          break

        case 'create_chapter':
          if (action.result.chapter && currentProject) {
            const updatedProject = {
              ...currentProject,
              chapters: [...(currentProject.chapters || []), action.result.chapter]
            }
            updateProject(currentProject.id, updatedProject)
            setCurrentChapter(action.result.chapter)
            message.success(`章节 "${action.result.chapter.title}" 创建成功`)
          }
          break

        case 'write_content':
        case 'continue_writing':
          if (action.result.newContent && currentChapter && currentProject) {
            const updatedChapter = {
              ...currentChapter,
              content: currentChapter.content + '\n\n' + action.result.newContent,
              wordCount: action.result.totalWords || currentChapter.wordCount
            }
            
            // 更新项目中的章节
            const updatedChapters = currentProject.chapters?.map(ch => 
              ch.id === currentChapter.id ? updatedChapter : ch
            ) || []
            
            updateProject(currentProject.id, { 
              ...currentProject, 
              chapters: updatedChapters 
            })
            setCurrentChapter(updatedChapter)
            message.success(`已添加 ${action.result.newContent.length} 字内容`)
          }
          break

        default:
          console.log('未处理的动作类型:', action.actionType)
      }
    }
  }

  // 直接执行指定动作
  const executeAction = useCallback(async (actionType: string, params: any) => {
    setIsProcessing(true)
    
    try {
      // 这里需要通过反射或其他方式访问private actions
      // 暂时使用processUserInput的方式，将参数信息包含在输入中
      const paramString = params ? JSON.stringify(params) : ''
      const response = await aiAgentService.processUserInput(`执行动作: ${actionType} ${paramString}`)
      
      if (response && response.actions && response.actions.length > 0) {
        await handleActionResults(response.actions)
        return response.actions[0].result
      }
      
      throw new Error('动作执行失败')
    } catch (error) {
      message.error(`执行动作失败: ${error instanceof Error ? error.message : '未知错误'}`)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // 更新上下文
  const updateContext = useCallback((updates: Partial<AIAgentContext>) => {
    const newContext = { ...context, ...updates }
    aiAgentService.updateContext(newContext)
    setContext(newContext)
  }, [context])

  // 清除历史记录
  const clearHistory = useCallback(() => {
    setActionHistory([])
    setLastResponse(null)
    updateContext({ conversationHistory: [] })
  }, [updateContext])

  // 获取可用动作
  const getAvailableActions = useCallback(() => {
    return aiAgentService.getAvailableActions()
  }, [])

  // 快捷方法：创建角色
  const createCharacter = useCallback(async (characterData: any) => {
    const input = `创建一个角色，姓名：${characterData.name}，角色：${characterData.role || '配角'}，背景：${characterData.background || '待补充'}`
    const response = await processUserInput(input)
    return response?.actions?.[0]?.result || null
  }, [processUserInput])

  // 快捷方法：续写内容
  const continueWriting = useCallback(async () => {
    if (!currentChapter) {
      message.warning('请先选择或创建一个章节')
      return null
    }
    const response = await processUserInput('继续写作当前章节')
    return response?.actions?.[0]?.result || null
  }, [processUserInput, currentChapter])

  // 快捷方法：分析当前章节
  const analyzeCurrentChapter = useCallback(async () => {
    if (!currentChapter?.content) {
      message.warning('当前章节没有内容可以分析')
      return null
    }
    const response = await processUserInput(`分析当前章节内容：${currentChapter.content.slice(0, 200)}...`)
    return response?.actions?.[0]?.result || null
  }, [processUserInput, currentChapter])

  // 快捷方法：建议下一步操作
  const suggestNextAction = useCallback(async (): Promise<string[]> => {
    const suggestions = []
    
    if (!currentProject) {
      suggestions.push('创建新项目')
    } else {
      if (!characters.length) {
        suggestions.push('创建主要角色')
      }
      
      if (!currentProject.chapters?.length) {
        suggestions.push('创建第一个章节')
      } else if ((currentChapter?.content?.length || 0) < 500) {
        suggestions.push('继续写作当前章节')
      }
      
      if (characters.length > 0 && currentChapter?.content) {
        suggestions.push('分析当前章节')
        suggestions.push('优化文本内容')
      }
    }
    
    return suggestions
  }, [currentProject, currentChapter, characters])

  return {
    // 状态
    isProcessing,
    context,
    lastResponse,
    actionHistory,
    
    // 方法
    processUserInput,
    executeAction,
    updateContext,
    clearHistory,
    getAvailableActions,
    
    // 快捷方法
    createCharacter,
    continueWriting,
    analyzeCurrentChapter,
    suggestNextAction
  }
}

export default useAIAgent
