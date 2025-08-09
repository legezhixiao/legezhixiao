import { DataTypes, Model, Optional } from 'sequelize';
import { databaseConfig } from '../config/database';

// 项目状态枚举
export enum ProjectStatus {
  DRAFT = 'draft',           // 草稿
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed',   // 已完成
  PUBLISHED = 'published',   // 已发布
  PAUSED = 'paused'         // 暂停
}

// 项目类型枚举
export enum ProjectType {
  NOVEL = 'novel',           // 长篇小说
  SHORT_STORY = 'short_story', // 短篇小说
  ESSAY = 'essay',           // 散文
  SCRIPT = 'script',         // 剧本
  POETRY = 'poetry'          // 诗歌
}

// 项目属性接口
export interface ProjectAttributes {
  id: string;
  userId: string;           // 用户ID
  title: string;            // 项目标题
  description?: string;     // 项目描述
  type: ProjectType;        // 项目类型
  status: ProjectStatus;    // 项目状态
  coverImage?: string;      // 封面图片
  tags?: string[];          // 标签
  genres?: string[];        // 类型/流派
  targetWordCount?: number; // 目标字数
  currentWordCount: number; // 当前字数
  chapterCount: number;     // 章节数
  outline?: string;         // 大纲
  settings?: {              // 项目设置
    autoSave: boolean;
    aiAssistant: boolean;
    collaborationEnabled: boolean;
    privacyLevel: 'private' | 'public' | 'shared';
  };
  metadata?: {              // 元数据
    lastEditedAt: Date;
    lastEditedChapter?: string;
    writingGoal?: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    deadlines?: {
      firstDraft?: Date;
      finalDraft?: Date;
      publication?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// 创建项目时的可选属性
interface ProjectCreationAttributes extends Optional<ProjectAttributes, 
  'id' | 'currentWordCount' | 'chapterCount' | 'createdAt' | 'updatedAt'> {}

// 项目模型类
class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public description?: string;
  public type!: ProjectType;
  public status!: ProjectStatus;
  public coverImage?: string;
  public tags?: string[];
  public genres?: string[];
  public targetWordCount?: number;
  public currentWordCount!: number;
  public chapterCount!: number;
  public outline?: string;
  public settings?: {
    autoSave: boolean;
    aiAssistant: boolean;
    collaborationEnabled: boolean;
    privacyLevel: 'private' | 'public' | 'shared';
  };
  public metadata?: {
    lastEditedAt: Date;
    lastEditedChapter?: string;
    writingGoal?: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    deadlines?: {
      firstDraft?: Date;
      finalDraft?: Date;
      publication?: Date;
    };
  };

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 静态方法：初始化模型
  public static initModel() {
    Project.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'Users',
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
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM(...Object.values(ProjectType)),
          allowNull: false,
          defaultValue: ProjectType.NOVEL,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ProjectStatus)),
          allowNull: false,
          defaultValue: ProjectStatus.DRAFT,
        },
        coverImage: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        tags: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        genres: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        targetWordCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 0,
          },
        },
        currentWordCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        chapterCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        outline: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        settings: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {
            autoSave: true,
            aiAssistant: true,
            collaborationEnabled: false,
            privacyLevel: 'private',
          },
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
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
        modelName: 'Project',
        tableName: 'projects',
        timestamps: true,
        indexes: [
          {
            fields: ['userId'],
          },
          {
            fields: ['status'],
          },
          {
            fields: ['type'],
          },
          {
            fields: ['createdAt'],
          },
        ],
      }
    );

    return Project;
  }

  // 实例方法：更新字数统计
  public async updateWordCount(wordCount: number): Promise<void> {
    this.currentWordCount = wordCount;
    this.metadata = {
      ...this.metadata,
      lastEditedAt: new Date(),
    };
    await this.save();
  }

  // 实例方法：添加章节
  public async incrementChapterCount(): Promise<void> {
    this.chapterCount += 1;
    await this.save();
  }

  // 实例方法：获取进度百分比
  public getProgress(): number {
    if (!this.targetWordCount || this.targetWordCount === 0) {
      return 0;
    }
    return Math.min(100, (this.currentWordCount / this.targetWordCount) * 100);
  }

  // 静态方法：按用户获取项目
  public static async getByUserId(userId: string): Promise<Project[]> {
    return Project.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });
  }

  // 静态方法：获取用户的活跃项目
  public static async getActiveProjects(userId: string): Promise<Project[]> {
    return Project.findAll({
      where: {
        userId,
        status: [ProjectStatus.DRAFT, ProjectStatus.IN_PROGRESS],
      },
      order: [['updatedAt', 'DESC']],
    });
  }
}

export default Project;
