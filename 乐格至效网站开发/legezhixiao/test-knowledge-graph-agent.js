#!/usr/bin/env node

/**
 * AI Agent 知识图谱构建功能演示脚本
 * 展示完整的知识图谱构建、查询和分析功能
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/ai/chat';

// 测试用例
const testCases = [
  {
    name: '知识图谱构建 - 创建角色',
    data: {
      message: '创建一个角色叫做李小明，他是一个勇敢的战士，擅长剑术',
      type: 'general',
      projectId: 'demo-project',
      enableKnowledgeGraph: true
    }
  },
  {
    name: '自动知识提取',
    data: {
      message: '从这段话自动提取知识：在青云城的酒馆里，剑客张无忌遇到了神秘女子小龙女，她警告他黑暗势力即将入侵',
      type: 'general',
      projectId: 'demo-project',
      enableKnowledgeGraph: true
    }
  },
  {
    name: '关系构建',
    data: {
      message: '建立张无忌和小龙女之间的师徒关系，还有青云城和黑暗势力的敌对关系',
      type: 'general',
      projectId: 'demo-project',
      enableKnowledgeGraph: true
    }
  },
  {
    name: '角色关系分析',
    data: {
      message: '分析现有的角色关系网络，找出主要的关系模式',
      type: 'general',
      projectId: 'demo-project',
      enableKnowledgeGraph: true
    }
  },
  {
    name: '剧情发展建议',
    data: {
      message: '基于现有角色和设定，给我一些剧情发展建议，特别是冲突设计',
      type: 'general',
      projectId: 'demo-project',
      enableKnowledgeGraph: true
    }
  },
  {
    name: '世界观扩展',
    data: {
      message: '帮我扩展世界观，特别是魔法体系和政治结构',
      type: 'general',
      projectId: 'demo-project',
      enableKnowledgeGraph: true
    }
  },
  {
    name: '知识图谱查询',
    data: {
      message: '查询关于张无忌的所有相关信息和关系',
      type: 'general',
      projectId: 'demo-project',
      enableKnowledgeGraph: true
    }
  }
];

async function testAIAgent() {
  console.log('🤖 AI Agent 知识图谱功能演示');
  console.log('=====================================\n');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 测试 ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`💬 用户输入: ${testCase.data.message.substring(0, 50)}...`);
    
    try {
      const response = await axios.post(API_BASE, testCase.data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      const result = response.data;
      console.log(`✅ AI响应: ${result.text.substring(0, 200)}...`);
      console.log(`📊 置信度: ${result.confidence}`);
      
      if (result.actions && result.actions.length > 0) {
        console.log(`🔧 执行的动作: ${result.actions.map(a => a.type).join(', ')}`);
      }
      
    } catch (error) {
      console.error(`❌ 测试失败:`, error.response?.data || error.message);
    }
    
    console.log('---\n');
    
    // 延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎉 AI Agent 知识图谱功能演示完成!');
  
  // 总结功能特点
  console.log('\n📋 功能总结:');
  console.log('1. ✅ 智能实体识别和知识图谱节点创建');
  console.log('2. ✅ 自动关系提取和构建');
  console.log('3. ✅ 角色关系网络分析');
  console.log('4. ✅ 基于知识图谱的剧情建议');
  console.log('5. ✅ 世界观智能扩展');
  console.log('6. ✅ 上下文感知的知识查询');
  console.log('7. ✅ ArangoDB数据库集成（带降级方案）');
  console.log('8. ✅ 多模态AI Agent动作执行');
}

// 检查服务状态
async function checkService() {
  try {
    const response = await axios.get('http://localhost:3000/api/ai/health');
    console.log('✅ AI服务运行正常');
    return true;
  } catch (error) {
    console.error('❌ AI服务不可用，请确保后端服务正在运行');
    return false;
  }
}

// 主函数
async function main() {
  const serviceOk = await checkService();
  if (serviceOk) {
    await testAIAgent();
  }
}

// 运行演示
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAIAgent, checkService };
