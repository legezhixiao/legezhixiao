import { DataTypes, Model, Optional } from 'sequelize';
import { databaseConfig } from '../config/database';

// 章节历史版本属性接口
export interface ChapterVersionAttributes {
  id: string;
  chapterId: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  status: ChapterStatus;
  wordCount: number;
  summary?: string;
  notes?: string;
  tags?: string[];
  version: number;
  outline?: string;
  characters?: string[];
  locations?: string[];
  metadata?: object;
  aiAnalysis?: object;
  createdAt: Date;
  updatedAt: Date;
  savedAt: Date;
}

interface ChapterVersionCreationAttributes extends Optional<ChapterVersionAttributes, 'id' | 'savedAt'> {}

// 章节历史版本模型
export class ChapterVersion extends Model<ChapterVersionAttributes, ChapterVersionCreationAttributes> implements ChapterVersionAttributes {
  public id!: string;
  public chapterId!: string;
  public projectId!: string;
  public title!: string;
  public content!: string;
  public order!: number;
  public status!: ChapterStatus;
  public wordCount!: number;
  public summary?: string;
  public notes?: string;
  public tags?: string[];
  public version!: number;
  public outline?: string;
  public characters?: string[];
  public locations?: string[];
  public metadata?: object;
  public aiAnalysis?: object;
  public createdAt!: Date;
  public updatedAt!: Date;
  public savedAt!: Date;

  public static initModel() {
    ChapterVersion.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        chapterId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        projectId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        wordCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        summary: DataTypes.STRING,
        notes: DataTypes.STRING,
        tags: DataTypes.ARRAY(DataTypes.STRING),
        version: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        outline: DataTypes.STRING,
        characters: DataTypes.ARRAY(DataTypes.STRING),
        locations: DataTypes.ARRAY(DataTypes.STRING),
        metadata: DataTypes.JSONB,
        aiAnalysis: DataTypes.JSONB,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        savedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize: databaseConfig.getSequelize()!,
        tableName: 'chapter_versions',
        timestamps: false,
      }
    );
  }
}

// 章节状态枚举
export enum ChapterStatus {
  DRAFT = 'draft',           // 草稿
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed',   // 已完成
  REVIEWED = 'reviewed',     // 已审阅
  PUBLISHED = 'published'    // 已发布
}

// 章节属性接口
export interface ChapterAttributes {
  id: string;
  projectId: string;        // 项目ID
  title: string;            // 章节标题
  content: string;          // 章节内容
  order: number;            // 章节顺序
  status: ChapterStatus;    // 章节状态
  wordCount: number;        // 字数
  summary?: string;         // 章节摘要
  notes?: string;           // 作者笔记
  tags?: string[];          // 标签
  version: number;          // 版本号
  outline?: string;         // 章节大纲
  characters?: string[];    // 出现的角色
  locations?: string[];     // 出现的地点
  metadata?: {              // 元数据
    estimatedReadTime: number; // 预计阅读时间（分钟）
    difficulty?: 'easy' | 'medium' | 'hard';
    themes?: string[];      // 主题
    plotPoints?: string[];  // 情节要点
    mood?: string;          // 情绪基调
    pov?: string;           // 视角
  };
  aiAnalysis?: {            // AI分析结果
    sentiment: number;      // 情感倾向 (-1 到 1)
    complexity: number;     // 复杂度 (0 到 1)
    coherence: number;      // 连贯性 (0 到 1)
    engagement: number;     // 参与度 (0 到 1)
    suggestions?: string[]; // AI建议
    issues?: string[];      // 发现的问题
  };
  createdAt: Date;
  updatedAt: Date;
}

// 创建章节时的可选属性
interface ChapterCreationAttributes extends Optional<ChapterAttributes, 
  'id' | 'wordCount' | 'version' | 'createdAt' | 'updatedAt'> {}

// 章节模型类
class Chapter extends Model<ChapterAttributes, ChapterCreationAttributes> implements ChapterAttributes {
  public id!: string;
  public projectId!: string;
  public title!: string;
  public content!: string;
  public order!: number;
  public status!: ChapterStatus;
  public wordCount!: number;
  public summary?: string;
  public notes?: string;
  public tags?: string[];
  public version!: number;
  public outline?: string;
  public characters?: string[];
  public locations?: string[];
  public metadata?: {
    estimatedReadTime: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    themes?: string[];
    plotPoints?: string[];
    mood?: string;
    pov?: string;
  };
  public aiAnalysis?: {
    sentiment: number;
    complexity: number;
    coherence: number;
    engagement: number;
    suggestions?: string[];
    issues?: string[];
  };

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 保存历史版本
  public async saveVersion(): Promise<void> {
    const ChapterVersionModel = databaseConfig.models?.ChapterVersion || ChapterVersion;
    await ChapterVersionModel.create({
      chapterId: this.id,
      projectId: this.projectId,
      title: this.title,
      content: this.content,
      order: this.order,
      status: this.status,
      wordCount: this.wordCount,
      summary: this.summary,
      notes: this.notes,
      tags: this.tags,
      version: this.version,
      outline: this.outline,
      characters: this.characters,
      locations: this.locations,
      metadata: this.metadata,
      aiAnalysis: this.aiAnalysis,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      savedAt: new Date(),
    });
  }

  // 静态方法：初始化模型
  public static initModel() {
    Chapter.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        projectId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'projects',
            key: 'id',
          },
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [1, 200],
          },
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: '',
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
          },
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ChapterStatus)),
          allowNull: false,
          defaultValue: ChapterStatus.DRAFT,
        },
        wordCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        summary: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        tags: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        version: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
          },
        },
        outline: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        characters: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        locations: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {
            estimatedReadTime: 0,
          },
        },
        aiAnalysis: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
      },
      {
        sequelize: databaseConfig.getSequelize()!,
        modelName: 'Chapter',
        tableName: 'chapters',
        timestamps: true,
        indexes: [
          {
            fields: ['projectId'],
          },
          {
            fields: ['projectId', 'order'],
            unique: true,
          },
          {
            fields: ['status'],
          },
          {
            fields: ['createdAt'],
          },
        ],
      }
    );

    return Chapter;
  }

  // 实例方法：计算并更新字数
  public async updateWordCount(): Promise<void> {
    // 简单的字数统计（中英文混合）
    const chineseChars = (this.content.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (this.content.match(/[a-zA-Z]+/g) || []).length;
    this.wordCount = chineseChars + englishWords;
    
    // 更新预计阅读时间（按200字/分钟计算）
    const estimatedReadTime = Math.ceil(this.wordCount / 200);
    this.metadata = {
      ...this.metadata,
      estimatedReadTime,
    };
    
    await this.save();
  }

  // 实例方法：增加版本号
  public async incrementVersion(): Promise<void> {
    this.version += 1;
    await this.save();
  }

  // 静态方法：按项目获取章节
  public static async getByProjectId(projectId: string): Promise<Chapter[]> {
    return Chapter.findAll({
      where: { projectId },
      order: [['order', 'ASC']],
    });
  }

  // 静态方法：获取项目的下一个章节顺序号
  public static async getNextOrder(projectId: string): Promise<number> {
    const lastChapter = await Chapter.findOne({
      where: { projectId },
      order: [['order', 'DESC']],
    });
    return lastChapter ? lastChapter.order + 1 : 1;
  }

  // 静态方法：重新排序章节
  public static async reorderChapters(projectId: string, chapterOrders: { id: string; order: number }[]): Promise<void> {
    const transaction = await databaseConfig.getSequelize()!.transaction();
    
    try {
      for (const { id, order } of chapterOrders) {
        await Chapter.update(
          { order },
          { 
            where: { id, projectId },
            transaction 
          }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 静态方法：获取章节统计
  public static async getStatistics(projectId: string): Promise<{
    totalChapters: number;
    totalWords: number;
    averageWordsPerChapter: number;
    statusDistribution: Record<ChapterStatus, number>;
  }> {
    const chapters = await Chapter.findAll({ 
      where: { projectId },
      attributes: ['status', 'wordCount'],
    });

    const totalWords = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
    const totalChapters = chapters.length;
    const averageWordsPerChapter = totalChapters > 0 ? Math.round(totalWords / totalChapters) : 0;

    const statusDistribution = chapters.reduce((acc, chapter) => {
      acc[chapter.status] = (acc[chapter.status] || 0) + 1;
      return acc;
    }, {} as Record<ChapterStatus, number>);

    return {
      totalChapters,
      totalWords,
      averageWordsPerChapter,
      statusDistribution,
    };
  }
}

export default Chapter;
