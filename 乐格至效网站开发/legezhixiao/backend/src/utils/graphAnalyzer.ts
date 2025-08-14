import { 
  GraphNode, 
  GraphRelationship,
  PathInfo, 
  Community, 
  EventChain, 
  TimelineSegment,
  ConceptCluster,
  ThematicGroup
} from '../types/graph';

export class GraphAnalyzer {
  private nodes: GraphNode[];
  private relationships: GraphRelationship[];

  constructor(nodes: GraphNode[], relationships: GraphRelationship[]) {
    this.nodes = nodes;
    this.relationships = relationships;
  }

  // 路径分析
  public findShortestPaths(startNodeId: string, endNodeId: string, maxPaths: number = 5): PathInfo[] {
    const paths: PathInfo[] = [];
    const visited = new Set<string>();
    
    const dfs = (
      currentNodeId: string,
      currentPath: GraphNode[],
      currentRelationships: GraphRelationship[],
      weight: number
    ) => {
      if (currentNodeId === endNodeId) {
        paths.push({
          nodes: [...currentPath],
          relationships: [...currentRelationships],
          weight,
          score: this.calculatePathScore(currentPath, currentRelationships)
        });
        return;
      }

      if (paths.length >= maxPaths) return;

      visited.add(currentNodeId);

      // 获取相邻节点
      const adjacentRelationships = this.relationships.filter(
        rel => rel.startNodeId === currentNodeId || rel.endNodeId === currentNodeId
      );

      for (const rel of adjacentRelationships) {
        const nextNodeId = rel.startNodeId === currentNodeId ? rel.endNodeId : rel.startNodeId;
        if (!visited.has(nextNodeId)) {
          const nextNode = this.nodes.find(n => n.id === nextNodeId);
          if (nextNode) {
            currentPath.push(nextNode);
            currentRelationships.push(rel);
            dfs(nextNodeId, currentPath, currentRelationships, weight + (rel.strength || 1));
            currentPath.pop();
            currentRelationships.pop();
          }
        }
      }

      visited.delete(currentNodeId);
    };

    const startNode = this.nodes.find(n => n.id === startNodeId);
    if (startNode) {
      dfs(startNodeId, [startNode], [], 0);
    }

    return paths.sort((a, b) => a.weight - b.weight).slice(0, maxPaths);
  }

  // 社群检测
  public detectCommunities(): Community[] {
    const communities: Community[] = [];
    const visited = new Set<string>();

    // 使用简单的连通分量算法检测社群
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        const community: Community = {
          id: `community_${communities.length + 1}`,
          nodes: [],
          centralityScore: 0,
          density: 0,
          properties: {}
        };

        // BFS找到连通分量
        const queue: string[] = [node.id];
        visited.add(node.id);

        while (queue.length > 0) {
          const currentNodeId = queue.shift()!;
          community.nodes.push(currentNodeId);

          const adjacentRelationships = this.relationships.filter(
            rel => rel.startNodeId === currentNodeId || rel.endNodeId === currentNodeId
          );

          for (const rel of adjacentRelationships) {
            const nextNodeId = rel.startNodeId === currentNodeId ? rel.endNodeId : rel.startNodeId;
            if (!visited.has(nextNodeId)) {
              queue.push(nextNodeId);
              visited.add(nextNodeId);
            }
          }
        }

        // 计算社群属性
        this.calculateCommunityMetrics(community);
        communities.push(community);
      }
    }

    return communities;
  }

  // 时序分析
  public analyzeTimeline(): {eventChains: EventChain[], timelineSegments: TimelineSegment[]} {
    const eventNodes = this.nodes.filter(node => node.type === 'EVENT');
    const eventChains: EventChain[] = [];
    const timelineSegments: TimelineSegment[] = [];

    // 按时间排序事件
    const sortedEvents = eventNodes.sort((a, b) => {
      const timeA = a.properties?.timestamp || 0;
      const timeB = b.properties?.timestamp || 0;
      return timeA - timeB;
    });

    // 构建事件链
    let currentChain: GraphNode[] = [];
    let currentTimespan = { start: new Date(), end: new Date() };

    for (const event of sortedEvents) {
      if (currentChain.length === 0) {
        currentChain.push(event);
        currentTimespan.start = new Date(event.properties?.timestamp);
      } else {
        const lastEvent = currentChain[currentChain.length - 1];
        const timeDiff = event.properties?.timestamp - lastEvent.properties?.timestamp;

        // 如果事件间隔过大，创建新的事件链
        if (timeDiff > 86400000) { // 24小时
          if (currentChain.length > 0) {
            eventChains.push({
              id: `chain_${eventChains.length + 1}`,
              events: [...currentChain],
              timespan: { ...currentTimespan, end: new Date(lastEvent.properties?.timestamp) },
              importance: this.calculateChainImportance(currentChain)
            });
          }
          currentChain = [event];
          currentTimespan.start = new Date(event.properties?.timestamp);
        } else {
          currentChain.push(event);
        }
      }
    }

    // 添加最后一个事件链
    if (currentChain.length > 0) {
      const lastEvent = currentChain[currentChain.length - 1];
      eventChains.push({
        id: `chain_${eventChains.length + 1}`,
        events: currentChain,
        timespan: { ...currentTimespan, end: new Date(lastEvent.properties?.timestamp) },
        importance: this.calculateChainImportance(currentChain)
      });
    }

    // 构建时间线段
    let currentSegment: GraphNode[] = [];
    let currentPeriod = '';

    for (const event of sortedEvents) {
      const eventPeriod = this.calculateEventPeriod(event);
      
      if (eventPeriod !== currentPeriod) {
        if (currentSegment.length > 0) {
          timelineSegments.push({
            id: `segment_${timelineSegments.length + 1}`,
            events: [...currentSegment],
            period: currentPeriod,
            summary: this.generateSegmentSummary(currentSegment)
          });
        }
        currentSegment = [event];
        currentPeriod = eventPeriod;
      } else {
        currentSegment.push(event);
      }
    }

    // 添加最后一个时间线段
    if (currentSegment.length > 0) {
      timelineSegments.push({
        id: `segment_${timelineSegments.length + 1}`,
        events: currentSegment,
        period: currentPeriod,
        summary: this.generateSegmentSummary(currentSegment)
      });
    }

    return { eventChains, timelineSegments };
  }

  // 语义分析
  public analyzeSemanticRelations(): {conceptClusters: ConceptCluster[], thematicGroups: ThematicGroup[]} {
    const conceptNodes = this.nodes.filter(node => node.type === 'CONCEPT');
    const conceptClusters: ConceptCluster[] = [];
    const thematicGroups: ThematicGroup[] = [];

    // 构建概念聚类
    const unprocessedConcepts = new Set(conceptNodes.map(n => n.id));
    
    while (unprocessedConcepts.size > 0) {
      const seedConceptId = Array.from(unprocessedConcepts)[0];
      const cluster = this.buildConceptCluster(seedConceptId, unprocessedConcepts);
      conceptClusters.push(cluster);
    }

    // 构建主题组
    const processedNodes = new Set<string>();
    
    for (const node of this.nodes) {
      if (!processedNodes.has(node.id)) {
        const group = this.buildThematicGroup(node, processedNodes);
        if (group.nodes.length > 1) {
          thematicGroups.push(group);
        }
      }
    }

    return { conceptClusters, thematicGroups };
  }

  // 辅助方法
  private calculatePathScore(nodes: GraphNode[], relationships: GraphRelationship[]): number {
    let score = 0;
    
    // 基于节点重要性计算分数
    for (const node of nodes) {
      score += node.importance || 1;
    }

    // 基于关系强度计算分数
    for (const rel of relationships) {
      score += rel.strength || 1;
    }

    return score / (nodes.length + relationships.length);
  }

  private calculateCommunityMetrics(community: Community): void {
    const communityNodes = this.nodes.filter(n => community.nodes.includes(n.id));
    const communityRelationships = this.relationships.filter(
      r => community.nodes.includes(r.startNodeId) && community.nodes.includes(r.endNodeId)
    );

    // 计算中心度
    let maxConnections = 0;
    for (const node of communityNodes) {
      const connections = communityRelationships.filter(
        r => r.startNodeId === node.id || r.endNodeId === node.id
      ).length;
      maxConnections = Math.max(maxConnections, connections);
    }
    community.centralityScore = maxConnections;

    // 计算密度
    const maxPossibleRelationships = (community.nodes.length * (community.nodes.length - 1)) / 2;
    community.density = maxPossibleRelationships > 0 ? 
      communityRelationships.length / maxPossibleRelationships : 0;
  }

  private calculateChainImportance(events: GraphNode[]): number {
    return events.reduce((sum, event) => sum + (event.importance || 1), 0) / events.length;
  }

  private calculateEventPeriod(event: GraphNode): string {
    const timestamp = event.properties?.timestamp;
    if (!timestamp) return 'unknown';
    
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private generateSegmentSummary(events: GraphNode[]): string {
    return `包含 ${events.length} 个事件的时间段`;
  }

  private buildConceptCluster(
    seedConceptId: string, 
    unprocessedConcepts: Set<string>
  ): ConceptCluster {
    const cluster: ConceptCluster = {
      id: `cluster_${Math.random().toString(36).substr(2, 9)}`,
      concepts: [],
      centralConcept: seedConceptId,
      semanticDistance: 0
    };

    const queue: string[] = [seedConceptId];
    const processedConcepts = new Set<string>();

    while (queue.length > 0) {
      const currentConceptId = queue.shift()!;
      if (processedConcepts.has(currentConceptId)) continue;

      processedConcepts.add(currentConceptId);
      unprocessedConcepts.delete(currentConceptId);

      const currentConcept = this.nodes.find(n => n.id === currentConceptId);
      if (currentConcept) {
        cluster.concepts.push(currentConcept);

        // 查找相关概念
        const relatedRelationships = this.relationships.filter(
          r => (r.startNodeId === currentConceptId || r.endNodeId === currentConceptId) &&
               r.type === 'RELATES_TO'
        );

        for (const rel of relatedRelationships) {
          const relatedConceptId = rel.startNodeId === currentConceptId ? 
            rel.endNodeId : rel.startNodeId;

          const relatedConcept = this.nodes.find(
            n => n.id === relatedConceptId && n.type === 'CONCEPT'
          );

          if (relatedConcept && !processedConcepts.has(relatedConceptId)) {
            queue.push(relatedConceptId);
          }
        }
      }
    }

    // 计算语义距离
    cluster.semanticDistance = this.calculateSemanticDistance(cluster.concepts);

    return cluster;
  }

  private buildThematicGroup(
    seedNode: GraphNode, 
    processedNodes: Set<string>
  ): ThematicGroup {
    const group: ThematicGroup = {
      id: `group_${Math.random().toString(36).substr(2, 9)}`,
      theme: this.detectTheme([seedNode]),
      nodes: [],
      relationships: [],
      weight: 0
    };

    const queue: string[] = [seedNode.id];
    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (processedNodes.has(currentNodeId)) continue;

      processedNodes.add(currentNodeId);
      const currentNode = this.nodes.find(n => n.id === currentNodeId);
      if (currentNode) {
        group.nodes.push(currentNode);

        // 查找相关节点
        const relatedRelationships = this.relationships.filter(
          r => r.startNodeId === currentNodeId || r.endNodeId === currentNodeId
        );

        for (const rel of relatedRelationships) {
          group.relationships.push(rel);
          const relatedNodeId = rel.startNodeId === currentNodeId ? 
            rel.endNodeId : rel.startNodeId;

          if (!processedNodes.has(relatedNodeId)) {
            queue.push(relatedNodeId);
          }
        }
      }
    }

    // 更新主题和权重
    if (group.nodes.length > 1) {
      group.theme = this.detectTheme(group.nodes);
      group.weight = this.calculateGroupWeight(group);
    }

    return group;
  }

  private calculateSemanticDistance(concepts: GraphNode[]): number {
    if (concepts.length <= 1) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        totalDistance += this.calculateConceptSimilarity(concepts[i], concepts[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  private calculateConceptSimilarity(concept1: GraphNode, concept2: GraphNode): number {
    // 简单实现：基于标签或属性的匹配度
    const tags1 = concept1.tags || [];
    const tags2 = concept2.tags || [];
    
    // 计算共同标签
    const commonTagsCount = tags1.filter(tag => tags2.includes(tag)).length;
    
    // 计算唯一标签总数
    const uniqueTagsSet = new Set();
    tags1.forEach(tag => uniqueTagsSet.add(tag));
    tags2.forEach(tag => uniqueTagsSet.add(tag));
    
    return uniqueTagsSet.size > 0 ? commonTagsCount / uniqueTagsSet.size : 0;
  }

  private detectTheme(nodes: GraphNode[]): string {
    // 简单实现：使用最常见的标签或属性作为主题
    const tagFrequency: Record<string, number> = {};
    
    for (const node of nodes) {
      if (node.tags) {
        for (const tag of node.tags) {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        }
      }
    }

    let maxFreq = 0;
    let theme = '未分类主题';
    
    for (const [tag, freq] of Object.entries(tagFrequency)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        theme = tag;
      }
    }

    return theme;
  }

  private calculateGroupWeight(group: ThematicGroup): number {
    const nodeImportance = group.nodes.reduce((sum, node) => sum + (node.importance || 1), 0);
    const relationshipStrength = group.relationships.reduce((sum, rel) => sum + (rel.strength || 1), 0);
    
    return (nodeImportance + relationshipStrength) / (group.nodes.length + group.relationships.length);
  }
}
