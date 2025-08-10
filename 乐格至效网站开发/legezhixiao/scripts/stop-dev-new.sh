#!/bin/bash

# 停止开发服务脚本 - 现在使用 PM2

echo "🛑 停止开发服务 (PM2)"
echo "================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 调用 PM2 停止脚本
exec "$SCRIPT_DIR/stop-pm2.sh"
