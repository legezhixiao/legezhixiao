#!/bin/bash

# 乐格智小完整开发环境启动脚本 - 使用 PM2

echo "🚀 启动乐格智小完整开发环境 (PM2)..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 调用 PM2 启动脚本
exec "$SCRIPT_DIR/start-pm2.sh"
