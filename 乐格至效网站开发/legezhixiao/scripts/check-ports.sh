#!/bin/bash

# 端口配置确认脚本
echo "🔍 乐格智小端口配置检查"
echo "========================"

# 定义端口
FRONTEND_PORT=5173
BACKEND_PORT=3000
ARANGODB_PORT=8529

# 检查端口函数
check_service_port() {
    local port=$1
    local service_name=$2
    local expected_url=$3
    
    echo -n "📡 检查 $service_name (端口 $port): "
    
    # 检查端口是否有进程监听
    if ss -tlnp | grep ":$port " >/dev/null 2>&1; then
        echo "✅ 运行中"
        
        # 如果提供了URL，测试HTTP响应
        if [ ! -z "$expected_url" ]; then
            if curl -s "$expected_url" > /dev/null; then
                echo "   └─ HTTP响应: ✅ 正常"
            else
                echo "   └─ HTTP响应: ❌ 异常"
            fi
        fi
    else
        echo "❌ 未运行"
    fi
}

# 检查所有服务
check_service_port $ARANGODB_PORT "ArangoDB" "http://localhost:$ARANGODB_PORT/_api/version"
check_service_port $BACKEND_PORT "后端服务" "http://localhost:$BACKEND_PORT/api/db-status"
check_service_port $FRONTEND_PORT "前端服务" "http://localhost:$FRONTEND_PORT"

echo ""
echo "🌐 服务地址:"
echo "  前端应用: http://localhost:$FRONTEND_PORT"
echo "  后端API:  http://localhost:$BACKEND_PORT"
echo "  数据库:   http://localhost:$ARANGODB_PORT"
echo "  API状态:  http://localhost:$BACKEND_PORT/api/db-status"

echo ""
echo "📊 PM2 进程状态:"
pm2 list 2>/dev/null || echo "PM2 未运行或无进程"
