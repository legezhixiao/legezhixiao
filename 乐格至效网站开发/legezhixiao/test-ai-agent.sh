#!/bin/bash

# AI Agent 系统测试脚本
echo "🤖 乐格至效 AI Agent 系统测试"
echo "================================"

# 检查前端服务状态
echo "📱 检查前端服务..."
if curl -s http://localhost:5173/ > /dev/null; then
    echo "✅ 前端服务运行正常 (http://localhost:5173/)"
else
    echo "❌ 前端服务未启动"
fi

# 检查后端服务状态  
echo "🔧 检查后端服务..."
if curl -s http://localhost:3000/api > /dev/null; then
    echo "✅ 后端服务运行正常 (http://localhost:3000/)"
else
    echo "❌ 后端服务未启动"
fi

# 检查关键文件
echo "📂 检查核心文件..."
files=(
    "frontend/src/services/aiAgentService.ts"
    "frontend/src/components/AI/AIAgentPanel.tsx"
    "frontend/src/components/AI/AIAgentPanel.css"
    "frontend/src/pages/ProjectDashboard.tsx"
    "AI_AGENT_USER_GUIDE.md"
    "AI_AGENT_COMPLETION_REPORT.md"
    "AI_AGENT_DEMO.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
    fi
done

# 检查 TypeScript 编译状态
echo "🔍 检查 TypeScript 编译..."
cd frontend
if npm run type-check 2>/dev/null; then
    echo "✅ TypeScript 编译无错误"
else
    echo "⚠️ TypeScript 可能存在编译问题"
fi

echo ""
echo "🎉 AI Agent 系统测试完成!"
echo ""
echo "📋 快速访问链接:"
echo "   🏠 主应用: http://localhost:5173/"
echo "   📖 演示页面: file:///workspaces/legezhixiao/AI_AGENT_DEMO.html"
echo "   🔧 API文档: http://localhost:3000/api"
echo ""
echo "💡 使用建议:"
echo "   1. 在主应用右侧找到 AI Agent 面板"
echo "   2. 尝试输入: '创建一个科幻小说项目'"
echo "   3. 查看 AI 如何理解并执行您的指令"
echo ""
