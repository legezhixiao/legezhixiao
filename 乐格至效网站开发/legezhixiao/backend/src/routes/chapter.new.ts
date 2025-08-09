import express from 'express';
import { ChapterController } from '../controllers/chapterController.new';

const router = express.Router();
const chapterController = new ChapterController();

// 获取项目的所有章节
router.get('/project/:projectId', chapterController.getChapters);

// 创建新章节
router.post('/project/:projectId', chapterController.createChapter);

// 获取单个章节详情
router.get('/:chapterId', chapterController.getChapterById);

// 更新章节
router.put('/:chapterId', chapterController.updateChapter);

// 删除章节
router.delete('/:chapterId', chapterController.deleteChapter);

// 自动保存章节
router.post('/:chapterId/autosave', chapterController.autoSaveChapter);

// 获取章节统计
router.get('/:chapterId/stats', chapterController.getChapterStats);

export default router;
