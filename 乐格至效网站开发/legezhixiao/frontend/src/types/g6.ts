// G6 数据类型定义与项目 GraphData 类型适配
// 位置：frontend/src/types/g6.ts

// G6 节点类型
export interface G6Node {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  type?: string;
  style?: Record<string, any>;
  [key: string]: any;
}

// G6 边类型
export interface G6Edge {
  id?: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  style?: Record<string, any>;
  [key: string]: any;
}

// G6 图数据类型
export interface G6GraphData {
  nodes: G6Node[];
  edges: G6Edge[];
}

// 项目 GraphData 类型（已存在于 src/types/graph.ts）
// export interface GraphData {
//   nodes: GraphNode[];
//   relationships: GraphRelationship[];
// }

// 适配函数：将项目 GraphData 转为 G6GraphData
export function convertToG6Data(graphData: any): G6GraphData {
  return {
    nodes: (graphData.nodes || []).map((n: any) => ({
      id: n.id,
      label: n.name,
      type: n.type,
      ...n
    })),
    edges: (graphData.relationships || []).map((e: any) => ({
      id: e.id,
      source: e.startNodeId,
      target: e.endNodeId,
      label: e.type,
      type: e.type,
      ...e
    }))
  };
}
