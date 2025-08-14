import React, { useEffect, useRef } from 'react';
import G6 from '@antv/g6';
import type { G6GraphData } from '../types/g6';

interface G6GraphProps {
  data: G6GraphData;
  width?: number;
  height?: number;
}

const G6Graph: React.FC<G6GraphProps> = ({ data, width = 800, height = 600 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<G6.Graph | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }
    // G6 官方类型声明未包含 modes/data，实际 API 支持，故用 as any 类型断言
    const graph = new G6.Graph({
      container: containerRef.current,
      width,
      height,
      modes: { default: ['drag-node', 'zoom-canvas', 'click-select', 'drag-canvas'] }, // G6 支持但类型未声明
      layout: { type: 'force' },
      fitView: true
    } as any);
    // G6.Graph 类型声明不含 data 方法，实际 API 存在
    (graph as any).data(data);
    graph.render();
    graphRef.current = graph;
    return () => {
      graph.destroy();
    };
  }, [data, width, height]);

  return <div ref={containerRef} style={{ width, height }} />;
};

export default G6Graph;
