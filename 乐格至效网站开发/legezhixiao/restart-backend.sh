#!/bin/bash

# 强制停止端口3000的进程
echo "正在检查端口3000..."
PID=$(lsof -ti:3000)
if [ ! -z "$PID" ]; then
    echo "杀死端口3000的进程: $PID"
    kill -9 $PID
    sleep 2
fi

# 启动后端服务
echo "启动后端服务..."
cd "/workspaces/legezhixiao/乐格至效网站开发/legezhixiao"
npm run dev:backend
