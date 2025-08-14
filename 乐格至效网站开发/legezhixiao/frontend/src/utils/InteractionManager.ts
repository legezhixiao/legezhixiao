import { GraphNode, GraphRelationship, GraphLayoutConfig } from '../types/graph';
import { GraphLayoutManager } from './GraphLayoutManager';
import { GraphViewStateManager } from './GraphViewStateManager';

export class InteractionManager {
  private layoutManager: GraphLayoutManager;
  private viewStateManager: GraphViewStateManager;
  private isDragging: boolean = false;
  private lastMousePosition: { x: number; y: number } | null = null;

  constructor(
    width: number,
    height: number,
    private onStateChange: () => void
  ) {
    this.layoutManager = new GraphLayoutManager(width, height);
    this.viewStateManager = new GraphViewStateManager(width, height);
  }

  setLayout(
    config: GraphLayoutConfig,
    nodes: GraphNode[],
    relationships: GraphRelationship[]
  ) {
    // 更新布局管理器的数据
    this.layoutManager.setData(nodes, relationships);
    // 更新布局配置
    this.layoutManager.setConfig(config);
    this.onStateChange();
  }

  handleNodeClick(node: GraphNode, isMultiSelect: boolean = false) {
    this.viewStateManager.selectNode(node.id, isMultiSelect);
    this.onStateChange();
  }

  handleNodeHover(node: GraphNode | null) {
    this.viewStateManager.setHoveredNode(node?.id || null);
    this.onStateChange();
  }

  handleZoom(delta: number) {
    const currentZoom = this.viewStateManager.getState().zoomLevel;
    this.viewStateManager.setZoomLevel(currentZoom * (1 + delta * 0.1));
    this.onStateChange();
  }

  handleDragStart(x: number, y: number) {
    this.isDragging = true;
    this.lastMousePosition = { x, y };
  }

  handleDragMove(x: number, y: number) {
    if (!this.isDragging || !this.lastMousePosition) return;

    const dx = x - this.lastMousePosition.x;
    const dy = y - this.lastMousePosition.y;

    const state = this.viewStateManager.getState();
    this.viewStateManager.setCenter(state.centerX + dx, state.centerY + dy);

    this.lastMousePosition = { x, y };
    this.onStateChange();
  }

  handleDragEnd() {
    this.isDragging = false;
    this.lastMousePosition = null;
  }

  reset() {
    this.viewStateManager.reset();
    this.layoutManager.stopSimulation();
    this.onStateChange();
  }

  applyHighlighting(nodes: GraphNode[], relationships: GraphRelationship[]) {
    this.viewStateManager.applyHighlighting(nodes, relationships);
  }

  getViewState() {
    return this.viewStateManager.getState();
  }

  dispose() {
    this.layoutManager.stopSimulation();
  }
}
