import express from 'express';
import ProjectControllerArangoDB from '../controllers/ProjectControllerArangoDB';

const router = express.Router();
const projectController = new ProjectControllerArangoDB();

// 获取用户的所有项目
router.get('/', projectController.getProjects);

// 创建新项目
router.post('/', projectController.createProject);

// 搜索项目
router.get('/search', projectController.searchProjects);

// 获取项目统计
router.get('/stats', projectController.getProjectStats);

// 获取单个项目详情
router.get('/:projectId', projectController.getProjectById);

// 更新项目信息
router.put('/:projectId', projectController.updateProject);

// 删除项目
router.delete('/:projectId', projectController.deleteProject);

export default router;
