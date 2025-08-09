import { Request } from 'express';

// 用户相关类型
export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  subscription: SubscriptionTier;
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  emailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
}

// 认证相关类型
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  subscription: SubscriptionTier;
  iat: number;
  exp: number;
}

// Express 扩展类型
export interface AuthRequest extends Request {
  user?: {
    id: string;
    _id: string;
    username: string;
    email: string;
    role: UserRole;
    subscription: SubscriptionTier;
    iat: number;
    exp: number;
  };
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  pagination?: PaginationInfo;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 项目相关类型
export interface IProject {
  _id: string;
  title: string;
  description?: string;
  genre?: string;
  targetWordCount?: number;
  currentWordCount: number;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  tags: string[];
  owner: string; // User ID
  collaborators: ProjectCollaborator[];
  chapters: string[]; // Chapter IDs
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedAt: Date;
  publishedAt?: Date;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum ProjectVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public'
}

export interface ProjectCollaborator {
  userId: string;
  role: CollaboratorRole;
  permissions: string[];
  addedAt: Date;
}

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer'
}

export interface ProjectSettings {
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  versionControl: boolean;
  allowComments: boolean;
  wordCountTarget?: number;
  deadlineDate?: Date;
  formatting: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
  };
}

// 章节相关类型
export interface IChapter {
  _id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  status: ChapterStatus;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  versions: ChapterVersion[];
}

export enum ChapterStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEW = 'review'
}

export interface ChapterVersion {
  versionId: string;
  content: string;
  comment?: string;
  createdAt: Date;
  createdBy: string; // User ID
}

// AI 服务相关类型
export interface AIRequest {
  prompt: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  context?: string;
  userId: string;
  projectId?: string;
  chapterId?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

// 通知相关类型
export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  SYSTEM = 'system',
  PROJECT_INVITE = 'project_invite',
  COMMENT = 'comment',
  COLLABORATION = 'collaboration',
  AI_COMPLETE = 'ai_complete',
  REMINDER = 'reminder'
}

// 系统配置类型
export interface SystemConfig {
  maintenance: boolean;
  registrationEnabled: boolean;
  maxProjectsPerUser: number;
  maxChaptersPerProject: number;
  defaultSubscription: SubscriptionTier;
  features: {
    aiAssistant: boolean;
    realTimeCollaboration: boolean;
    versionControl: boolean;
    commenting: boolean;
  };
}

// 文件上传类型
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
}

// 错误类型
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Only call captureStackTrace if available (Node.js specific)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 日志类型
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  metadata?: any;
}
