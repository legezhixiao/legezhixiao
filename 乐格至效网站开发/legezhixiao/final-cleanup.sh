#!/bin/bash

echo "=== 最终清理脚本 ==="
echo

# 删除剩余的测试组件
echo "🗑️  删除剩余测试组件..."
rm -f frontend/src/components/AITestPanel.tsx
rm -f frontend/src/components/AI/TempFloatingAIWindow.tsx

# 检查并删除WritingTemplate相关文件（如果是临时的）
echo "🗑️  检查WritingTemplate文件..."
if [ -f "backend/src/models/WritingTemplate.ts" ]; then
    echo "⚠️  发现WritingTemplate文件，请确认是否需要保留"
    # 这个文件可能是功能文件，先不删除
fi

echo "✅ 最终清理完成！"

# 提交更改
git add -A
git commit -m "最终清理：删除剩余测试组件

- 删除AITestPanel.tsx
- 删除TempFloatingAIWindow.tsx
- 保留WritingTemplate.ts（待确认）"

git push origin main

echo "✅ 同步完成！"

echo
echo "📊 清理后统计："
echo "前端文件数量："
ls -la frontend/ | wc -l
echo "总文件数量（排除node_modules和.git）："
find . -type f | grep -v node_modules | grep -v ".git" | wc -l
