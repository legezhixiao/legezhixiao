#!/bin/bash

echo "🚀 启动乐格至效开发环境（用户级）"

BASE_DIR="/workspaces/legezhixiao/乐格至效网站开发/legezhixiao"

# 检查并启动ArangoDB
check_and_start_arangodb() {
    echo "�️ 第一步：检查 ArangoDB 数据库状态..."
    
    # 先检查数据库是否可访问
    if curl -s http://localhost:8529/_api/version > /dev/null 2>&1; then
        echo "✅ ArangoDB 已运行并可访问"
        return 0
    fi
    
    # 数据库未运行，尝试启动
    echo "⚠️  ArangoDB 未运行，尝试启动数据库服务..."
    echo "🔐 需要管理员权限启动数据库，请输入密码："
    
    # 尝试启动数据库服务
    if sudo service arangodb3 start; then
        echo "✅ 数据库启动命令执行成功"
    else
        echo "❌ 数据库启动失败，请检查："
        echo "   1. ArangoDB 是否正确安装"
        echo "   2. 服务配置是否正确"
        echo "   3. 端口 8529 是否被占用"
        exit 1
    fi
    
    # 等待数据库完全启动
    echo "⏳ 等待数据库完全启动..."
    timeout=45
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:8529/_api/version > /dev/null 2>&1; then
            echo "✅ ArangoDB 数据库已就绪"
            return 0
        fi
        echo "   等待数据库启动... (剩余 ${timeout}s)"
        sleep 3
        timeout=$((timeout - 3))
    done
    
    echo "❌ 数据库启动超时，请手动检查："
    echo "   sudo service arangodb3 status"
    echo "   sudo journalctl -u arangodb3 --no-pager -l"
    exit 1
}

# 启动后端服务（确保数据库连接）
start_backend() {
    echo ""
    echo "🚀 第二步：启动后端服务..."
    
    cd "$BASE_DIR"
    
    # 停止现有后端服务
    echo "🔄 停止现有后端服务..."
    pm2 delete backend 2>/dev/null || true
    sleep 2
    
    # 启动后端服务
    echo "📦 启动后端服务..."
    pm2 start ecosystem.config.js --only backend
    
    # 等待后端启动并连接数据库
    echo "⏳ 等待后端服务启动并连接数据库..."
    for i in {1..25}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ 后端服务启动成功"
            # 验证数据库连接
            if curl -s http://localhost:3000/api/db-status > /dev/null 2>&1; then
                echo "✅ 后端已成功连接数据库"
                return 0
            else
                echo "⚠️  后端启动但数据库连接异常，继续等待..."
            fi
        fi
        echo "   等待后端连接数据库... ($i/25)"
        sleep 3
    done
    
    echo "❌ 后端服务启动超时或数据库连接失败"
    echo "💡 请检查后端日志: pm2 logs backend"
    return 1
}

# 启动前端服务
start_frontend() {
    echo ""
    echo "🎨 第三步：启动前端服务..."
    
    cd "$BASE_DIR"
    
    # 停止现有前端服务
    echo "🔄 停止现有前端服务..."
    pm2 delete frontend 2>/dev/null || true
    sleep 2
    
    # 启动前端服务
    echo "📦 启动前端服务..."
    pm2 start ecosystem.config.js --only frontend
    
    # 等待前端启动
    echo "⏳ 等待前端服务启动..."
    for i in {1..20}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ 前端服务启动成功"
            return 0
        fi
        echo "   等待前端服务... ($i/20)"
        sleep 2
    done
    
    echo "❌ 前端服务启动超时"
    echo "💡 请检查前端日志: pm2 logs frontend"
    return 1
}

# 显示最终状态
show_status() {
    echo ""
    echo "📊 第四步：验证所有服务状态..."
    echo "========================================="
    
    # 健康检查
    echo "🔍 服务健康检查："
    if curl -s http://localhost:8529/_api/version > /dev/null; then
        echo "   ✅ ArangoDB: http://localhost:8529"
    else
        echo "   ❌ ArangoDB 连接失败"
    fi
    
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo "   ✅ 后端API: http://localhost:3000"
    else
        echo "   ❌ 后端API 连接失败"
    fi
    
    if curl -s http://localhost:5173 > /dev/null; then
        echo "   ✅ 前端应用: http://localhost:5173"
    else
        echo "   ❌ 前端应用连接失败"
    fi
    
    echo ""
    echo "📈 PM2 进程状态："
    pm2 status
    
    echo ""
    echo "🎉 乐格至效开发环境启动完成！"
    echo "========================================="
    echo "📱 访问地址："
    echo "   🌐 前端应用: http://localhost:5173"
    echo "   🚀 后端API:  http://localhost:3000"
    echo "   �️ 数据库:   http://localhost:8529"
    echo ""
    echo "�🔧 常用命令："
    echo "   pm2 logs        - 查看所有日志"
    echo "   pm2 logs backend - 查看后端日志"
    echo "   pm2 logs frontend - 查看前端日志"
    echo "   pm2 monit       - 实时监控"
    echo "   pm2 restart all - 重启所有服务"
    echo "   ./stop-dev.sh   - 停止服务"
    echo "========================================="
}

# 主执行流程
main() {
    echo "🚀 启动乐格至效开发环境"
    echo "========================================="
    echo "启动顺序：数据库 → 后端 → 前端"
    echo "========================================="
    
    # 按严格顺序执行启动步骤
    if check_and_start_arangodb; then
        if start_backend; then
            if start_frontend; then
                show_status
            else
                echo "❌ 前端服务启动失败"
                echo "💡 数据库和后端正常，请检查前端日志"
                pm2 status
                exit 1
            fi
        else
            echo "❌ 后端服务启动失败"
            echo "💡 请检查数据库连接和后端配置"
            pm2 status
            exit 1
        fi
    else
        echo "❌ 数据库启动失败"
        echo "💡 请检查 ArangoDB 安装和配置"
        exit 1
    fi
}

# 运行主函数
main
