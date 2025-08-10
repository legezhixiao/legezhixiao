import KnowledgeGraphManager from './components/Writing/KnowledgeGraphManager';

function TestKnowledgeGraph() {
  return (
    <div style={{ height: '100vh', padding: '20px' }}>
      <h1>知识图谱管理器测试</h1>
      <KnowledgeGraphManager 
        projectId="test-project"
        onNodeSelect={(node) => console.log('节点选择:', node)}
        onRelationshipSelect={(rel) => console.log('关系选择:', rel)}
      />
    </div>
  );
}

export default TestKnowledgeGraph;
