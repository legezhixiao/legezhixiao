import React, { useEffect, useRef, useState } from 'react';
import { useGraphLayout } from '../../hooks/useGraphLayout';
import { useGraphViewState } from '../../hooks/useGraphViewState';
import { GraphNode, GraphData } from '../../types/graph';

interface KnowledgeGraphProps {
  width: number;
  height: number;
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  width,
  height,
  data,
  onNodeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // 使用布局钩子
  const { updateLayout } = useGraphLayout(data.nodes, data.relationships, {
    type: 'force',
    settings: { width, height }
  });

  // 使用视图状态钩子
  const { updateViewState } = useGraphViewState(width, height);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width: newWidth, height: newHeight } = containerRef.current.getBoundingClientRect();
        updateLayout({
          type: 'force',
          settings: { width: newWidth, height: newHeight }
        });
        updateViewState({
          zoomLevel: 1,
          centerX: newWidth / 2,
          centerY: newHeight / 2,
          selectedNodes: new Set<string>(),
          hoveredNode: null
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateLayout, updateViewState]);

  // 监听数据变化
  useEffect(() => {
    if (data.nodes.length > 0 && data.relationships.length > 0) {
      updateLayout({
        type: 'force',
        settings: { width, height }
      });
    }
  }, [data, updateLayout, width, height]);

  return (
    <div
      ref={containerRef}
      style={{ width, height, position: 'relative' }}
      onClick={() => {
        // 示例：点击某个位置时选择相应的节点
        if (data.nodes.length > 0 && onNodeClick) {
          setSelectedNode(data.nodes[0]);
          onNodeClick(data.nodes[0]);
        }
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ddd', borderRadius: '4px' }}
      >
        {/* 实际图形内容会在D3.js中渲染 */}
      </svg>
      {selectedNode && (
        <div style={{ 
          position: 'absolute', 
          bottom: 10, 
          right: 10, 
          background: 'white', 
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3>{selectedNode.name}</h3>
          <p>类型: {selectedNode.type}</p>
        </div>
      )}
    </div>
  );
};
