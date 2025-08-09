// 用户相关类型
export interface User {
    id: string
    username: string
    email: string
    displayName: string
    avatar?: string
    role: UserRole
    subscription: SubscriptionTier
    createdAt: Date
    lastLoginAt: Date
    preferences: UserPreferences
    profile: UserProfile
}

export enum UserRole {
    USER = 'user',
    PREMIUM = 'premium',
    ADMIN = 'admin',
}

export enum SubscriptionTier {
    FREE = 'free',
    BASIC = 'basic',
    PREMIUM = 'premium',
    ENTERPRISE = 'enterprise',
}

export interface UserProfile {
    bio?: string
    location?: string
    website?: string
    socialLinks?: {
        twitter?: string
        github?: string
        weibo?: string
    }
    writingStats: {
        totalWords: number
        totalProjects: number
        publishedProjects: number
        averageWritingTime: number
        dailyGoal: number
        streakDays: number
    }
}

export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

export interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterData {
    username: string
    email: string
    password: string
    confirmPassword: string
    displayName: string
    agreeToTerms: boolean
}

export interface ResetPasswordData {
    email: string
}

export interface ChangePasswordData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

// 小说相关类型
export interface NovelProject {
    id: string
    title: string
    author: string
    genre: string[]
    description: string
    status: ProjectStatus
    targetWords: number
    currentWords: number
    createdAt: Date
    updatedAt: Date
    chapters: Chapter[]
    characters: Character[]
    worldBuilding?: WorldBuilding
    constraints: ConstraintRule[]
    settings?: ProjectSettings
}

export enum ProjectStatus {
    DRAFT = 'draft',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    PUBLISHED = 'published',
}

export interface ProjectSettings {
    autoSave: boolean
    autoSaveInterval: number // seconds
    theme: 'light' | 'dark'
    fontSize: number
    lineHeight: number
}

// 章节相关类型
export interface Chapter {
    id: string
    projectId: string
    number: number
    title: string
    content: string
    wordCount: number
    status: ChapterStatus
    parentId?: string  // 父章节ID，用于支持子章节
    summary?: string   // 章节概要
    outline?: string   // 详细大纲
    notes?: string     // 备注
    aiSuggestions: AISuggestion[]
    createdAt: Date
    updatedAt: Date
}

export enum ChapterStatus {
    DRAFT = 'draft',
    WRITING = 'writing',
    REVIEW = 'review',
    COMPLETED = 'completed',
}

// 角色相关类型
export interface Character {
    id: string
    projectId: string
    name: string
    alias?: string       // 别名或外号
    type: CharacterType  // 角色类型
    importance: number   // 重要性等级 1-5
    age?: number        // 年龄
    gender?: string     // 性别
    occupation?: string // 职业
    appearance?: string // 外貌描述
    personality?: string // 性格特点
    background?: string // 背景故事
    relationships?: string // 人物关系
    avatar?: string     // 头像
    createdAt: Date
    updatedAt: Date
}

export enum CharacterType {
    PROTAGONIST = 'protagonist',
    ANTAGONIST = 'antagonist',
    SUPPORTING = 'supporting',
    MINOR = 'minor',
    BACKGROUND = 'background',
}

export enum RelationshipType {
    FRIEND = 'friend',
    ENEMY = 'enemy',
    FAMILY = 'family',
    ROMANTIC = 'romantic',
    MENTOR = 'mentor',
    RIVAL = 'rival',
}

export interface DevelopmentPoint {
    chapterNumber: number
    description: string
    importance: number // 1-5
}

// 世界构建类型
export interface WorldBuilding {
    id: string
    projectId: string
    settings: WorldSetting[]
    timeline: TimelineEvent[]
    maps?: string[]
}

export interface WorldSetting {
    id: string
    name: string
    type: 'location' | 'culture' | 'technology' | 'magic' | 'politics' | 'society' | 'economy' | 'other'
    description: string
    details?: string
    importance: number
    tags?: string[]
    images?: string[]
    relatedCharacters?: string[]
    createdAt?: Date
    updatedAt?: Date
}

export interface TimelineEvent {
    id: string
    date?: Date | string | null
    title: string
    description: string
    importance: number
    order: number
    tags?: string[]
    relatedCharacters?: string[]
    createdAt?: Date
    updatedAt?: Date
}

// AI相关类型
export interface AISuggestion {
    id: string
    type: SuggestionType
    content: string
    confidence: number
    context: string
    appliedAt?: Date
}

export enum SuggestionType {
    CONTINUATION = 'continuation',
    REWRITE = 'rewrite',
    EXPANSION = 'expansion',
    CHARACTER_DEVELOPMENT = 'character_development',
    PLOT_SUGGESTION = 'plot_suggestion',
    DIALOGUE_IMPROVEMENT = 'dialogue_improvement',
}

// AI对话历史记录类型
export interface AIConversation {
    id: string
    title: string
    projectId?: string  // 关联的小说ID，为空表示全局对话
    chapterId?: string  // 关联的章节ID（可选）
    messages: AIMessage[]
    context: ConversationContext
    createdAt: Date
    updatedAt: Date
    isActive: boolean
}

export interface AIMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    metadata?: {
        suggestedChanges?: string[]
        appliedSuggestions?: string[]
        relatedChapter?: string
        relatedCharacter?: string
    }
}

export interface ConversationContext {
    projectSummary?: string
    currentChapter?: string
    activeCharacters?: string[]
    plotStage?: string
    writingGoals?: string[]
    constraints?: ConstraintRule[]
}

// AI服务类型
export interface AIService {
    conversations: AIConversation[]
    currentConversation: AIConversation | null
    isGenerating: boolean
    error: string | null
}

// 约束系统类型
export interface ConstraintRule {
    id: string
    module: ConstraintModule
    description: string
    severity: ConstraintSeverity
    autoFix: boolean
    customLogic?: string
    enabled: boolean
}

export enum ConstraintModule {
    TYPE_SELECTION = 'type_selection',
    CHARACTER_DEVELOPMENT = 'character_development',
    PLOT_STRUCTURE = 'plot_structure',
    CHAPTER_PLANNING = 'chapter_planning',
    DIALOGUE_TECHNIQUE = 'dialogue_technique',
    REVISION_STRATEGY = 'revision_strategy',
    PUBLICATION_PREP = 'publication_prep',
    SERIES_MANAGEMENT = 'series_management',
}

export enum ConstraintSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
}

// API相关类型
export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface AIGenerationRequest {
    prompt: string
    context: WritingContext
    constraints: ConstraintRule[]
    maxTokens?: number
    temperature?: number
}

export interface AIGenerationResponse {
    content: string
    suggestions: AISuggestion[]
    confidence: number
    appliedConstraints: string[]
}

export interface WritingContext {
    projectId: string
    chapterId?: string
    previousContent: string
    characterContext: Character[]
    plotContext: string
    worldContext: WorldBuilding
}

// 编辑器相关类型
export interface EditorState {
    content: string
    selection: EditorSelection
    suggestions: AISuggestion[]
    isGenerating: boolean
}

export interface EditorSelection {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

// 应用状态类型
export interface AppState {
    currentProject: NovelProject | null
    currentChapter: Chapter | null
    sidebarCollapsed: boolean
    theme: 'light' | 'dark'
    isOnline: boolean
}

// 用户偏好类型
export interface UserPreferences {
  autoSave: boolean
  autoSaveInterval: number
  enableAISuggestions: boolean
  constraintLevel: 'low' | 'medium' | 'high'
  editorTheme: 'vs-light' | 'vs-dark' | 'hc-black'
  fontSize: number
  wordWrap: boolean
  theme: 'light' | 'dark'
  lineHeight: number
}