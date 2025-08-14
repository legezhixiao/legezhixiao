// 导入图形类型定义
import { GraphData, GraphNode, GraphViewState } from '../../types/graph';

export interface KnowledgeGraphVisualizationProps {
  data: GraphData;
  width: number;
  height: number;
  settings?: {
    zoom?: {
      enabled?: boolean;
      min?: number;
      max?: number;
      defaultScale?: number;
    };
    drag?: {
      enabled?: boolean;
      snapToGrid?: boolean;
      gridSize?: number;
    };
  };
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onRelationshipClick?: (relationship: any) => void;
  onViewStateChange?: (viewState: GraphViewState) => void;
}
