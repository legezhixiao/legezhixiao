// 临时直接使用API密钥，确保功能正常
const SILICONFLOW_API_KEY = 'sk-mjithqmjwccqgffouexthbavtnvftwkqjludpcxhrmeztcib'

// AI服务配置
const AI_SERVICE_CONFIG = {
    // 可以配置不同的AI服务提供商
    providers: {
        siliconflow: {
            apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
            model: 'deepseek-ai/DeepSeek-V3',
            headers: (apiKey: string) => ({
                'Authorization': `Bearer ${apiKey || SILICONFLOW_API_KEY}`,
                'Content-Type': 'application/json'
            })
        }
    }
}

// AI服务类型定义
export interface AIMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface AIRequest {
    message: string
    context?: string
    type?: 'continuation' | 'improvement' | 'correction' | 'general'
    maxTokens?: number
}

export interface AIResponse {
    id: string
    type: 'continuation' | 'improvement' | 'correction' | 'general'
    text: string
    confidence: number
    reason: string
    provider: string
}

export interface AIServiceConfig {
    provider: keyof typeof AI_SERVICE_CONFIG.providers
    apiKey?: string
    customApiUrl?: string
    model?: string
}

// AI服务类
class AIService {
    private config: AIServiceConfig
    private conversationHistory: AIMessage[] = []

    constructor(config: AIServiceConfig) {
        this.config = config
        this.initializeSystemPrompt()
    }

    // 初始化系统提示词
    private initializeSystemPrompt() {
        this.conversationHistory = [{
            role: 'system',
            content: `你是乐格至效AI小说创作助手，专门帮助用户进行小说创作。你的主要功能包括：

1. 续写建议：根据用户当前的小说内容，提供合理的剧情续写建议
2. 改进建议：分析用户的文本，提供写作风格、情节结构、人物塑造等方面的改进建议
3. 修正建议：检查语法、逻辑、情节连贯性等问题，提供修正建议
4. 创作指导：提供小说创作的技巧、灵感和建议

请始终以专业、友好、富有创造力的方式回应用户，提供具体、实用的建议。回答要简洁明了，重点突出，适合在小窗口中显示。`
        }]
    }

    // 调用AI API - 使用本地后端API
    async generateResponse(request: AIRequest): Promise<AIResponse> {
        try {
            console.log('🔗 准备调用后端AI API:')
            console.log('- 请求类型:', request.type)
            console.log('- 消息内容:', request.message.substring(0, 50) + '...')
            
            // 调用本地后端API，自动包含认证头
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''}`
                },
                body: JSON.stringify({
                    message: request.message,
                    context: request.context,
                    type: request.type || 'general',
                    maxTokens: request.maxTokens || 1000
                })
            })
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            const aiResponse: AIResponse = await response.json()
            console.log('✅ 后端API请求成功，响应长度:', aiResponse.text.length)

            // 更新对话历史（用于前端显示）
            this.conversationHistory.push(
                { role: 'user', content: request.message },
                { role: 'assistant', content: aiResponse.text }
            )

            // 限制对话历史长度
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = [
                    this.conversationHistory[0], // 保留系统提示
                    ...this.conversationHistory.slice(-19)
                ]
            }

            return aiResponse

        } catch (error: any) {
            console.error('❌ 后端AI API调用失败:')
            console.error('- 错误类型:', error.constructor.name)
            console.error('- 错误消息:', error.message)
            
            // 返回错误响应
            return {
                id: Date.now().toString(),
                type: request.type || 'general',
                text: '抱歉，AI服务暂时不可用。请检查网络连接或稍后再试。\n\n错误详情: ' + error.message,
                confidence: 0,
                reason: `服务错误: ${error.message}`,
                provider: 'backend'
            }
        }
    }

    // 清除对话历史
    clearHistory() {
        this.initializeSystemPrompt()
    }

    // 更新配置
    updateConfig(newConfig: Partial<AIServiceConfig>) {
        this.config = { ...this.config, ...newConfig }
    }
}

// 导出AI服务实例管理器
class AIServiceManager {
    private static instance: AIService | null = null
    private static defaultConfig: AIServiceConfig = {
        provider: 'siliconflow', // 默认使用SiliconFlow
        model: 'deepseek-ai/DeepSeek-V3'
    }

    static getInstance(config?: AIServiceConfig): AIService {
        if (!this.instance || config) {
            // 如果没有提供配置，使用默认配置
            if (!config) {
                // 尝试从localStorage获取用户选择的模型
                const savedConfig = localStorage.getItem('ai-service-config')
                let selectedModel = 'deepseek-ai/DeepSeek-V3'
                
                if (savedConfig) {
                    try {
                        const parsed = JSON.parse(savedConfig)
                        selectedModel = parsed.model || selectedModel
                    } catch (error) {
                        console.error('解析保存的配置失败:', error)
                    }
                }
                
                config = {
                    provider: 'siliconflow',
                    apiKey: SILICONFLOW_API_KEY,
                    customApiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
                    model: selectedModel
                }
            }
            
            this.instance = new AIService(config || this.defaultConfig)
        }
        return this.instance
    }

    static updateConfig(config: Partial<AIServiceConfig>) {
        if (this.instance) {
            this.instance.updateConfig(config)
        } else {
            this.defaultConfig = { ...this.defaultConfig, ...config }
        }
    }

    static getProviders() {
        return Object.keys(AI_SERVICE_CONFIG.providers)
    }
}

export { AIService, AIServiceManager }
export default AIServiceManager
