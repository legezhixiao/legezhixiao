#!/bin/bash

# 乐格至效平台 - 生产环境配置检查脚本
# 用于验证RXDB + ArangoDB架构的部署环境

echo "======================================"
echo "乐格至效平台 - 生产环境配置检查"
echo "RXDB + ArangoDB 现代化数据库架构"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查结果统计
CHECKS_PASSED=0
CHECKS_FAILED=0
TOTAL_CHECKS=0

# 检查函数
check_command() {
    local cmd=$1
    local name=$2
    local required_version=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>/dev/null | head -n 1)
        echo -e "${GREEN}✓${NC} $name: $version"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        
        if [ ! -z "$required_version" ]; then
            echo -e "  ${BLUE}ℹ${NC} 要求版本: $required_version"
        fi
    else
        echo -e "${RED}✗${NC} $name: 未安装"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

# 检查服务状态
check_service() {
    local service=$1
    local name=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if systemctl is-active --quiet $service; then
        echo -e "${GREEN}✓${NC} $name: 运行中"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name: 未运行"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

# 检查端口占用
check_port() {
    local port=$1
    local name=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        local process=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f2)
        echo -e "${GREEN}✓${NC} 端口 $port ($name): 被 $process 占用"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} 端口 $port ($name): 未被占用"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

# 检查目录存在
check_directory() {
    local dir=$1
    local name=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $name: $dir 存在"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name: $dir 不存在"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

# 检查文件存在
check_file() {
    local file=$1
    local name=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $name: $file 存在"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name: $file 不存在"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

echo ""
echo "1. 系统环境检查"
echo "=================="

# 操作系统信息
echo -e "${BLUE}操作系统:${NC} $(lsb_release -d 2>/dev/null | cut -f2 || uname -s)"
echo -e "${BLUE}内核版本:${NC} $(uname -r)"
echo -e "${BLUE}CPU核心:${NC} $(nproc)"
echo -e "${BLUE}内存大小:${NC} $(free -h | grep '^Mem:' | awk '{print $2}')"
echo -e "${BLUE}磁盘空间:${NC} $(df -h / | tail -1 | awk '{print $4}') 可用"

echo ""
echo "2. 基础软件检查"
echo "=================="

check_command "node" "Node.js" "v18+"
check_command "npm" "NPM" 
check_command "pm2" "PM2进程管理器"
check_command "nginx" "Nginx" 
check_command "curl" "Curl"
check_command "git" "Git"

echo ""
echo "3. 数据库软件检查"
echo "=================="

check_command "arangod" "ArangoDB Server"
check_command "arangosh" "ArangoDB Shell"
check_command "arangodump" "ArangoDB Dump"
check_command "arangorestore" "ArangoDB Restore"

echo ""
echo "4. 服务状态检查"
echo "=================="

check_service "nginx" "Nginx服务"
check_service "arangodb3" "ArangoDB服务"

echo ""
echo "5. 端口占用检查"
echo "=================="

check_port "80" "HTTP"
check_port "443" "HTTPS" 
check_port "3001" "Backend API"
check_port "8529" "ArangoDB"

echo ""
echo "6. 项目目录检查"
echo "=================="

PROJECT_ROOT="/opt/legezhixiao"
check_directory "$PROJECT_ROOT" "项目根目录"
check_directory "$PROJECT_ROOT/frontend" "前端目录"
check_directory "$PROJECT_ROOT/backend" "后端目录"
check_directory "$PROJECT_ROOT/logs" "日志目录"
check_directory "$PROJECT_ROOT/uploads" "上传目录"

echo ""
echo "7. 配置文件检查"
echo "=================="

check_file "$PROJECT_ROOT/.env.production" "生产环境配置"
check_file "$PROJECT_ROOT/ecosystem.production.js" "PM2配置文件"
check_file "/etc/nginx/sites-enabled/legezhixiao" "Nginx站点配置"
check_file "/etc/arangodb3/arangod.conf" "ArangoDB配置"

echo ""
echo "8. Node.js依赖检查"
echo "=================="

if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
    echo -e "${BLUE}后端依赖检查:${NC}"
    cd "$PROJECT_ROOT/backend"
    
    # 检查关键依赖
    if npm list arangojs &>/dev/null; then
        echo -e "${GREEN}✓${NC} arangojs (ArangoDB驱动)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} arangojs (ArangoDB驱动)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if npm list express &>/dev/null; then
        echo -e "${GREEN}✓${NC} express (Web框架)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} express (Web框架)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if npm list socket.io &>/dev/null; then
        echo -e "${GREEN}✓${NC} socket.io (WebSocket)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} socket.io (WebSocket)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
    echo -e "${BLUE}前端依赖检查:${NC}"
    cd "$PROJECT_ROOT/frontend"
    
    # 检查关键依赖
    if npm list rxdb &>/dev/null; then
        echo -e "${GREEN}✓${NC} rxdb (响应式数据库)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} rxdb (响应式数据库)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if npm list rxjs &>/dev/null; then
        echo -e "${GREEN}✓${NC} rxjs (响应式编程)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} rxjs (响应式编程)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if npm list dexie &>/dev/null; then
        echo -e "${GREEN}✓${NC} dexie (IndexedDB适配器)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} dexie (IndexedDB适配器)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

echo ""
echo "9. 网络连接测试"
echo "=================="

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if curl -s http://localhost:3001/api/health &>/dev/null; then
    echo -e "${GREEN}✓${NC} 后端API健康检查"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} 后端API健康检查"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if curl -s http://localhost:8529/_api/version &>/dev/null; then
    echo -e "${GREEN}✓${NC} ArangoDB API连接"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} ArangoDB API连接"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""
echo "10. 数据库集合检查"
echo "=================="

# 使用arangosh检查数据库和集合
if command -v arangosh &> /dev/null; then
    # 创建临时脚本检查数据库
    cat > /tmp/check_db.js << 'EOF'
try {
    db._useDatabase("legezhixiao");
    
    var collections = ["users", "projects", "chapters", "characters", "worldbuilding", "writing_sessions", "writing_goals"];
    var edgeCollections = ["character_relationships", "story_connections", "world_relations"];
    
    print("=== 文档集合 ===");
    collections.forEach(function(col) {
        if (db._collection(col)) {
            print("✓ " + col + ": " + db._collection(col).count() + " 文档");
        } else {
            print("✗ " + col + ": 不存在");
        }
    });
    
    print("=== 边集合 ===");
    edgeCollections.forEach(function(col) {
        if (db._collection(col)) {
            print("✓ " + col + ": " + db._collection(col).count() + " 边");
        } else {
            print("✗ " + col + ": 不存在");
        }
    });
    
} catch (e) {
    print("✗ 数据库 'legezhixiao' 不存在或无法访问");
}
EOF

    # 执行检查
    arangosh --javascript.execute /tmp/check_db.js 2>/dev/null
    rm -f /tmp/check_db.js
else
    echo -e "${RED}✗${NC} 无法执行数据库集合检查 (arangosh 不可用)"
fi

echo ""
echo "11. 系统资源检查"
echo "=================="

# 内存使用率
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
echo -e "${BLUE}内存使用率:${NC} ${MEMORY_USAGE}%"

# 磁盘使用率
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo -e "${BLUE}磁盘使用率:${NC} ${DISK_USAGE}%"

# CPU负载
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
echo -e "${BLUE}系统负载:${NC} ${LOAD_AVG}"

# 检查资源警告
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo -e "${YELLOW}⚠${NC} 内存使用率较高 (${MEMORY_USAGE}%)"
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠${NC} 磁盘使用率较高 (${DISK_USAGE}%)"
fi

echo ""
echo "======================================"
echo "检查结果汇总"
echo "======================================"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过!${NC}"
    echo -e "✅ 通过: $CHECKS_PASSED/$TOTAL_CHECKS"
    echo -e "🚀 系统已准备好进行生产部署"
else
    echo -e "${RED}❌ 发现问题!${NC}"
    echo -e "✅ 通过: $CHECKS_PASSED/$TOTAL_CHECKS"
    echo -e "❌ 失败: $CHECKS_FAILED/$TOTAL_CHECKS"
    echo ""
    echo -e "${YELLOW}请解决以上标记为 ✗ 的问题后重新运行检查${NC}"
    echo ""
    echo "常见解决方案:"
    echo "- 安装缺失的软件包"
    echo "- 启动未运行的服务"
    echo "- 检查配置文件路径"
    echo "- 验证端口配置"
    echo "- 安装项目依赖包"
fi

echo ""
echo "详细部署指南请参考: PRODUCTION_NATIVE_DEPLOYMENT.md"
echo "项目规范文档请参考: PROJECT_SPECIFICATION_FINAL.md"
echo ""

# 退出码
if [ $CHECKS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
