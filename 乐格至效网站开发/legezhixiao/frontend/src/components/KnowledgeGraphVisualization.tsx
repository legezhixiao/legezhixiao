import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, Button, Tabs, Space, Statistic, Tag, Empty } from 'antd';
import * as d3 from 'd3';
import { GraphNode, GraphRelationship, GraphData } from '../types/graph';
import { InteractionSettings, ViewState } from '../types/interaction';
import { useGraphInteraction } from '../hooks/useGraphInteraction';

interface KnowledgeGraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
  settings?: Partial<InteractionSettings>;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onRelationshipClick?: (relationship: GraphRelationship) => void;
  onViewStateChange?: (viewState: ViewState) => void;
}

const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  settings: _settings,
  onNodeClick,
  onNodeHover,
  onRelationshipClick,
  onViewStateChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 颜色配置
  const nodeColors = {
    CHARACTER: '#ff6b6b',
    LOCATION: '#4ecdc4',
    CONCEPT: '#45b7d1',
    EVENT: '#f9ca24',
    PLOT_POINT: '#6c5ce7',
    ITEM: '#a8a8a8',
    default: '#cccccc'
  };

  const linkColors = {
    CONTAINS: '#95a5a6',
    RELATES_TO: '#3498db',
    BELONGS_TO: '#e74c3c',
    INFLUENCES: '#f39c12',
    APPEARS_IN: '#27ae60',
    default: '#bdc3c7'
  };

  // 使用交互钩子
  const {
    selectedNodes,
    hoveredNode,
    handleNodeClick: handleInteractionNodeClick,
    handleNodeHover: handleNodeHoverBase,
    handleZoom,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    clearSelection
  } = useGraphInteraction(
    width, 
    height, 
    data.nodes || [], 
    data.relationships || []
  );

  // 处理节点点击
  const handleNodeClick = useCallback((node: GraphNode) => {
    handleInteractionNodeClick(node);
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [handleInteractionNodeClick, onNodeClick]);

  // 处理节点悬停
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    handleNodeHoverBase(node);
    if (onNodeHover) {
      onNodeHover(node);
    }
  }, [handleNodeHoverBase, onNodeHover]);

  // 处理关系点击
  const handleRelationshipClick = useCallback((relationship: GraphRelationship) => {
    if (onRelationshipClick) {
      onRelationshipClick(relationship);
    }
  }, [onRelationshipClick]);

  // 重置视图
  const handleResetView = useCallback(() => {
    clearSelection();
    setSelectedNode(null);
    // 重置 D3 转换
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform as any,
          d3.zoomIdentity
        );
    }
  }, [clearSelection]);

  // 切换全屏
  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  // 设置缩放行为
  const setupZoom = useCallback(() => {
    if (!svgRef.current) return null;
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const g = d3.select(svgRef.current).select('g');
        g.attr('transform', event.transform);
        handleZoom(event.transform.k);
        
        // 传递视图状态变更
        if (onViewStateChange) {
          onViewStateChange({
            scale: event.transform.k,
            translateX: event.transform.x,
            translateY: event.transform.y,
            selectedNodes: Array.from(selectedNodes),
            selectedRelationships: [],
            highlightedElements: [],
            hoveredElement: hoveredNode?.id || null,
            focusedArea: null
          });
        }
      });
    
    d3.select(svgRef.current).call(zoom);
    return zoom;
  }, [svgRef, handleZoom, onViewStateChange, selectedNodes, hoveredNode]);

  // 设置拖拽行为
  const setupDrag = useCallback(() => {
    return d3.drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => {
        handleDragStart(d.id, event.x, event.y);
      })
      .on('drag', (event) => {
        handleDragMove(event.x, event.y);
      })
      .on('end', () => {
        handleDragEnd();
      });
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // 初始化图形渲染
  useEffect(() => {
    if (!svgRef.current || !data.nodes || data.nodes.length === 0) {
      return;
    }

    // 清空SVG
    d3.select(svgRef.current).selectAll('*').remove();

    // 处理数据
    const processedNodes = data.nodes.map(node => ({
      ...node,
      size: node.importance ? 10 + node.importance * 10 : 20
    }));

    // 处理连接
    const processedLinks = data.relationships.map(rel => ({
      ...rel,
      source: rel.startNodeId,
      target: rel.endNodeId,
      weight: rel.strength || 1
    }));

    // 创建主容器
    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // 设置缩放
    setupZoom();

    // 创建力导向图模拟
    const simulation = d3.forceSimulation<any>(processedNodes)
      .force('link', d3.forceLink<any, any>(processedLinks)
        .id((d: any) => d.id)
        .distance((d: any) => 50 + (d.weight || 1) * 30)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.size || 20) + 5));

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
      .data(processedLinks)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => linkColors[d.type as keyof typeof linkColors] || linkColors.default)
      .attr('stroke-width', (d: any) => Math.sqrt(d.weight || 1) * 2)
      .attr('marker-end', (d: any) => `url(#arrow-${d.type})`)
      .attr('stroke-opacity', 0.6)
      .on('click', (_event: MouseEvent, d: any) => {
        handleRelationshipClick(d);
      });

    // 绘制连接线标签
    const linkLabels = g.append('g')
      .selectAll('text')
      .data(processedLinks)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d: any) => d.type);

    // 绘制节点
    const nodes = g.append('g')
      .selectAll('circle')
      .data(processedNodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => d.size || 20)
      .attr('fill', (d: any) => nodeColors[d.type as keyof typeof nodeColors] || nodeColors.default)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event: MouseEvent, d: any) => {
        handleNodeClick(d);
      })
      .on('mouseover', function(_event: MouseEvent, d: any) {
        handleNodeHover(d);
        d3.select(this).attr('stroke', '#ff0');
      })
      .on('mouseout', function() {
        handleNodeHover(null);
        d3.select(this).attr('stroke', '#fff');
      });

    // 添加拖拽行为
    const drag = setupDrag();
    nodes.call(drag as any);

    // 绘制节点标签
    const nodeLabels = g.append('g')
      .selectAll('text')
      .data(processedNodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .text((d: any) => d.name);

    // 更新位置
    simulation.on('tick', () => {
      // 更新连接线
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      // 更新连接线标签
      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      // 更新节点
      nodes
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      // 更新节点标签
      nodeLabels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // 清理函数
    return () => {
      simulation.stop();
    };
  }, [
    data, 
    width, 
    height, 
    setupZoom, 
    setupDrag, 
    handleNodeClick, 
    handleNodeHover, 
    handleRelationshipClick,
    nodeColors,
    linkColors
  ]);

  // 如果没有数据，显示空状态
  if (!data.nodes || data.nodes.length === 0) {
    return (
      <Card title="知识图谱" style={{ width: '100%' }}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  // 渲染组件
  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Card
        title="知识图谱可视化"
        extra={
          <Space>
            <Button onClick={handleResetView}>重置视图</Button>
            <Button onClick={handleFullscreen}>
              {isFullscreen ? '退出全屏' : '全屏显示'}
            </Button>
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
                          backgroundColor: color as string
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
                    {Object.entries(data.analysis?.nodesByType || {}).map(([type, count]) => (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Tag color={nodeColors[type as keyof typeof nodeColors] as string || nodeColors.default}>
                          {type}
                        </Tag>
                        <span>{count}</span>
                      </div>
                    ))}
                  </Card>
                  
                  <Card title="关系类型分布" size="small">
                    {Object.entries(data.analysis?.relationshipsByType || {}).map(([type, count]) => (
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
    </div>
  );
};

export default KnowledgeGraphVisualization;
