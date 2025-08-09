#!/bin/bash

echo "=== 精确清理临时文件脚本 ==="
echo

# 只删除确认的临时文件
echo "🗑️  删除临时服务器文件..."
rm -f backend/simple-server.js
rm -f backend/simple-start.js  
rm -f backend/test-server.js
rm -f backend/src/temp-server.ts

echo "🗑️  删除测试路由文件..."
rm -f backend/src/routes/upload-test.ts

echo "🗑️  删除前端临时测试文件..."
rm -f frontend/ai-agent-test.html
rm -f frontend/ai-agent-direct-test.html
rm -f frontend/api-test.html
rm -f frontend/js-test.html
rm -f frontend/network-test.html
rm -f frontend/simple-test.html
rm -f frontend/public/api-test.html
rm -f frontend/public/debug.html

echo "🗑️  删除前端测试组件..."
rm -f frontend/src/App_test.tsx
rm -f frontend/src/TestApp.tsx
rm -f frontend/src/TestComponent.tsx
rm -f frontend/src/MinimalApp.tsx
rm -f frontend/src/SimpleApp.tsx

echo "🗑️  删除后端编译的临时文件..."
rm -f backend/dist/temp-server.*
rm -f backend/dist/controllers/projectController.simple.*
rm -f backend/dist/models/index_simple.*

echo "✅ 保留所有功能文件和新版控制器"
echo "✅ 保留中间件系统"
echo "✅ 保留服务层和工具模块"
echo "✅ 保留配置文件"

echo
echo "📋 清理完成！已删除的文件："
echo "  后端临时文件："
echo "    - backend/simple-server.js"
echo "    - backend/simple-start.js"
echo "    - backend/test-server.js"
echo "    - backend/src/temp-server.ts"
echo "    - backend/src/routes/upload-test.ts"
echo "  前端测试文件："
echo "    - frontend/ai-agent-test.html"
echo "    - frontend/ai-agent-direct-test.html"
echo "    - frontend/api-test.html"
echo "    - frontend/js-test.html"
echo "    - frontend/network-test.html"
echo "    - frontend/simple-test.html"
echo "    - frontend/public/api-test.html
    - frontend/public/debug.html"
echo "  前端测试组件："
echo "    - frontend/src/App_test.tsx"
echo "    - frontend/src/TestApp.tsx"
echo "    - frontend/src/TestComponent.tsx"
echo "    - frontend/src/MinimalApp.tsx"
echo "    - frontend/src/SimpleApp.tsx"
echo "  编译临时文件："
echo "    - backend/dist/temp-server.*"
echo "    - backend/dist/controllers/projectController.simple.*"
echo "    - backend/dist/models/index_simple.*"

echo
echo "💾 保留的重要功能文件："
echo "  后端核心："
echo "    - 所有 .new.ts 控制器文件"
echo "    - 中间件系统 (auth, logger, upload)"
echo "    - 服务层 (fileParsingService, novelCreationService)"
echo "    - 工具模块 (errorLogger, moduleLogger)"
echo "    - 配置和脚本文件"
echo "  前端核心："
echo "    - frontend/src/App.tsx (主应用)"
echo "    - frontend/src/ProgressiveApp.tsx (渐进式应用)"
echo "    - frontend/index.html (主页面)"
echo "    - 所有服务层文件 (services/)"
echo "    - 组件、样式、工具模块"

echo
echo "🔄 建议下一步操作："
echo "  1. git add . (添加需要的文件)"
echo "  2. git commit -m '添加新功能模块'"
echo "  3. git push (推送到远程仓库)"
