import { Router } from 'express';
import { FileUploadController } from '../controllers/fileUploadController';
import { uploadNovelFile } from '../middleware/uploadMiddleware';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const fileUploadController = new FileUploadController();

// 获取支持的文件格式
router.get('/formats', fileUploadController.getSupportedFormats);

// 文件上传相关路由
router.post('/upload/novel',
  authenticate,
  uploadNovelFile,
  fileUploadController.uploadNovelFile
);

// 导入到新项目
router.post('/import/new',
  authenticate,
  uploadNovelFile,
  fileUploadController.importToNewProject
);

// 导入到现有项目
router.post('/import/existing',
  authenticate,
  uploadNovelFile,
  fileUploadController.importToExistingProject
);

export default router;
