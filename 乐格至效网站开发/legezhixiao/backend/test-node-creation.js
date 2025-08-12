const { arangoDBService } = require('./dist/services/arangoDBService.js');

async function testCreateNode() {
  try {
    console.log('=== 测试创建知识图谱节点 ===');
    
    const testData = {
      projectId: 'test-manual-123',
      type: 'CHARACTER',
      name: '测试角色',
      description: '这是一个测试角色',
      importance: 80,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('1. 直接创建节点...');
    const node = await arangoDBService.createKnowledgeGraphNode(testData);
    console.log('创建结果:', node);
    
    console.log('2. 测试analyzeContentForNodes...');
    const nodes = await arangoDBService.analyzeContentForNodes('test-analyze-123', '李明是一位年轻的侦探，他住在北京的一间小公寓里。');
    console.log('分析结果:', nodes);
    
    console.log('3. 检查数据是否存在...');
    const graph1 = await arangoDBService.getProjectGraph('test-manual-123');
    console.log('test-manual-123 图谱:', graph1);
    
    const graph2 = await arangoDBService.getProjectGraph('test-analyze-123');
    console.log('test-analyze-123 图谱:', graph2);
    
  } catch (error) {
    console.error('测试错误:', error);
  }
}

testCreateNode();
