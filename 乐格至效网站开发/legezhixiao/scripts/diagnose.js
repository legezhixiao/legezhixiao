#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 乐格至效项目全面诊断');
console.log('环境: Ubuntu 24.04.2 LTS (开发容器)');
console.log('=' .repeat(60));

const runCommand = (command, description) => {
  return new Promise((resolve) => {
    console.log(`\n📋 ${description}`);
    console.log(`运行: ${command}`);
    console.log('─'.repeat(50));
    
    exec(command, (error, stdout, stderr) => {
      if (stdout) {
        console.log('✅ 输出:');
        console.log(stdout);
      }
      if (stderr) {
        console.log('⚠️  错误信息:');
        console.log(stderr);
      }
      if (error && !stdout && !stderr) {
        console.log('❌ 命令执行失败:', error.message);
      }
      if (!stdout && !stderr && !error) {
        console.log('📭 无输出');
      }
      resolve();
    });
  });
};

const checkFile = (filePath, description) => {
  console.log(`\n📁 检查${description}: ${filePath}`);
  try {
    const stats = fs.statSync(filePath);
    console.log(`✅ 存在 (${stats.isDirectory() ? '目录' : '文件'}, ${stats.size} 字节)`);
    if (stats.isFile() && stats.size < 2000 && stats.size > 0) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('📄 内容预览:');
        console.log(content.substring(0, 300) + (content.length > 300 ? '...' : ''));
      } catch (readErr) {
        console.log('⚠️  无法读取文件内容');
      }
    }
  } catch (err) {
    console.log(`❌ 不存在或无法访问: ${err.message}`);
  }
};

async function diagnose() {
  console.log('\n🚀 开始诊断...\n');
  
  // 1. 系统状态
  console.log('\n' + '='.repeat(60));
  console.log('📊 系统状态检查');
  console.log('='.repeat(60));
  
  await runCommand('netstat -tlnp | grep -E ":(3000|5173|8529)" || echo "没有相关端口在监听"', '端口占用状态');
  await runCommand('ps aux | grep -E "(node|arango)" | grep -v grep || echo "没有相关进程运行"', '相关进程');
  await runCommand('free -h', '内存使用情况');
  await runCommand('df -h | grep -E "(/$|/tmp)"', '磁盘空间');
  
  // 2. ArangoDB诊断
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  ArangoDB诊断');
  console.log('='.repeat(60));
  
  await runCommand('dpkg -l | grep arangodb || echo "ArangoDB未安装"', 'ArangoDB安装状态');
  await runCommand('which arangod || echo "找不到arangod可执行文件"', 'ArangoDB可执行文件位置');
  await runCommand('ls -la /var/lib/arangodb3/ 2>/dev/null || echo "ArangoDB数据目录不存在"', 'ArangoDB数据目录');
  await runCommand('service --status-all 2>/dev/null | grep arango || echo "没有ArangoDB服务"', 'ArangoDB服务状态');
  
  // 3. Node.js环境
  console.log('\n' + '='.repeat(60));
  console.log('🟢 Node.js环境检查');
  console.log('='.repeat(60));
  
  await runCommand('node --version', 'Node.js版本');
  await runCommand('npm --version', 'npm版本');
  await runCommand('which node', 'Node.js位置');
  
  // 4. 项目文件检查
  console.log('\n' + '='.repeat(60));
  console.log('📁 项目文件检查');
  console.log('='.repeat(60));
  
  checkFile('./package.json', '根项目配置');
  checkFile('./frontend/package.json', '前端配置');
  checkFile('./backend/package.json', '后端配置');
  checkFile('./backend/.env', '后端环境变量');
  checkFile('./.vscode/tasks.json', 'VS Code任务配置');
  checkFile('./scripts/start-frontend.sh', '前端启动脚本');
  checkFile('./scripts/start-backend.sh', '后端启动脚本');
  
  // 5. 项目结构
  console.log('\n' + '='.repeat(60));
  console.log('🏗️  项目结构');
  console.log('='.repeat(60));
  
  await runCommand('ls -la', '根目录内容');
  await runCommand('ls -la frontend/', '前端目录内容');
  await runCommand('ls -la backend/src/', '后端源码目录');
  
  // 6. 依赖状态
  console.log('\n' + '='.repeat(60));
  console.log('📦 依赖状态检查');
  console.log('='.repeat(60));
  
  await runCommand('cd frontend && npm list --depth=0 | head -15 || echo "前端依赖检查失败"', '前端依赖状态');
  await runCommand('cd backend && npm list --depth=0 | head -15 || echo "后端依赖检查失败"', '后端依赖状态');
  
  // 7. 编译状态
  console.log('\n' + '='.repeat(60));
  console.log('🔨 编译状态检查');
  console.log('='.repeat(60));
  
  await runCommand('cd backend && npx tsc --noEmit || echo "TypeScript编译检查失败"', 'TypeScript编译检查');
  await runCommand('cd frontend && npm run build --dry-run 2>/dev/null || echo "前端构建检查跳过"', '前端构建检查');
  
  // 8. 网络连接测试
  console.log('\n' + '='.repeat(60));
  console.log('🌐 网络连接测试');
  console.log('='.repeat(60));
  
  await runCommand('curl -I http://localhost:3000 2>/dev/null || echo "后端服务不可访问"', '后端连接测试');
  await runCommand('curl -I http://localhost:5173 2>/dev/null || echo "前端服务不可访问"', '前端连接测试');
  await runCommand('curl -I http://localhost:8529 2>/dev/null || echo "ArangoDB不可访问"', 'ArangoDB连接测试');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 诊断完成！');
  console.log('='.repeat(60));
  
  console.log('\n📋 诊断摘要:');
  console.log('1. 检查上述输出中的❌错误和⚠️警告');
  console.log('2. 关注端口占用和进程状态');
  console.log('3. 验证ArangoDB安装状态');
  console.log('4. 检查项目依赖完整性');
  console.log('5. 确认TypeScript编译无误');
}

diagnose().catch(console.error);
