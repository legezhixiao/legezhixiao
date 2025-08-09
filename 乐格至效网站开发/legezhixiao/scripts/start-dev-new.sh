#!/bin/bash

# 主启动器 - 启动完整的开发环境
# 现在使用 PM2 进程管理器

set -e  # 遇到错误立即退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 启动乐格智小开发环境 (PM2)"
echo "========================"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo "ArangoDB: http://localhost:8529"
echo "========================"

# 调用 PM2 启动脚本
exec "$SCRIPT_DIR/start-pm2.sh"
