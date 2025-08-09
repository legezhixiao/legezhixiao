#!/bin/bash

# ArangoDB 静默启动脚本
# 禁用版本检查和减少日志输出

echo "🚀 启动 ArangoDB..."

# 停止现有的 ArangoDB 进程
sudo service arangodb3 stop > /dev/null 2>&1

# 清理可能存在的 PID 文件
sudo rm -f /var/run/arangodb/arangod.pid

# 启动 ArangoDB 服务
sudo service arangodb3 start

# 等待服务启动
sleep 3

# 检查是否启动成功
if curl -s http://localhost:8529/_api/version > /dev/null; then
    echo "✅ ArangoDB 启动成功 (端口 8529)"
else
    echo "❌ ArangoDB 启动失败"
    exit 1
fi
