#!/bin/bash

echo "🗄️ 乐格至效 - ArangoDB 数据库启动脚本"
echo "======================================="

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo "🔐 需要管理员权限启动数据库服务"
    echo "正在请求 sudo 权限..."
    exec sudo "$0" "$@"
fi

# 检查ArangoDB是否已安装
if ! command -v arangod &> /dev/null; then
    echo "❌ ArangoDB 未安装，请先安装 ArangoDB"
    echo "   Ubuntu/Debian: apt-get install arangodb3"
    echo "   CentOS/RHEL:   yum install arangodb3"
    exit 1
fi

# 检查服务状态
echo "🔍 检查 ArangoDB 服务状态..."
if service arangodb3 status > /dev/null 2>&1; then
    echo "✅ ArangoDB 服务已在运行"
else
    echo "🔄 启动 ArangoDB 服务..."
    if service arangodb3 start; then
        echo "✅ ArangoDB 服务启动成功"
    else
        echo "❌ ArangoDB 服务启动失败"
        echo "💡 请检查："
        echo "   1. ArangoDB 配置文件是否正确"
        echo "   2. 数据目录权限是否正确"
        echo "   3. 端口 8529 是否被占用"
        exit 1
    fi
fi

# 等待数据库完全启动
echo "⏳ 等待数据库完全启动..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:8529/_api/version > /dev/null 2>&1; then
        echo "✅ ArangoDB 数据库已就绪"
        break
    fi
    echo "   等待数据库响应... (剩余 ${timeout}s)"
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ 数据库启动超时"
    echo "💡 请检查日志: sudo journalctl -u arangodb3 -f"
    exit 1
fi

# 显示数据库信息
echo ""
echo "🎉 ArangoDB 数据库启动完成！"
echo "======================================="
echo "📊 数据库信息："

# 获取数据库版本信息
DB_INFO=$(curl -s http://localhost:8529/_api/version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   版本: $(echo $DB_INFO | grep -o '"version":"[^"]*' | cut -d'"' -f4)"
    echo "   许可证: $(echo $DB_INFO | grep -o '"license":"[^"]*' | cut -d'"' -f4)"
fi

echo ""
echo "🌐 访问地址："
echo "   Web界面: http://localhost:8529"
echo "   API端点: http://localhost:8529/_api/"
echo ""
echo "🔧 管理命令："
echo "   查看状态: sudo service arangodb3 status"
echo "   停止数据库: sudo service arangodb3 stop"
echo "   重启数据库: sudo service arangodb3 restart"
echo "   查看日志: sudo journalctl -u arangodb3 -f"
echo ""
echo "💡 现在可以启动应用服务："
echo "   ./start-dev.sh        # 启动前后端服务"
echo "   ./scripts/start-pm2.sh # 完整启动（会检查数据库）"
echo "======================================="
