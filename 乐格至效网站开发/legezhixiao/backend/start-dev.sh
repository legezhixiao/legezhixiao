#!/bin/bash

# 后端开发环境启动脚本

echo "🚀 启动乐格智小后端开发环境..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  没有找到 .env 文件，从示例文件复制..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
fi

# 检查依赖
echo "📦 检查依赖..."
npm list --depth=0 > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p uploads/avatars
mkdir -p assets

# 启动开发服务器
echo "🔧 启动开发服务器..."
npm run dev
