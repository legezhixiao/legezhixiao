#!/bin/bash

# 乐格至效平台 - 快速部署脚本
# RXDB + ArangoDB 现代化数据库架构 - 原生生产环境部署

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "乐格至效平台 - 快速部署脚本"
echo "RXDB + ArangoDB 原生生产环境部署"
echo "======================================"

# 配置变量
PROJECT_NAME="legezhixiao"
PROJECT_PATH="/opt/${PROJECT_NAME}"
DOMAIN_NAME=""
ARANGODB_PASSWORD=""
JWT_SECRET=""
SILICONFLOW_API_KEY=""

# 获取用户输入
get_user_input() {
    echo ""
    echo "🔧 配置信息收集"
    echo "=================="
    
    read -p "请输入域名 (如: example.com): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        echo -e "${RED}错误: 域名不能为空${NC}"
        exit 1
    fi
    
    read -s -p "请输入ArangoDB root密码: " ARANGODB_PASSWORD
    echo ""
    if [ -z "$ARANGODB_PASSWORD" ]; then
        echo -e "${RED}错误: ArangoDB密码不能为空${NC}"
        exit 1
    fi
    
    read -s -p "请输入JWT密钥 (32位随机字符串): " JWT_SECRET
    echo ""
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -hex 32)
        echo -e "${YELLOW}自动生成JWT密钥: ${JWT_SECRET}${NC}"
    fi
    
    read -p "请输入SiliconFlow API密钥: " SILICONFLOW_API_KEY
    if [ -z "$SILICONFLOW_API_KEY" ]; then
        echo -e "${YELLOW}警告: 未设置AI API密钥，AI功能将不可用${NC}"
    fi
}

# 检查root权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}错误: 请使用sudo运行此脚本${NC}"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        OS=$DISTRIB_ID
        VER=$DISTRIB_RELEASE
    elif [ -f /etc/debian_version ]; then
        OS=Debian
        VER=$(cat /etc/debian_version)
    elif [ -f /etc/redhat-release ]; then
        OS=CentOS
        VER=$(grep -oE '[0-9]+\.[0-9]+' /etc/redhat-release)
    else
        echo -e "${RED}错误: 不支持的操作系统${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}检测到操作系统: $OS $VER${NC}"
}

# 更新系统
update_system() {
    echo ""
    echo "📦 更新系统包"
    echo "=================="
    
    case $OS in
        Ubuntu|Debian)
            apt update && apt upgrade -y
            apt install -y curl wget gnupg2 software-properties-common build-essential
            ;;
        CentOS)
            dnf update -y
            dnf install -y curl wget gnupg2 gcc gcc-c++ make
            ;;
    esac
    
    echo -e "${GREEN}✓ 系统更新完成${NC}"
}

# 安装Node.js
install_nodejs() {
    echo ""
    echo "🟢 安装Node.js 18"
    echo "=================="
    
    if command -v node &> /dev/null && node --version | grep -q "v18"; then
        echo -e "${GREEN}✓ Node.js 18 已安装${NC}"
        return
    fi
    
    case $OS in
        Ubuntu|Debian)
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt install -y nodejs
            ;;
        CentOS)
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            dnf install -y nodejs
            ;;
    esac
    
    # 安装PM2
    npm install -g pm2
    pm2 startup
    
    echo -e "${GREEN}✓ Node.js和PM2安装完成${NC}"
}

# 安装ArangoDB
install_arangodb() {
    echo ""
    echo "🗄️ 安装ArangoDB"
    echo "=================="
    
    if command -v arangod &> /dev/null; then
        echo -e "${GREEN}✓ ArangoDB 已安装${NC}"
        return
    fi
    
    case $OS in
        Ubuntu|Debian)
            curl -OL https://download.arangodb.com/arangodb310/DEBIAN/Release.key
            apt-key add - < Release.key
            echo 'deb https://download.arangodb.com/arangodb310/DEBIAN/ /' > /etc/apt/sources.list.d/arangodb.list
            apt update
            apt install -y arangodb3
            ;;
        CentOS)
            curl -OL https://download.arangodb.com/arangodb310/RPM/arangodb.repo
            cp arangodb.repo /etc/yum.repos.d/
            dnf install -y arangodb3
            ;;
    esac
    
    # 配置ArangoDB
    systemctl start arangodb3
    systemctl enable arangodb3
    
    # 设置密码
    echo "$ARANGODB_PASSWORD" | arangodb-arango-admin-password
    
    echo -e "${GREEN}✓ ArangoDB安装和配置完成${NC}"
}

# 安装Nginx
install_nginx() {
    echo ""
    echo "🌐 安装Nginx"
    echo "=================="
    
    if command -v nginx &> /dev/null; then
        echo -e "${GREEN}✓ Nginx 已安装${NC}"
        return
    fi
    
    case $OS in
        Ubuntu|Debian)
            apt install -y nginx
            ;;
        CentOS)
            dnf install -y nginx
            ;;
    esac
    
    systemctl start nginx
    systemctl enable nginx
    
    echo -e "${GREEN}✓ Nginx安装完成${NC}"
}

# 创建项目目录和用户
setup_project() {
    echo ""
    echo "📁 设置项目环境"
    echo "=================="
    
    # 创建项目用户
    if ! id "$PROJECT_NAME" &>/dev/null; then
        useradd --system --shell /bin/false --home $PROJECT_PATH $PROJECT_NAME
        echo -e "${GREEN}✓ 创建项目用户${NC}"
    fi
    
    # 创建项目目录
    mkdir -p $PROJECT_PATH/{backend,frontend,logs,uploads,scripts}
    chown -R $PROJECT_NAME:$PROJECT_NAME $PROJECT_PATH
    
    echo -e "${GREEN}✓ 项目目录创建完成${NC}"
}

# 创建环境配置文件
create_env_config() {
    echo ""
    echo "⚙️ 创建环境配置"
    echo "=================="
    
    cat > $PROJECT_PATH/.env.production << EOF
NODE_ENV=production
PORT=3001

# ArangoDB配置
ARANGODB_URL=http://localhost:8529
ARANGODB_DATABASE=legezhixiao
ARANGODB_USERNAME=root
ARANGODB_PASSWORD=$ARANGODB_PASSWORD

# JWT配置
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=7d

# AI API配置
SILICONFLOW_API_KEY=$SILICONFLOW_API_KEY
SILICONFLOW_API_URL=https://api.siliconflow.cn

# 安全配置
CORS_ORIGIN=https://$DOMAIN_NAME
SESSION_SECRET=$(openssl rand -hex 32)

# 文件上传配置
UPLOAD_PATH=$PROJECT_PATH/uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_FILE=$PROJECT_PATH/logs/app.log
EOF
    
    chown $PROJECT_NAME:$PROJECT_NAME $PROJECT_PATH/.env.production
    chmod 600 $PROJECT_PATH/.env.production
    
    echo -e "${GREEN}✓ 环境配置文件创建完成${NC}"
}

# 创建PM2配置
create_pm2_config() {
    echo ""
    echo "🔄 创建PM2配置"
    echo "=================="
    
    cat > $PROJECT_PATH/ecosystem.production.js << 'EOF'
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
EOF
    
    chown $PROJECT_NAME:$PROJECT_NAME $PROJECT_PATH/ecosystem.production.js
    
    echo -e "${GREEN}✓ PM2配置文件创建完成${NC}"
}

# 配置Nginx
configure_nginx() {
    echo ""
    echo "🔧 配置Nginx"
    echo "=================="
    
    cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # 重定向到HTTPS (SSL配置后启用)
    # return 301 https://\$server_name\$request_uri;
    
    # 临时HTTP配置 (SSL配置前使用)
    location / {
        root $PROJECT_PATH/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    systemctl reload nginx
    
    echo -e "${GREEN}✓ Nginx配置完成${NC}"
}

# 配置ArangoDB数据库
setup_database() {
    echo ""
    echo "🗃️ 配置数据库"
    echo "=================="
    
    # 创建数据库初始化脚本
    cat > /tmp/init_database.js << 'EOF'
try {
    // 创建数据库
    db._createDatabase("legezhixiao");
    print("✓ 数据库 'legezhixiao' 创建成功");
    
    // 切换到新数据库
    db._useDatabase("legezhixiao");
    
    // 创建文档集合
    var collections = ["users", "projects", "chapters", "characters", "worldbuilding", "writing_sessions", "writing_goals"];
    collections.forEach(function(col) {
        db._create(col);
        print("✓ 集合 '" + col + "' 创建成功");
    });
    
    // 创建边集合
    var edgeCollections = ["character_relationships", "story_connections", "world_relations"];
    edgeCollections.forEach(function(col) {
        db._createEdgeCollection(col);
        print("✓ 边集合 '" + col + "' 创建成功");
    });
    
    // 创建索引
    db.users.ensureIndex({ type: "hash", fields: ["email"] });
    db.projects.ensureIndex({ type: "hash", fields: ["userId"] });
    db.chapters.ensureIndex({ type: "hash", fields: ["projectId"] });
    db.characters.ensureIndex({ type: "hash", fields: ["projectId"] });
    print("✓ 索引创建成功");
    
} catch (e) {
    print("错误: " + e.message);
}
EOF
    
    # 执行初始化脚本
    arangosh --server.password "$ARANGODB_PASSWORD" --javascript.execute /tmp/init_database.js
    rm -f /tmp/init_database.js
    
    echo -e "${GREEN}✓ 数据库初始化完成${NC}"
}

# 配置防火墙
configure_firewall() {
    echo ""
    echo "🔒 配置防火墙"
    echo "=================="
    
    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw deny 8529/tcp  # ArangoDB仅本地访问
        ufw deny 3001/tcp  # Backend仅本地访问
        echo -e "${GREEN}✓ UFW防火墙配置完成${NC}"
    elif command -v firewall-cmd &> /dev/null; then
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        echo -e "${GREEN}✓ FirewallD配置完成${NC}"
    else
        echo -e "${YELLOW}⚠ 未检测到防火墙，请手动配置${NC}"
    fi
}

# 创建部署脚本
create_deploy_script() {
    echo ""
    echo "🚀 创建部署脚本"
    echo "=================="
    
    cat > $PROJECT_PATH/scripts/deploy.sh << 'EOF'
#!/bin/bash

# 项目部署脚本
PROJECT_PATH="/opt/legezhixiao"
cd $PROJECT_PATH

echo "开始部署..."

# 拉取最新代码
if [ -d ".git" ]; then
    git pull origin main
else
    echo "警告: 非Git仓库，请手动上传代码"
fi

# 安装后端依赖
if [ -f "backend/package.json" ]; then
    cd backend
    npm ci --only=production
    npm run build
    cd ..
fi

# 构建前端
if [ -f "frontend/package.json" ]; then
    cd frontend
    npm ci --only=production
    npm run build
    cd ..
fi

# 重启PM2应用
pm2 restart ecosystem.production.js

echo "部署完成!"
EOF
    
    chmod +x $PROJECT_PATH/scripts/deploy.sh
    chown $PROJECT_NAME:$PROJECT_NAME $PROJECT_PATH/scripts/deploy.sh
    
    echo -e "${GREEN}✓ 部署脚本创建完成${NC}"
}

# 创建备份脚本
create_backup_script() {
    echo ""
    echo "💾 创建备份脚本"
    echo "=================="
    
    cat > $PROJECT_PATH/scripts/backup.sh << EOF
#!/bin/bash

BACKUP_DIR="/opt/backups/legezhixiao"
DATE=\$(date +%Y%m%d_%H%M%S)
ARANGODB_PASSWORD="$ARANGODB_PASSWORD"

mkdir -p \$BACKUP_DIR

# 备份数据库
arangodump --server.password \$ARANGODB_PASSWORD \\
  --server.database legezhixiao \\
  --output-directory "\$BACKUP_DIR/arangodb_\$DATE"

# 备份文件
tar -czf "\$BACKUP_DIR/uploads_\$DATE.tar.gz" $PROJECT_PATH/uploads/
tar -czf "\$BACKUP_DIR/logs_\$DATE.tar.gz" $PROJECT_PATH/logs/

# 清理旧备份
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find \$BACKUP_DIR -name "arangodb_*" -mtime +7 -exec rm -rf {} \\;

echo "备份完成: \$DATE"
EOF
    
    chmod +x $PROJECT_PATH/scripts/backup.sh
    chown $PROJECT_NAME:$PROJECT_NAME $PROJECT_PATH/scripts/backup.sh
    
    # 添加定时任务
    echo "0 3 * * * $PROJECT_PATH/scripts/backup.sh >> $PROJECT_PATH/logs/backup.log 2>&1" | crontab -
    
    echo -e "${GREEN}✓ 备份脚本和定时任务创建完成${NC}"
}

# SSL证书配置提示
ssl_setup_guide() {
    echo ""
    echo "🔐 SSL证书配置指南"
    echo "=================="
    
    echo "1. 安装Certbot:"
    case $OS in
        Ubuntu|Debian)
            echo "   apt install -y certbot python3-certbot-nginx"
            ;;
        CentOS)
            echo "   dnf install -y certbot python3-certbot-nginx"
            ;;
    esac
    
    echo ""
    echo "2. 申请SSL证书:"
    echo "   certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
    echo ""
    echo "3. 设置自动续期:"
    echo "   echo '0 2 * * * /usr/bin/certbot renew --quiet --renew-hook \"systemctl reload nginx\"' | crontab -"
    echo ""
    echo -e "${YELLOW}注意: 申请SSL证书前，请确保域名已正确解析到此服务器${NC}"
}

# 部署完成提示
deployment_complete() {
    echo ""
    echo "======================================"
    echo "🎉 部署完成!"
    echo "======================================"
    
    echo -e "${GREEN}✓ 系统环境配置完成${NC}"
    echo -e "${GREEN}✓ 数据库安装配置完成${NC}"
    echo -e "${GREEN}✓ Web服务器配置完成${NC}"
    echo -e "${GREEN}✓ 项目环境准备完成${NC}"
    
    echo ""
    echo "📝 接下来的步骤:"
    echo "1. 上传项目代码到 $PROJECT_PATH"
    echo "2. 运行部署脚本: $PROJECT_PATH/scripts/deploy.sh"
    echo "3. 配置SSL证书 (参考上方指南)"
    echo "4. 运行环境检查: $PROJECT_PATH/check-production-environment.sh"
    
    echo ""
    echo "🔗 访问地址:"
    echo "- HTTP: http://$DOMAIN_NAME"
    echo "- API: http://$DOMAIN_NAME/api"
    echo "- 健康检查: http://$DOMAIN_NAME/api/health"
    
    echo ""
    echo "📊 管理命令:"
    echo "- 查看应用状态: pm2 status"
    echo "- 查看日志: pm2 logs"
    echo "- 重启应用: pm2 restart all"
    echo "- 备份数据: $PROJECT_PATH/scripts/backup.sh"
    
    echo ""
    echo -e "${BLUE}详细文档请参考:${NC}"
    echo "- PRODUCTION_NATIVE_DEPLOYMENT.md"
    echo "- PROJECT_SPECIFICATION_FINAL.md"
}

# 主函数
main() {
    check_root
    get_user_input
    detect_os
    update_system
    install_nodejs
    install_arangodb
    install_nginx
    setup_project
    create_env_config
    create_pm2_config
    configure_nginx
    setup_database
    configure_firewall
    create_deploy_script
    create_backup_script
    ssl_setup_guide
    deployment_complete
}

# 错误处理
trap 'echo -e "${RED}部署过程中发生错误，请检查上方日志${NC}"; exit 1' ERR

# 运行主函数
main "$@"
