# 创建后端开发配置脚本
$backendDevScript = @"
#!/bin/bash
echo 'Starting backend development server...'
npx nodemon --exec ts-node src/server.ts
"@

# 创建前端开发配置脚本
$frontendDevScript = @"
#!/bin/bash
echo 'Starting frontend development server...'
npm start
"@

Write-Host "开始配置本地开发环境..." -ForegroundColor Green

# 检查Node.js安装
try {
    $nodeVersion = node -v
    Write-Host "检测到Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "未检测到Node.js，请先安装Node.js 18 LTS版本" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi" -ForegroundColor Yellow
    exit 1
}

# 检查开发工具
Write-Host "安装必要的开发工具..." -ForegroundColor Green
npm install -g nodemon typescript ts-node npm-check-updates

# 创建开发环境配置
$envContent = @"
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
ARANGO_URL=http://localhost:8529
ARANGO_DATABASE=legezhixiao
ARANGO_USERNAME=root
ARANGO_PASSWORD=development
"@

# 创建后端开发环境配置
Set-Content -Path ".\backend\.env.development" -Value $envContent
Write-Host "已创建后端开发环境配置文件" -ForegroundColor Green

# 创建前端开发环境配置
$frontendEnvContent = @"
REACT_APP_API_URL=http://localhost:4000
REACT_APP_ENV=development
"@
Set-Content -Path ".\frontend\.env.development" -Value $frontendEnvContent
Write-Host "已创建前端开发环境配置文件" -ForegroundColor Green

# 安装项目依赖
Write-Host "安装后端依赖..." -ForegroundColor Green
Set-Location .\backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "后端依赖安装失败" -ForegroundColor Red
    exit 1
}

Write-Host "安装前端依赖..." -ForegroundColor Green
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "前端依赖安装失败" -ForegroundColor Red
    exit 1
}

Set-Location ..

# 创建开发启动脚本
$startDevContent = @"
Write-Host "启动开发环境..." -ForegroundColor Green

# 启动后端服务
Start-Process -NoNewWindow powershell -ArgumentList "-Command `"Set-Location ./backend; npm run dev`""

# 启动前端服务
Start-Process -NoNewWindow powershell -ArgumentList "-Command `"Set-Location ./frontend; npm start`""

Write-Host "开发环境已启动！" -ForegroundColor Green
Write-Host "前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "后端地址: http://localhost:4000" -ForegroundColor Cyan
Write-Host "数据库地址: http://localhost:8529" -ForegroundColor Cyan
"@
Set-Content -Path ".\start-dev.ps1" -Value $startDevContent
Write-Host "已创建开发环境启动脚本" -ForegroundColor Green

# 安装VS Code推荐扩展
Write-Host "安装推荐的VS Code扩展..." -ForegroundColor Green
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension christian-kohler.npm-intellisense
code --install-extension formulahendry.auto-rename-tag
code --install-extension eg2.vscode-npm-script

# 创建VS Code工作区配置
$vsCodeSettings = @"
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "typescript.tsdk": "node_modules/typescript/lib",
    "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact"
    ],
    "files.associations": {
        "*.css": "css",
        "*.scss": "scss",
        "*.json": "json"
    }
}
"@

if (!(Test-Path ".\.vscode")) {
    New-Item -ItemType Directory -Path ".\.vscode"
}
Set-Content -Path ".\.vscode\settings.json" -Value $vsCodeSettings
Write-Host "已创建VS Code工作区配置" -ForegroundColor Green

Write-Host "`n开发环境配置完成！" -ForegroundColor Green
Write-Host "`n使用说明：" -ForegroundColor Yellow
Write-Host "1. 运行 .\start-dev.ps1 启动开发环境" -ForegroundColor White
Write-Host "2. 前端代码在 frontend 目录下" -ForegroundColor White
Write-Host "3. 后端代码在 backend 目录下" -ForegroundColor White
Write-Host "4. 代码修改后会自动重新加载" -ForegroundColor White
Write-Host "5. 使用 VS Code 打开项目以获得最佳开发体验" -ForegroundColor White
