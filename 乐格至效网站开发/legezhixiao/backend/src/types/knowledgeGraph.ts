import { GraphNode, GraphRelationship } from './graph';

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
