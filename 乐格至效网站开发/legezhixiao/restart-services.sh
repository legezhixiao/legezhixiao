#!/bin/bash

# 乐格至效服务重启脚本
# 解决端口冲突和PM2重启问题

echo "🔄 乐格至效服务重启脚本"
echo "=========================="

# 函数：杀死指定端口的进程
kill_port() {
    local port=$1
    echo "🔍 检查端口 $port..."
    
    # 查找占用端口的进程
    local pids=$(lsof -ti:$port)
    
    if [ ! -z "$pids" ]; then
        echo "⚠️  端口 $port 被占用，PID: $pids"
        echo "🔪 杀死占用进程..."
        
        # 先尝试优雅关闭
        for pid in $pids; do
            echo "  杀死进程 $pid"
            kill -TERM $pid 2>/dev/null || true
        done
        
        # 等待2秒
        sleep 2
        
        # 强制杀死仍然存在的进程
        pids=$(lsof -ti:$port)
        if [ ! -z "$pids" ]; then
            echo "  强制杀死进程 $pids"
            for pid in $pids; do
                kill -9 $pid 2>/dev/null || true
            done
        fi
        
        echo "✅ 端口 $port 已清理"
    else
        echo "✅ 端口 $port 空闲"
    fi
}

# 函数：杀死相关的Node.js进程
kill_node_processes() {
    echo "🔍 检查相关Node.js进程..."
    
    # 查找nodemon和ts-node进程
    local nodemon_pids=$(ps aux | grep 'nodemon\|ts-node' | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$nodemon_pids" ]; then
        echo "⚠️  发现相关进程: $nodemon_pids"
        for pid in $nodemon_pids; do
            echo "  杀死进程 $pid"
            kill -9 $pid 2>/dev/null || true
        done
        echo "✅ 相关进程已清理"
    else
        echo "✅ 没有发现相关进程"
    fi
}

# 停止PM2服务
echo "🛑 停止PM2服务..."
pm2 stop all 2>/dev/null || true
sleep 2

# 清理端口
kill_port 3000
kill_port 5173

# 清理相关进程
kill_node_processes

# 删除PM2进程
echo "🗑️  删除PM2进程..."
pm2 delete all 2>/dev/null || true

# 等待一下确保所有进程都被清理
echo "⏳ 等待进程清理完成..."
sleep 3

# 重新启动服务
echo "🚀 重新启动服务..."
cd /workspaces/legezhixiao/乐格至效网站开发/legezhixiao

# 启动后端
echo "📦 启动后端服务..."
pm2 start ecosystem.config.js --only backend

# 等待后端启动
sleep 5

# 检查后端状态
if curl -s http://localhost:3000/api/ai/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
fi

# 启动前端
echo "🎨 启动前端服务..."
pm2 start ecosystem.config.js --only frontend

# 等待前端启动
sleep 5

# 检查服务状态
echo "📊 服务状态:"
pm2 status

echo ""
echo "🌐 服务地址:"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:3000"
echo ""
echo "🎉 重启完成!"
