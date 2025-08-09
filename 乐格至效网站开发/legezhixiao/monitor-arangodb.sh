#!/bin/bash
# ArangoDB 启动监控脚本

echo "🔍 监控 ArangoDB 启动状态..."
echo "============================================"

# 检查函数
check_arangodb() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] 检查中..."
    
    # 检查进程
    if pgrep -f arangod > /dev/null; then
        echo "  ✅ ArangoDB 进程运行中"
    else
        echo "  ❌ ArangoDB 进程未运行"
        return 1
    fi
    
    # 检查端口
    if netstat -tln | grep ":8529" > /dev/null; then
        echo "  ✅ 端口 8529 已开放"
    else
        echo "  ⚠️  端口 8529 未开放"
        return 1
    fi
    
    # 检查API响应
    local response=$(curl -s -w "%{http_code}" http://127.0.0.1:8529/_api/version -o /tmp/arango_response.json)
    if [ "$response" = "200" ]; then
        local version=$(cat /tmp/arango_response.json | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo "  ✅ API 响应正常 (版本: $version)"
        echo "  🎉 ArangoDB 完全启动！"
        return 0
    elif [ "$response" = "503" ]; then
        echo "  ⏳ API 响应但服务不可用 (启动中...)"
        return 1
    else
        echo "  ❌ API 无响应 (HTTP: $response)"
        return 1
    fi
}

# 监控循环
attempt=1
max_attempts=20
while [ $attempt -le $max_attempts ]; do
    echo ""
    echo "=== 第 $attempt 次检查 (最多 $max_attempts 次) ==="
    
    if check_arangodb; then
        echo ""
        echo "🎉 ArangoDB 启动完成！"
        echo "📍 访问地址: http://127.0.0.1:8529"
        echo "👤 用户名: root"
        echo "🔐 密码: 88888888"
        echo ""
        
        # 尝试连接并创建数据库
        echo "🔄 正在创建数据库..."
        curl -s -u root:88888888 -X POST http://127.0.0.1:8529/_api/database \
             -H "Content-Type: application/json" \
             -d '{"name": "legezhixiao"}' > /tmp/create_db.json
        
        if grep -q '"error":false' /tmp/create_db.json; then
            echo "✅ 数据库 'legezhixiao' 创建成功"
        else
            echo "ℹ️  数据库创建响应: $(cat /tmp/create_db.json)"
        fi
        
        exit 0
    fi
    
    echo "  ⏳ 等待 10 秒后重试..."
    sleep 10
    attempt=$((attempt + 1))
done

echo ""
echo "❌ ArangoDB 启动超时 (等待了 $(($max_attempts * 10)) 秒)"
echo "📋 查看日志: sudo tail -20 /var/log/arangodb3/arangod.log"
exit 1
