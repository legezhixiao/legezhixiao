/**
 * 同步路由 - 简化版本
 * 提供基本的RXDB同步接口，用于测试
 */

import express from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sync service is running (简化模式)',
    timestamp: new Date().toISOString()
  });
});

// 拉取数据 (简化版本)
const collections = ['projects', 'chapters', 'characters', 'worldBuilding', 'writingSessions', 'writingGoals'];

collections.forEach(collectionName => {
  router.post(`/${collectionName}/pull`, auth, async (req, res) => {
    try {
      console.log(`📥 Pull request for ${collectionName} (模拟)`);
      
      // 返回空的文档列表
      res.json({
        documents: [],
        checkpoint: {
          id: `${collectionName}-checkpoint`,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`Pull error for ${collectionName}:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 推送数据 (简化版本)
  router.post(`/${collectionName}/push`, auth, async (req, res) => {
    try {
      console.log(`📤 Push request for ${collectionName} (模拟)`);
      const { newDocumentState } = req.body;
      
      console.log(`Received document for ${collectionName}:`, newDocumentState?.id || 'unknown');
      
      // 模拟处理成功
      res.json({
        success: true,
        message: `Document processed for ${collectionName}`,
        documentId: newDocumentState?.id || 'unknown'
      });
    } catch (error) {
      console.error(`Push error for ${collectionName}:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

// 同步状态
router.get('/status', auth, async (req, res) => {
  try {
    console.log('📊 Sync status request (模拟)');
    
    res.json({
      status: 'ok',
      collections: {
        projects: { count: 0, lastSync: new Date().toISOString() },
        chapters: { count: 0, lastSync: new Date().toISOString() },
        characters: { count: 0, lastSync: new Date().toISOString() },
        worldBuilding: { count: 0, lastSync: new Date().toISOString() },
        writingSessions: { count: 0, lastSync: new Date().toISOString() },
        writingGoals: { count: 0, lastSync: new Date().toISOString() }
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 强制同步
router.post('/force', auth, async (req, res) => {
  try {
    console.log('🔄 Force sync request (模拟)');
    
    res.json({
      success: true,
      message: 'Force sync completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Force sync error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
