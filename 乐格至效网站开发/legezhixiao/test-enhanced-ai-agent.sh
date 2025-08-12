#!/bin/bash

echo "=== 测试增强的AI Agent功能 ==="

# 设置变量
BASE_URL="http://localhost:3000"
PROJECT_ID="test-project-$(date +%s)"

echo "使用项目ID: $PROJECT_ID"

# 测试1: 知识图谱分析
echo "
==== 测试1: 知识图谱分析 ===="
curl -X POST "$BASE_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"请分析这段内容并创建知识图谱：李明是一位年轻的侦探，他住在北京的一间小公寓里。他的朋友张华是一名医生，经常帮助他处理案件中的医学问题。最近，他们一起调查一起神秘的失踪案。\",
    \"projectId\": \"$PROJECT_ID\",
    \"useTools\": true
  }" | jq '.'

echo "
==== 测试2: 角色分析 ===="
curl -X POST "$BASE_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"请分析李明这个角色的特点和发展建议\",
    \"projectId\": \"$PROJECT_ID\",
    \"useTools\": true
  }" | jq '.'

echo "
==== 测试3: 情节规划 ===="
curl -X POST "$BASE_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"请帮我规划这个侦探故事的高潮部分\",
    \"projectId\": \"$PROJECT_ID\",
    \"useTools\": true
  }" | jq '.'

echo "
==== 测试4: 关系分析 ===="
curl -X POST "$BASE_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"请分析故事中的人物关系网络\",
    \"projectId\": \"$PROJECT_ID\",
    \"useTools\": true
  }" | jq '.'

echo "
==== 测试5: 查询知识图谱 ===="
curl -X POST "$BASE_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"显示当前项目的知识图谱\",
    \"projectId\": \"$PROJECT_ID\",
    \"useTools\": true
  }" | jq '.'

echo "
=== 测试完成 ==="
