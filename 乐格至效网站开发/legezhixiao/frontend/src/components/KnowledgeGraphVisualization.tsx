import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Tabs, Space, Statistic, Tag, Empty } from 'antd';
import * as d3 from 'd3';
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  _key?: string;
  _id?: string;
  name: string;
  type: string;
  properties?: Record<string, any>;
  size?: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
  startNodeId?: string;
  endNodeId?: string;
  type: string;
  weight?: number;
  properties?: Record<string, any>;
}

interface KnowledgeGraphData {
  nodes: GraphNode[];
  relationships: GraphLink[];
  analysis?: {
    totalNodes: number;
    totalRelationships: number;
    nodeTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
  };
}

interface KnowledgeGraphVisualizationProps {
  data: KnowledgeGraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const nodeColors = {
    person: '#ff6b6b',
    location: '#4ecdc4',
    concept: '#45b7d1',
    event: '#f9ca24',
    organization: '#6c5ce7',
    default: '#a8a8a8'
  };

  const linkColors = {
    contains: '#95a5a6',
    relates_to: '#3498db',
    belongs_to: '#e74c3c',
    influences: '#f39c12',
    default: '#bdc3c7'
  };

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // 数据预处理：转换ArangoDB格式到D3格式
    const processedNodes: GraphNode[] = data.nodes.map(node => ({
      ...node,
      id: node._key || node.id || `node_${Math.random()}`,
      size: 20
    }));

    const processedLinks: GraphLink[] = data.relationships.map(rel => ({
      ...rel,
      source: rel.startNodeId || rel.source,
      target: rel.endNodeId || rel.target,
      weight: 1
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 创建主要的g元素用于缩放
    const g = svg.append('g');

    // 添加缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 创建力导向图模拟
    const simulation = d3.forceSimulation<GraphNode>(processedNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(processedLinks)
        .id(d => d.id)
        .distance(d => 50 + (d.weight || 1) * 30)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => ((d as GraphNode).size || 20) + 5));

    // 创建箭头标记
    const defs = g.append('defs');
    Object.keys(linkColors).forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', linkColors[type as keyof typeof linkColors] || linkColors.default);
    });

    // 绘制连接线
    const links = g.append('g')
      .selectAll('line')
      .data(data.relationships)
      .enter()
      .append('line')
      .attr('stroke', d => linkColors[d.type as keyof typeof linkColors] || linkColors.default)
      .attr('stroke-width', d => Math.sqrt(d.weight || 1) * 2)
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .attr('stroke-opacity', 0.6);

    // 绘制连接线标签
    const linkLabels = g.append('g')
      .selectAll('text')
      .data(data.relationships)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => d.type);

    // 绘制节点
    const nodes = g.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.size || 20)
      .attr('fill', d => nodeColors[d.type as keyof typeof nodeColors] || nodeColors.default)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        setSelectedNode(d);
        onNodeClick?.(d);
      })
      .on('mouseover', function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d.size || 20) * 1.2)
          .attr('stroke-width', 3);
      })
      .on('mouseout', function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size || 20)
          .attr('stroke-width', 2);
      });

    // 绘制节点标签
    const nodeLabels = g.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .text(d => d.name);

    // 添加拖拽行为
    const drag = d3.drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodes.call(drag);

    // 更新位置
    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      linkLabels
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      nodes
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      nodeLabels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // 清理函数
    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick]);

  const resetZoom = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
    }
  };

  if (!data.nodes.length) {
    return (
      <Card title="知识图谱" style={{ width: '100%' }}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card
      title="知识图谱可视化"
      extra={
        <Space>
          <Button onClick={resetZoom}>重置视图</Button>
        </Space>
      }
      style={{ width: '100%' }}
    >
      <Tabs
        items={[
          {
            key: 'graph',
            label: '图谱视图',
            children: (
              <div style={{ position: 'relative' }}>
                <svg
                  ref={svgRef}
                  width={width}
                  height={height}
                  style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}
                />
                
                {/* 图例 */}
                <div style={{ 
                  position: 'absolute', 
                  top: 10, 
                  left: 10, 
                  background: 'rgba(255,255,255,0.9)', 
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>
                  <div><strong>节点类型：</strong></div>
                  {Object.entries(nodeColors).filter(([key]) => key !== 'default').map(([type, color]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: color 
                      }} />
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          },
          {
            key: 'statistics',
            label: '统计信息',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <Statistic title="节点总数" value={data.analysis?.totalNodes || data.nodes.length} />
                <Statistic title="关系总数" value={data.analysis?.totalRelationships || data.relationships.length} />
                
                <Card title="节点类型分布" size="small">
                  {Object.entries(data.analysis?.nodeTypes || {}).map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Tag color={nodeColors[type as keyof typeof nodeColors] || nodeColors.default}>
                        {type}
                      </Tag>
                      <span>{count}</span>
                    </div>
                  ))}
                </Card>
                
                <Card title="关系类型分布" size="small">
                  {Object.entries(data.analysis?.relationshipTypes || {}).map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Tag>{type}</Tag>
                      <span>{count}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )
          },
          {
            key: 'details',
            label: '节点详情',
            children: selectedNode ? (
              <Card title={selectedNode.name} size="small">
                <p><strong>类型：</strong> {selectedNode.type}</p>
                <p><strong>ID：</strong> {selectedNode.id}</p>
                {selectedNode.properties && (
                  <div>
                    <strong>属性：</strong>
                    <pre style={{ marginTop: '8px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      {JSON.stringify(selectedNode.properties, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            ) : (
              <Empty description="点击节点查看详情" />
            )
          }
        ]}
      />
    </Card>
  );
};

export default KnowledgeGraphVisualization;
