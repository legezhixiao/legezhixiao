#!/bin/bash

echo "🛑 停止乐格至效开发环境"

# 停止PM2服务
stop_pm2_services() {
    echo "🛑 停止PM2服务..."
    pm2 delete all 2>/dev/null || true
    echo "✅ PM2服务已停止"
}

# 停止ArangoDB（可选）
stop_arangodb() {
    if [ "$1" = "--with-db" ]; then
        echo "🛑 停止ArangoDB..."
        if [ "$EUID" -ne 0 ]; then
            echo "❌ 需要root权限停止ArangoDB，请使用: sudo $0 --with-db"
            return 1
        else
            systemctl stop arangodb3
            echo "✅ ArangoDB已停止"
        fi
    else
        echo "💡 ArangoDB保持运行，如需停止请使用: sudo $0 --with-db"
    fi
}

# 显示帮助
show_help() {
    echo "用法:"
    echo "  $0                - 停止PM2服务，保持ArangoDB运行"
    echo "  $0 --with-db      - 停止所有服务包括ArangoDB（需要sudo）"
    echo "  $0 --help         - 显示此帮助信息"
}

# 主执行流程
main() {
    case "$1" in
        --help)
            show_help
            ;;
        --with-db)
            stop_pm2_services
            stop_arangodb --with-db
            ;;
        "")
            stop_pm2_services
            stop_arangodb
            ;;
        *)
            echo "❌ 未知参数: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo "✅ 停止完成"
}

# 运行主函数
main "$@"
