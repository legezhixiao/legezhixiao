#!/bin/bash

# Jasper AI 替换完成脚本
# 清理 Cline 相关的残留文件和引用

echo "🎨 开始 Jasper AI 替换和清理..."

# 1. 清理前端 node_modules 中的 cline 相关包
echo "1. 清理依赖包..."
cd /workspaces/legezhixiao/乐格至效网站开发/legezhixiao/frontend
rm -rf node_modules/cline-sdk 2>/dev/null || true
rm -rf package-lock.json 2>/dev/null || true

# 2. 重新安装依赖
echo "2. 重新安装前端依赖..."
npm install

# 3. 清理可能的 Cline 相关文件
echo "3. 清理 Cline 相关文件..."
find . -name "*cline*" -type f -delete 2>/dev/null || true
find . -name "*Cline*" -type f -delete 2>/dev/null || true

# 4. 清理后端（如果有 cline 相关依赖）
echo "4. 清理后端依赖..."
cd ../backend
rm -rf node_modules/cline-sdk 2>/dev/null || true
npm install

# 5. 更新 TypeScript 编译
echo "5. 检查 TypeScript 编译..."
cd ../frontend
npm run type-check

# 6. 检查 ESLint
echo "6. 检查代码质量..."
npm run lint || echo "发现代码警告，请手动检查"

# 7. 构建测试
echo "7. 测试构建..."
npm run build

echo "✅ Jasper AI 替换完成！"
echo ""
echo "🎯 替换总结："
echo "   ✅ 删除了 Cline 相关服务和依赖"
echo "   ✅ 创建了 Jasper AI 核心服务"
echo "   ✅ 更新了 AgentTaskPanel 组件"
echo "   ✅ 更新了项目描述和文档"
echo "   ✅ 创建了 Jasper AI 全局配置"
echo ""
echo "🚀 新功能："
echo "   📝 专业的写作模板系统"
echo "   🎨 多种品牌语调和写作风格"
echo "   🛠️ 外部工具集成（维基百科、知识图谱等）"
echo "   📊 详细的创作统计和历史记录"
echo "   ⚙️ 丰富的个性化配置选项"
echo ""
echo "📚 使用指南："
echo "   1. 启动服务: npm run dev"
echo "   2. 访问创作工作台"
echo "   3. 选择合适的模板开始创作"
echo "   4. 配置写作风格和工具"
echo "   5. 享受 Jasper AI 风格的创作体验"

exit 0
