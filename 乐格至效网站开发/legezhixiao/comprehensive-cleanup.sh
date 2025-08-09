#!/bin/bash

echo "=== 全面清理临时文件和测试文件脚本 ==="
echo

# 删除前端根目录的所有测试和调试文件
echo "🗑️  删除前端测试和调试文件..."
cd frontend
rm -f AI_SCROLLBAR_TEST.html
rm -f AI_STEP_PROCESS_TEST.html
rm -f DATA_FORMAT_DEBUG.html
rm -f PROJECT_CREATE_DEBUG.html
rm -f PROJECT_DEBUG.html
rm -f REAL_TIME_DEBUG.html
rm -f SIMPLE_API_TEST.html
rm -f ai-agent-direct-test.html
rm -f ai-agent-test.html
rm -f api-test.html
rm -f js-test.html
rm -f network-test.html
rm -f simple-test.html
rm -f test-create.html
rm -f test-sync.html

# 删除public目录的测试文件
echo "🗑️  删除public目录测试文件..."
rm -f public/api-test.html
rm -f public/debug.html

# 删除src目录的测试组件
echo "🗑️  删除测试组件..."
rm -f src/App_test.tsx
rm -f src/TestApp.tsx
rm -f src/TestComponent.tsx
rm -f src/MinimalApp.tsx
rm -f src/SimpleApp.tsx

cd ..

# 删除后端临时文件
echo "🗑️  删除后端临时文件..."
rm -f backend/simple-server.js
rm -f backend/simple-start.js  
rm -f backend/test-server.js
rm -f backend/src/temp-server.ts
rm -f backend/src/routes/upload-test.ts
rm -f backend/real-server.js
rm -f backend/api-test.html
rm -f backend/writing-api-test.html

# 删除后端编译的临时文件
echo "🗑️  删除后端编译临时文件..."
rm -f backend/dist/temp-server.*
rm -f backend/dist/controllers/projectController.simple.*
rm -f backend/dist/models/index_simple.*

# 删除根目录的测试文件
echo "🗑️  删除根目录测试文件..."
rm -f test-ai-agent.sh
rm -f test-novel.md

# 删除空的脚本文件
echo "🗑️  删除空脚本文件..."
rm -f dev.sh
rm -f smart-start.sh

echo
echo "✅ 清理完成！"
echo
echo "📊 执行文件同步到远程仓库..."

# 添加所有更改
git add -A

# 提交删除
git commit -m "清理临时文件、测试文件和调试文件

- 删除前端所有测试HTML文件
- 删除调试和演示文件
- 删除后端临时服务器文件
- 删除编译生成的临时文件
- 删除空的脚本文件
- 保留核心功能文件"

# 推送到远程仓库
echo "🚀 推送到远程仓库..."
git push origin main

echo
echo "✅ 文件同步完成！远程仓库已更新"
