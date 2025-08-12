# 🎨 乐格至效 - AI智能小说创作平台

基于Jasper AI风格的智能小说创作助手，采用React + TypeScript + Node.js全栈构建。

## ✨ 核心特性

- 🎯 **模板化创作**: Jasper AI风格的专业写作模板
- 🤖 **AI智能写作**: 多种写作风格和品牌语调
- 🛠️ **外部工具集成**: 维基百科、知识图谱、情感分析等AI小说创作平台

基于GitHub Copilot风格的智能小说创作助手，采用React + TypeScript + Node.js全栈构建。

## ✨ 核心特性

- 🤖 **AI智能写作**: GitHub Copilot式实时写作建议
- 📝 **Monaco编辑器**: 基于VS Code的专业编辑体验
- 🎯 **约束引擎**: 8模块约束系统确保内容质量
- 📊 **项目管理**: 完整的小说项目管理工具
- 👥 **用户系统**: 完整的认证和权限管理
- 🔗 **实时协作**: Socket.io实时编辑和协作
- 💾 **现代数据库**: RXDB + ArangoDB 响应式架构
- 📈 **写作统计**: 详细的写作进度和分析

## 🏗️ 技术架构

### 前端技术栈
- **React 18** + **TypeScript** - 现代化前端框架
- **Vite** - 极速构建工具
- **Ant Design** - 企业级UI组件库
- **Monaco Editor** - VS Code编辑器内核
- **Zustand** - 轻量级状态管理
- **RXDB** - 响应式离线优先数据库

### 后端技术栈
- **Node.js** + **Express** - 高性能Web服务器
- **TypeScript** - 类型安全的JavaScript
- **ArangoDB** - 多模型图数据库
- **JWT** - 安全认证机制

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- ArangoDB >= 3.9.0
- PM2 >= 5.4.2

### 前端开发

```bash
# 克隆项目
git clone https://github.com/lessstoryclassmate/legezhixiao.git
cd legezhixiao

# 设置前端环境
chmod +x setup-frontend.sh
./setup-frontend.sh

# 启动前端开发服务器
cd frontend
npm run dev
```

### 后端开发

```bash
# 进入后端目录
cd backend

# 复制环境配置
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 数据库设置

```bash
# ArangoDB (原生安装)
sudo systemctl start arangodb3
```

## 📚 详细文档

- **[项目规格书](PROJECT_SPECIFICATION_FINAL.md)** - 完整的技术规格和架构说明
- **[生产部署指南](PRODUCTION_NATIVE_DEPLOYMENT.md)** - 详细的生产环境部署步骤
- **[项目完成报告](PROJECT_COMPLETION_REPORT.md)** - 项目实施状态和成果

## 🔄 开发工作流

### 使用预配置脚本

```bash
# 启动RXDB + ArangoDB技术栈
./start-rxdb-stack.sh

# 或者分别启动前后端
npm run dev:frontend
npm run dev:backend
```

### 访问应用

- 前端应用: http://localhost:5173
- 后端API: http://localhost:3001
- API测试页面: http://localhost:3001/api-test.html

## 📁 项目结构

```
legezhixiao/
├── README.md                        # 项目介绍和快速开始
├── PROJECT_SPECIFICATION_FINAL.md  # 完整技术规格书  
├── PRODUCTION_NATIVE_DEPLOYMENT.md # 生产部署指南
├── PROJECT_COMPLETION_REPORT.md    # 项目完成报告
├── package.json                    # 根级包管理
├── start-rxdb-stack.sh            # RXDB技术栈启动脚本
├── frontend/                       # React前端应用
│   ├── src/
│   │   ├── components/            # React组件
│   │   │   ├── AI/               # AI相关组件
│   │   │   ├── Auth/             # 认证相关组件
│   │   │   ├── Layout/           # 布局组件
│   │   │   └── Writing/          # 写作相关组件
│   │   ├── contexts/             # React Context
│   │   ├── hooks/                # 自定义Hooks
│   │   ├── pages/                # 页面组件
│   │   ├── services/             # API服务和RXDB配置
│   │   ├── store/                # Zustand状态管理
│   │   ├── styles/               # 样式文件
│   │   └── types/                # TypeScript类型
│   ├── package.json              # 前端依赖
│   └── vite.config.ts            # Vite配置
└── backend/                       # Node.js后端应用
    ├── src/
    │   ├── config/               # 配置文件(ArangoDB等)
    │   ├── controllers/          # 控制器
    │   ├── middleware/           # 中间件
    │   ├── models/               # 数据模型
    │   ├── routes/               # 路由定义
    │   ├── services/             # 业务服务
    │   ├── utils/                # 工具函数
    │   ├── types/                # TypeScript类型
    │   └── server.ts             # 服务器入口
    ├── package.json              # 后端依赖
    ├── tsconfig.json             # TypeScript配置
    └── .env.example              # 环境变量模板
```

## 🛠️ 技术栈

### 前端技术
- **React 18**: 现代化UI框架
- **TypeScript**: 类型安全的JavaScript  
- **Vite**: 快速的构建工具
- **Monaco Editor**: VS Code编辑器核心
- **Ant Design**: 企业级UI组件库
- **Zustand**: 轻量级状态管理
- **RXDB**: 响应式离线优先数据库
- **React Query**: 数据获取和缓存

### 后端技术
- **Node.js + Express**: 高性能Web服务器
- **TypeScript**: 类型安全开发
- **ArangoDB**: 多模型图数据库
- **Socket.io**: 实时通信

### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **GitHub Copilot**: AI编程助手
- **VS Code**: 推荐开发环境

## 📝 核心功能

### 1. 智能写作引擎
- 实时AI建议和续写
- 上下文感知的内容生成
- 多种写作模式支持
- 约束验证和质量控制

### 2. 项目管理
- 多项目管理
- 章节组织和导航
- 进度跟踪和统计
- 版本历史管理

### 3. 专业创作工具
- 角色关系管理
- 世界观构建
- 情节规划工具
- 伏笔系统

### 4. AI助手系统
- 智能建议面板
- 对话式写作助手
- 约束引擎集成
- 个性化建议

## ⚙️ 开发配置

### 环境变量

复制 `.env.example` 到 `frontend/.env` 并配置：

```bash
# AI 服务配置
VITE_SILICONFLOW_API_KEY=your-api-key-here
VITE_SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 应用配置
VITE_APP_NAME=乐格至效
VITE_API_URL=http://localhost:8001
```

### VS Code 配置

项目已包含完整的VS Code配置：

- **扩展推荐**: 自动推荐必要的开发扩展
- **调试配置**: 预配置的调试设置
- **编辑器设置**: 统一的代码格式和行为

### 开发脚本

```bash
# 安装依赖
npm run setup

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 类型检查
npm test
```

## 🎯 项目特色

### GitHub/VSCode 最佳实践
- 遵循 GitHub 开源项目结构规范
- 集成 VS Code 开发最佳实践
- 完整的 TypeScript 类型系统
- 现代化的前端工程化配置

### AI 驱动的写作体验
- GitHub Copilot 风格的智能建议
- 基于上下文的内容生成
- 实时约束验证
- 个性化写作助手

### 专业的编辑体验
- Monaco Editor 专业编辑器
- 丰富的快捷键支持
- 实时预览和统计
- 多主题支持

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [React](https://reactjs.org/) - UI 框架
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 编辑器核心
- [Ant Design](https://ant.design/) - UI 组件库
- [Vite](https://vitejs.dev/) - 构建工具
- [RXDB](https://rxdb.info/) - 响应式数据库
- [ArangoDB](https://www.arangodb.com/) - 多模型数据库
- [SiliconFlow](https://siliconflow.cn/) - AI 服务提供商

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
