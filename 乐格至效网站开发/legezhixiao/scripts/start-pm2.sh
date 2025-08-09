#!/bin/bash

# PM2 启动脚本
echo "🚀 启动 PM2 开发环境..."

# 端口配置
FRONTEND_PORT=5173
BACKEND_PORT=3000
ARANGODB_PORT=8529

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $port ($service_name) 已被占用"
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        echo "   占用进程 PID: $pid"
        
        # 如果不是我们自己的服务，询问是否杀死
        if ! pm2 list | grep -q "online.*$service_name"; then
            echo "❓ 是否杀死占用端口的进程? (y/N)"
            read -t 10 -n 1 answer || answer="n"
            echo
            if [[ $answer =~ ^[Yy]$ ]]; then
                kill -9 $pid 2>/dev/null || true
                echo "✅ 已杀死进程 $pid"
                sleep 1
            else
                echo "❌ 端口冲突，无法启动 $service_name"
                return 1
            fi
        fi
    fi
    return 0
}

# 确保 ArangoDB 系统服务正在运行
echo "🔄 检查 ArangoDB 服务 (端口 $ARANGODB_PORT)..."
if ! sudo service arangodb3 status > /dev/null 2>&1; then
    echo "🔄 启动 ArangoDB 系统服务..."
    sudo service arangodb3 start
    sleep 3
fi

if curl -s http://localhost:$ARANGODB_PORT/_api/version > /dev/null; then
    echo "✅ ArangoDB 服务正常运行 (端口 $ARANGODB_PORT)"
else
    echo "❌ ArangoDB 服务启动失败"
    exit 1
fi

# 检查端口占用
echo "🔍 检查端口占用情况..."
check_port $FRONTEND_PORT "前端服务" || exit 1
check_port $BACKEND_PORT "后端服务" || exit 1

# 停止现有的PM2进程
echo "🔄 停止现有PM2进程..."
pm2 delete all 2>/dev/null || true

# 启动前端和后端服务
echo "🔄 启动服务..."
echo "   - 后端服务: 端口 $BACKEND_PORT"
echo "   - 前端服务: 端口 $FRONTEND_PORT"
pm2 start ecosystem.config.js

# 等待服务启动
sleep 5

# 验证服务启动
echo "🔍 验证服务启动..."
if curl -s http://localhost:$BACKEND_PORT/api/db-status > /dev/null; then
    echo "✅ 后端服务已启动 (端口 $BACKEND_PORT)"
else
    echo "❌ 后端服务启动失败"
fi

if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    echo "✅ 前端服务已启动 (端口 $FRONTEND_PORT)"
else
    echo "❌ 前端服务启动失败"
fi

# 显示状态
echo ""
echo "📊 服务状态:"
pm2 list

echo ""
echo "✅ PM2 开发环境启动完成!"
echo ""
echo "📝 常用命令:"
echo "  pm2 list        - 查看进程状态"
echo "  pm2 logs        - 查看所有日志"
echo "  pm2 logs backend - 查看后端日志"
echo "  pm2 logs frontend - 查看前端日志"
echo "  pm2 restart all - 重启所有服务"
echo "  pm2 stop all    - 停止所有服务"
echo "  pm2 delete all  - 删除所有进程"
echo "  pm2 monit       - 实时监控"
echo ""
echo "🌐 服务地址:"
echo "  前端: http://localhost:$FRONTEND_PORT"
echo "  后端: http://localhost:$BACKEND_PORT"
echo "  数据库: http://localhost:$ARANGODB_PORT"
echo "  API状态: http://localhost:$BACKEND_PORT/api/db-status"
