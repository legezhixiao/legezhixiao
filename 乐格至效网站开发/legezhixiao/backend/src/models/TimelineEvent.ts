import { DataTypes, Model, Optional } from 'sequelize';
import { databaseConfig } from '../config/database';

// 时间线事件属性接口
export interface TimelineEventAttributes {
  id: string;
  projectId: string;        // 项目ID
  title: string;            // 事件标题
  description?: string;     // 事件描述
  eventType: 'plot' | 'character' | 'world' | 'other'; // 事件类型
  importance: 'critical' | 'major' | 'minor'; // 重要性
  status: 'planned' | 'in_progress' | 'completed'; // 状态
  date?: string;            // 故事内时间
  realDate?: Date;          // 现实时间（用于排序）
  duration?: number;        // 持续时间（小时）
  location?: string;        // 发生地点
  characters?: string[];    // 涉及角色
  chapterIds?: string[];    // 相关章节
  tags?: string[];          // 标签
  consequences?: string[];  // 后果/影响
  prerequisites?: string[]; // 前置条件
  notes?: string;           // 备注
  order: number;            // 排序
  createdAt: Date;
  updatedAt: Date;
}

interface TimelineEventCreationAttributes extends Optional<TimelineEventAttributes, 
  'id' | 'createdAt' | 'updatedAt' | 'description' | 'date' | 'realDate' | 'duration' | 
  'location' | 'characters' | 'chapterIds' | 'tags' | 'consequences' | 'prerequisites' | 'notes'> {}

// 时间线事件模型
export class TimelineEvent extends Model<TimelineEventAttributes, TimelineEventCreationAttributes> 
  implements TimelineEventAttributes {
  public id!: string;
  public projectId!: string;
  public title!: string;
  public description?: string;
  public eventType!: 'plot' | 'character' | 'world' | 'other';
  public importance!: 'critical' | 'major' | 'minor';
  public status!: 'planned' | 'in_progress' | 'completed';
  public date?: string;
  public realDate?: Date;
  public duration?: number;
  public location?: string;
  public characters?: string[];
  public chapterIds?: string[];
  public tags?: string[];
  public consequences?: string[];
  public prerequisites?: string[];
  public notes?: string;
  public order!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate() {
    // 这里会在models/index.ts中设置关联
  }
}

// 初始化模型
export const initTimelineEventModel = () => {
  const sequelize = databaseConfig.getSequelize();
  if (!sequelize) {
    throw new Error('Database not initialized');
  }

  TimelineEvent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    eventType: {
      type: DataTypes.ENUM('plot', 'character', 'world', 'other'),
      allowNull: false
    },
    importance: {
      type: DataTypes.ENUM('critical', 'major', 'minor'),
      allowNull: false,
      defaultValue: 'minor'
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'planned'
    },
    date: {
      type: DataTypes.STRING,
      allowNull: true
    },
    realDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    characters: {
      type: DataTypes.JSON,
      allowNull: true
    },
    chapterIds: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    consequences: {
      type: DataTypes.JSON,
      allowNull: true
    },
    prerequisites: {
      type: DataTypes.JSON,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TimelineEvent',
    tableName: 'TimelineEvents',
    timestamps: true,
    indexes: [
      {
        fields: ['projectId']
      },
      {
        fields: ['eventType']
      },
      {
        fields: ['importance']
      },
      {
        fields: ['order']
      }
    ]
  });

  return TimelineEvent;
};
