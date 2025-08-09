import express from 'express';

const router = express.Router();

// 临时路由，稍后会完善
router.get('/', (req, res) => {
  res.json({
    message: '章节路由',
    status: 'coming soon'
  });
});

export default router;
