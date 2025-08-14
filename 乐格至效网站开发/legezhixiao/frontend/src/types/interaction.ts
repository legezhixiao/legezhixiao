// 交互设置类型
export interface InteractionSettings {
  // 缩放控制
  zoom: {
    enabled: boolean;
    min: number;
    max: number;
    defaultScale: number;
  };

  // 拖拽控制
  drag: {
    enabled: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };

  // 高亮控制
  highlight: {
    mode: 'node' | 'path' | 'community' | 'none';
    color: string;
    opacity: number;
    duration: number;
  };

  // 选择控制
  selection: {
    enabled: boolean;
    multiple: boolean;
    boxSelect: boolean;
  };

  // 悬停效果
  hover: {
    enabled: boolean;
    delay: number;
    scale: number;
    showDetails: boolean;
  };

  // 动画设置
  animation: {
    duration: number;
    easing: string;
  };
}

// 视图状态
export interface ViewState {
  scale: number;
  translateX: number;
  translateY: number;
  selectedNodes: string[];
  selectedRelationships: string[];
  highlightedElements: string[];
  hoveredElement: string | null;
  focusedArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

// 交互事件
export interface InteractionEvent {
  type: 'select' | 'hover' | 'drag' | 'zoom' | 'highlight';
  elementId?: string;
  elementType?: 'node' | 'relationship';
  position?: { x: number; y: number };
  scale?: number;
  timestamp: number;
}
