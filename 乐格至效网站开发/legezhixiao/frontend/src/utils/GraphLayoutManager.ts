import * as d3 from 'd3';
import { GraphNode, GraphRelationship, GraphLayoutConfig } from '../types/graph';

// 类型安全的 D3 力模拟类型
type ForceSimulation = d3.Simulation<GraphNode, d3.SimulationLinkDatum<GraphNode>>;
type ForceLink = d3.ForceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>;

export class GraphLayoutManager {
  private nodes: GraphNode[];
  private relationships: GraphRelationship[];
  private simulation: ForceSimulation | null = null;
  private config: GraphLayoutConfig;

  constructor(private width: number, private height: number) {
    this.nodes = [];
    this.relationships = [];
    this.config = {
      type: 'force',
      settings: {
        forceStrength: 0.1,
        linkDistance: 100,
        centerForce: 1,
        width,
        height
      }
    };

    // 初始化模拟器
    this.simulation = d3.forceSimulation<GraphNode>()
      .force('link', d3.forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>().id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    // 设置回调，当模拟器每次迭代时更新节点位置
    this.simulation.on('tick', () => {
      // 这里不做具体操作，由外部组件决定如何使用更新后的位置
    });
  }

  /**
   * 更新布局配置
   */
  public setConfig(config: GraphLayoutConfig): void {
    this.config = config;
    this.applyLayout();
  }

  /**
   * 更新图数据
   */
  public setData(nodes: GraphNode[], relationships: GraphRelationship[]): void {
    this.nodes = nodes;
    this.relationships = relationships;
    this.applyLayout();
  }

  /**
   * 应用当前配置的布局
   */
  public applyLayout(): void {
    // 根据布局类型选择适当的布局算法
    switch (this.config.type) {
      case 'force':
        this.applyForceLayout();
        break;
      case 'circular':
        this.applyCircularLayout();
        break;
      case 'tree':
        this.applyTreeLayout();
        break;
    }
  }

  /**
   * 应用力导向布局
   */
  private applyForceLayout(): void {
    const { forceStrength = 0.1, linkDistance = 100, width = this.width, height = this.height } = this.config.settings || {};

    // 更新模拟器节点和链接
    this.simulation!.nodes(this.nodes);
    const linkForce = this.simulation!.force('link') as ForceLink;
    
    // 创建兼容的链接数据
    const links = this.relationships.map(rel => {
      return {
        source: typeof rel.source === 'string' ? rel.source : rel.source.id,
        target: typeof rel.target === 'string' ? rel.target : rel.target.id
      };
    });
    
    linkForce
      .links(links)
      .distance(linkDistance);

    // 更新力强度
    const chargeForce = this.simulation!.force('charge') as d3.ForceManyBody<GraphNode>;
    chargeForce.strength(-100 * forceStrength);

    // 更新中心力
    const centerForce = this.simulation!.force('center') as d3.ForceCenter<GraphNode>;
    centerForce.x(width / 2).y(height / 2);

    // 重启模拟器
    this.simulation!.alpha(1).restart();
  }

  /**
   * 应用环形布局
   */
  private applyCircularLayout(): void {
    const { radiusMultiplier = 1, width = this.width, height = this.height } = this.config.settings || {};

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8 * radiusMultiplier;

    // 计算每个节点的位置
    this.nodes.forEach((node, i) => {
      const angle = (i / this.nodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      node.fx = node.x;
      node.fy = node.y;
    });

    // 使用力导向来处理链接
    this.simulation!.nodes(this.nodes);
    const linkForce = this.simulation!.force('link') as ForceLink;
    
    // 创建兼容的链接数据
    const links = this.relationships.map(rel => {
      return {
        source: typeof rel.source === 'string' ? rel.source : rel.source.id,
        target: typeof rel.target === 'string' ? rel.target : rel.target.id
      };
    });
    
    linkForce.links(links);
    
    // 固定节点位置
    this.simulation!.alpha(0.1).restart();
  }

  /**
   * 应用树形布局
   */
  private applyTreeLayout(): void {
    const { verticalSpacing = 100, width = this.width } = this.config.settings || {};

    // 找到根节点（没有入边的节点）
    const rootId = this.findRootNode();
    if (!rootId) return;

    // 构建树结构
    const root = this.buildTree(rootId);
    if (!root) return;

    // 计算节点位置
    let currentY = 50;
    const visited = new Set<string>();

    // 层级遍历
    const traverseLevel = (nodes: GraphNode[], level: number) => {
      if (nodes.length === 0) return;

      const nextLevel: GraphNode[] = [];
      const levelWidth = width / (nodes.length + 1);

      nodes.forEach((node, i) => {
        if (visited.has(node.id)) return;
        visited.add(node.id);

        // 设置节点位置
        node.x = levelWidth * (i + 1);
        node.y = currentY;
        node.fx = node.x;
        node.fy = node.y;

        // 获取子节点
        const children = this.getChildNodes(node.id);
        children.forEach(child => {
          if (!visited.has(child.id)) {
            nextLevel.push(child);
          }
        });
      });

      // 处理下一层
      currentY += verticalSpacing;
      traverseLevel(nextLevel, level + 1);
    };

    traverseLevel([root], 0);

    // 使用力导向来处理链接
    this.simulation!.nodes(this.nodes);
    const linkForce = this.simulation!.force('link') as ForceLink;
    
    // 创建兼容的链接数据
    const links = this.relationships.map(rel => {
      return {
        source: typeof rel.source === 'string' ? rel.source : rel.source.id,
        target: typeof rel.target === 'string' ? rel.target : rel.target.id
      };
    });
    
    linkForce.links(links);
    
    // 固定节点位置
    this.simulation!.alpha(0.1).restart();
  }

  /**
   * 查找可能的根节点
   */
  private findRootNode(): string | null {
    // 计算每个节点的入度
    const inDegree: Record<string, number> = {};
    
    this.nodes.forEach(node => {
      inDegree[node.id] = 0;
    });
    
    this.relationships.forEach(rel => {
      const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
      inDegree[targetId] = (inDegree[targetId] || 0) + 1;
    });
    
    // 找到入度为0的节点作为根
    for (const [id, degree] of Object.entries(inDegree)) {
      if (degree === 0) return id;
    }
    
    // 如果没有入度为0的节点，返回第一个节点
    return this.nodes.length > 0 ? this.nodes[0].id : null;
  }

  /**
   * 构建以指定节点为根的树
   */
  private buildTree(rootId: string): GraphNode | null {
    return this.nodes.find(node => node.id === rootId) || null;
  }

  /**
   * 获取节点的子节点
   */
  private getChildNodes(nodeId: string): GraphNode[] {
    const childIds = this.relationships
      .filter(rel => {
        const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
        return sourceId === nodeId;
      })
      .map(rel => {
        const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
        return targetId;
      });
    
    return this.nodes.filter(node => childIds.includes(node.id));
  }

  /**
   * 更新尺寸
   */
  public updateDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    if (this.config.settings) {
      this.config.settings.width = width;
      this.config.settings.height = height;
    }
    
    // 更新中心力
    const centerForce = this.simulation!.force('center') as d3.ForceCenter<GraphNode>;
    centerForce.x(width / 2).y(height / 2);
    
    this.applyLayout();
  }

  /**
   * 停止模拟
   */
  public stopSimulation(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  /**
   * 获取节点
   */
  public getNodes(): GraphNode[] {
    return this.nodes;
  }

  /**
   * 获取关系
   */
  public getRelationships(): GraphRelationship[] {
    return this.relationships;
  }
}
