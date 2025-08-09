import { Router } from 'express';
import { WritingStatsController } from '../controllers/writingStatsController.new';

const router = Router();

// 实例化控制器
const writingStatsController = new WritingStatsController();

// 写作统计相关路由
router.get('/user', writingStatsController.getUserStats);
router.get('/projects/:projectId', writingStatsController.getProjectStats);
router.post('/goals', writingStatsController.updateWritingGoal);
router.post('/sessions', writingStatsController.recordWritingSession);
router.get('/habits', writingStatsController.getWritingHabits);
router.get('/achievements', writingStatsController.getAchievements);
router.get('/export', writingStatsController.exportWritingReport);

export default router;
