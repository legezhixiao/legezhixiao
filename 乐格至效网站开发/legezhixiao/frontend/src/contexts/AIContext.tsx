import React, { createContext, useContext, useState, useCallback } from 'react'
import { message } from 'antd'
import { useAppStore } from '../store/appStore'
import AIServiceManager from '../services/aiService'
import type { AIConversation, AIMessage, ConversationContext } from '../types'

interface AIContextType {
  // 对话管理
  conversations: AIConversation[]
  currentConversation: AIConversation | null
  isGenerating: boolean
  
  // 小说关联
  currentProjectId: string | null
  currentChapterId: string | null
  
  // 操作方法
  createConversation: (title: string, projectId?: string, chapterId?: string) => AIConversation
  switchConversation: (conversationId: string) => void
  deleteConversation: (conversationId: string) => void
  sendMessage: (content: string) => Promise<void>
  setProjectContext: (projectId: string | null, chapterId?: string | null) => void
  updateConversationProject: (conversationId: string, projectId: string | null) => void
  
  // 上下文管理
  getContextualPrompt: () => string
  getActiveContext: () => ConversationContext
}

const AIContext = createContext<AIContextType | null>(null)

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within AIProvider')
  }
  return context
}

interface AIProviderProps {
  children: React.ReactNode
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null)
  
  const { projects } = useAppStore()

  // 创建新对话
  const createConversation = useCallback((
    title: string,
    projectId?: string,
    chapterId?: string
  ): AIConversation => {
    const newConversation: AIConversation = {
      id: Date.now().toString(),
      title,
      projectId: projectId || currentProjectId || undefined,
      chapterId: chapterId || currentChapterId || undefined,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }

    setConversations(prev => [newConversation, ...prev])
    setCurrentConversation(newConversation)
    return newConversation
  }, [currentProjectId, currentChapterId])

  // 切换对话
  const switchConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversation(conversation)
      // 自动切换到对话关联的小说上下文
      if (conversation.projectId !== currentProjectId) {
        setCurrentProjectId(conversation.projectId || null)
      }
      if (conversation.chapterId !== currentChapterId) {
        setCurrentChapterId(conversation.chapterId || null)
      }
    }
  }, [conversations, currentProjectId, currentChapterId])

  // 删除对话
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId))
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
    }
  }, [currentConversation])

  // 获取活跃上下文
  const getActiveContext = useCallback((): ConversationContext => {
    const context: ConversationContext = {}
    
    if (currentProjectId) {
      const project = projects.find(p => p.id === currentProjectId)
      if (project) {
        context.projectSummary = project.title
        context.activeCharacters = project.characters.map(c => c.name)
        context.plotStage = `${project.currentWords}/${project.targetWords}字`
        
        if (currentChapterId) {
          const chapter = project.chapters.find(c => c.id === currentChapterId)
          if (chapter) {
            context.currentChapter = chapter.title
          }
        }
      }
    }
    
    return context
  }, [currentProjectId, currentChapterId, projects])

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) return

    setIsGenerating(true)
    try {
      // 添加用户消息
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
      }

      // 获取当前上下文
      const context = getActiveContext()

      // 更新对话
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
        context,
        updatedAt: new Date()
      }

      setCurrentConversation(updatedConversation)
      setConversations(prev => 
        prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
      )

      // 调用真实的AI服务
      const aiService = AIServiceManager.getInstance()
      const aiResponse = await aiService.generateResponse({
        message: content,
        context: context.projectSummary ? `当前小说: ${context.projectSummary}` : undefined,
        type: 'general'
      })

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.text,
        timestamp: new Date(),
        metadata: {
          relatedChapter: currentChapterId || undefined,
          suggestedChanges: [`置信度: ${aiResponse.confidence}`, `提供商: ${aiResponse.provider}`]
        }
      }

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        updatedAt: new Date()
      }

      setCurrentConversation(finalConversation)
      setConversations(prev => 
        prev.map(c => c.id === finalConversation.id ? finalConversation : c)
      )
      setIsGenerating(false)

    } catch (error) {
      console.error('AI响应失败:', error)
      message.error('AI响应失败，请重试')
      setIsGenerating(false)
    }
  }, [currentConversation, currentChapterId, getActiveContext])

  // 设置小说上下文
  const setProjectContext = useCallback((
    projectId: string | null,
    chapterId: string | null = null
  ) => {
    setCurrentProjectId(projectId)
    setCurrentChapterId(chapterId)
    
    // 如果当前有对话，更新其小说关联
    if (currentConversation) {
      const updatedConversation = {
        ...currentConversation,
        projectId: projectId || undefined,
        chapterId: chapterId || undefined,
        updatedAt: new Date()
      }
      setCurrentConversation(updatedConversation)
      setConversations(prev => 
        prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
      )
    }
  }, [currentConversation])

  // 更新对话的小说关联
  const updateConversationProject = useCallback((
    conversationId: string,
    projectId: string | null
  ) => {
    setConversations(prev => 
      prev.map(c => c.id === conversationId ? {
        ...c,
        projectId: projectId || undefined,
        updatedAt: new Date()
      } : c)
    )
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? {
        ...prev,
        projectId: projectId || undefined,
        updatedAt: new Date()
      } : null)
    }
  }, [currentConversation])

  // 获取上下文化的提示词
  const getContextualPrompt = useCallback((): string => {
    let prompt = '你是一个专业的小说写作助手。'
    
    if (currentProjectId) {
      const project = projects.find(p => p.id === currentProjectId)
      if (project) {
        prompt += `\n\n当前小说信息:
- 小说名称: ${project.title}
- 类型: ${Array.isArray(project.genre) ? project.genre.join('、') : project.genre}
- 简介: ${project.description}
- 目标字数: ${project.targetWords.toLocaleString()}字
- 当前字数: ${project.currentWords.toLocaleString()}字`

        if (project.characters.length > 0) {
          prompt += `\n- 主要角色: ${project.characters.map(c => c.name).join('、')}`
        }

        if (currentChapterId) {
          const chapter = project.chapters.find(c => c.id === currentChapterId)
          if (chapter) {
            prompt += `\n- 当前章节: ${chapter.title}
- 章节概要: ${chapter.summary || '暂无'}
- 章节字数: ${chapter.wordCount}字`
          }
        }
      }
    }

    prompt += '\n\n请基于以上信息为用户提供精准的写作建议。'
    return prompt
  }, [currentProjectId, currentChapterId, projects])

  const value: AIContextType = {
    conversations,
    currentConversation,
    isGenerating,
    currentProjectId,
    currentChapterId,
    createConversation,
    switchConversation,
    deleteConversation,
    sendMessage,
    setProjectContext,
    updateConversationProject,
    getContextualPrompt,
    getActiveContext
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}

export default AIProvider
