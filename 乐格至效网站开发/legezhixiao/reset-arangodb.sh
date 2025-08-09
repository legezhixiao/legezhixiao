#!/bin/bash

echo "重新安装和配置 ArangoDB..."

# 停止服务
sudo service arangodb3 stop 2>/dev/null || true

# 删除现有数据（重新开始）
sudo rm -rf /var/lib/arangodb3/* 2>/dev/null || true

# 重新启动服务
sudo service arangodb3 start

# 等待服务启动
sleep 5

# 使用默认设置创建数据库
echo "正在设置数据库..."

# 创建 legezhixiao 数据库
arangosh --server.endpoint tcp://127.0.0.1:8529 --javascript.execute-string "
try {
  db._useDatabase('_system');
  db._createDatabase('legezhixiao');
  print('数据库 legezhixiao 创建成功');
} catch (e) {
  print('数据库可能已存在:', e.message);
}
"

echo "ArangoDB 重新配置完成"
