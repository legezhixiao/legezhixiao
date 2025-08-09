#!/bin/bash
# 启动ArangoDB
sudo service arangodb3 start
sleep 2
echo "ArangoDB状态:"
sudo service arangodb3 status
echo "端口检查:"
lsof -i:8529
