# 开发环境启动指南

## 🚀 快速启动

### 启动完整开发环境
```bash
./scripts/start-dev.sh
```
这将同时启动前端和后端服务：
- 前端：http://localhost:5173
- 后端：http://localhost:3000

### 单独启动服务

#### 仅启动前端
```bash
./scripts/start-frontend.sh
```

#### 仅启动后端
```bash
./scripts/start-backend.sh
```

### 停止服务
```bash
./scripts/stop-dev.sh
```

## 📋 VS Code 任务

在 VS Code 中，你可以使用以下任务：

1. **Ctrl+Shift+P** → 搜索 "Tasks: Run Task"
2. 选择任务：
   - `启动完整开发环境` - 启动前后端
   - `启动前端开发服务器` - 仅前端
   - `启动后端开发服务器` - 仅后端
   - `停止开发服务` - 停止所有服务

## 🔧 特性

### 固定端口
- **前端固定端口**: 5173
- **后端固定端口**: 3000
- 如果端口被占用，自动终止占用进程并重新启动

### 自动依赖管理
- 自动检查并安装 `node_modules`
- 自动复制环境变量配置文件

### 日志管理
所有日志保存在 `logs/` 目录：
- `backend.log` - 后端日志
- `frontend.log` - 前端日志
- `backend-full.log` - 完整环境的后端日志
- `frontend-full.log` - 完整环境的前端日志

### 进程管理
- 使用 PID 文件跟踪进程
- 优雅的信号处理和清理
- Ctrl+C 安全退出

## 🛠️ 故障排除

### 端口被占用
启动器会自动处理端口冲突，但如果遇到问题：

```bash
# 手动检查端口
lsof -i:3000  # 后端
lsof -i:5173  # 前端

# 手动清理端口
kill -9 $(lsof -ti:3000)  # 清理后端端口
kill -9 $(lsof -ti:5173)  # 清理前端端口
```

### 依赖问题
```bash
# 重新安装依赖
cd frontend && rm -rf node_modules package-lock.json && npm install
cd backend && rm -rf node_modules package-lock.json && npm install
```

### 查看实时日志
```bash
# 查看后端日志
tail -f logs/backend.log

# 查看前端日志
tail -f logs/frontend.log

# 查看完整环境日志
tail -f logs/backend-full.log logs/frontend-full.log
```

## 📁 脚本文件结构

```
scripts/
├── port-utils.sh      # 端口管理工具函数
├── start-backend.sh   # 后端启动器
├── start-frontend.sh  # 前端启动器
├── start-dev.sh       # 完整环境启动器
└── stop-dev.sh        # 停止脚本
```

## 🔄 环境变量

启动器会自动处理环境变量：
- `PORT=3000` (后端)
- `NODE_ENV=development`
- Vite 自动使用端口 5173 和代理配置

## 💡 提示

1. 首次启动可能需要较长时间来安装依赖
2. 确保你有足够的权限来杀死进程（某些系统可能需要 sudo）
3. 如果遇到权限问题，确保脚本有执行权限：`chmod +x scripts/*.sh`
4. 前端会自动代理 `/api` 请求到后端的 3000 端口
