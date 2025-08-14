import { GraphAnalyzer } from '../utils/graphAnalyzer';
import { AdvancedGraphAnalytics } from '../types/graph';
import { KnowledgeGraphService } from './knowledgeGraphService';

export class AdvancedKnowledgeGraphService extends KnowledgeGraphService {
  private analyzer: GraphAnalyzer | null = null;

  // 初始化分析器
  private initializeAnalyzer(forceRefresh: boolean = false) {
    if (!this.analyzer || forceRefresh) {
      this.analyzer = new GraphAnalyzer(this.nodes, this.relationships);
    }
  }

  // 执行高级分析
  async performAdvancedAnalysis(): Promise<AdvancedGraphAnalytics> {
    this.initializeAnalyzer(true);
    
    if (!this.analyzer) {
      throw new Error('分析器初始化失败');
    }

    // 获取所有分析结果
    const shortestPaths = this.analyzer.findShortestPaths(
      this.nodes[0].id,
      this.nodes[this.nodes.length - 1].id
    );
    
    const communities = this.analyzer.detectCommunities();
    const { eventChains, timelineSegments } = this.analyzer.analyzeTimeline();
    const { conceptClusters, thematicGroups } = this.analyzer.analyzeSemanticRelations();

    return {
      pathAnalysis: {
        shortestPaths,
        criticalPaths: shortestPaths.filter(path => path.score > 0.7) // 示例阈值
      },
      communities,
      temporalAnalysis: {
        eventChains,
        timelineSegments
      },
      semanticAnalysis: {
        conceptClusters,
        thematicGroups
      }
    };
  }

  // 获取两个节点之间的所有路径
  async findPaths(startNodeId: string, endNodeId: string, maxPaths: number = 5) {
    this.initializeAnalyzer();
    return this.analyzer?.findShortestPaths(startNodeId, endNodeId, maxPaths);
  }

  // 获取社群分析结果
  async analyzeCommunities() {
    this.initializeAnalyzer();
    return this.analyzer?.detectCommunities();
  }

  // 获取时间线分析
  async analyzeTimeline() {
    this.initializeAnalyzer();
    return this.analyzer?.analyzeTimeline();
  }

  // 获取语义关系分析
  async analyzeSemanticRelations() {
    this.initializeAnalyzer();
    return this.analyzer?.analyzeSemanticRelations();
  }
}
