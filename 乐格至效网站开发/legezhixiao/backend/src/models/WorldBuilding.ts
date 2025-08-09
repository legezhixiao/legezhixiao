import { DataTypes, Model, Optional } from 'sequelize';
import { databaseConfig } from '../config/database';

// 世界观设定属性接口
export interface WorldBuildingAttributes {
  id: string;
  projectId: string;        // 项目ID
  type: 'location' | 'culture' | 'history' | 'magic_system' | 'technology' | 'organization' | 'other';
  name: string;             // 名称
  description: string;      // 详细描述
  parentId?: string;        // 父级设定ID（用于层级结构）
  tags?: string[];          // 标签
  attributes?: {            // 具体属性
    [key: string]: any;
  };
  relatedElements?: string[]; // 关联的其他设定元素
  images?: string[];        // 相关图片
  notes?: string;           // 备注
  importance: 'high' | 'medium' | 'low'; // 重要性
  visibility: 'public' | 'private'; // 可见性
  createdAt: Date;
  updatedAt: Date;
}

interface WorldBuildingCreationAttributes extends Optional<WorldBuildingAttributes, 
  'id' | 'createdAt' | 'updatedAt' | 'parentId' | 'tags' | 'attributes' | 'relatedElements' | 'images' | 'notes'> {}

// 世界观设定模型
export class WorldBuilding extends Model<WorldBuildingAttributes, WorldBuildingCreationAttributes> 
  implements WorldBuildingAttributes {
  public id!: string;
  public projectId!: string;
  public type!: 'location' | 'culture' | 'history' | 'magic_system' | 'technology' | 'organization' | 'other';
  public name!: string;
  public description!: string;
  public parentId?: string;
  public tags?: string[];
  public attributes?: { [key: string]: any };
  public relatedElements?: string[];
  public images?: string[];
  public notes?: string;
  public importance!: 'high' | 'medium' | 'low';
  public visibility!: 'public' | 'private';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate() {
    // 这里会在models/index.ts中设置关联
  }
}

// 初始化模型
export const initWorldBuildingModel = () => {
  const sequelize = databaseConfig.getSequelize();
  if (!sequelize) {
    throw new Error('Database not initialized');
  }

  WorldBuilding.init({
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
    type: {
      type: DataTypes.ENUM('location', 'culture', 'history', 'magic_system', 'technology', 'organization', 'other'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'WorldBuildings',
        key: 'id'
      }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true
    },
    relatedElements: {
      type: DataTypes.JSON,
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    importance: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium'
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private'),
      allowNull: false,
      defaultValue: 'private'
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
    modelName: 'WorldBuilding',
    tableName: 'WorldBuildings',
    timestamps: true,
    indexes: [
      {
        fields: ['projectId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['importance']
      }
    ]
  });

  return WorldBuilding;
};
