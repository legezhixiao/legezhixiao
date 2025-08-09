#!/bin/bash

# 完整的开发环境启动脚本
# 自动启动 ArangoDB + 后端 + 前端

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 启动乐格智小完整开发环境"
echo "=========================================="
echo "🗄️ ArangoDB: http://localhost:8529"
echo "🔧 后端API: http://localhost:3000" 
echo "🌐 前端界面: http://localhost:5173"
echo "=========================================="

# 1. 启动 ArangoDB
echo ""
echo "1️⃣ 启动 ArangoDB 数据库..."
if ! pgrep -f "arangod" > /dev/null; then
    sudo service arangodb3 start
    echo "✅ ArangoDB 启动成功"
else
    echo "✅ ArangoDB 已在运行"
fi

# 等待 ArangoDB 完全启动
echo "⏳ 等待 ArangoDB 完全启动..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:8529/_api/version >/dev/null 2>&1; then
        echo "✅ ArangoDB 准备就绪"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ ArangoDB 启动超时"
    exit 1
fi

# 2. 启动后端
echo ""
echo "2️⃣ 启动后端服务..."
cd "$PROJECT_ROOT/backend"

# 编译TypeScript
echo "🔨 编译后端代码..."
npm run build

# 启动后端服务（后台）
echo "📡 启动后端API服务..."
node dist/server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ 后端服务准备就绪"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ 后端服务启动超时"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 3. 启动前端
echo ""
echo "3️⃣ 启动前端服务..."
cd "$PROJECT_ROOT/frontend"

# 启动前端服务（后台）
echo "🌐 启动前端界面..."
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端服务启动..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo "✅ 前端服务准备就绪"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ 前端服务启动超时"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 启动完成
echo ""
echo "🎉 完整开发环境启动成功！"
echo "=========================================="
echo "🗄️ ArangoDB Web 界面: http://localhost:8529"
echo "🔧 后端 API 健康检查: http://localhost:3000/health"
echo "🌐 前端应用: http://localhost:5173"
echo "📊 查看后端日志: tail -f $PROJECT_ROOT/logs/backend.log"
echo "📊 查看前端日志: tail -f $PROJECT_ROOT/logs/frontend.log"
echo "=========================================="
echo ""
echo "💡 提示: 按 Ctrl+C 停止所有服务"

# 保存进程ID
mkdir -p "$PROJECT_ROOT/logs"
echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"
echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"

# 设置清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    rm -f "$PROJECT_ROOT/logs/backend.pid" "$PROJECT_ROOT/logs/frontend.pid"
    echo "✅ 所有服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 保持脚本运行
wait
