# PM2 开发环境使用指南

## 概述
项目已完全迁移到 PM2 进程管理器，提供更稳定和可靠的开发体验。

## 快速启动

```bash
# 启动所有服务（推荐）
npm run dev
# 或者
npm start

# 查看服务状态
npm run status

# 查看日志
npm run logs

# 停止所有服务
npm run stop

# 重启所有服务
npm run restart

# 实时监控
npm run monit
```

## PM2 直接命令

```bash
# 启动服务
pm2 start ecosystem.config.js

# 查看所有进程
pm2 list

# 查看日志
pm2 logs
pm2 logs backend    # 只看后端日志
pm2 logs frontend   # 只看前端日志

# 重启服务
pm2 restart all
pm2 restart backend
pm2 restart frontend

# 停止服务
pm2 stop all
pm2 delete all      # 完全删除进程

# 实时监控
pm2 monit
```

## 服务信息

- **前端**: http://localhost:5173 (Vite + React)
- **后端**: http://localhost:3000 (Express + TypeScript)
- **数据库**: http://localhost:8529 (ArangoDB - 系统服务)

## PM2 优势

✅ **自动重启**: 进程崩溃后自动重启  
✅ **资源监控**: CPU、内存使用情况  
✅ **日志管理**: 分离的错误和输出日志  
✅ **进程隔离**: 服务间互不影响  
✅ **生产就绪**: 可直接用于生产环境  

## 故障排除

### 查看详细日志
```bash
pm2 logs --lines 100
```

### 重置所有进程
```bash
pm2 delete all
npm run dev
```

### 检查端口占用
```bash
lsof -i :3000  # 后端端口
lsof -i :5173  # 前端端口
lsof -i :8529  # 数据库端口
```
