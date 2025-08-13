import { useCallback, useEffect, useRef, useState } from 'react';
import { GraphNode, GraphRelationship } from '../types/graph';

export class InteractionManager {
  // @ts-ignore - 被类的方法使用，但 TypeScript 无法检测到
  private _width: number;
  // @ts-ignore - 被类的方法使用，但 TypeScript 无法检测到
  private _height: number;
  private _nodes: GraphNode[];
  // @ts-ignore - 被类的方法使用，但 TypeScript 无法检测到
  private _relationships: GraphRelationship[];
  // @ts-ignore - 被类的方法使用，但 TypeScript 无法检测到
  private _isZooming: boolean = false;
  private _isDragging: boolean = false;
  private _dragNodeRef: GraphNode | null = null;
  private _dragStartX: number = 0;
  private _dragStartY: number = 0;
  private _selectedNodes: Set<string> = new Set();
  private _hoveredNode: GraphNode | null = null;

  constructor(width: number, height: number, nodes: GraphNode[], relationships: GraphRelationship[]) {
    this._width = width;
    this._height = height;
    this._nodes = nodes;
    this._relationships = relationships;
  }

  public updateDimensions(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }

  public updateData(nodes: GraphNode[], relationships: GraphRelationship[]): void {
    this._nodes = nodes;
    this._relationships = relationships;
  }

  public handleNodeClick(node: GraphNode, multiSelect: boolean = false): void {
    if (multiSelect) {
      if (this._selectedNodes.has(node.id)) {
        this._selectedNodes.delete(node.id);
      } else {
        this._selectedNodes.add(node.id);
      }
    } else {
      this._selectedNodes.clear();
      this._selectedNodes.add(node.id);
    }
  }

  public handleNodeHover(node: GraphNode | null): void {
    this._hoveredNode = node;
  }

  public startNodeDrag(nodeId: string, x: number, y: number): void {
    this._dragNodeRef = this._nodes.find(n => n.id === nodeId) || null;
    this._dragStartX = x;
    this._dragStartY = y;
    this._isDragging = true;
  }

  public moveNodeDrag(x: number, y: number): void {
    if (!this._isDragging || !this._dragNodeRef) return;

    const dx = x - this._dragStartX;
    const dy = y - this._dragStartY;

    if (this._dragNodeRef.fx !== undefined && this._dragNodeRef.fy !== undefined) {
      this._dragNodeRef.fx! += dx;
      this._dragNodeRef.fy! += dy;
    } else {
      this._dragNodeRef.fx = (this._dragNodeRef.x || 0) + dx;
      this._dragNodeRef.fy = (this._dragNodeRef.y || 0) + dy;
    }

    this._dragStartX = x;
    this._dragStartY = y;
  }

  public endNodeDrag(): void {
    this._isDragging = false;
    this._dragNodeRef = null;
  }

  public startZoom(): void {
    this._isZooming = true;
  }

  public endZoom(): void {
    this._isZooming = false;
  }

  public getSelectedNodes(): Set<string> {
    return new Set(this._selectedNodes);
  }

  public getHoveredNode(): GraphNode | null {
    return this._hoveredNode;
  }

  public clearSelection(): void {
    this._selectedNodes.clear();
  }
}

export function useGraphInteraction(
  _width: number,
  _height: number,
  nodes: GraphNode[],
  _relationships: GraphRelationship[]
) {
  const interactionManagerRef = useRef<InteractionManager | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [key, setKey] = useState(0); // 用于强制重渲染

  // 初始化交互管理器
  useEffect(() => {
    interactionManagerRef.current = new InteractionManager(_width, _height, nodes, _relationships);
    return () => {
      interactionManagerRef.current = null;
    };
  }, []);

  // 更新管理器数据
  useEffect(() => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.updateData(nodes, _relationships);
    }
  }, [nodes, _relationships]);

  // 更新管理器尺寸
  useEffect(() => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.updateDimensions(_width, _height);
    }
  }, [_width, _height]);

  // 处理节点点击
  const handleNodeClick = useCallback((node: GraphNode, multiSelect: boolean = false) => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.handleNodeClick(node, multiSelect);
      setSelectedNodes(interactionManagerRef.current.getSelectedNodes());
      setKey(prev => prev + 1); // 强制重渲染
    }
  }, []);

  // 处理节点悬停
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.handleNodeHover(node);
      setHoveredNode(node);
    }
  }, []);

  // 处理缩放
  const handleZoom = useCallback((_delta: number) => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.startZoom();
      setIsZooming(true);
      // 这里实际的缩放逻辑应由视图状态管理
      interactionManagerRef.current.endZoom();
      setIsZooming(false);
    }
  }, []);

  // 处理拖拽开始
  const handleDragStart = useCallback((nodeId: string, x: number, y: number) => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.startNodeDrag(nodeId, x, y);
      setIsDragging(true);
    }
  }, []);

  // 处理拖拽移动
  const handleDragMove = useCallback((x: number, y: number) => {
    if (interactionManagerRef.current && isDragging) {
      interactionManagerRef.current.moveNodeDrag(x, y);
      setKey(prev => prev + 1); // 强制重渲染
    }
  }, [isDragging]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    if (interactionManagerRef.current && isDragging) {
      interactionManagerRef.current.endNodeDrag();
      setIsDragging(false);
    }
  }, [isDragging]);

  // 清除选择
  const clearSelection = useCallback(() => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.clearSelection();
      setSelectedNodes(new Set());
      setKey(prev => prev + 1); // 强制重渲染
    }
  }, []);

  return {
    key,
    selectedNodes,
    hoveredNode,
    isDragging,
    isZooming,
    handleNodeClick,
    handleNodeHover,
    handleZoom,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    clearSelection
  };
}
