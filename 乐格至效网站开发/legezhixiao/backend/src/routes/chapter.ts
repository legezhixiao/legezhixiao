import express from 'express';
import { ChapterController } from '../controllers/chapterController';

const router = express.Router();
const controller = new ChapterController();

// 章节历史版本相关
router.get('/:chapterId/versions', controller.getChapterVersions);
router.get('/version/:versionId', controller.getChapterVersionDetail);
router.post('/version/:versionId/restore', controller.restoreChapterVersion);
router.get('/version/:versionIdA/diff/:versionIdB', controller.diffChapterVersions);

// 临时路由，稍后会完善
router.get('/', (req, res) => {
  res.json({
    message: '章节路由',
    status: 'coming soon'
  });
});

export default router;
