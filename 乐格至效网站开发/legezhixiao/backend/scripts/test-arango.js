const { Database } = require('arangojs');

async function tryConnect() {
  const configs = [
    { url: 'http://localhost:8529', auth: { username: 'root', password: '' }},
    { url: 'http://localhost:8529' }, // 无认证
    { url: 'http://localhost:8529', auth: { username: 'root', password: 'password' }},
  ];
  
  for (let i = 0; i < configs.length; i++) {
    try {
      console.log(`尝试配置 ${i + 1}:`, configs[i]);
      const db = new Database(configs[i]);
      const version = await db.version();
      console.log('✅ 连接成功！版本:', version.version);
      
      // 列出数据库
      const databases = await db.listDatabases();
      console.log('数据库:', databases);
      return db;
    } catch (error) {
      console.log(`❌ 配置 ${i + 1} 失败:`, error.message);
    }
  }
  console.log('所有连接尝试都失败了');
}

tryConnect();
