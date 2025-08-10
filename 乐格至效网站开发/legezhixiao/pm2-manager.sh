#!/bin/bash

# 乐格至效PM2服务管理脚本
# 提供启动、停止、重启、状态检查等功能

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印有颜色的消息
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 强制杀死端口占用进程
force_kill_port() {
    local port=$1
    print_color $YELLOW "🔍 检查端口 $port..."
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        print_color $YELLOW "⚠️  端口 $port 被占用，PID: $pids"
        
        for pid in $pids; do
            print_color $RED "  强制杀死进程 $pid"
            kill -9 $pid 2>/dev/null || true
        done
        
        sleep 1
        
        # 再次检查
        if check_port $port; then
            print_color $RED "❌ 端口 $port 仍被占用"
            return 1
        else
            print_color $GREEN "✅ 端口 $port 已清理"
            return 0
        fi
    else
        print_color $GREEN "✅ 端口 $port 空闲"
        return 0
    fi
}

# 清理相关Node.js进程
cleanup_node_processes() {
    print_color $YELLOW "🔍 清理相关Node.js进程..."
    
    # 查找相关进程
    local processes=$(ps aux | grep -E 'nodemon|ts-node|node.*server' | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$processes" ]; then
        print_color $YELLOW "发现相关进程: $processes"
        for pid in $processes; do
            # 检查是否是VS Code相关进程
            local cmd=$(ps -p $pid -o comm= 2>/dev/null)
            if [[ "$cmd" != *"vscode"* ]]; then
                print_color $RED "  杀死进程 $pid"
                kill -9 $pid 2>/dev/null || true
            fi
        done
        print_color $GREEN "✅ 相关进程已清理"
    else
        print_color $GREEN "✅ 没有发现相关进程"
    fi
}

# 启动服务
start_services() {
    print_color $BLUE "🚀 启动乐格至效服务..."
    
    cd "$PROJECT_DIR"
    
    # 清理端口
    force_kill_port 3000
    force_kill_port 5173
    
    # 清理进程
    cleanup_node_processes
    
    print_color $YELLOW "📦 启动后端服务..."
    pm2 start ecosystem.config.js --only backend
    
    # 等待后端启动
    local backend_ready=false
    for i in {1..10}; do
        sleep 2
        if curl -s http://localhost:3000/api/ai/health > /dev/null 2>&1; then
            backend_ready=true
            break
        fi
        print_color $YELLOW "  等待后端启动... ($i/10)"
    done
    
    if [ "$backend_ready" = true ]; then
        print_color $GREEN "✅ 后端服务启动成功"
    else
        print_color $RED "❌ 后端服务启动失败"
    fi
    
    print_color $YELLOW "🎨 启动前端服务..."
    pm2 start ecosystem.config.js --only frontend
    
    # 等待前端启动
    sleep 3
    
    print_color $GREEN "📊 服务状态:"
    pm2 status
    
    print_color $BLUE "\n🌐 服务地址:"
    print_color $GREEN "  前端: http://localhost:5173"
    print_color $GREEN "  后端: http://localhost:3000"
    print_color $GREEN "  健康检查: http://localhost:3000/api/ai/health"
}

# 停止服务
stop_services() {
    print_color $YELLOW "🛑 停止乐格至效服务..."
    
    pm2 stop all 2>/dev/null || true
    sleep 2
    
    # 清理端口
    force_kill_port 3000
    force_kill_port 5173
    
    # 清理进程
    cleanup_node_processes
    
    print_color $GREEN "✅ 服务已停止"
}

# 重启服务
restart_services() {
    print_color $BLUE "🔄 重启乐格至效服务..."
    
    stop_services
    sleep 2
    
    # 删除PM2进程记录
    pm2 delete all 2>/dev/null || true
    
    start_services
    
    print_color $GREEN "🎉 重启完成!"
}

# 查看状态
show_status() {
    print_color $BLUE "📊 乐格至效服务状态:"
    
    print_color $YELLOW "\nPM2 状态:"
    pm2 status
    
    print_color $YELLOW "\n端口占用情况:"
    if check_port 3000; then
        print_color $GREEN "  端口 3000: 已占用"
    else
        print_color $RED "  端口 3000: 空闲"
    fi
    
    if check_port 5173; then
        print_color $GREEN "  端口 5173: 已占用"
    else
        print_color $RED "  端口 5173: 空闲"
    fi
    
    print_color $YELLOW "\n健康检查:"
    if curl -s http://localhost:3000/api/ai/health > /dev/null 2>&1; then
        print_color $GREEN "  后端健康检查: ✅ 正常"
    else
        print_color $RED "  后端健康检查: ❌ 失败"
    fi
    
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_color $GREEN "  前端服务: ✅ 正常"
    else
        print_color $RED "  前端服务: ❌ 失败"
    fi
}

# 查看日志
show_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        print_color $BLUE "📋 可用的日志:"
        print_color $YELLOW "  backend  - 后端日志"
        print_color $YELLOW "  frontend - 前端日志"
        print_color $YELLOW "  all      - 所有日志"
        return
    fi
    
    case $service in
        backend)
            print_color $BLUE "📋 后端日志:"
            pm2 logs backend --lines 50
            ;;
        frontend)
            print_color $BLUE "📋 前端日志:"
            pm2 logs frontend --lines 50
            ;;
        all)
            print_color $BLUE "📋 所有日志:"
            pm2 logs --lines 50
            ;;
        *)
            print_color $RED "❌ 未知的服务: $service"
            ;;
    esac
}

# 显示帮助
show_help() {
    print_color $BLUE "乐格至效PM2服务管理脚本"
    print_color $BLUE "========================="
    echo ""
    print_color $YELLOW "用法: $0 <命令> [选项]"
    echo ""
    print_color $GREEN "命令:"
    print_color $YELLOW "  start     启动所有服务"
    print_color $YELLOW "  stop      停止所有服务"
    print_color $YELLOW "  restart   重启所有服务"
    print_color $YELLOW "  status    查看服务状态"
    print_color $YELLOW "  logs      查看日志 [backend|frontend|all]"
    print_color $YELLOW "  help      显示此帮助信息"
    echo ""
    print_color $GREEN "示例:"
    print_color $YELLOW "  $0 start          # 启动服务"
    print_color $YELLOW "  $0 restart        # 重启服务"
    print_color $YELLOW "  $0 logs backend   # 查看后端日志"
    print_color $YELLOW "  $0 status         # 查看状态"
}

# 主函数
main() {
    case $1 in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs $2
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_color $RED "❌ 未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
