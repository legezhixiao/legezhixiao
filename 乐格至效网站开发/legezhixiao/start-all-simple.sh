#!/bin/bash

echo "🚀 启动完整开发环境..."

# 确保ArangoDB运行
echo "📊 检查 ArangoDB..."
if ! curl -s http://localhost:8529/_admin/version > /dev/null 2>&1; then
    echo "🗄️ 启动 ArangoDB..."
    ./start-arango-quiet.sh
    sleep 3
else
    echo "✅ ArangoDB 已运行"
fi

# 启动后端 (后台)
echo "⚙️ 启动后端服务..."
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid
cd ..

# 等待后端启动
echo "⏳ 等待后端启动..."
sleep 5

# 启动前端 (后台)
echo "🎨 启动前端服务..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
echo $! > ../logs/frontend.pid
cd ..

echo "✅ 所有服务已启动!"
echo "📊 后端: http://localhost:3000"
echo "🎨 前端: http://localhost:5173"
echo "🗄️ ArangoDB: http://localhost:8529"
echo ""
echo "📋 检查状态:"
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || echo "后端未就绪"
