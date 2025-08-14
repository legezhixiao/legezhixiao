import { useCallback, useEffect, useRef, useState } from 'react';
import { GraphViewState } from '../types/graph';

export class GraphViewStateManager {
  private state: GraphViewState;
  private width: number;
  private height: number;
  private onChange: (state: GraphViewState) => void;

  constructor(width: number, height: number, onChange?: (state: GraphViewState) => void) {
    this.width = width;
    this.height = height;
    this.onChange = onChange || (() => {});
    this.state = this.getInitialState();
  }

  private getInitialState(): GraphViewState {
    return {
      zoomLevel: 1,
      centerX: this.width / 2,
      centerY: this.height / 2,
      selectedNodes: new Set<string>(),
      hoveredNode: null
    };
  }

  setState(partialState: Partial<GraphViewState>) {
    this.state = { ...this.state, ...partialState };
    this.onChange(this.state);
  }

  getState(): GraphViewState {
    return { ...this.state };
  }

  reset() {
    this.setState(this.getInitialState());
  }

  zoom(delta: number) {
    const newZoom = Math.max(0.1, Math.min(5, this.state.zoomLevel + delta));
    this.setState({ zoomLevel: newZoom });
  }

  setZoom(scale: number) {
    const newZoom = Math.max(0.1, Math.min(5, scale));
    this.setState({ zoomLevel: newZoom });
  }

  pan(dx: number, dy: number) {
    this.setState({
      centerX: this.state.centerX + dx,
      centerY: this.state.centerY + dy
    });
  }

  setPan(x: number, y: number) {
    this.setState({ centerX: x, centerY: y });
  }

  select(ids: string[], multiSelect: boolean = false) {
    const selectedNodes = multiSelect
      ? new Set([...this.state.selectedNodes, ...ids])
      : new Set(ids);
    this.setState({ selectedNodes });
  }

  clearSelection() {
    this.setState({ selectedNodes: new Set<string>() });
  }

  setHoveredNode(nodeId: string | null) {
    this.setState({ hoveredNode: nodeId });
  }

  exportState() {
    return {
      ...this.state,
      selectedNodes: Array.from(this.state.selectedNodes)
    };
  }

  importState(state: any) {
    if (state) {
      const selectedNodes = new Set(
        Array.isArray(state.selectedNodes) ? state.selectedNodes : []
      );
      this.setState({ 
        ...state,
        selectedNodes
      });
    }
  }

  dispose() {
    // 清理任何资源
  }
}

export function useGraphViewState(
  width: number,
  height: number,
  initialState?: Partial<GraphViewState>
) {
  const [viewState, setViewState] = useState<GraphViewState>({
    zoomLevel: 1,
    centerX: width / 2,
    centerY: height / 2,
    selectedNodes: new Set<string>(),
    hoveredNode: null
  });

  const viewManagerRef = useRef<GraphViewStateManager | null>(null);

  useEffect(() => {
    // 初始化视图状态管理器
    viewManagerRef.current = new GraphViewStateManager(
      width, height, 
      (newState) => setViewState({...newState})
    );
    
    // 应用初始状态
    if (initialState && viewManagerRef.current) {
      viewManagerRef.current.setState(initialState);
    }

    return () => {
      if (viewManagerRef.current) {
        viewManagerRef.current.dispose();
      }
    };
  }, [width, height]);

  // 更新视图状态
  const updateViewState = useCallback((state: Partial<GraphViewState>) => {
    if (viewManagerRef.current) {
      viewManagerRef.current.setState(state);
    }
  }, []);

  // 获取当前视图状态
  const getViewState = useCallback(() => {
    if (viewManagerRef.current) {
      return viewManagerRef.current.getState();
    }
    return viewState;
  }, [viewState]);

  // 重置视图状态
  const resetViewState = useCallback(() => {
    if (viewManagerRef.current) {
      viewManagerRef.current.reset();
    }
  }, []);

  // 缩放相关
  const zoom = useCallback((delta: number) => {
    if (viewManagerRef.current) {
      viewManagerRef.current.zoom(delta);
    }
  }, []);

  const setZoom = useCallback((scale: number) => {
    if (viewManagerRef.current) {
      viewManagerRef.current.setZoom(scale);
    }
  }, []);

  // 平移相关
  const pan = useCallback((dx: number, dy: number) => {
    if (viewManagerRef.current) {
      viewManagerRef.current.pan(dx, dy);
    }
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    if (viewManagerRef.current) {
      viewManagerRef.current.setPan(x, y);
    }
  }, []);

  // 选择相关
  const select = useCallback((ids: string[], multiSelect: boolean = false) => {
    if (viewManagerRef.current) {
      viewManagerRef.current.select(ids, multiSelect);
    }
  }, []);

  const clearSelection = useCallback(() => {
    if (viewManagerRef.current) {
      viewManagerRef.current.clearSelection();
    }
  }, []);

  // 悬停相关
  const setHoveredNode = useCallback((nodeId: string | null) => {
    if (viewManagerRef.current) {
      viewManagerRef.current.setHoveredNode(nodeId);
    }
  }, []);

  return {
    viewState,
    updateViewState,
    getViewState,
    resetViewState,
    zoom,
    setZoom,
    pan,
    setPan,
    select,
    clearSelection,
    setHoveredNode
  };
}
