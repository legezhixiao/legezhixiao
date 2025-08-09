#!/bin/bash

# PM2 停止脚本
echo "🛑 停止 PM2 开发环境..."

# 停止所有服务
pm2 stop all

# 显示状态
echo "📊 服务状态:"
pm2 list

echo "✅ PM2 开发环境已停止!"
