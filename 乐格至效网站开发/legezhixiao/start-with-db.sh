#!/bin/bash

echo "🚀 启动乐格至效开发环境"

# 检查是否为root用户运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "❌ 需要root权限启动ArangoDB，正在尝试使用sudo..."
        # 重新以sudo运行
        exec sudo "$0" "$@"
    fi
}

# 启动ArangoDB
start_arangodb() {
    echo "📦 启动ArangoDB数据库..."
    
    # 检查ArangoDB是否已经运行
    if pgrep arangod > /dev/null; then
        echo "✅ ArangoDB已经在运行"
    else
        echo "🔄 启动ArangoDB服务..."
        # 在容器环境中直接启动arangod
        service arangodb3 start || arangod --server.endpoint tcp://0.0.0.0:8529 --database.directory /var/lib/arangodb3 --log.file /var/log/arangodb3/arangod.log --server.authentication false --daemon
        
        # 等待ArangoDB启动
        echo "⏳ 等待ArangoDB启动..."
        for i in {1..30}; do
            if curl -s http://localhost:8529/_api/version > /dev/null 2>&1; then
                echo "✅ ArangoDB启动成功"
                break
            fi
            echo "   等待中... ($i/30)"
            sleep 2
        done
        
        # 检查是否启动成功
        if ! curl -s http://localhost:8529/_api/version > /dev/null 2>&1; then
            echo "❌ ArangoDB启动失败"
            exit 1
        fi
    fi
}

# 初始化数据库
init_database() {
    echo "🗄️ 初始化数据库..."
    
    # 检查数据库是否存在
    if curl -s -u "root:" "http://localhost:8529/_db/legezhixiao/_api/version" > /dev/null 2>&1; then
        echo "✅ 数据库legezhixiao已存在"
    else
        echo "🔄 创建数据库legezhixiao..."
        curl -X POST \
            -H "Content-Type: application/json" \
            -u "root:" \
            -d '{"name":"legezhixiao"}' \
            "http://localhost:8529/_api/database" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ 数据库创建成功"
        else
            echo "❌ 数据库创建失败"
            exit 1
        fi
    fi
    
    # 检查集合是否存在
    echo "🔄 检查集合..."
    collections=("users" "projects" "chapters" "knowledge_nodes" "knowledge_edges")
    
    for collection in "${collections[@]}"; do
        if curl -s -u "root:" "http://localhost:8529/_db/legezhixiao/_api/collection/$collection" > /dev/null 2>&1; then
            echo "✅ 集合$collection已存在"
        else
            echo "🔄 创建集合$collection..."
            if [[ $collection == "knowledge_edges" ]]; then
                # 创建边集合
                curl -X POST \
                    -H "Content-Type: application/json" \
                    -u "root:" \
                    -d "{\"name\":\"$collection\",\"type\":3}" \
                    "http://localhost:8529/_db/legezhixiao/_api/collection" > /dev/null 2>&1
            else
                # 创建文档集合
                curl -X POST \
                    -H "Content-Type: application/json" \
                    -u "root:" \
                    -d "{\"name\":\"$collection\"}" \
                    "http://localhost:8529/_db/legezhixiao/_api/collection" > /dev/null 2>&1
            fi
            
            if [ $? -eq 0 ]; then
                echo "✅ 集合$collection创建成功"
            else
                echo "❌ 集合$collection创建失败"
            fi
        fi
    done
}

# 启动后端服务
start_backend() {
    echo "🚀 启动后端服务..."
    
    # 切换到普通用户运行后端
    su - $SUDO_USER -c "cd /workspaces/legezhixiao/乐格至效网站开发/legezhixiao && pm2 delete backend 2>/dev/null || true"
    su - $SUDO_USER -c "cd /workspaces/legezhixiao/乐格至效网站开发/legezhixiao && pm2 start ecosystem.config.js --only backend"
    
    # 等待后端启动
    echo "⏳ 等待后端服务启动..."
    for i in {1..20}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ 后端服务启动成功"
            break
        fi
        echo "   等待中... ($i/20)"
        sleep 3
    done
}

# 启动前端服务
start_frontend() {
    echo "🎨 启动前端服务..."
    
    su - $SUDO_USER -c "cd /workspaces/legezhixiao/乐格至效网站开发/legezhixiao && pm2 delete frontend 2>/dev/null || true"
    su - $SUDO_USER -c "cd /workspaces/legezhixiao/乐格至效网站开发/legezhixiao && pm2 start ecosystem.config.js --only frontend"
    
    # 等待前端启动
    echo "⏳ 等待前端服务启动..."
    for i in {1..15}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ 前端服务启动成功"
            break
        fi
        echo "   等待中... ($i/15)"
        sleep 2
    done
}

# 显示状态
show_status() {
    echo ""
    echo "📊 服务状态："
    echo "🗄️ ArangoDB: http://localhost:8529"
    echo "🚀 后端API: http://localhost:3000"
    echo "🎨 前端应用: http://localhost:5173"
    echo ""
    
    # 显示PM2状态
    su - $SUDO_USER -c "pm2 status"
    
    echo ""
    echo "✅ 所有服务启动完成！"
    echo "💡 使用 'pm2 logs' 查看日志"
    echo "💡 使用 'pm2 monit' 监控服务"
}

# 主执行流程
main() {
    check_root
    start_arangodb
    init_database
    start_backend
    start_frontend
    show_status
}

# 运行主函数
main
