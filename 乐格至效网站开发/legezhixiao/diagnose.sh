#!/bin/bash

echo "🔍 乐格至效服务诊断工具"
echo "========================="

# 检查PM2状态
echo ""
echo "📊 PM2进程状态:"
pm2 status

# 检查端口占用
echo ""
echo "🌐 端口占用情况:"
echo "端口 3000 (后端):"
lsof -i :3000 || echo "  ✅ 端口空闲"
echo "端口 5173 (前端):"
lsof -i :5173 || echo "  ✅ 端口空闲"

# 检查服务健康
echo ""
echo "🏥 服务健康检查:"
echo "后端健康状态:"
curl -s http://localhost:3000/api/ai/health > /dev/null && echo "  ✅ 后端服务正常" || echo "  ❌ 后端服务异常"

echo "前端访问状态:"
curl -s http://localhost:5173 > /dev/null && echo "  ✅ 前端服务正常" || echo "  ❌ 前端服务异常"

# 检查日志错误
echo ""
echo "📝 近期错误日志:"
if [ -f "/workspaces/legezhixiao/乐格至效网站开发/legezhixiao/backend/logs/backend-error-0.log" ]; then
    echo "后端错误 (最近5条):"
    tail -5 "/workspaces/legezhixiao/乐格至效网站开发/legezhixiao/backend/logs/backend-error-0.log" 2>/dev/null || echo "  ✅ 无错误日志"
else
    echo "  ✅ 无错误日志文件"
fi

# AI功能测试
echo ""
echo "🤖 AI功能快速测试:"
response=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "测试", "type": "general"}' 2>/dev/null)

if echo "$response" | grep -q "text"; then
    echo "  ✅ AI助手功能正常"
else
    echo "  ❌ AI助手功能异常"
fi

echo ""
echo "🎯 诊断完成!"
echo ""
echo "🛠️  如果发现问题，可以运行:"
echo "   ./restart-services.sh  # 重启所有服务"
echo ""
