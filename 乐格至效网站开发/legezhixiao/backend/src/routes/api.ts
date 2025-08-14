import { Router } from 'express';
import fileRoutes from './fileRoutes';

const router = Router();

// 文件上传相关路由
router.use('/files', fileRoutes);

export default router;
