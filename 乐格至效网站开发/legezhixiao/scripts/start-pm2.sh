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

# 第一步：启动 ArangoDB 数据库
echo "�️ 第一步：启动 ArangoDB 数据库..."
echo "📝 注意：需要管理员权限启动数据库服务"

# 检查当前是否以root权限运行数据库启动部分
if [ "$EUID" -ne 0 ]; then
    echo "🔐 请输入管理员密码以启动 ArangoDB 数据库..."
fi

# 尝试启动ArangoDB服务
if ! sudo service arangodb3 status > /dev/null 2>&1; then
    echo "🔄 正在启动 ArangoDB 系统服务..."
    if sudo service arangodb3 start; then
        echo "✅ ArangoDB 服务启动命令执行成功"
    else
        echo "❌ ArangoDB 服务启动命令失败"
        exit 1
    fi
else
    echo "ℹ️  ArangoDB 服务已在运行"
fi

# 等待数据库完全启动
echo "⏳ 等待 ArangoDB 数据库完全启动..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:$ARANGODB_PORT/_api/version > /dev/null 2>&1; then
        echo "✅ ArangoDB 数据库已就绪 (端口 $ARANGODB_PORT)"
        break
    fi
    echo "   等待数据库启动... (剩余 ${timeout}s)"
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ ArangoDB 数据库启动超时，请检查："
    echo "   1. 数据库服务是否正常安装"
    echo "   2. 端口 $ARANGODB_PORT 是否被占用"
    echo "   3. 系统资源是否充足"
    exit 1
fi

# 第二步：检查端口占用
echo ""
echo "🔍 第二步：检查端口占用情况..."
check_port $FRONTEND_PORT "前端服务" || exit 1
check_port $BACKEND_PORT "后端服务" || exit 1

# 第三步：停止现有PM2进程
echo ""
echo "🔄 第三步：清理现有服务..."
pm2 delete all 2>/dev/null || true
sleep 2

# 第四步：按顺序启动服务（先后端再前端）
echo ""
echo "� 第四步：启动应用服务..."
echo "📦 启动顺序：后端 → 前端（确保依赖关系）"



echo "   🔧 启动后端服务 (端口 $BACKEND_PORT)..."
pm2 start /workspaces/legezhixiao/乐格至效网站开发/legezhixiao/ecosystem.config.js --only backend

# 等待后端服务完全启动
echo "   ⏳ 等待后端服务启动并连接数据库..."
backend_timeout=45
while [ $backend_timeout -gt 0 ]; do
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
        echo "   ✅ 后端服务已启动并连接数据库成功"
        break
    fi
    echo "      等待后端连接数据库... (剩余 ${backend_timeout}s)"
    sleep 3
    backend_timeout=$((backend_timeout - 3))
done

if [ $backend_timeout -le 0 ]; then
    echo "   ❌ 后端服务启动超时，请检查："
    echo "      1. 数据库连接配置是否正确"
    echo "      2. 后端服务日志: pm2 logs backend"
    exit 1
fi


# 4.2 启动前端服务
echo "   🎨 启动前端服务 (端口 $FRONTEND_PORT)..."
pm2 start /workspaces/legezhixiao/乐格至效网站开发/legezhixiao/ecosystem.config.js --only frontend

# 等待前端服务启动
echo "   ⏳ 等待前端服务启动..."
frontend_timeout=30
while [ $frontend_timeout -gt 0 ]; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo "   ✅ 前端服务已启动"
        break
    fi
    echo "      等待前端服务... (剩余 ${frontend_timeout}s)"
    sleep 2
    frontend_timeout=$((frontend_timeout - 2))
done

if [ $frontend_timeout -le 0 ]; then
    echo "   ❌ 前端服务启动超时，请检查日志: pm2 logs frontend"
    exit 1
fi

# 自动检测并初始化测试项目数据
echo ""
echo "🧩 自动检测并初始化测试项目数据..."
curl -s http://localhost:$BACKEND_PORT/api/projects/test-project > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ 测试项目数据已检测/初始化（后端已自动处理）"
else
    echo "   ⚠️  测试项目数据检测失败，请检查后端日志"
fi

# 第五步：显示启动结果
echo ""
echo "📊 第五步：验证所有服务状态..."

# 最终验证所有服务
echo "🔍 最终健康检查："

# 检查数据库
if curl -s http://localhost:$ARANGODB_PORT/_api/version > /dev/null; then
    echo "   ✅ ArangoDB: http://localhost:$ARANGODB_PORT"
else
    echo "   ❌ ArangoDB 连接失败"
fi

# 检查后端（包含数据库连接状态）
if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null; then
    echo "   ✅ 后端API: http://localhost:$BACKEND_PORT"
    if curl -s http://localhost:$BACKEND_PORT/api/db-status > /dev/null; then
        echo "   ✅ 数据库连接正常"
    else
        echo "   ⚠️  后端运行但数据库连接异常"
    fi
else
    echo "   ❌ 后端API 连接失败"
fi

# 检查前端
if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    echo "   ✅ 前端应用: http://localhost:$FRONTEND_PORT"
else
    echo "   ❌ 前端应用连接失败"
fi

echo ""
echo "📈 PM2 进程状态:"
pm2 list

echo ""
echo "🎉 乐格至效开发环境启动完成!"
echo "========================================"
echo "📱 服务访问地址:"
echo "   🌐 前端应用: http://localhost:$FRONTEND_PORT"
echo "   🚀 后端API:  http://localhost:$BACKEND_PORT"
echo "   🗄️ 数据库:   http://localhost:$ARANGODB_PORT"
echo ""
echo "🔧 健康检查地址:"
echo "   📊 API状态:    http://localhost:$BACKEND_PORT/api/health"
echo "   🗄️ 数据库状态: http://localhost:$BACKEND_PORT/api/db-status"
echo ""
echo "💡 管理命令:"
echo "   查看进程:     pm2 list"
echo "   查看所有日志: pm2 logs"
echo "   查看后端日志: pm2 logs backend"
echo "   查看前端日志: pm2 logs frontend"
echo "   重启所有:     pm2 restart all"
echo "   停止所有:     pm2 stop all"
echo "   实时监控:     pm2 monit"
echo "========================================"
