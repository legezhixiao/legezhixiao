#!/usr/bin/env node
/**
 * 测试账号注入脚本 - 简化版本
 * 创建test@legezhixiao.com测试账号用于功能测试
 */

import bcrypt from 'bcryptjs';
import { Database } from 'arangojs';

// 创建数据库连接
const db = new Database({
  url: 'http://localhost:8529',
  databaseName: 'novel_data',
  auth: {
    username: 'root',
    password: 'lkr350702'
  }
});

// 测试用户数据
const TEST_USER = {
  username: 'test',
  email: 'admin@legezhixiao.com',
  password: '88888888',
  role: 'admin',
  status: 'active',
  profile: {
    nickname: '测试用户',
    bio: '系统功能测试账号'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function main() {
  try {
    console.log('🚀 开始注入测试账号...');
    
    // 测试数据库连接
    console.log('🔍 测试数据库连接...');
    const version = await db.version();
    console.log('✅ 数据库连接成功，版本:', version.version);

    // 获取或创建users集合
    const usersCollection = db.collection('users');
    
    try {
      await usersCollection.get();
      console.log('✅ users集合已存在');
    } catch (error) {
      console.log('➕ 创建users集合...');
      await usersCollection.create();
      console.log('✅ users集合创建成功');
    }

    // 检查用户是否已存在
    console.log('🔍 检查用户是否已存在...');
    const query = `
      FOR user IN users
      FILTER user.email == @email OR user.username == @username
      RETURN user
    `;
    
    const cursor = await db.query(query, {
      email: TEST_USER.email,
      username: TEST_USER.username
    });
    
    const existingUsers = await cursor.all();

    if (existingUsers.length > 0) {
      console.log('🔄 用户已存在，更新密码...');
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      
      const updateQuery = `
        FOR user IN users
        FILTER user._key == @key
        UPDATE user WITH {
          password: @password,
          updatedAt: @updatedAt
        } IN users
        RETURN NEW
      `;
      
      await db.query(updateQuery, {
        key: existingUsers[0]._key,
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ 用户密码已更新');
    } else {
      console.log('➕ 创建新用户...');
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      
      const newUser = {
        ...TEST_USER,
        password: hashedPassword
      };
      
      const result = await usersCollection.save(newUser);
      console.log('✅ 用户创建成功，ID:', result._key);
    }

    console.log('');
    console.log('🎉 测试账号注入完成！');
    console.log('');
    console.log('📋 登录信息:');
    console.log('   邮箱:', TEST_USER.email);
    console.log('   用户名:', TEST_USER.username);
    console.log('   密码:', TEST_USER.password);
    console.log('   角色:', TEST_USER.role);
    console.log('');
    console.log('现在可以使用此账号登录系统进行测试！');

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

export { main as injectTestUser };
