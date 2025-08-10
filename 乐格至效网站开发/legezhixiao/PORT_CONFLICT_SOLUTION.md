# 端口冲突和API路径问题解决方案

## 🔍 问题分析

### 1. 端口冲突问题
**原因**: 多个Node.js进程同时运行，导致端口3000被重复绑定
- PM2进程
- 直接启动的Node.js进程
- nodemon或ts-node进程

### 2. API路径重复问题
**原因**: 前端API路径配置错误，导致`/api/api/knowledge-graph`的重复路径
- 后端路由: `/api/knowledge-graph`
- 前端API客户端基础路径: `/api`
- 前端服务路径: `/api/knowledge-graph` (错误)

## ✅ 解决方案

### 1. 端口冲突解决

#### A. 强制清理端口
```bash
# 查找占用端口的进程
lsof -ti:3000
lsof -ti:5173

# 强制杀死进程
kill -9 <PID>
```

#### B. PM2进程管理
```bash
# 完全停止PM2
pm2 kill

# 清理所有进程
pm2 flush

# 重新启动
pm2 start ecosystem.config.js
```

#### C. 自动化重启脚本
创建了`restart-services.sh`脚本，自动处理：
- 端口清理
- PM2进程停止
- 服务重启
- 状态检查

### 2. API路径修复

#### 正确的路径配置
```typescript
// 前端 knowledgeGraphService.ts
export class KnowledgeGraphService {
  private baseUrl = '/knowledge-graph'; // ✅ 正确
  // 不是 '/api/knowledge-graph' // ❌ 错误
}

// 前端 api.ts  
class ApiClient {
  private baseURL = '/api'; // 基础路径
}

// 后端 server.ts
app.use('/api/knowledge-graph', knowledgeGraphRoutes); // 完整路径
```

#### 最终的API调用路径
```
前端调用: api.get('/knowledge-graph/nodes')
实际路径: /api + /knowledge-graph/nodes = /api/knowledge-graph/nodes ✅
后端路由: /api/knowledge-graph/nodes ✅
```

## 🔧 预防措施

### 1. PM2配置优化
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'backend',
    script: 'dist/server.js',
    // 添加端口检查
    env: {
      PORT: 3000,
      NODE_ENV: 'development'
    },
    // 错误重启设置
    max_restarts: 3,
    min_uptime: '10s',
    // 避免端口冲突
    kill_timeout: 5000
  }]
}
```

### 2. 启动前端口检查
```bash
# 启动前检查端口
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "端口3000被占用，正在清理..."
    kill -9 $(lsof -ti:3000)
fi
```

### 3. 开发环境脚本
```json
// package.json
{
  "scripts": {
    "dev:clean": "killall node && npm run dev",
    "dev:restart": "./restart-services.sh",
    "dev:check": "pm2 status && netstat -tlnp | grep -E '(3000|5173)'"
  }
}
```

## 📋 问题排查清单

### 端口冲突排查
- [ ] 检查PM2进程状态: `pm2 status`
- [ ] 检查端口占用: `netstat -tlnp | grep 3000`
- [ ] 查找Node.js进程: `ps aux | grep node`
- [ ] 检查lsof: `lsof -i :3000`

### API路径排查
- [ ] 检查前端baseUrl配置
- [ ] 检查后端路由注册
- [ ] 测试API调用: `curl http://localhost:3000/api/health`
- [ ] 检查浏览器网络面板

## 🚀 当前状态

### ✅ 已解决
1. 端口冲突问题 - 通过重启脚本自动处理
2. API路径重复问题 - 修正了前端路径配置
3. PM2进程管理 - 优化了启动和停止流程
4. 知识图谱功能 - AI Agent正常工作

### 🔄 监控要点
1. PM2进程状态稳定性
2. 端口占用情况
3. API调用成功率
4. 错误日志监控

## 💡 最佳实践

### 1. 开发环境管理
- 使用统一的重启脚本
- 定期清理PM2进程
- 监控端口占用

### 2. API路径管理
- 明确前端/后端路径职责
- 使用环境变量管理API地址
- 统一的错误处理

### 3. 进程管理
- PM2配置文件标准化
- 错误重启策略
- 日志轮转和监控

---

**解决时间**: 2025年8月9日  
**状态**: 所有问题已解决，服务正常运行  
**下次遇到**: 直接运行 `./restart-services.sh`
