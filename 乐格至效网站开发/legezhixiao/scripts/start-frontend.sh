#!/bin/bash

# 前端启动器 - 固定端口5173
# 如果端口被占用则自动清理并重新启动

set -e  # 遇到错误立即退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 导入端口工具
source "$SCRIPT_DIR/port-utils.sh"

# 配置
FRONTEND_PORT=5173
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_DIR="$PROJECT_ROOT/logs"

echo "🚀 启动前端服务 (固定端口: $FRONTEND_PORT)"
echo "============================================"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 检查并清理端口
if ! check_and_kill_port $FRONTEND_PORT "前端服务"; then
    echo "❌ 无法清理端口 $FRONTEND_PORT，启动失败"
    exit 1
fi

# 切换到前端目录
cd "$FRONTEND_DIR"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 检查环境变量文件
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "📋 复制环境变量配置..."
    cp .env.example .env
fi

# 确保 Vite 配置中的端口设置
echo "🔧 检查 Vite 配置..."

# 启动前端服务
echo "⚙️ 启动前端服务..."
echo "   - 端口: $FRONTEND_PORT"
echo "   - 目录: $FRONTEND_DIR"
echo "   - 日志: $LOG_DIR/frontend.log"
echo "   - 代理: /api -> http://localhost:3000"

# 启动服务（前台运行）
echo ""
echo "🌐 前端服务启动中..."

# 使用 Vite 开发服务器，强制指定端口
npm run dev -- --port $FRONTEND_PORT --host 0.0.0.0 2>&1 | tee "$LOG_DIR/frontend.log"
