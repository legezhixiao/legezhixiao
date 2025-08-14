import { GraphViewState, GraphNode, GraphRelationship } from '../types/graph';

export class GraphViewStateManager {
  private viewState: GraphViewState = {
    zoomLevel: 1,
    centerX: 0,
    centerY: 0,
    selectedNodes: new Set<string>(),
    hoveredNode: null
  };

  private listeners: ((state: GraphViewState) => void)[] = [];

  constructor(width: number, height: number) {
    this.viewState.centerX = width / 2;
    this.viewState.centerY = height / 2;
  }

  subscribe(listener: (state: GraphViewState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.viewState));
  }

  setZoomLevel(level: number) {
    this.viewState = {
      ...this.viewState,
      zoomLevel: Math.max(0.1, Math.min(4, level))
    };
    this.notifyListeners();
  }

  setCenter(x: number, y: number) {
    this.viewState = {
      ...this.viewState,
      centerX: x,
      centerY: y
    };
    this.notifyListeners();
  }

  selectNode(nodeId: string, multiSelect: boolean = false) {
    const newSelection = multiSelect
      ? new Set(this.viewState.selectedNodes)
      : new Set<string>();

    if (this.viewState.selectedNodes.has(nodeId)) {
      newSelection.delete(nodeId);
    } else {
      newSelection.add(nodeId);
    }

    this.viewState = {
      ...this.viewState,
      selectedNodes: newSelection
    };
    this.notifyListeners();
  }

  setHoveredNode(nodeId: string | null) {
    this.viewState = {
      ...this.viewState,
      hoveredNode: nodeId
    };
    this.notifyListeners();
  }

  reset() {
    this.viewState = {
      ...this.viewState,
      zoomLevel: 1,
      selectedNodes: new Set(),
      hoveredNode: null
    };
    this.notifyListeners();
  }

  getState(): GraphViewState {
    return this.viewState;
  }

  applyHighlighting(nodes: GraphNode[], relationships: GraphRelationship[]) {
    const { selectedNodes, hoveredNode } = this.viewState;
    
    // 高亮选中和悬停的节点
    nodes.forEach(node => {
      if (selectedNodes.has(node.id)) {
        node.color = '#ff6b6b';
        node.size = (node.size || 20) * 1.2;
      } else if (hoveredNode === node.id) {
        node.color = '#4ecdc4';
        node.size = (node.size || 20) * 1.1;
      } else {
        delete node.color;
        node.size = 20;
      }
    });

    // 高亮相关的关系
    relationships.forEach(rel => {
      const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
      const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;

      if (selectedNodes.has(sourceId) || selectedNodes.has(targetId)) {
        rel.color = '#ff6b6b';
        rel.weight = (rel.weight || 1) * 1.5;
      } else if (hoveredNode === sourceId || hoveredNode === targetId) {
        rel.color = '#4ecdc4';
        rel.weight = (rel.weight || 1) * 1.2;
      } else {
        delete rel.color;
        rel.weight = 1;
      }
    });
  }
}
