import express from 'express';
import { handleChatRequest, healthCheck, getAIConfig } from '../controllers/aiController';

const router = express.Router();

// AI助手对话接口
router.post('/chat', handleChatRequest);

// AI服务健康检查
router.get('/health', healthCheck);

// 获取AI配置信息
router.get('/config', getAIConfig);

// 基础信息接口
router.get('/', (req, res) => {
  res.json({
    message: 'AI 服务已就绪',
    status: 'active',
    endpoints: {
      chat: 'POST /api/ai/chat',
      health: 'GET /api/ai/health',
      config: 'GET /api/ai/config'
    }
  });
});

export default router;
