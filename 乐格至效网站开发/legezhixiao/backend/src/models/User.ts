import { DataTypes, Model, Sequelize, Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { 
  UserRole, 
  SubscriptionTier
} from '../types';

// 用户模型接口
export interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  subscription: SubscriptionTier;
  profile: any;
  preferences: any;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// 用户模型类
export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: UserRole;
  public subscription!: SubscriptionTier;
  public profile!: any;
  public preferences!: any;
  public isActive!: boolean;
  public emailVerified!: boolean;
  public lastLoginAt?: Date;
  public resetPasswordToken?: string;
  public resetPasswordExpires?: Date;
  
  // 时间戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // 实例方法：验证密码
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // 实例方法：生成重置令牌
  public generateResetToken(): string {
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    this.resetPasswordToken = resetToken;
    this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
    
    return resetToken;
  }

  // 实例方法：清除重置令牌
  public clearResetToken(): void {
    this.resetPasswordToken = undefined;
    this.resetPasswordExpires = undefined;
  }

  // 静态方法：根据邮箱或用户名查找用户
  public static async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.findOne({
      where: {
        [Op.or]: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ]
      }
    });
  }

  // 静态方法：查找活跃用户
  public static async findActiveUsers(): Promise<User[]> {
    return this.findAll({ where: { isActive: true } });
  }
}

// 定义用户模型
export function defineUserModel(sequelize: Sequelize): typeof User {
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30],
        is: /^[a-zA-Z0-9_-]+$/,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.USER,
    },
    subscription: {
      type: DataTypes.ENUM(...Object.values(SubscriptionTier)),
      defaultValue: SubscriptionTier.FREE,
    },
    profile: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        theme: 'auto',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        notifications: {
          email: true,
          push: true,
          desktop: false,
        },
        privacy: {
          profileVisible: true,
          activityVisible: true,
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] },
      { fields: ['createdAt'] },
      { fields: ['lastLoginAt'] },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
      withResetToken: {
        attributes: { include: ['resetPasswordToken', 'resetPasswordExpires'] },
      },
    },
  });

  return User;
}

export default User;
