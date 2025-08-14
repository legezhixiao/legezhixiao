// 基础类型定义
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface BaseNode {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  importance?: number;
  status?: string;
  tags?: string[];
  properties?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisualizationNode extends SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface VisualizationLink extends SimulationLinkDatum<VisualizationNode> {
  id: string;
  source: string | VisualizationNode;
  target: string | VisualizationNode;
  type: string;
  strength: number;
  weight?: number;
  color?: string;
}

// 节点类型定义
export interface GraphNode extends BaseNode, VisualizationNode {
  type: 'CHARACTER' | 'LOCATION' | 'EVENT' | 'PLOT_POINT' | 'ITEM' | 'CONCEPT';
}

// 关系类型定义
export interface GraphRelationship extends VisualizationLink {
  type: 'CONTAINS' | 'RELATES_TO' | 'BELONGS_TO' | 'INFLUENCES' | 'APPEARS_IN';
  startNodeId: string;
  endNodeId: string;
  description?: string;
  status?: string;
  properties?: Record<string, any>;
}

// 数据接口
export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  analysis?: GraphAnalytics;
}

// 视图状态接口
export interface GraphViewState {
  zoomLevel: number;
  centerX: number;
  centerY: number;
  selectedNodes: Set<string>;
  hoveredNode: string | null;
}

// 分析结果接口
export interface GraphAnalytics {
  totalNodes: number;
  totalRelationships: number;
  nodesByType: Record<string, number>;
  relationshipsByType: Record<string, number>;
  centralNodes: Array<{ node: GraphNode; connections: number }>;
  isolatedNodes: GraphNode[];
  strongestRelationships: GraphRelationship[];
}

// 查询接口
export interface GraphQuery {
  projectId?: string;
  nodeTypes?: string[];
  relationshipTypes?: string[];
  searchTerm?: string;
  importanceRange?: [number, number];
  status?: string;
  limit?: number;
}

// 布局配置接口
export interface GraphLayoutConfig {
  type: 'force' | 'circular' | 'tree';
  settings?: {
    forceStrength?: number;
    linkDistance?: number;
    centerForce?: number;
    radiusMultiplier?: number;
    verticalSpacing?: number;
    horizontalSpacing?: number;
    width?: number;
    height?: number;
  };
}

// 高级分析结果接口
export interface AdvancedGraphAnalytics {
  // 路径分析
  pathAnalysis: {
    shortestPaths: PathInfo[];
    criticalPaths: PathInfo[];
  };
  
  // 社群分析
  communities: Community[];
  
  // 时序分析
  temporalAnalysis: {
    eventChains: EventChain[];
    timelineSegments: TimelineSegment[];
  };
  
  // 语义分析
  semanticAnalysis: {
    conceptClusters: ConceptCluster[];
    thematicGroups: ThematicGroup[];
  };
}

// 路径分析相关接口
export interface PathInfo {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  weight: number;
  score: number;
}

// 社群分析相关接口
export interface Community {
  id: string;
  nodes: string[];
  centralityScore: number;
  density: number;
  properties: Record<string, any>;
}

// 时序分析相关接口
export interface EventChain {
  id: string;
  events: GraphNode[];
  timespan: {
    start: Date;
    end: Date;
  };
  importance: number;
}

export interface TimelineSegment {
  id: string;
  events: GraphNode[];
  period: string;
  summary: string;
}

// 语义分析相关接口
export interface ConceptCluster {
  id: string;
  concepts: GraphNode[];
  centralConcept: string;
  semanticDistance: number;
}

export interface ThematicGroup {
  id: string;
  theme: string;
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  weight: number;
}
