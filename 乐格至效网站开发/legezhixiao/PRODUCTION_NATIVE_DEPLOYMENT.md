# 乐格至效平台 - 生产环境原生部署指南

## 📋 概述

本指南提供完整的生产环境原生部署方案，基于 **RXDB + ArangoDB** 现代化数据库架构，确保高性能、高可用性的部署配置。

### 架构概览
- **前端**: React 18 + TypeScript + RXDB (离线优先)
- **后端**: Node.js + TypeScript + ArangoDB 多模态数据库
- **同步**: 双向实时数据同步，支持离线编辑
- **部署**: 原生安装，无容器化依赖

## 🚀 系统要求

### 硬件配置
- **CPU**: 4核心或以上
- **内存**: 8GB RAM (推荐16GB)
- **存储**: 100GB SSD (推荐NVMe)
- **网络**: 稳定的互联网连接

### 操作系统支持
- Ubuntu 20.04 LTS / 22.04 LTS (推荐)
- CentOS 8 / Rocky Linux 8
- Debian 11/12
- macOS 12+ (开发环境)

### 软件依赖要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **ArangoDB**: >= 3.9.0
- **PM2**: >= 5.4.2 (必要依赖，进程管理)

## 📦 Step 1: 系统环境准备

### 1.1 更新系统
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget gnupg2 software-properties-common

# CentOS/Rocky Linux
sudo dnf update -y
sudo dnf install -y curl wget gnupg2
```

### 1.2 安装Node.js 18+
```bash
# 使用NodeSource安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version  # 应显示 v18.x.x
npm --version
```

### 1.3 安装PM2进程管理器（必要依赖）
```bash
sudo npm install -g pm2
pm2 startup  # 设置开机自启动
```

## 🗄️ Step 2: ArangoDB 原生安装

### 2.1 安装ArangoDB Server
```bash
# 添加ArangoDB官方仓库
curl -OL https://download.arangodb.com/arangodb310/DEBIAN/Release.key
sudo apt-key add - < Release.key

echo 'deb https://download.arangodb.com/arangodb310/DEBIAN/ /' | sudo tee /etc/apt/sources.list.d/arangodb.list

# 更新包列表并安装
sudo apt update
sudo apt install -y arangodb3
```

### 2.2 ArangoDB初始配置
```bash
# 启动ArangoDB服务
sudo systemctl start arangodb3
sudo systemctl enable arangodb3

# 检查服务状态
sudo systemctl status arangodb3

# 设置root密码（首次运行时）
sudo arangodb-arango-admin-password
```

### 2.3 生产环境配置
创建生产配置文件：
```bash
sudo nano /etc/arangodb3/arangod.conf
```

配置内容：
```ini
[database]
directory = /var/lib/arangodb3

[server]
endpoint = tcp://0.0.0.0:8529
authentication = true
threads = 8

[log]
level = info
file = /var/log/arangodb3/arangod.log

[cache]
size = 2147483648

[rocksdb]
write-buffer-size = 134217728
max-write-buffer-number = 4
```

重启ArangoDB使配置生效：
```bash
sudo systemctl restart arangodb3
```

### 2.4 创建应用数据库
```bash
# 使用ArangoDB Shell创建数据库
arangosh --server.password [your-root-password]
```

在ArangoDB Shell中执行：
```javascript
// 创建应用数据库
db._createDatabase("legezhixiao");

// 切换到应用数据库
db._useDatabase("legezhixiao");

// 创建集合
db._create("users");
db._create("projects");  
db._create("chapters");
db._create("characters");
db._create("worldbuilding");
db._create("writing_sessions");
db._create("writing_goals");

// 创建边集合（图数据库关系）
db._createEdgeCollection("character_relationships");
db._createEdgeCollection("story_connections");
db._createEdgeCollection("world_relations");

// 创建索引
db.users.ensureIndex({ type: "hash", fields: ["email"] });
db.projects.ensureIndex({ type: "hash", fields: ["userId"] });
db.chapters.ensureIndex({ type: "hash", fields: ["projectId"] });
db.characters.ensureIndex({ type: "hash", fields: ["projectId"] });

quit;
```

## 🔧 Step 3: 应用部署

### 3.1 创建应用目录
```bash
sudo mkdir -p /opt/legezhixiao
sudo chown $USER:$USER /opt/legezhixiao
cd /opt/legezhixiao
```

### 3.2 克隆项目代码
```bash
# 假设从Git仓库部署
git clone [your-repository-url] .

# 或者上传代码包
# scp -r ./legezhixiao/ user@server:/opt/legezhixiao/
```

### 3.3 配置环境变量
创建生产环境配置：
```bash
cp .env.example .env.production
nano .env.production
```

配置内容：
```env
NODE_ENV=production
PORT=3001

# ArangoDB配置
ARANGODB_URL=http://localhost:8529
ARANGODB_DATABASE=legezhixiao
ARANGODB_USERNAME=root
ARANGODB_PASSWORD=[your-arangodb-password]

# JWT配置
JWT_SECRET=[your-jwt-secret-key]
JWT_EXPIRY=7d

# AI API配置
SILICONFLOW_API_KEY=[your-siliconflow-api-key]
SILICONFLOW_API_URL=https://api.siliconflow.cn

# 安全配置
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=[your-session-secret]

# 文件上传配置
UPLOAD_PATH=/opt/legezhixiao/uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_FILE=/opt/legezhixiao/logs/app.log
```

### 3.4 安装后端依赖
```bash
cd backend
npm ci --only=production
npm run build
```

### 3.5 创建系统用户
```bash
sudo useradd --system --shell /bin/false --home /opt/legezhixiao legezhixiao
sudo chown -R legezhixiao:legezhixiao /opt/legezhixiao
```

## 🚀 Step 4: 后端服务配置

### 4.1 PM2 Ecosystem配置
创建PM2配置文件：
```bash
nano /opt/legezhixiao/ecosystem.production.js
```

配置内容：
```javascript
module.exports = {
  apps: [{
    name: 'legezhixiao-backend',
    script: './backend/dist/server.js',
    cwd: '/opt/legezhixiao',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '.env.production',
    log_file: '/opt/legezhixiao/logs/pm2-combined.log',
    out_file: '/opt/legezhixiao/logs/pm2-out.log',
    error_file: '/opt/legezhixiao/logs/pm2-error.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true
  }]
};
```

### 4.2 启动后端服务
```bash
# 创建日志目录
mkdir -p /opt/legezhixiao/logs

# 使用PM2启动
cd /opt/legezhixiao
pm2 start ecosystem.production.js

# 保存PM2配置
pm2 save

# 设置开机自启动
pm2 startup
```

## 🌐 Step 5: 前端构建与部署

### 5.1 安装前端依赖并构建
```bash
cd /opt/legezhixiao/frontend
npm ci --only=production
npm run build
```

### 5.2 配置Nginx (推荐)
安装Nginx：
```bash
sudo apt install -y nginx
```

创建Nginx配置：
```bash
sudo nano /etc/nginx/sites-available/legezhixiao
```

配置内容：
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL配置 (使用Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # 前端静态文件
    root /opt/legezhixiao/frontend/dist;
    index index.html;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 文件上传配置
        client_max_body_size 50M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket支持 (用于RXDB同步)
    location /api/sync/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/legezhixiao /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5.3 SSL证书配置 (Let's Encrypt)
```bash
# 安装certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请SSL证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 2 * * * /usr/bin/certbot renew --quiet --renew-hook "systemctl reload nginx"
```

## 🔒 Step 6: 安全配置

### 6.1 防火墙配置
```bash
# 启用UFW防火墙
sudo ufw enable

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# ArangoDB端口仅允许本地访问
sudo ufw deny 8529/tcp

# 查看防火墙状态
sudo ufw status
```

### 6.2 创建备份脚本
```bash
sudo nano /opt/legezhixiao/scripts/backup.sh
```

备份脚本内容：
```bash
#!/bin/bash

# 配置
BACKUP_DIR="/opt/backups/legezhixiao"
DATE=$(date +%Y%m%d_%H%M%S)
ARANGODB_PASSWORD="[your-arangodb-password]"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份ArangoDB数据库
arangodump --server.password $ARANGODB_PASSWORD \
  --server.database legezhixiao \
  --output-directory "$BACKUP_DIR/arangodb_$DATE"

# 备份应用文件
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /opt/legezhixiao/uploads/
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" /opt/legezhixiao/logs/

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "arangodb_*" -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $DATE"
```

设置备份定时任务：
```bash
sudo chmod +x /opt/legezhixiao/scripts/backup.sh
sudo crontab -e
# 添加每日备份：
# 0 3 * * * /opt/legezhixiao/scripts/backup.sh >> /opt/legezhixiao/logs/backup.log 2>&1
```

## 📊 Step 7: 监控与日志

### 7.1 系统监控
```bash
# 安装htop和iotop
sudo apt install -y htop iotop

# PM2监控
pm2 monit

# 查看应用日志
pm2 logs legezhixiao-backend

# 查看ArangoDB日志
sudo tail -f /var/log/arangodb3/arangod.log
```

### 7.2 日志轮转配置
```bash
sudo nano /etc/logrotate.d/legezhixiao
```

配置内容：
```
/opt/legezhixiao/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 legezhixiao legezhixiao
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🚀 Step 8: 启动验证

### 8.1 检查服务状态
```bash
# 检查ArangoDB
sudo systemctl status arangodb3
curl http://localhost:8529/_api/version

# 检查PM2应用
pm2 status
pm2 logs legezhixiao-backend --lines 50

# 检查Nginx
sudo systemctl status nginx
sudo nginx -t

# 检查端口监听
sudo netstat -tlnp | grep -E ":(80|443|3001|8529)"
```

### 8.2 功能测试
```bash
# 测试API健康检查
curl http://localhost:3001/api/health

# 测试前端访问
curl -I https://yourdomain.com

# 测试数据库连接
curl -X GET http://localhost:3001/api/test/db \
  -H "Content-Type: application/json"
```

## 📝 运维命令手册

### 常用PM2命令
```bash
# 查看应用状态
pm2 status

# 重启应用
pm2 restart legezhixiao-backend

# 查看日志
pm2 logs legezhixiao-backend

# 监控应用
pm2 monit

# 停止应用
pm2 stop legezhixiao-backend

# 删除应用
pm2 delete legezhixiao-backend
```

### ArangoDB管理
```bash
# 重启ArangoDB
sudo systemctl restart arangodb3

# 查看数据库状态
arangosh --server.password [password] --javascript.execute-string "db._version()"

# 创建数据库备份
arangodump --server.password [password] --server.database legezhixiao --output-directory /tmp/backup

# 恢复数据库
arangorestore --server.password [password] --server.database legezhixiao --input-directory /tmp/backup
```

### 更新部署
```bash
# 拉取最新代码
cd /opt/legezhixiao
git pull origin main

# 更新后端
cd backend
npm ci --only=production
npm run build
pm2 restart legezhixiao-backend

# 更新前端
cd ../frontend  
npm ci --only=production
npm run build
```

## 🎯 性能优化建议

### 8.1 ArangoDB优化
- 调整缓存大小 (建议50%内存)
- 配置RocksDB写缓冲区
- 使用连接池
- 定期清理日志文件

### 8.2 应用优化
- 启用Gzip压缩
- 配置CDN加速
- 使用PM2集群模式
- 定期重启应用清理内存

### 8.3 系统优化
- 配置swap空间
- 调整文件描述符限制
- 使用SSD存储
- 定期系统更新

## 🆘 故障排除

### 常见问题
1. **ArangoDB连接失败**: 检查服务状态和防火墙配置
2. **PM2应用无法启动**: 检查端口占用和环境变量
3. **前端无法访问**: 检查Nginx配置和SSL证书
4. **数据同步异常**: 检查RXDB配置和网络连接

### 紧急恢复
```bash
# 快速重启所有服务
sudo systemctl restart arangodb3
pm2 restart all
sudo systemctl restart nginx

# 查看系统资源
htop
df -h
free -h
```

---

## 📞 技术支持

部署完成后，应用将在以下地址可用：
- **前端应用**: https://yourdomain.com
- **API接口**: https://yourdomain.com/api
- **健康检查**: https://yourdomain.com/api/health

定期检查备份、监控日志，确保系统稳定运行。如有问题，参考故障排除部分或查看相关日志文件。
