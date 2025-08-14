# 🚀 乐格至效 - 服务启动指南

## 📋 快速启动

### 🎯 一键启动（推荐）

```bash
# 完整启动（自动按顺序启动：数据库 → 后端 → 前端）
./scripts/start-pm2.sh

# 简化启动（会自动检查并启动数据库）
./start-dev.sh
```

### �️ 单独启动数据库

```bash
# 如果需要单独启动数据库
./start-database.sh
```

### �🛑 停止服务

```bash
# 停止所有PM2服务
./stop-dev.sh

# 停止所有服务包括数据库（需要sudo）
./stop-dev.sh --with-db
```

## ⚡ 启动顺序说明

所有启动脚本都遵循以下严格的启动顺序：

1. **🗄️ ArangoDB 数据库** - 必须首先启动，后端需要连接数据库
2. **🚀 后端服务** - 等待数据库就绪后启动，验证数据库连接
3. **🎨 前端服务** - 最后启动，依赖后端API

## 🔧 启动脚本说明

### 1. `scripts/start-pm2.sh` ⭐ 主要启动脚本
- ✅ **严格启动顺序**: 数据库 → 后端 → 前端
- ✅ **智能数据库管理**: 自动检查并启动ArangoDB
- ✅ **端口冲突处理**: 检查端口占用并提供解决方案
- ✅ **完整健康检查**: 验证所有服务和数据库连接
- ✅ **详细错误提示**: 启动失败时提供具体排查建议

**启动流程：**
1. 请求管理员权限启动数据库
2. 等待数据库完全就绪（最多60秒）
3. 检查端口占用情况
4. 按顺序启动后端服务（等待数据库连接成功）
5. 启动前端服务
6. 进行全面健康检查

### 2. `start-dev.sh` 增强版启动脚本
- ✅ **自动数据库启动**: 检测到数据库未运行时自动启动
- ✅ **数据库连接验证**: 确保后端成功连接数据库后再启动前端
- ✅ **智能超时处理**: 针对不同服务设置合适的启动超时时间
- ✅ **详细状态反馈**: 实时显示启动进度和状态

### 3. `start-database.sh` 🆕 数据库专用启动脚本
- ✅ **单独数据库管理**: 专门用于启动和管理ArangoDB
- ✅ **安装检查**: 验证ArangoDB是否正确安装
- ✅ **服务状态检查**: 智能检测服务状态
- ✅ **详细信息显示**: 显示数据库版本和访问信息

### 4. `stop-dev.sh` 停止脚本
- ✅ 停止PM2管理的所有服务
- ✅ 可选择是否停止数据库

## 📊 服务端口

| 服务 | 端口 | 地址 | 说明 |
|------|------|------|------|
| 前端 | 5173 | http://localhost:5173 | React + Vite 开发服务器 |
| 后端 | 3000 | http://localhost:3000 | Node.js + Express API |
| 数据库 | 8529 | http://localhost:8529 | ArangoDB Web界面 |

## 🎮 PM2 常用命令

```bash
# 查看服务状态
pm2 status
pm2 list

# 查看日志
pm2 logs               # 所有服务日志
pm2 logs backend       # 后端日志
pm2 logs frontend      # 前端日志

# 重启服务
pm2 restart all        # 重启所有服务
pm2 restart backend    # 重启后端
pm2 restart frontend   # 重启前端

# 停止服务
pm2 stop all           # 停止所有服务
pm2 delete all         # 删除所有进程

# 监控
pm2 monit              # 实时监控界面
```

## 🔍 健康检查

启动后可以通过以下地址检查服务状态：

- **前端**: http://localhost:5173
- **后端API**: http://localhost:3000/api/health
- **数据库**: http://localhost:8529
- **数据库状态**: http://localhost:3000/api/db-status

## ⚠️ 故障排除

### 🔧 常见问题和解决方案

#### 1. 数据库启动失败
```bash
# 检查数据库服务状态
sudo service arangodb3 status

# 查看数据库日志
sudo journalctl -u arangodb3 -f

# 重启数据库服务
sudo service arangodb3 restart
```

#### 2. 后端连接数据库失败
- **现象**: 后端启动但提示数据库连接错误
- **解决**: 
  1. 确保数据库完全启动：`curl http://localhost:8529/_api/version`
  2. 检查后端日志：`pm2 logs backend`
  3. 重启后端：`pm2 restart backend`

#### 3. 端口占用冲突
- **自动处理**: `scripts/start-pm2.sh` 会自动检测并询问是否杀死占用进程
- **手动处理**: 
  ```bash
  # 查看端口占用
  lsof -i :8529  # 数据库端口
  lsof -i :3000  # 后端端口
  lsof -i :5173  # 前端端口
  
  # 杀死占用进程
  kill -9 <PID>
  ```

#### 4. 权限问题
- **数据库启动需要sudo权限**
- **解决**: 确保在启动时输入正确的管理员密码

#### 5. 服务启动超时
- **数据库超时**: 检查系统资源，数据库可能需要更多时间启动
- **后端超时**: 通常是数据库连接问题，确保数据库已完全启动
- **前端超时**: 检查依赖是否安装完整：`cd frontend && npm install`

## 📁 文件结构

```
legezhixiao/
├── scripts/
│   ├── start-pm2.sh     # 主要启动脚本 ⭐ (完整启动)
│   └── stop-pm2.sh      # PM2停止脚本
├── start-dev.sh         # 增强版启动脚本 🔄 (自动数据库)
├── start-database.sh    # 数据库专用启动脚本 🗄️ 
├── stop-dev.sh          # 通用停止脚本
├── ecosystem.config.js  # PM2配置文件
└── STARTUP_GUIDE.md     # 本文档
```

## 🎉 启动建议

### 🚀 首次使用或完整启动
```bash
./scripts/start-pm2.sh
```
**优点**: 最全面的检查和启动流程，适合首次使用或解决问题时使用

### ⚡ 日常开发启动
```bash
./start-dev.sh
```
**优点**: 启动速度较快，会自动处理数据库，适合日常开发

### 🗄️ 仅启动数据库
```bash
./start-database.sh
```
**优点**: 当只需要启动数据库时使用，或数据库出现问题时单独诊断

### 🔄 服务管理
```bash
pm2 restart all      # 重启所有服务（数据库不重启）
pm2 logs            # 查看实时日志
pm2 monit           # 图形化监控界面
./stop-dev.sh       # 停止所有服务
```

---
**💡 提示**: 首次使用建议运行 `./scripts/start-pm2.sh`，它会自动处理所有依赖和配置。
