import { DataTypes, Model, Optional } from 'sequelize';
import { databaseConfig } from '../config/database';

// 角色重要性枚举
export enum CharacterImportance {
  PROTAGONIST = 'protagonist',     // 主角
  DEUTERAGONIST = 'deuteragonist', // 第二主角
  ANTAGONIST = 'antagonist',       // 反角
  SUPPORTING = 'supporting',       // 配角
  MINOR = 'minor',                 // 龙套
  BACKGROUND = 'background'        // 背景角色
}

// 角色状态枚举
export enum CharacterStatus {
  ALIVE = 'alive',                 // 存活
  DECEASED = 'deceased',           // 死亡
  MISSING = 'missing',             // 失踪
  UNKNOWN = 'unknown'              // 未知
}

// 角色属性接口
export interface CharacterAttributes {
  id: string;
  projectId: string;              // 项目ID
  name: string;                   // 角色名称
  aliases?: string[];             // 别名/昵称
  importance: CharacterImportance; // 重要性
  status: CharacterStatus;        // 状态
  description?: string;           // 描述
  biography?: string;             // 传记/背景故事
  personality?: {                 // 性格特征
    traits: string[];             // 性格特点
    strengths: string[];          // 优点
    weaknesses: string[];         // 缺点
    fears: string[];              // 恐惧
    motivations: string[];        // 动机
    goals: string[];              // 目标
  };
  appearance?: {                  // 外观
    age?: number;                 // 年龄
    gender?: string;              // 性别
    height?: string;              // 身高
    weight?: string;              // 体重
    hair?: string;                // 头发
    eyes?: string;                // 眼睛
    distinguishingMarks?: string[]; // 特征标记
    style?: string;               // 风格
  };
  background?: {                  // 背景
    birthplace?: string;          // 出生地
    family?: string[];            // 家庭成员
    education?: string;           // 教育背景
    occupation?: string;          // 职业
    socialClass?: string;         // 社会阶层
    religion?: string;            // 宗教信仰
  };
  relationships?: Array<{         // 关系网络
    characterId: string;          // 相关角色ID
    relationship: string;         // 关系类型
    description?: string;         // 关系描述
    intensity: number;            // 关系强度 (1-10)
  }>;
  timeline?: Array<{              // 时间线事件
    event: string;                // 事件
    date?: string;                // 日期
    chapterId?: string;           // 相关章节
    description?: string;         // 描述
  }>;
  dialogueStyle?: {               // 对话风格
    vocabulary?: string;          // 词汇特点
    tone?: string;                // 语调
    mannerisms?: string[];        // 口头禅
    accentOrDialect?: string;     // 口音/方言
  };
  developmentArc?: {              // 角色发展弧线
    startingPoint: string;        // 起点
    keyEvents: string[];          // 关键事件
    transformations: string[];    // 转变
    endingPoint?: string;         // 终点
  };
  images?: string[];              // 角色图片
  notes?: string;                 // 备注
  tags?: string[];                // 标签
  firstAppearance?: string;       // 首次出现章节
  lastAppearance?: string;        // 最后出现章节
  createdAt: Date;
  updatedAt: Date;
}

// 创建角色时的可选属性
interface CharacterCreationAttributes extends Optional<CharacterAttributes, 
  'id' | 'createdAt' | 'updatedAt'> {}

// 角色模型类
class Character extends Model<CharacterAttributes, CharacterCreationAttributes> implements CharacterAttributes {
  public id!: string;
  public projectId!: string;
  public name!: string;
  public aliases?: string[];
  public importance!: CharacterImportance;
  public status!: CharacterStatus;
  public description?: string;
  public biography?: string;
  public personality?: {
    traits: string[];
    strengths: string[];
    weaknesses: string[];
    fears: string[];
    motivations: string[];
    goals: string[];
  };
  public appearance?: {
    age?: number;
    gender?: string;
    height?: string;
    weight?: string;
    hair?: string;
    eyes?: string;
    distinguishingMarks?: string[];
    style?: string;
  };
  public background?: {
    birthplace?: string;
    family?: string[];
    education?: string;
    occupation?: string;
    socialClass?: string;
    religion?: string;
  };
  public relationships?: Array<{
    characterId: string;
    relationship: string;
    description?: string;
    intensity: number;
  }>;
  public timeline?: Array<{
    event: string;
    date?: string;
    chapterId?: string;
    description?: string;
  }>;
  public dialogueStyle?: {
    vocabulary?: string;
    tone?: string;
    mannerisms?: string[];
    accentOrDialect?: string;
  };
  public developmentArc?: {
    startingPoint: string;
    keyEvents: string[];
    transformations: string[];
    endingPoint?: string;
  };
  public images?: string[];
  public notes?: string;
  public tags?: string[];
  public firstAppearance?: string;
  public lastAppearance?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 静态方法：初始化模型
  public static initModel() {
    Character.init(
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
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [1, 100],
          },
        },
        aliases: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        importance: {
          type: DataTypes.ENUM(...Object.values(CharacterImportance)),
          allowNull: false,
          defaultValue: CharacterImportance.SUPPORTING,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(CharacterStatus)),
          allowNull: false,
          defaultValue: CharacterStatus.ALIVE,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        biography: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        personality: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {
            traits: [],
            strengths: [],
            weaknesses: [],
            fears: [],
            motivations: [],
            goals: [],
          },
        },
        appearance: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
        background: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
        relationships: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        timeline: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        dialogueStyle: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
        developmentArc: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        images: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
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
        firstAppearance: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'chapters',
            key: 'id',
          },
        },
        lastAppearance: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'chapters',
            key: 'id',
          },
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
        modelName: 'Character',
        tableName: 'characters',
        timestamps: true,
        indexes: [
          {
            fields: ['projectId'],
          },
          {
            fields: ['importance'],
          },
          {
            fields: ['status'],
          },
          {
            fields: ['name'],
          },
        ],
      }
    );

    return Character;
  }

  // 实例方法：添加关系
  public async addRelationship(
    characterId: string, 
    relationship: string, 
    description?: string, 
    intensity: number = 5
  ): Promise<void> {
    const currentRelationships = this.relationships || [];
    const existingIndex = currentRelationships.findIndex(r => r.characterId === characterId);
    
    const newRelationship = {
      characterId,
      relationship,
      description,
      intensity,
    };

    if (existingIndex >= 0) {
      currentRelationships[existingIndex] = newRelationship;
    } else {
      currentRelationships.push(newRelationship);
    }

    this.relationships = currentRelationships;
    await this.save();
  }

  // 实例方法：添加时间线事件
  public async addTimelineEvent(
    event: string, 
    date?: string, 
    chapterId?: string, 
    description?: string
  ): Promise<void> {
    const currentTimeline = this.timeline || [];
    currentTimeline.push({
      event,
      date,
      chapterId,
      description,
    });

    this.timeline = currentTimeline;
    await this.save();
  }

  // 静态方法：按项目获取角色
  public static async getByProjectId(projectId: string): Promise<Character[]> {
    return Character.findAll({
      where: { projectId },
      order: [
        ['importance', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  // 静态方法：获取主要角色
  public static async getMainCharacters(projectId: string): Promise<Character[]> {
    return Character.findAll({
      where: {
        projectId,
        importance: [
          CharacterImportance.PROTAGONIST,
          CharacterImportance.DEUTERAGONIST,
          CharacterImportance.ANTAGONIST,
        ],
      },
      order: [['importance', 'ASC']],
    });
  }

  // 静态方法：搜索角色
  public static async searchCharacters(projectId: string, query: string): Promise<Character[]> {
    const { Op } = require('sequelize');
    
    return Character.findAll({
      where: {
        projectId,
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
        ],
      },
    });
  }

  // 静态方法：获取角色关系网络
  public static async getRelationshipNetwork(projectId: string): Promise<{
    nodes: Array<{ id: string; name: string; importance: CharacterImportance }>;
    edges: Array<{ source: string; target: string; relationship: string; intensity: number }>;
  }> {
    const characters = await Character.getByProjectId(projectId);
    
    const nodes = characters.map(char => ({
      id: char.id,
      name: char.name,
      importance: char.importance,
    }));

    const edges: Array<{ source: string; target: string; relationship: string; intensity: number }> = [];
    
    characters.forEach(character => {
      if (character.relationships) {
        character.relationships.forEach(rel => {
          edges.push({
            source: character.id,
            target: rel.characterId,
            relationship: rel.relationship,
            intensity: rel.intensity,
          });
        });
      }
    });

    return { nodes, edges };
  }
}

export default Character;
