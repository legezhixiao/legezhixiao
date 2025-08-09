/**
 * 项目分析器服务
 * 提供项目数据分析和统计功能
 */

export interface ProjectStats {
  totalWords: number;
  totalChapters: number;
  totalCharacters: number;
  averageChapterLength: number;
  writingProgress: number;
  dailyWords: number;
  weeklyWords: number;
  monthlyWords: number;
  estimatedCompletionDate?: string;
}

export interface WritingPattern {
  dailyAverage: number;
  peakHours: number[];
  productiveDays: string[];
  averageSessionLength: number;
  consistencyScore: number;
}

export interface ContentAnalysis {
  sentimentScore: number;
  complexityScore: number;
  readabilityScore: number;
  dialogueRatio: number;
  narrativeRatio: number;
  descriptionRatio: number;
}

export interface CharacterAnalysis {
  totalCharacters: number;
  mainCharacters: number;
  supportingCharacters: number;
  characterDevelopmentScore: number;
  relationshipComplexity: number;
}

export interface PlotAnalysis {
  structureScore: number;
  paceScore: number;
  tensionCurve: number[];
  conflictTypes: string[];
  themeStrength: number;
}

export interface QualityMetrics {
  overallScore: number;
  consistencyScore: number;
  creativityScore: number;
  technicalScore: number;
  engagementScore: number;
  suggestions: string[];
}

export class ProjectAnalyzerService {
  /**
   * 分析项目统计数据
   */
  analyzeProjectStats(project: any): ProjectStats {
    const chapters = project.chapters || [];
    const totalWords = chapters.reduce((sum: number, chapter: any) => sum + (chapter.wordCount || 0), 0);
    const totalChapters = chapters.length;
    const totalCharacters = (project.characters || []).length;
    const averageChapterLength = totalChapters > 0 ? Math.round(totalWords / totalChapters) : 0;
    
    const targetWords = project.targetWords || 100000;
    const writingProgress = Math.min((totalWords / targetWords) * 100, 100);

    // 计算日/周/月字数（基于最近的写作记录）
    const writingSessions = project.writingSessions || [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyWords = this.calculateWordsInPeriod(writingSessions, oneDayAgo);
    const weeklyWords = this.calculateWordsInPeriod(writingSessions, oneWeekAgo);
    const monthlyWords = this.calculateWordsInPeriod(writingSessions, oneMonthAgo);

    // 估算完成日期
    const remainingWords = targetWords - totalWords;
    const averageDailyWords = writingSessions.length > 0 ? weeklyWords / 7 : 0;
    let estimatedCompletionDate;
    
    if (averageDailyWords > 0 && remainingWords > 0) {
      const daysToCompletion = Math.ceil(remainingWords / averageDailyWords);
      estimatedCompletionDate = new Date(now.getTime() + daysToCompletion * 24 * 60 * 60 * 1000).toISOString();
    }

    return {
      totalWords,
      totalChapters,
      totalCharacters,
      averageChapterLength,
      writingProgress,
      dailyWords,
      weeklyWords,
      monthlyWords,
      estimatedCompletionDate
    };
  }

  /**
   * 分析写作模式
   */
  analyzeWritingPattern(writingSessions: any[]): WritingPattern {
    if (!writingSessions || writingSessions.length === 0) {
      return {
        dailyAverage: 0,
        peakHours: [],
        productiveDays: [],
        averageSessionLength: 0,
        consistencyScore: 0
      };
    }

    // 计算日平均字数
    const totalWords = writingSessions.reduce((sum, session) => sum + (session.wordsWritten || 0), 0);
    const uniqueDays = new Set(writingSessions.map(session => 
      new Date(session.startTime).toDateString()
    )).size;
    const dailyAverage = uniqueDays > 0 ? Math.round(totalWords / uniqueDays) : 0;

    // 分析高峰时段
    const hourlyWords: { [hour: number]: number } = {};
    writingSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourlyWords[hour] = (hourlyWords[hour] || 0) + (session.wordsWritten || 0);
    });

    const peakHours = Object.entries(hourlyWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // 分析高效日期
    const dailyWords: { [date: string]: number } = {};
    writingSessions.forEach(session => {
      const date = new Date(session.startTime).toDateString();
      dailyWords[date] = (dailyWords[date] || 0) + (session.wordsWritten || 0);
    });

    const averageDailyWords = Object.values(dailyWords).reduce((sum, words) => sum + words, 0) / Object.keys(dailyWords).length;
    const productiveDays = Object.entries(dailyWords)
      .filter(([, words]) => words > averageDailyWords * 1.2)
      .map(([date]) => date);

    // 计算平均写作时长
    const totalDuration = writingSessions.reduce((sum, session) => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime || session.startTime);
      return sum + (end.getTime() - start.getTime());
    }, 0);
    const averageSessionLength = writingSessions.length > 0 ? Math.round(totalDuration / writingSessions.length / (1000 * 60)) : 0;

    // 计算一致性评分
    const wordCounts = Object.values(dailyWords);
    const variance = this.calculateVariance(wordCounts);
    const consistencyScore = Math.max(0, Math.min(100, 100 - (variance / averageDailyWords) * 100));

    return {
      dailyAverage,
      peakHours,
      productiveDays,
      averageSessionLength,
      consistencyScore: Math.round(consistencyScore)
    };
  }

  /**
   * 分析内容质量
   */
  analyzeContent(chapters: any[]): ContentAnalysis {
    if (!chapters || chapters.length === 0) {
      return {
        sentimentScore: 50,
        complexityScore: 50,
        readabilityScore: 50,
        dialogueRatio: 0,
        narrativeRatio: 0,
        descriptionRatio: 0
      };
    }

    const allContent = chapters.map(chapter => chapter.content || '').join(' ');
    
    // 情感分析（简化版）
    const sentimentScore = this.analyzeSentiment(allContent);
    
    // 复杂度分析
    const complexityScore = this.analyzeComplexity(allContent);
    
    // 可读性分析
    const readabilityScore = this.analyzeReadability(allContent);
    
    // 内容类型比例分析
    const { dialogueRatio, narrativeRatio, descriptionRatio } = this.analyzeContentTypes(allContent);

    return {
      sentimentScore: Math.round(sentimentScore),
      complexityScore: Math.round(complexityScore),
      readabilityScore: Math.round(readabilityScore),
      dialogueRatio: Math.round(dialogueRatio * 100),
      narrativeRatio: Math.round(narrativeRatio * 100),
      descriptionRatio: Math.round(descriptionRatio * 100)
    };
  }

  /**
   * 分析角色发展
   */
  analyzeCharacters(characters: any[]): CharacterAnalysis {
    if (!characters || characters.length === 0) {
      return {
        totalCharacters: 0,
        mainCharacters: 0,
        supportingCharacters: 0,
        characterDevelopmentScore: 0,
        relationshipComplexity: 0
      };
    }

    const totalCharacters = characters.length;
    const mainCharacters = characters.filter(char => char.role === 'main' || char.importance === 'high').length;
    const supportingCharacters = totalCharacters - mainCharacters;

    // 角色发展评分
    const developmentScore = characters.reduce((sum, character) => {
      const hasBackstory = character.background && character.background.length > 50;
      const hasPersonality = character.personality && character.personality.length > 0;
      const hasGoals = character.goals && character.goals.length > 0;
      const hasGrowth = character.developmentArc && character.developmentArc.length > 0;
      
      let score = 0;
      if (hasBackstory) score += 25;
      if (hasPersonality) score += 25;
      if (hasGoals) score += 25;
      if (hasGrowth) score += 25;
      
      return sum + score;
    }, 0);

    const characterDevelopmentScore = totalCharacters > 0 ? Math.round(developmentScore / totalCharacters) : 0;

    // 关系复杂度
    const totalRelationships = characters.reduce((sum, character) => {
      return sum + (character.relationships ? Object.keys(character.relationships).length : 0);
    }, 0);
    const relationshipComplexity = Math.min(100, (totalRelationships / totalCharacters) * 20);

    return {
      totalCharacters,
      mainCharacters,
      supportingCharacters,
      characterDevelopmentScore,
      relationshipComplexity: Math.round(relationshipComplexity)
    };
  }

  /**
   * 分析情节结构
   */
  analyzePlot(project: any): PlotAnalysis {
    const chapters = project.chapters || [];
    const outline = project.outline || {};
    
    // 结构评分（基于章节数量和大纲完整性）
    const hasOutline = outline.acts && outline.acts.length > 0;
    const hasKeyEvents = outline.keyEvents && outline.keyEvents.length > 0;
    const hasThemes = project.themes && project.themes.length > 0;
    
    let structureScore = 0;
    if (hasOutline) structureScore += 30;
    if (hasKeyEvents) structureScore += 30;
    if (hasThemes) structureScore += 20;
    if (chapters.length > 5) structureScore += 20;

    // 节奏评分（基于章节长度变化）
    const chapterLengths = chapters.map((chapter: any) => chapter.wordCount || 0);
    const lengthVariance = this.calculateVariance(chapterLengths);
    const averageLength = chapterLengths.reduce((sum: number, length: number) => sum + length, 0) / chapterLengths.length || 0;
    const paceScore = Math.max(0, Math.min(100, 100 - (lengthVariance / averageLength) * 50));

    // 张力曲线（简化计算）
    const tensionCurve = chapters.map((_chapter: any, index: number) => {
      const position = index / (chapters.length - 1 || 1);
      const baseTension = Math.sin(position * Math.PI) * 50 + 50;
      const randomVariation = (Math.random() - 0.5) * 20;
      return Math.max(0, Math.min(100, baseTension + randomVariation));
    });

    // 冲突类型分析
    const conflictTypes = this.analyzeConflictTypes(chapters);

    // 主题强度
    const themeStrength = hasThemes ? Math.min(100, project.themes.length * 20) : 0;

    return {
      structureScore: Math.round(structureScore),
      paceScore: Math.round(paceScore),
      tensionCurve,
      conflictTypes,
      themeStrength
    };
  }

  /**
   * 生成质量评估报告
   */
  generateQualityMetrics(project: any): QualityMetrics {
    const stats = this.analyzeProjectStats(project);
    const content = this.analyzeContent(project.chapters);
    const characters = this.analyzeCharacters(project.characters);
    const plot = this.analyzePlot(project);

    const consistencyScore = (content.readabilityScore + characters.characterDevelopmentScore) / 2;
    const creativityScore = (plot.structureScore + characters.relationshipComplexity) / 2;
    const technicalScore = content.complexityScore;
    const engagementScore = (plot.paceScore + content.sentimentScore) / 2;

    const overallScore = (consistencyScore + creativityScore + technicalScore + engagementScore) / 4;

    const suggestions = this.generateSuggestions({
      stats,
      content,
      characters,
      plot,
      consistencyScore,
      creativityScore,
      technicalScore,
      engagementScore
    });

    return {
      overallScore: Math.round(overallScore),
      consistencyScore: Math.round(consistencyScore),
      creativityScore: Math.round(creativityScore),
      technicalScore: Math.round(technicalScore),
      engagementScore: Math.round(engagementScore),
      suggestions
    };
  }

  // 私有辅助方法

  private calculateWordsInPeriod(sessions: any[], since: Date): number {
    return sessions
      .filter(session => new Date(session.startTime) >= since)
      .reduce((sum, session) => sum + (session.wordsWritten || 0), 0);
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  private analyzeSentiment(text: string): number {
    // 简化的情感分析
    const positiveWords = ['好', '棒', '美', '爱', '喜欢', '开心', '快乐', '希望'];
    const negativeWords = ['坏', '糟', '恨', '讨厌', '伤心', '愤怒', '绝望', '痛苦'];
    
    const words = text.split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
      if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 50;
    
    return (positiveCount / total) * 100;
  }

  private analyzeComplexity(text: string): number {
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    
    if (sentences.length === 0) return 50;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const complexityScore = Math.min(100, avgWordsPerSentence * 5);
    
    return complexityScore;
  }

  private analyzeReadability(text: string): number {
    // 简化的可读性分析
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 50;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = text.length / words.length;
    
    // 理想的可读性：每句10-15个词，每词2-4个字符
    const sentenceLengthScore = Math.max(0, 100 - Math.abs(avgWordsPerSentence - 12.5) * 4);
    const wordLengthScore = Math.max(0, 100 - Math.abs(avgCharsPerWord - 3) * 10);
    
    return (sentenceLengthScore + wordLengthScore) / 2;
  }

  private analyzeContentTypes(text: string): { dialogueRatio: number; narrativeRatio: number; descriptionRatio: number } {
    const dialogueMatches = text.match(/[""].*?[""]|「.*?」/g) || [];
    const dialogueLength = dialogueMatches.join('').length;
    
    // 简化的描述性文本检测
    const descriptionKeywords = ['描述', '景色', '外观', '样子', '看起来', '听起来', '感觉'];
    const descriptionMatches = text.split(/[。！？]/).filter(sentence => 
      descriptionKeywords.some(keyword => sentence.includes(keyword))
    );
    const descriptionLength = descriptionMatches.join('').length;
    
    const narrativeLength = Math.max(0, text.length - dialogueLength - descriptionLength);
    
    const totalLength = text.length || 1;
    
    return {
      dialogueRatio: dialogueLength / totalLength,
      narrativeRatio: narrativeLength / totalLength,
      descriptionRatio: descriptionLength / totalLength
    };
  }

  private analyzeConflictTypes(chapters: any[]): string[] {
    const conflictKeywords = {
      '内心冲突': ['犹豫', '纠结', '矛盾', '挣扎', '思考'],
      '人际冲突': ['争吵', '对立', '冲突', '敌对', '竞争'],
      '环境冲突': ['困难', '挑战', '障碍', '危险', '阻碍']
    };
    
    const allContent = chapters.map(chapter => chapter.content || '').join(' ');
    const foundConflicts: string[] = [];
    
    Object.entries(conflictKeywords).forEach(([conflictType, keywords]) => {
      if (keywords.some(keyword => allContent.includes(keyword))) {
        foundConflicts.push(conflictType);
      }
    });
    
    return foundConflicts;
  }

  private generateSuggestions(analysis: any): string[] {
    const suggestions: string[] = [];
    
    if (analysis.stats.averageChapterLength < 1000) {
      suggestions.push('建议增加章节长度，当前章节平均字数较少');
    }
    
    if (analysis.content.dialogueRatio < 0.2) {
      suggestions.push('考虑增加对话内容，提高故事的动态性');
    }
    
    if (analysis.characters.characterDevelopmentScore < 60) {
      suggestions.push('完善角色背景和发展轨迹，增强角色深度');
    }
    
    if (analysis.plot.structureScore < 70) {
      suggestions.push('建议完善故事大纲和结构规划');
    }
    
    if (analysis.consistencyScore < 50) {
      suggestions.push('注意保持故事的一致性和逻辑性');
    }
    
    return suggestions;
  }
}

// 创建单例实例
export const projectAnalyzerService = new ProjectAnalyzerService();