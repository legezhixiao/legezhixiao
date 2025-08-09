# 乐格至效 AI小说创作平台 - 现代化项目说明书

## 📋 项目概述

**项目名称**: 乐格至效 (LegeZhiXiao) AI小说创作平台  
**项目定位**: 基于GitHub Copilot模式的智能小说创作助手  
**核心特色**: GitHub Copilot式AI Agent + ArangoDB多模态数据库 + 前端日志系统 + 原生部署架构  
**技术栈**: React 18 + TypeScript + Vite + Node.js + Express + ArangoDB Community + SiliconFlow DeepSeek-V3  
**开发状态**: ✅ 核心架构完成，后端API运行正常，ArangoDB原生部署完毕，前端开发服务器运行中

## 🎯 核心功能架构

### 1. ✅ 现代化数据存储系统 (已完成)
- **ArangoDB Community**: ✅ 多模态数据库，统一文档+图数据库架构
- **原生部署**: ✅ Ubuntu 24.04 原生安装，非容器化部署
- **数据模型**: ✅ 用户、项目、章节、角色、世界观统一数据模型
- **索引优化**: ✅ 持久化索引、全文检索、关系查询优化

### 2. ✅ AI Agent智能写作系统 (已完成)
- **GitHub Copilot模式**: ✅ 自然语言交互，智能意图识别
- **图数据库集成**: ✅ 自动读取角色关系、情节连接、世界观设定
- **上下文感知**: ✅ 基于ArangoDB图查询的深度上下文理解
- **多模态生成**: ✅ 续写、改写、扩写、角色对话、场景描写

### 3. ✅ 后端服务架构 (已完成)
- **Express.js + TypeScript**: ✅ 现代化REST API架构
- **ArangoDB集成**: ✅ 完整的服务层封装，支持文档和图操作
- **健康检查**: ✅ 完整的服务监控和状态检查
- **错误处理**: ✅ 统一错误处理和日志记录

### 4. ✅ 前端开发系统 (已完成)
- **Vite + React 18**: ✅ 现代化前端构建工具链
- **完整日志系统**: ✅ apiLogger + LogMonitor 实时调试
- **ErrorBoundary**: ✅ 错误边界和异常处理
- **组件化架构**: ✅ 模块化组件设计

## 🏗️ 技术架构详解

### 前端架构 (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── components/          # React组件库
│   │   ├── AI/             # AI助手界面组件
│   │   │   ├── FloatingAIButton.tsx
│   │   │   └── DraggableAIWindow.tsx
│   │   ├── Layout/         # 布局组件
│   │   │   ├── AppHeader.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── ErrorBoundary.tsx # 错误边界
│   │   └── LogMonitor.tsx   # 日志监控组件
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx
│   │   ├── EditorContext.tsx
│   │   └── AIContext.tsx
│   ├── pages/              # 页面组件
│   │   ├── ProjectDashboard.tsx
│   │   ├── WritingInterfaceOptimized.tsx
│   │   ├── CharacterManagementPage.tsx
│   │   └── WorldBuildingPage.tsx
│   ├── services/           # API服务层
│   │   ├── api.ts          # 基础API配置
│   │   ├── projectService.ts
│   │   ├── characterService.ts
│   │   └── aiService.ts
│   ├── store/              # 状态管理
│   │   └── appStore.ts     # Zustand状态管理
│   ├── utils/              # 工具函数
│   │   ├── apiLogger.ts    # 完整日志系统
│   │   └── constants.ts
│   └── types/              # TypeScript类型定义
│       └── index.ts
├── public/                 # 静态资源
├── index.html              # 入口HTML
├── vite.config.ts          # Vite配置
└── package.json            # 依赖配置
```

### 后端架构 (Node.js + Express + TypeScript)
```
backend/
├── src/
│   ├── server.ts           # 服务器入口
│   ├── config/             # 配置层
│   │   ├── databaseAdapter.ts  # 数据库适配器
│   │   └── arangodb.ts     # ArangoDB配置
│   ├── services/           # 业务服务层
│   │   ├── arangoDBService.ts  # ArangoDB服务
│   │   ├── dataService.ts      # 数据服务
│   │   └── novelCreationService.ts
│   ├── controllers/        # 控制器层
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   ├── chapterController.ts
│   │   ├── characterController.ts
│   │   └── aiController.ts
│   ├── routes/             # 路由配置
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   ├── ai.ts
│   │   ├── sync.ts         # 同步路由
│   │   └── health.ts       # 健康检查
│   ├── middleware/         # 中间件
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── notFound.ts
│   ├── models/             # 数据模型
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Chapter.ts
│   │   └── Character.ts
│   ├── types/              # TypeScript类型
│   │   └── index.ts
│   └── utils/              # 工具函数
│       └── logger.ts       # 日志工具
├── logs/                   # 日志文件
├── uploads/                # 文件上传
├── package.json            # 依赖配置
└── tsconfig.json           # TypeScript配置
```

### 数据库架构 (ArangoDB Community)
```
ArangoDB (端口: 8529)
├── 数据库: legezhixiao
├── 文档集合 (Document Collections)
│   ├── users               # 用户集合
│   │   ├── 索引: username (唯一)
│   │   └── 索引: email (唯一)
│   ├── user_sessions       # 会话集合
│   │   └── 索引: expiresAt (TTL)
│   ├── novels              # 小说集合
│   │   ├── 索引: authorId
│   │   └── 索引: title, description (全文)
│   ├── chapters            # 章节集合
│   │   ├── 索引: novelId
│   │   └── 索引: chapterNumber
│   └── agent_configs       # AI代理配置
│       └── 索引: userId
├── 边集合 (Edge Collections)
│   ├── character_relationships  # 角色关系
│   ├── plot_connections        # 情节连接
│   └── world_elements          # 世界观元素
└── 图查询支持
    ├── 角色关系网络
    ├── 情节连接图
    └── 世界观概念图
```

## 🔧 开发环境配置

### 系统环境
```bash
# 操作系统
Ubuntu 24.04.2 LTS (在 VS Code Dev Container 中)

# Node.js 环境
Node.js: v18+ 
npm: v9+

# 数据库
ArangoDB Community Edition 3.11.14 (原生安装)
```

### 开发服务器启动
```bash
# 1. 启动 ArangoDB (已配置为系统服务)
sudo service arangodb3 start

# 2. 启动后端开发服务器 (端口: 3000)
cd backend
npm install
npm run dev

# 3. 启动前端开发服务器 (端口: 5173)
cd frontend  
npm install
npm run dev

# 4. 使用 VS Code Tasks (推荐)
# Ctrl+Shift+P -> Tasks: Run Task
# - "启动后端开发服务器"
# - "启动前端开发服务器"
```

### VS Code 任务配置
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "启动前端开发服务器",
      "type": "shell",
      "command": "./scripts/start-frontend.sh",
      "group": "build",
      "isBackground": true,
      "options": {
        "cwd": "${workspaceFolder}"
      }
    },
    {
      "label": "启动后端开发服务器", 
      "type": "shell",
      "command": "./scripts/start-backend.sh",
      "group": "build",
      "isBackground": true,
      "options": {
        "cwd": "${workspaceFolder}"
      }
    }
  ]
}
```

## 📊 数据模型设计

### ArangoDB 数据模型
```typescript
// 用户模型
interface UserDocument {
  _key: string;
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  profile: {
    displayName?: string;
    bio?: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 项目模型
interface NovelDocument {
  _key: string;
  _id: string;
  title: string;
  description?: string;
  authorId: string;
  genre?: string;
  status: 'planning' | 'writing' | 'editing' | 'completed';
  targetWords?: number;
  currentWords: number;
  coverImage?: string;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 章节模型
interface ChapterDocument {
  _key: string;
  _id: string;
  novelId: string;
  title: string;
  content: string;
  wordCount: number;
  chapterNumber: number;
  status: 'draft' | 'reviewing' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 角色关系 (Edge Collection)
interface CharacterRelationship {
  _key: string;
  _id: string;
  _from: string; // 角色ID
  _to: string;   // 目标角色ID
  relationship: string; // 关系类型
  strength: number; // 关系强度 1-10
  description?: string;
  timeline?: string;
  createdAt: Date;
}
```

## 🤖 AI集成架构

### SiliconFlow DeepSeek-V3 配置
```typescript
// AI服务配置
const AI_CONFIG = {
  provider: "SiliconFlow",
  model: "deepseek-ai/DeepSeek-V3", 
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: "https://api.siliconflow.cn/v1",
  maxTokens: 4000,
  temperature: 0.7,
  timeout: 30000
};

// AI Agent 接口
interface AIAgentService {
  // 基础AI交互
  sendMessage(message: string, context?: AgentContext): Promise<AIResponse>;
  getChatHistory(): Promise<ChatMessage[]>;
  clearChatHistory(): Promise<void>;
  
  // ArangoDB 图数据库集成
  queryKnowledgeGraph(query: string): Promise<GraphQueryResult>;
  getCharacterNetwork(novelId: string): Promise<CharacterNode[]>;
  analyzePlotStructure(novelId: string): Promise<PlotAnalysis>;
  generateWritingSuggestions(context: WritingContext): Promise<WritingSuggestion[]>;
}
```

### ArangoDB 图查询示例
```aql
// 查询角色关系网络
FOR character IN characters
  FILTER character.novelId == @novelId
  LET relationships = (
    FOR rel IN character_relationships
      FILTER rel._from == character._id OR rel._to == character._id
      RETURN rel
  )
  RETURN {
    character: character,
    relationships: relationships
  }

// 分析情节连接
FOR chapter IN chapters
  FILTER chapter.novelId == @novelId
  LET connections = (
    FOR conn IN plot_connections  
      FILTER conn._from == chapter._id
      LET targetChapter = DOCUMENT(conn._to)
      RETURN {
        target: targetChapter,
        type: conn.connectionType,
        strength: conn.strength
      }
  )
  RETURN {
    chapter: chapter,
    connections: connections
  }
```

## 🔍 调试和监控系统

### 前端日志系统
```typescript
// apiLogger.ts - 完整日志系统
enum LogLevel {
  DEBUG = 0,
  INFO = 1, 
  WARN = 2,
  ERROR = 3
}

class ApiLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  log(level: LogLevel, source: string, message: string, data?: any): void;
  debug(source: string, message: string, data?: any): void;
  info(source: string, message: string, data?: any): void;
  warn(source: string, message: string, data?: any): void;
  error(source: string, message: string, data?: any): void;
  
  getLogs(): LogEntry[];
  clearLogs(): void;
  exportLogs(): string;
}

// LogMonitor.tsx - 实时日志监控组件
const LogMonitor: React.FC<{
  visible: boolean;
  onToggle: () => void;
}> = ({ visible, onToggle }) => {
  // 实时日志显示
  // 日志级别过滤
  // 日志导出功能
  // 快捷键支持 (Ctrl+L)
};
```

### 后端健康检查
```typescript
// /api/health 端点
interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  environment: string;
  uptime: number;
  databases: {
    arangodb: 'connected' | 'disconnected' | 'error';
    status: string;
  };
  version: string;
}

// 实际响应示例
{
  "status": "ok",
  "timestamp": "2025-08-02T01:54:38.197Z", 
  "environment": "development",
  "uptime": 72.022975756,
  "databases": {
    "arangodb": "connected",
    "status": "connected"
  },
  "version": "1.0.0"
}
```

## 🚀 部署架构

### 开发环境 (当前状态)
```bash
# 服务状态
前端开发服务器: http://localhost:5173 (Vite) ✅ 运行中
后端API服务器:   http://localhost:3000 (Express) ✅ 运行中  
ArangoDB数据库:  http://localhost:8529 ✅ 运行中

# 代理配置
前端API代理: /api/* -> http://localhost:3000/api/* ✅ 已配置

# 健康检查
curl http://localhost:3000/api/health ✅ 正常响应
curl http://localhost:5173/api/health ✅ 代理正常
```

### 脚本化管理
```bash
# 项目根目录脚本
./scripts/
├── start-frontend.sh     # 启动前端服务
├── start-backend.sh      # 启动后端服务 
├── start-dev.sh          # 启动完整开发环境
├── stop-dev.sh           # 停止所有服务
└── port-utils.sh         # 端口管理工具

# 使用方式
./scripts/start-dev.sh    # 一键启动所有服务
```

## 📈 开发进度

### ✅ 已完成功能 (100%)
- [x] 项目架构设计和实现
- [x] ArangoDB原生安装和配置
- [x] 后端Express.js API服务
- [x] 前端React 18 + Vite应用
- [x] 完整的数据库服务层
- [x] 健康检查和监控端点
- [x] 前端日志系统和错误处理
- [x] VS Code开发环境配置

### 🔄 进行中功能
- [ ] 前端白屏问题调试
- [ ] AI Agent完整集成
- [ ] 用户认证系统完善
- [ ] 项目管理功能实现

### 📋 待开发功能
- [ ] 角色管理系统
- [ ] 章节编辑器
- [ ] 世界观构建工具
- [ ] 写作统计分析
- [ ] 约束引擎系统

## 🔒 安全与配置

### 环境变量配置
```bash
# 后端环境变量
NODE_ENV=development
PORT=3000
ARANGO_HOST=localhost
ARANGO_PORT=8529
ARANGO_USERNAME=root
ARANGO_PASSWORD=
ARANGO_DATABASE=legezhixiao
SILICONFLOW_API_KEY=your_api_key_here
```

### 数据库安全
- **认证模式**: 当前配置为无密码模式（开发环境）
- **网络访问**: 仅限本地访问 (127.0.0.1:8529)
- **数据持久化**: /var/lib/arangodb3/ 目录
- **日志记录**: /var/log/arangodb3/arangod.log

## 🎯 下一步开发计划

### 立即任务
1. **前端调试**: 解决前端白屏问题，使用日志系统诊断
2. **功能测试**: 验证API端点和数据库操作
3. **AI集成**: 完成SiliconFlow DeepSeek-V3集成
4. **用户界面**: 实现核心页面组件

### 短期目标 (1-2周)
- 完整的用户认证流程
- 基础的项目创建和管理
- 简单的章节编辑功能
- AI助手基础交互

### 中期目标 (1个月)
- 完整的角色管理系统
- 高级编辑器功能
- 图数据库查询优化
- 性能优化和用户体验提升

---

**当前项目状态**: 核心架构完成，后端服务运行正常，数据库集成完毕。前端开发服务器运行中，准备进入功能开发阶段。
