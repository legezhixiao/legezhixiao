import { Request, Response } from 'express';
import axios from 'axios';

// SiliconFlow API配置
const SILICONFLOW_API_KEY = 'sk-mjithqmjwccqgffouexthbavtnvftwkqjludpcxhrmeztcib';
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIRequest {
  message: string;
  context?: string;
  type?: 'continuation' | 'improvement' | 'correction' | 'general';
  maxTokens?: number;
}

interface AIResponse {
  id: string;
  type: 'continuation' | 'improvement' | 'correction' | 'general';
  text: string;
  confidence: number;
  reason: string;
  provider: string;
}

// AI助手对话处理
export const handleChatRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🤖 收到AI助手请求:', req.body);
    
    const { message, context, type = 'general', maxTokens = 1000 }: AIRequest = req.body;

    if (!message || message.trim().length === 0) {
      res.status(400).json({
        error: '消息内容不能为空',
        code: 'INVALID_MESSAGE'
      });
      return;
    }

    // 构建系统提示词
    const systemPrompt = `你是乐格至效AI小说创作助手，专门帮助用户进行小说创作。你的主要功能包括：

1. 续写建议：根据用户当前的小说内容，提供合理的剧情续写建议
2. 改进建议：分析用户的文本，提供写作风格、情节结构、人物塑造等方面的改进建议
3. 修正建议：检查语法、逻辑、情节连贯性等问题，提供修正建议
4. 创作指导：提供小说创作的技巧、灵感和建议

请始终以专业、友好、富有创造力的方式回应用户，提供具体、实用的建议。回答要简洁明了，重点突出，适合在小窗口中显示。`;

    // 根据类型构建用户提示词
    let userPrompt = '';
    switch (type) {
      case 'continuation':
        userPrompt = `当前小说内容：\n${context || ''}\n\n用户请求：${message}\n\n请为这段小说内容提供续写建议，要求：
1. 保持情节连贯性和人物一致性
2. 提供2-3个可能的发展方向
3. 每个建议100-200字
4. 保持原有的写作风格`;
        break;

      case 'improvement':
        userPrompt = `需要改进的文本：\n${context || ''}\n\n用户请求：${message}\n\n请分析这段文本并提供改进建议，包括：
1. 写作技巧方面的建议
2. 情节结构的优化
3. 人物描写的改进
4. 语言表达的提升`;
        break;

      case 'correction':
        userPrompt = `需要修正的文本：\n${context || ''}\n\n用户请求：${message}\n\n请检查这段文本并提供修正建议，重点关注：
1. 语法错误
2. 逻辑漏洞
3. 情节矛盾
4. 表达不清的地方`;
        break;

      default:
        userPrompt = `用户请求：${message}\n\n${context ? `相关内容：\n${context}\n\n` : ''}请提供专业的小说创作建议和指导。`;
        break;
    }

    // 构建消息
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('🔗 准备调用SiliconFlow API...');

    // 调用SiliconFlow API
    const response = await axios.post(
      SILICONFLOW_API_URL,
      {
        model: 'deepseek-ai/DeepSeek-V3',
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ SiliconFlow API 调用成功');

    // 提取AI回复
    const aiText = response.data.choices?.[0]?.message?.content || '';

    if (!aiText) {
      throw new Error('AI响应内容为空');
    }

    // 构建响应
    const aiResponse: AIResponse = {
      id: Date.now().toString(),
      type: type,
      text: aiText.trim(),
      confidence: calculateConfidence(aiText),
      reason: getReasonByType(type),
      provider: 'siliconflow'
    };

    console.log('📝 AI响应生成完成，长度:', aiText.length);

    res.json(aiResponse);

  } catch (error: any) {
    console.error('❌ AI助手处理失败:', error);
    
    let errorMessage = 'AI服务暂时不可用';
    let errorCode = 'AI_SERVICE_ERROR';

    if (error.response) {
      console.error('- HTTP状态码:', error.response.status);
      console.error('- 响应数据:', error.response.data);
      
      if (error.response.status === 401) {
        errorMessage = 'API密钥无效或已过期';
        errorCode = 'INVALID_API_KEY';
      } else if (error.response.status === 429) {
        errorMessage = 'API调用频率超限，请稍后再试';
        errorCode = 'RATE_LIMIT_EXCEEDED';
      } else if (error.response.status === 500) {
        errorMessage = 'AI服务内部错误';
        errorCode = 'AI_SERVICE_INTERNAL_ERROR';
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'AI服务请求超时';
      errorCode = 'REQUEST_TIMEOUT';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到AI服务';
      errorCode = 'CONNECTION_ERROR';
    }

    res.status(500).json({
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 计算置信度（简单实现）
function calculateConfidence(content: string): number {
  const length = content.length;
  if (length > 200) return 0.9;
  if (length > 100) return 0.8;
  if (length > 50) return 0.7;
  return 0.6;
}

// 根据类型获取原因说明
function getReasonByType(type: string): string {
  switch (type) {
    case 'continuation': return '续写建议';
    case 'improvement': return '改进建议';
    case 'correction': return '修正建议';
    default: return 'AI建议';
  }
}

// AI服务健康检查
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 AI服务健康检查...');
    
    // 发送简单的测试请求
    const response = await axios.post(
      SILICONFLOW_API_URL,
      {
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          { role: 'user', content: '测试连接，请回复"连接正常"' }
        ],
        max_tokens: 10,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const isHealthy = response.status === 200 && response.data.choices?.length > 0;
    const testResponse = response.data.choices?.[0]?.message?.content || 'No response';

    res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      provider: 'siliconflow',
      model: 'deepseek-ai/DeepSeek-V3',
      timestamp: new Date().toISOString(),
      response_time: Date.now() - parseInt(req.headers['x-request-start'] as string || '0'),
      test_response: testResponse.replace(/[^\x20-\x7E]/g, '').substring(0, 100) // 清理非ASCII字符并限制长度
    });

  } catch (error: any) {
    console.error('❌ AI服务健康检查失败:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      provider: 'siliconflow',
      model: 'deepseek-ai/DeepSeek-V3',
      timestamp: new Date().toISOString(),
      error: error.message,
      error_code: error.response?.status || 'UNKNOWN'
    });
  }
};

// 获取AI配置信息
export const getAIConfig = async (req: Request, res: Response): Promise<void> => {
  res.json({
    provider: 'siliconflow',
    model: 'deepseek-ai/DeepSeek-V3',
    available_models: [
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/deepseek-chat',
      'Qwen/Qwen2.5-72B-Instruct'
    ],
    features: [
      'chat',
      'continuation',
      'improvement',
      'correction',
      'creative_writing'
    ],
    limits: {
      max_tokens: 4000,
      max_context_length: 8000,
      rate_limit: '100 requests per minute'
    }
  });
};
