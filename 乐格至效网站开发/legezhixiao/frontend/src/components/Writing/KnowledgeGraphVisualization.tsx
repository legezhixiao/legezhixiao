import React, { useEffect, useRef, useState } from 'react';
import { Button, Space, Select, Slider, Card, Typography, Switch } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { GraphNode, GraphRelationship } from '../../services/knowledgeGraphService';

const { Text } = Typography;
const { Option } = Select;

interface KnowledgeGraphVisualizationProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  onNodeSelect?: (node: GraphNode) => void;
  onRelationshipSelect?: (relationship: GraphRelationship) => void;
  selectedNodeId?: string;
  selectedRelationshipId?: string;
}

interface VisualizationNode extends GraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius: number;
  color: string;
}

interface VisualizationLink {
  id: string;
  source: VisualizationNode;
  target: VisualizationNode;
  relationship: GraphRelationship;
  strength: number;
}

const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  nodes,
  relationships,
  onNodeSelect,
  onRelationshipSelect,
  selectedNodeId,
  selectedRelationshipId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [visualization, setVisualization] = useState<{
    nodes: VisualizationNode[];
    links: VisualizationLink[];
  }>({ nodes: [], links: [] });
  
  // 可视化设置
  const [settings, setSettings] = useState({
    nodeSize: 15,
    linkStrength: 0.5,
    showLabels: true,
    showRelationshipLabels: false,
    physics: true,
    colorScheme: 'type' as 'type' | 'importance',
    filterNodeType: 'all' as string,
    filterImportance: [0, 100] as [number, number]
  });

  // 节点类型颜色映射
  const getNodeColor = (node: GraphNode): string => {
    if (settings.colorScheme === 'importance') {
      const importance = node.importance || 50;
      const intensity = importance / 100;
      return `hsl(${60 - intensity * 60}, 70%, ${50 + intensity * 30}%)`;
    }

    const typeColors: Record<string, string> = {
      CHARACTER: '#ff6b6b',
      LOCATION: '#4ecdc4',
      EVENT: '#45b7d1',
      PLOT_POINT: '#96ceb4',
      ITEM: '#ffeaa7',
      CONCEPT: '#dda0dd'
    };
    return typeColors[node.type] || '#95a5a6';
  };

  // 初始化可视化数据
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes || nodes.length === 0 || !relationships) return;

    const width = canvas.width;
    const height = canvas.height;

    // 过滤节点
    const filteredNodes = nodes.filter(node => {
      if (settings.filterNodeType !== 'all' && node.type !== settings.filterNodeType) {
        return false;
      }
      const importance = node.importance || 50;
      return importance >= settings.filterImportance[0] && importance <= settings.filterImportance[1];
    });

    // 创建可视化节点
    const visNodes: VisualizationNode[] = filteredNodes.map((node) => ({
      ...node,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      radius: settings.nodeSize + (node.importance || 50) / 100 * 10,
      color: getNodeColor(node)
    }));

    // 创建节点ID映射
    const nodeMap = new Map(visNodes.map(node => [node.id, node]));

    // 创建可视化连接
    const visLinks: VisualizationLink[] = (relationships || [])
      .filter(rel => nodeMap.has(rel.startNodeId) && nodeMap.has(rel.endNodeId))
      .map(rel => ({
        id: rel.id,
        source: nodeMap.get(rel.startNodeId)!,
        target: nodeMap.get(rel.endNodeId)!,
        relationship: rel,
        strength: (rel.strength || 50) / 100
      }));

    setVisualization({ nodes: visNodes, links: visLinks });
  }, [nodes, relationships, settings]);

  // 力导向算法
  const updatePhysics = () => {
    if (!settings.physics) return;

    const { nodes: visNodes, links: visLinks } = visualization;
    const alpha = 0.1;

    // 排斥力
    for (let i = 0; i < visNodes.length; i++) {
      for (let j = i + 1; j < visNodes.length; j++) {
        const nodeA = visNodes[i];
        const nodeB = visNodes[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const repulsion = 500 / (distance * distance);
        
        const fx = (dx / distance) * repulsion;
        const fy = (dy / distance) * repulsion;
        
        nodeA.vx = (nodeA.vx || 0) - fx;
        nodeA.vy = (nodeA.vy || 0) - fy;
        nodeB.vx = (nodeB.vx || 0) + fx;
        nodeB.vy = (nodeB.vy || 0) + fy;
      }
    }

    // 吸引力（连接）
    visLinks.forEach(link => {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = distance * settings.linkStrength * link.strength;
      
      const fx = (dx / distance) * force * alpha;
      const fy = (dy / distance) * force * alpha;
      
      link.source.vx = (link.source.vx || 0) + fx;
      link.source.vy = (link.source.vy || 0) + fy;
      link.target.vx = (link.target.vx || 0) - fx;
      link.target.vy = (link.target.vy || 0) - fy;
    });

    // 更新位置
    visNodes.forEach(node => {
      node.vx = (node.vx || 0) * 0.8; // 阻尼
      node.vy = (node.vy || 0) * 0.8;
      node.x += node.vx || 0;
      node.y += node.vy || 0;

      // 边界检查
      const canvas = canvasRef.current;
      if (canvas) {
        node.x = Math.max(node.radius, Math.min(canvas.width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(canvas.height - node.radius, node.y));
      }
    });
  };

  // 渲染函数
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { nodes: visNodes, links: visLinks } = visualization;

    // 绘制连接线
    visLinks.forEach(link => {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      
      const isSelected = selectedRelationshipId === link.id;
      ctx.strokeStyle = isSelected ? '#ff4d4f' : `rgba(108, 117, 125, ${link.strength})`;
      ctx.lineWidth = isSelected ? 3 : 1 + link.strength * 2;
      ctx.stroke();

      // 绘制关系标签
      if (settings.showRelationshipLabels) {
        const midX = (link.source.x + link.target.x) / 2;
        const midY = (link.source.y + link.target.y) / 2;
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(link.relationship.type, midX, midY);
      }
    });

    // 绘制节点
    visNodes.forEach(node => {
      const isSelected = selectedNodeId === node.id;
      
      // 绘制节点圆圈
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#ff4d4f';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 绘制节点标签
      if (settings.showLabels) {
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + node.radius + 15);
      }
    });
  };

  // 动画循环
  const animate = () => {
    updatePhysics();
    render();
    animationRef.current = requestAnimationFrame(animate);
  };

  // 开始动画
  useEffect(() => {
    if (visualization.nodes.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visualization, settings, selectedNodeId, selectedRelationshipId]);

  // 鼠标事件处理
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // 检查点击的节点
    const clickedNode = visualization.nodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(clickX - node.x, 2) + Math.pow(clickY - node.y, 2)
      );
      return distance <= node.radius;
    });

    if (clickedNode) {
      onNodeSelect?.(clickedNode);
      return;
    }

    // 检查点击的连接线
    const clickedLink = visualization.links.find(link => {
      const distance = distanceToLine(
        clickX, clickY,
        link.source.x, link.source.y,
        link.target.x, link.target.y
      );
      return distance <= 5;
    });

    if (clickedLink) {
      onRelationshipSelect?.(clickedLink.relationship);
    }
  };

  // 计算点到线段的距离
  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projection_x = x1 + t * dx;
    const projection_y = y1 + t * dy;
    
    return Math.sqrt((px - projection_x) * (px - projection_x) + (py - projection_y) * (py - projection_y));
  };

  // 重置布局
  const resetLayout = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updatedNodes = visualization.nodes.map(node => ({
      ...node,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0
    }));

    setVisualization(prev => ({ ...prev, nodes: updatedNodes }));
  };

  const nodeTypes = ['all', ...new Set((nodes || []).map(n => n.type))];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 控制面板 */}
      <Card size="small" style={{ marginBottom: 8 }}>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={resetLayout} size="small">
            重置布局
          </Button>
          
          <Text>节点类型:</Text>
          <Select
            value={settings.filterNodeType}
            onChange={(value) => setSettings(prev => ({ ...prev, filterNodeType: value }))}
            size="small"
            style={{ width: 120 }}
          >
            {nodeTypes.map(type => (
              <Option key={type} value={type}>
                {type === 'all' ? '全部' : type}
              </Option>
            ))}
          </Select>

          <Text>节点大小:</Text>
          <Slider
            min={5}
            max={30}
            value={settings.nodeSize}
            onChange={(value) => setSettings(prev => ({ ...prev, nodeSize: value }))}
            style={{ width: 100 }}
          />

          <Text>连接强度:</Text>
          <Slider
            min={0.1}
            max={2}
            step={0.1}
            value={settings.linkStrength}
            onChange={(value) => setSettings(prev => ({ ...prev, linkStrength: value }))}
            style={{ width: 100 }}
          />

          <Switch
            checked={settings.showLabels}
            onChange={(checked) => setSettings(prev => ({ ...prev, showLabels: checked }))}
            checkedChildren="标签"
            unCheckedChildren="标签"
          />

          <Switch
            checked={settings.physics}
            onChange={(checked) => setSettings(prev => ({ ...prev, physics: checked }))}
            checkedChildren="物理"
            unCheckedChildren="物理"
          />
        </Space>
      </Card>

      {/* 画布 */}
      <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6 }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ width: '100%', height: '100%', cursor: 'pointer' }}
          onClick={handleCanvasClick}
        />
      </div>

      {/* 状态信息 */}
      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
        节点: {visualization.nodes.length} | 连接: {visualization.links.length}
      </div>
    </div>
  );
};

export default KnowledgeGraphVisualization;
