import axios from 'axios'

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

    // 构建针对不同类型请求的提示词
    private buildPrompt(request: AIRequest): string {
        const { message, context, type = 'general' } = request

        let prompt = ''

        switch (type) {
            case 'continuation':
                prompt = `当前小说内容：\n${context || ''}\n\n用户请求：${message}\n\n请为这段小说内容提供续写建议，要求：
1. 保持情节连贯性和人物一致性
2. 提供2-3个可能的发展方向
3. 每个建议100-200字
4. 保持原有的写作风格`
                break

            case 'improvement':
                prompt = `需要改进的文本：\n${context || ''}\n\n用户请求：${message}\n\n请分析这段文本并提供改进建议，包括：
1. 写作技巧方面的建议
2. 情节结构的优化
3. 人物描写的改进
4. 语言表达的提升`
                break

            case 'correction':
                prompt = `需要修正的文本：\n${context || ''}\n\n用户请求：${message}\n\n请检查这段文本并提供修正建议，重点关注：
1. 语法错误
2. 逻辑漏洞
3. 情节矛盾
4. 表达不清的地方`
                break

            default:
                prompt = `用户请求：${message}\n\n${context ? `相关内容：\n${context}\n\n` : ''}请提供专业的小说创作建议和指导。`
                break
        }

        return prompt
    }

    // 调用AI API
    async generateResponse(request: AIRequest): Promise<AIResponse> {
        try {
            const provider = AI_SERVICE_CONFIG.providers[this.config.provider]
            
            if (!provider) {
                throw new Error(`不支持的AI服务提供商: ${this.config.provider}`)
            }

            const prompt = this.buildPrompt(request)
            
            // 构建请求消息
            const messages: AIMessage[] = [
                ...this.conversationHistory,
                { role: 'user', content: prompt }
            ]

            // 根据不同的提供商构建请求
            const requestData = this.buildRequestData(provider, messages, request)
            
            console.log('🔗 准备发送API请求:')
            console.log('- API URL:', this.config.customApiUrl || provider.apiUrl)
            console.log('- 模型:', this.config.model)
            console.log('- 密钥状态:', this.config.apiKey ? `sk-***${this.config.apiKey.slice(-4)}` : '未设置')
            console.log('- 请求数据:', requestData)
            
            // 发送请求
            const response = await axios.post(
                this.config.customApiUrl || provider.apiUrl,
                requestData,
                {
                    headers: {
                        ...provider.headers(this.config.apiKey || ''),
                        'Accept': 'application/json'
                    },
                    timeout: 30000,
                    withCredentials: false  // 避免CORS问题
                }
            )
            
            console.log('✅ API请求成功，状态码:', response.status)

            // 解析响应
            const aiResponse = this.parseResponse(response.data, request.type || 'general')
            
            // 更新对话历史
            this.conversationHistory.push(
                { role: 'user', content: prompt },
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
            console.error('❌ AI API调用失败:')
            console.error('- 错误类型:', error.constructor.name)
            console.error('- 错误消息:', error.message)
            
            if (error.response) {
                console.error('- HTTP状态码:', error.response.status)
                console.error('- 响应数据:', error.response.data)
                console.error('- 响应头:', error.response.headers)
            } else if (error.request) {
                console.error('- 请求配置:', error.config)
                console.error('- 没有收到响应')
            }
            
            // 返回错误响应
            return {
                id: Date.now().toString(),
                type: request.type || 'general',
                text: '抱歉，AI服务暂时不可用。请检查网络连接或API配置，稍后再试。',
                confidence: 0,
                reason: `服务错误: ${error.message}`,
                provider: this.config.provider
            }
        }
    }

    // 构建不同提供商的请求数据
    private buildRequestData(provider: any, messages: AIMessage[], request: AIRequest) {
        const baseData = {
            model: this.config.model || provider.model,
            messages: messages,
            max_tokens: request.maxTokens || 1000,
            temperature: 0.7
        }

        // SiliconFlow 使用OpenAI兼容格式
        return baseData
    }

    // 解析AI响应
    private parseResponse(data: any, type: string): AIResponse {
        let content = ''
        
        try {
            // SiliconFlow 使用OpenAI兼容格式
            content = data.choices?.[0]?.message?.content || ''
        } catch (error) {
            console.error('解析AI响应失败:', error)
            content = '解析响应失败'
        }

        return {
            id: Date.now().toString(),
            type: type as any,
            text: content.trim() || '暂无建议',
            confidence: this.calculateConfidence(content),
            reason: this.getReasonByType(type),
            provider: this.config.provider
        }
    }

    // 计算置信度（简单实现）
    private calculateConfidence(content: string): number {
        const length = content.length
        if (length > 200) return 0.9
        if (length > 100) return 0.8
        if (length > 50) return 0.7
        return 0.6
    }

    // 根据类型获取原因说明
    private getReasonByType(type: string): string {
        switch (type) {
            case 'continuation': return '续写建议'
            case 'improvement': return '改进建议'
            case 'correction': return '修正建议'
            default: return 'AI建议'
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
