import { useCallback, useEffect, useRef, useState } from 'react';
import { GraphLayoutManager } from '../utils/GraphLayoutManager';
import { GraphNode, GraphRelationship, GraphLayoutConfig } from '../types/graph';

export function useGraphLayout(
  nodes: GraphNode[],
  relationships: GraphRelationship[],
  initialConfig: GraphLayoutConfig
) {
  const layoutManagerRef = useRef<GraphLayoutManager | null>(null);
  const [layoutResult, setLayoutResult] = useState({ nodes, relationships });

  // 初始化布局管理器
  useEffect(() => {
    if (initialConfig.settings?.width && initialConfig.settings?.height) {
      layoutManagerRef.current = new GraphLayoutManager(
        initialConfig.settings.width,
        initialConfig.settings.height
      );
      layoutManagerRef.current.setConfig(initialConfig);
      layoutManagerRef.current.setData(nodes, relationships);
      setLayoutResult({
        nodes: layoutManagerRef.current.getNodes(),
        relationships: layoutManagerRef.current.getRelationships()
      });
    }
    return () => {
      if (layoutManagerRef.current) {
        layoutManagerRef.current.stopSimulation();
      }
    };
  }, [initialConfig.settings?.width, initialConfig.settings?.height]);

  // 数据变更时更新
  useEffect(() => {
    if (layoutManagerRef.current) {
      layoutManagerRef.current.setData(nodes, relationships);
      setLayoutResult({
        nodes: layoutManagerRef.current.getNodes(),
        relationships: layoutManagerRef.current.getRelationships()
      });
    }
  }, [nodes, relationships]);

  // 更新布局配置
  const updateLayout = useCallback((config: GraphLayoutConfig) => {
    if (layoutManagerRef.current) {
      layoutManagerRef.current.setConfig(config);
      const updatedNodes = layoutManagerRef.current.getNodes();
      setLayoutResult({
        nodes: updatedNodes,
        relationships: layoutManagerRef.current.getRelationships()
      });
      return updatedNodes;
    }
    return null;
  }, []);

  // 获取当前布局
  const getCurrentLayout = useCallback(() => {
    if (layoutManagerRef.current) {
      return {
        nodes: layoutManagerRef.current.getNodes(),
        relationships: layoutManagerRef.current.getRelationships()
      };
    }
    return layoutResult;
  }, [layoutResult]);

  // 重置布局
  const resetLayout = useCallback(() => {
    if (layoutManagerRef.current) {
      layoutManagerRef.current.setData(nodes, relationships);
      layoutManagerRef.current.applyLayout();
      const updatedNodes = layoutManagerRef.current.getNodes();
      setLayoutResult({
        nodes: updatedNodes,
        relationships: layoutManagerRef.current.getRelationships()
      });
      return updatedNodes;
    }
    return null;
  }, [nodes, relationships]);

  // 更新节点位置
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    if (layoutManagerRef.current) {
      const node = layoutManagerRef.current.getNodes().find(n => n.id === nodeId);
      if (node) {
        node.fx = x;
        node.fy = y;
        setLayoutResult({
          nodes: layoutManagerRef.current.getNodes(),
          relationships: layoutManagerRef.current.getRelationships()
        });
        return true;
      }
    }
    return false;
  }, []);

  // 更新尺寸
  const updateDimensions = useCallback((width: number, height: number) => {
    if (layoutManagerRef.current) {
      layoutManagerRef.current.updateDimensions(width, height);
      setLayoutResult({
        nodes: layoutManagerRef.current.getNodes(),
        relationships: layoutManagerRef.current.getRelationships()
      });
    }
  }, []);

  return {
    updateLayout,
    getCurrentLayout,
    resetLayout,
    updateNodePosition,
    updateDimensions,
    layoutResult
  };
}
