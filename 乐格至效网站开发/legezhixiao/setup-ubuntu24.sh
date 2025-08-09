#!/bin/bash

echo "开始配置Ubuntu 24运营环境..."

# 更新系统
echo "正在更新系统..."
sudo apt update
sudo apt upgrade -y

# 安装必要的依赖
echo "安装基础依赖..."
sudo apt install -y curl wget git build-essential

# 安装Node.js 18 LTS
echo "安装Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装PM2 (必要依赖)
echo "安装PM2..."
sudo npm install -g pm2

# 安装ArangoDB
echo "安装ArangoDB..."
curl -OL https://download.arangodb.com/arangodb311/DEBIAN/Release.key
sudo apt-key add Release.key
echo 'deb https://download.arangodb.com/arangodb311/DEBIAN/ /' | sudo tee /etc/apt/sources.list.d/arangodb.list
sudo apt update
sudo apt install -y arangodb3

# 设置防火墙规则
echo "配置防火墙规则..."
sudo apt install -y ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 8529/tcp  # ArangoDB
sudo ufw allow 3000/tcp  # 前端
sudo ufw allow 4000/tcp  # 后端

# 创建必要的目录
echo "创建项目目录..."
mkdir -p ~/legezhixiao/uploads/novels

# 安装项目依赖
echo "安装项目依赖..."
cd ~/legezhixiao

# 安装后端依赖
echo "安装后端依赖..."
cd backend
npm install
npm run build  # 构建后端

# 安装前端依赖
echo "安装前端依赖..."
cd ../frontend
npm install
npm run build  # 构建前端

cd ..

# 配置环境变量
echo "配置环境变量..."
echo 'export NODE_ENV="production"' >> ~/.bashrc
source ~/.bashrc

echo "环境配置完成！"
echo "请记得："
echo "1. 检查 ArangoDB 配置文件"
echo "2. 设置数据库密码"
echo "3. 启用防火墙：sudo ufw enable"
echo "4. 使用 PM2 启动服务"
