#!/bin/bash

# 端口管理工具函数
# 检查端口是否被占用，如果被占用则杀掉进程

check_and_kill_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 检查端口 $port ($service_name)..."
    
    # 查找占用端口的进程
    local pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]; then
        echo "⚠️  端口 $port 被进程 $pid 占用，正在终止..."
        kill -9 $pid 2>/dev/null
        sleep 2
        
        # 再次检查是否还被占用
        local new_pid=$(lsof -ti:$port)
        if [ ! -z "$new_pid" ]; then
            echo "❌ 无法终止端口 $port 上的进程，请手动处理"
            return 1
        else
            echo "✅ 端口 $port 已释放"
        fi
    else
        echo "✅ 端口 $port 可用"
    fi
    
    return 0
}

wait_for_port() {
    local port=$1
    local service_name=$2
    local max_wait=${3:-30}
    
    echo "⏳ 等待 $service_name 在端口 $port 启动..."
    
    for i in $(seq 1 $max_wait); do
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ $service_name 已在端口 $port 启动成功"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo ""
    echo "❌ $service_name 启动超时 (端口 $port)"
    return 1
}

# 导出函数供其他脚本使用
export -f check_and_kill_port
export -f wait_for_port
