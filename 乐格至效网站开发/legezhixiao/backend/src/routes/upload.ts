import express from 'express';
import { FileUploadController } from '../controllers/fileUploadController';
import { uploadNovelFile } from '../middleware/uploadMiddleware';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const uploadController = new FileUploadController();

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取支持的文件格式
router.get('/formats', uploadController.getSupportedFormats);

// 上传并解析小说文件（预览）
router.post('/parse', uploadNovelFile, uploadController.uploadNovelFile);

// 导入小说到新项目
router.post('/import/new-project', uploadNovelFile, uploadController.importToNewProject);

// 导入小说到现有项目
router.post('/import/existing-project', uploadNovelFile, uploadController.importToExistingProject);

export default router;
