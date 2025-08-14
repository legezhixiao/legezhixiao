#!/bin/bash

echo "=== 原生环境启动脚本 ==="

# 设置项目根目录
PROJECT_ROOT="/workspaces/legezhixiao/乐格至效网站开发/legezhixiao"
cd "$PROJECT_ROOT"

# 1. 启动ArangoDB数据库
echo "🗄️ 启动ArangoDB数据库..."
sudo systemctl start arangodb3

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

# 检查数据库状态
if curl -s http://localhost:8529/_api/version > /dev/null; then
    echo "✅ ArangoDB已启动 (端口8529)"
else
    echo "❌ ArangoDB启动失败"
    exit 1
fi

# 2. 启动后端服务
echo "🔧 启动后端服务..."
cd "$PROJECT_ROOT/backend"

# 确保依赖已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 跳过编译，直接启动开发模式
echo "🚀 启动后端服务 (端口3000)..."
pm2 start "$PROJECT_ROOT/ecosystem.config.js" --only backend

# 3. 启动前端服务
echo "🎨 启动前端服务..."
cd "$PROJECT_ROOT/frontend"

# 确保依赖已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端（使用PM2管理）
echo "🚀 启动前端服务 (端口5173)..."
pm2 start "$PROJECT_ROOT/ecosystem.config.js" --only frontend

# 4. 检查服务状态
echo "📊 检查服务状态..."
sleep 3

# 检查后端
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ 后端服务运行正常 (端口3000)"
else
    echo "⚠️ 后端服务可能有问题"
fi

# 检查前端
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ 前端服务运行正常 (端口5173)"
else
    echo "⚠️ 前端服务可能有问题"
fi

# 显示PM2状态
echo "📈 PM2服务状态:"
pm2 status

echo ""
echo "🎉 启动完成！"
echo "🌐 前端访问地址: http://localhost:5173"
echo "🔧 后端API地址: http://localhost:3000"
echo "🗄️ 数据库管理: http://localhost:8529"
echo ""
echo "💡 管理命令:"
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs --lines 50"
echo "   停止服务: pm2 stop all"
echo "   重启服务: pm2 restart all"
