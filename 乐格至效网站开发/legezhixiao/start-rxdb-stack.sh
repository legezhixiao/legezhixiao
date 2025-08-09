#!/bin/bash

# 乐格智小项目启动脚本
# 使用 RXDB + ArangoDB 架构

echo "🚀 启动乐格智小 - RXDB + ArangoDB 版本"
echo "======================================"

# 检查 ArangoDB 服务状态
if ! systemctl is-active --quiet arangodb3; then
    echo "⚠️  ArangoDB 服务未运行，正在启动..."
    sudo systemctl start arangodb3
    sleep 5
fi

# 等待 ArangoDB 启动
echo "⏳ 等待 ArangoDB 启动完成..."
for i in {1..30}; do
    if curl -s http://localhost:8529/_api/version > /dev/null 2>&1; then
        echo "✅ ArangoDB 启动成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ ArangoDB 启动超时，请检查服务状态"
        echo "   可以运行: sudo systemctl status arangodb3"
        exit 1
    fi
    sleep 2
    echo -n "."
done

# 显示 ArangoDB 信息
echo ""
echo "📊 ArangoDB 信息:"
echo "   - Web界面: http://localhost:8529"
echo "   - 原生安装的ArangoDB服务"
echo "   - 数据库: legezhixiao"

# 启动后端服务
echo ""
echo "⚙️ 启动后端服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 后台启动后端
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端服务启动 (PID: $BACKEND_PID)"
echo "   - API地址: http://localhost:3000"
echo "   - 日志文件: logs/backend.log"

# 等待后端启动
echo "⏳ 等待后端启动完成..."
for i in {1..20}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "❌ 后端服务启动超时"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 2
    echo -n "."
done

# 启动前端服务
echo ""
echo "🎨 启动前端服务..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 后台启动前端
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端服务启动 (PID: $FRONTEND_PID)"
echo "   - 应用地址: http://localhost:5173"
echo "   - 日志文件: logs/frontend.log"

# 创建停止脚本
cd ..
cat > stop-services.sh << 'EOF'
#!/bin/bash
echo "🛑 停止乐格智小服务..."

# 读取并停止进程
if [ -f .pids ]; then
    while read line; do
        service=$(echo $line | cut -d: -f1)
        pid=$(echo $line | cut -d: -f2)
        if kill -0 $pid 2>/dev/null; then
            echo "🔴 停止 $service (PID: $pid)"
            kill $pid
        fi
    done < .pids
    rm .pids
fi

# 停止 ArangoDB 服务
echo "🔴 停止 ArangoDB..."
sudo systemctl stop arangodb3

echo "✅ 所有服务已停止"
EOF

chmod +x stop-services.sh

# 保存进程ID
echo "backend:$BACKEND_PID" > .pids
echo "frontend:$FRONTEND_PID" >> .pids

# 显示启动完成信息
echo ""
echo "🎉 启动完成！"
echo "==============="
echo "📱 前端应用: http://localhost:5173"
echo "⚙️ 后端API: http://localhost:3000"
echo "🗄️ ArangoDB: http://localhost:8529"
echo "🧪 测试页面: http://localhost:5173/rxdb-test"
echo ""
echo "📋 管理命令:"
echo "   - 查看后端日志: tail -f logs/backend.log"
echo "   - 查看前端日志: tail -f logs/frontend.log"
echo "   - 停止所有服务: ./stop-services.sh"
echo "   - 查看ArangoDB状态: sudo systemctl status arangodb3"
echo ""
echo "💡 功能特性:"
echo "   ✅ 离线优先的数据存储 (RXDB)"
echo "   ✅ 实时双向数据同步"
echo "   ✅ 多模态数据库 (ArangoDB)"
echo "   ✅ 图数据库支持"
echo "   ✅ 知识图谱构建"
echo "   ✅ AI约束引擎"
echo ""

# 等待用户输入以保持脚本运行
echo "按 Ctrl+C 或运行 ./stop-services.sh 来停止所有服务"

# 监控服务状态
while true; do
    sleep 10
    
    # 检查后端
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ 后端服务已停止"
        break
    fi
    
    # 检查前端
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ 前端服务已停止"
        break
    fi
    
    # 检查 ArangoDB
    if ! systemctl is-active --quiet arangodb3; then
        echo "❌ ArangoDB 服务已停止"
        break
    fi
done

echo "🛑 检测到服务停止，运行清理..."
./stop-services.sh
