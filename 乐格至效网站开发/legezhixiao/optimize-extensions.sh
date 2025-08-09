#!/bin/bash

# VS Code 扩展清理脚本
echo "=== VS Code 扩展优化脚本 ==="
echo

echo "🔍 当前已安装的扩展："
code --list-extensions --show-versions

echo
echo "⚠️  建议卸载的扩展（可能导致冲突）："
echo "  1. csholmq.excel-to-markdown-table (Excel to Markdown Table)"
echo "  2. ms-toolsai.jupyter-keymap (Jupyter Keymap)" 
echo "  3. ms-vscode.vscode-typescript-next (TypeScript Next)"
echo "  4. cweijan.vscode-excel (VS Code Excel)"

echo
echo "📋 手动卸载方法："
echo "  1. 打开 VS Code"
echo "  2. 按 Ctrl+Shift+X 打开扩展面板"
echo "  3. 搜索上述扩展名称"
echo "  4. 点击扩展右侧的 '卸载' 按钮"

echo
echo "✅ 推荐保留的核心扩展："
echo "  - GitHub Copilot 套件 (github.copilot, github.copilot-chat)"
echo "  - Python 开发套件 (ms-python.python, ms-python.vscode-pylance)"
echo "  - 前端开发工具 (esbenp.prettier-vscode, bradlc.vscode-tailwindcss)"
echo "  - Vue 支持 (vue.volar)"
echo "  - 路径智能提示 (christian-kohler.path-intellisense)"

echo
echo "🚀 优化后预期效果："
echo "  - VS Code 启动速度提升"
echo "  - 减少扩展冲突"
echo "  - 降低内存占用"
echo "  - 提高整体性能"

echo
echo "💡 提示：配置文件已更新，重启 VS Code 后生效"
