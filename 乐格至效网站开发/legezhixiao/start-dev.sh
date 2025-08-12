#!/bin/bash

echo "🚀 启动乐格至效开发环境（用户级）"

BASE_DIR="/workspaces/legezhixiao/乐格至效网站开发/legezhixiao"

# 检查ArangoDB状态
check_arangodb() {
    echo "🔍 检查ArangoDB状态..."
    if curl -s http://localhost:8529/_api/version > /dev/null 2>&1; then
        echo "✅ ArangoDB运行正常"
        return 0
    else
        echo "❌ ArangoDB未运行，请先运行: sudo ./start-with-db.sh"
        echo "   或手动启动: sudo systemctl start arangodb3"
        exit 1
    fi
}

# 启动后端服务
start_backend() {
    echo "🚀 启动后端服务..."
    
    cd "$BASE_DIR"
    
    # 停止现有服务
    pm2 delete backend 2>/dev/null || true
    
    # 等待2秒确保完全停止
    sleep 2
    
    # 启动后端
    pm2 start ecosystem.config.js --only backend
    
    # 等待后端启动
    echo "⏳ 等待后端服务启动..."
    for i in {1..20}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ 后端服务启动成功"
            return 0
        fi
        echo "   等待中... ($i/20)"
        sleep 3
    done
    
    echo "❌ 后端服务启动超时"
    return 1
}

# 启动前端服务
start_frontend() {
    echo "🎨 启动前端服务..."
    
    cd "$BASE_DIR"
    
    # 停止现有服务
    pm2 delete frontend 2>/dev/null || true
    
    # 等待2秒确保完全停止
    sleep 2
    
    # 启动前端
    pm2 start ecosystem.config.js --only frontend
    
    # 等待前端启动
    echo "⏳ 等待前端服务启动..."
    for i in {1..15}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ 前端服务启动成功"
            return 0
        fi
        echo "   等待中... ($i/15)"
        sleep 2
    done
    
    echo "❌ 前端服务启动超时"
    return 1
}

# 显示状态
show_status() {
    echo ""
    echo "📊 服务状态："
    echo "🗄️ ArangoDB: http://localhost:8529"
    echo "🚀 后端API: http://localhost:3000"
    echo "🎨 前端应用: http://localhost:5173"
    echo ""
    
    # 显示PM2状态
    pm2 status
    
    echo ""
    echo "✅ 开发环境启动完成！"
    echo ""
    echo "🔧 常用命令："
    echo "   pm2 logs        - 查看所有日志"
    echo "   pm2 logs backend - 查看后端日志"
    echo "   pm2 logs frontend - 查看前端日志"
    echo "   pm2 monit       - 监控服务"
    echo "   pm2 restart all - 重启所有服务"
}

# 主执行流程
main() {
    check_arangodb
    
    if start_backend && start_frontend; then
        show_status
    else
        echo "❌ 部分服务启动失败，请检查日志"
        pm2 status
        exit 1
    fi
}

# 运行主函数
main
