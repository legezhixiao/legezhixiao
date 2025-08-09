import { DataTypes, Model, Optional } from 'sequelize';
import { databaseConfig } from '../config/database';

// 写作模板属性接口
export interface WritingTemplateAttributes {
  id: string;
  userId?: string;         // 用户ID（个人模板）
  name: string;            // 模板名称
  description?: string;    // 模板描述
  category: 'character' | 'plot' | 'scene' | 'dialogue' | 'description' | 'structure' | 'other';
  type: 'personal' | 'shared' | 'system'; // 模板类型
  content: string;         // 模板内容
  variables?: {            // 模板变量
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'multiline';
    label: string;
    description?: string;
    required: boolean;
    defaultValue?: any;
    options?: string[];    // 用于select类型
  }[];
  tags?: string[];         // 标签
  usageCount: number;      // 使用次数
  rating?: number;         // 评分 (1-5)
  isPublic: boolean;       // 是否公开
  language: string;        // 语言
  genre?: string[];        // 适用类型
  difficulty: 'beginner' | 'intermediate' | 'advanced'; // 难度
  examples?: {             // 使用示例
    title: string;
    description: string;
    result: string;
  }[];
  instructions?: string;   // 使用说明
  tips?: string[];         // 使用技巧
  createdAt: Date;
  updatedAt: Date;
}

interface WritingTemplateCreationAttributes extends Optional<WritingTemplateAttributes, 
  'id' | 'createdAt' | 'updatedAt' | 'userId' | 'description' | 'variables' | 'tags' | 
  'rating' | 'genre' | 'examples' | 'instructions' | 'tips'> {}

// 写作模板模型
export class WritingTemplate extends Model<WritingTemplateAttributes, WritingTemplateCreationAttributes> 
  implements WritingTemplateAttributes {
  public id!: string;
  public userId?: string;
  public name!: string;
  public description?: string;
  public category!: 'character' | 'plot' | 'scene' | 'dialogue' | 'description' | 'structure' | 'other';
  public type!: 'personal' | 'shared' | 'system';
  public content!: string;
  public variables?: {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'multiline';
    label: string;
    description?: string;
    required: boolean;
    defaultValue?: any;
    options?: string[];
  }[];
  public tags?: string[];
  public usageCount!: number;
  public rating?: number;
  public isPublic!: boolean;
  public language!: string;
  public genre?: string[];
  public difficulty!: 'beginner' | 'intermediate' | 'advanced';
  public examples?: {
    title: string;
    description: string;
    result: string;
  }[];
  public instructions?: string;
  public tips?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 实例方法
  public processTemplate(variables: { [key: string]: any }): string {
    let processedContent = this.content;
    
    if (this.variables) {
      this.variables.forEach(variable => {
        const value = variables[variable.name] || variable.defaultValue || '';
        const placeholder = `{{${variable.name}}}`;
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
      });
    }
    
    return processedContent;
  }

  public incrementUsage(): Promise<WritingTemplate> {
    this.usageCount += 1;
    return this.save();
  }

  // 关联方法
  public static associate() {
    // 这里会在models/index.ts中设置关联
  }
}

// 初始化模型
export const initWritingTemplateModel = () => {
  const sequelize = databaseConfig.getSequelize();
  if (!sequelize) {
    throw new Error('Database not initialized');
  }

  WritingTemplate.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('character', 'plot', 'scene', 'dialogue', 'description', 'structure', 'other'),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('personal', 'shared', 'system'),
      allowNull: false,
      defaultValue: 'personal'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'zh-CN'
    },
    genre: {
      type: DataTypes.JSON,
      allowNull: true
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    examples: {
      type: DataTypes.JSON,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tips: {
      type: DataTypes.JSON,
      allowNull: true
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
    modelName: 'WritingTemplate',
    tableName: 'WritingTemplates',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['category']
      },
      {
        fields: ['type']
      },
      {
        fields: ['isPublic']
      },
      {
        fields: ['language']
      },
      {
        fields: ['usageCount']
      }
    ]
  });

  return WritingTemplate;
};
