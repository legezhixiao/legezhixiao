import express from 'express';
const path = require('path');
const databaseConfig = require(path.join(__dirname, '../config/databaseAdapter')).default;

const router = express.Router();

// 数据库状态接口
router.get('/', (req, res) => {
  try {
    if (!databaseConfig || typeof databaseConfig.getConnectionStatus !== 'function') {
      return res.status(500).json({ 
        error: 'databaseConfig 未正确初始化',
        timestamp: new Date().toISOString()
      });
    }
    const status = databaseConfig.getConnectionStatus();
    return res.json({
      arangodb: status.arangodb,
      status: status.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取数据库状态失败:', error);
    return res.status(500).json({ 
      error: '获取数据库状态失败',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
