import { Router } from 'express';
import * as knowledgeGraphController from '../controllers/knowledgeGraphController';

const router = Router();

/**
 * 知识图谱路由
 * 提供完整的知识图谱API端点
 */

// 健康检查
router.get('/health', knowledgeGraphController.healthCheck);

// 项目图谱操作
router.get('/projects/:projectId/graph', knowledgeGraphController.getProjectGraph);
router.get('/projects/:projectId/analytics', knowledgeGraphController.getAnalytics);
router.get('/projects/:projectId/export', knowledgeGraphController.exportGraph);

// 节点操作
router.get('/projects/:projectId/nodes', knowledgeGraphController.searchNodes);
router.post('/projects/:projectId/nodes', knowledgeGraphController.createNode);
router.put('/nodes/:nodeId', knowledgeGraphController.updateNode);
router.delete('/nodes/:nodeId', knowledgeGraphController.deleteNode);
router.get('/nodes/:nodeId/relationships', knowledgeGraphController.getNodeRelationships);
router.get('/nodes/:nodeId/connected', knowledgeGraphController.getConnectedNodes);

// 关系操作
router.post('/projects/:projectId/relationships', knowledgeGraphController.createRelationship);
router.put('/relationships/:relationshipId', knowledgeGraphController.updateRelationship);
router.delete('/relationships/:relationshipId', knowledgeGraphController.deleteRelationship);

// 高级功能
router.post('/projects/:projectId/analyze', knowledgeGraphController.analyzeAndCreateNodes);
router.post('/projects/:projectId/search-related', knowledgeGraphController.searchRelatedNodes);
router.post('/path', knowledgeGraphController.findPath);

// 批量操作
router.post('/projects/:projectId/import/nodes', knowledgeGraphController.importNodes);
router.post('/projects/:projectId/import/relationships', knowledgeGraphController.importRelationships);

export default router;
