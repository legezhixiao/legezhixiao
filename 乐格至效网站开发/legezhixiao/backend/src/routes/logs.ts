import { Router } from 'express';
import { FrontendLogController } from '../controllers/frontendLogController';
import { requestTracker } from '../middleware/requestLogger';

const router = Router();

// 应用请求追踪中间件
router.use(requestTracker);

// 前端日志接收
router.post('/frontend', FrontendLogController.receiveLogs);

// 前端日志统计
router.get('/frontend/stats', FrontendLogController.getLogStats);

export default router;
