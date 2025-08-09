#!/bin/bash

echo "🚀 启动后端服务器..."

# 检查 ArangoDB 是否运行
if ! curl -s http://localhost:8529/_api/version > /dev/null; then
    echo "📊 ArangoDB 未运行，正在启动..."
    /workspaces/legezhixiao/start-arango-quiet.sh
fi

cd /workspaces/legezhixiao/backend

# 编译 TypeScript
echo "🔨 编译 TypeScript..."
npm run build

export PORT=3000
export NODE_ENV=development

# 启动服务器
echo "🌟 启动服务器..."
node dist/server.js
