#!/usr/bin/env node
/**
 * 更新测试账号密码脚本
 * 将test@legezhixiao.com的密码修改为lekairong8888
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

async function updateTestUserPassword() {
  try {
    console.log('🔐 开始更新测试账号密码...');
    
    // 测试数据库连接
    console.log('🔍 测试数据库连接...');
    const version = await db.version();
    console.log('✅ 数据库连接成功，版本:', version.version);

    // 查找测试用户
    console.log('🔍 查找测试用户...');
    const query = `
      FOR user IN users
      FILTER user.email == @email OR user.username == @username
      RETURN user
    `;
    
    const cursor = await db.query(query, {
      email: 'admin@legezhixiao.com',
      username: 'test'
    });
    
    const users = await cursor.all();

    if (users.length === 0) {
      console.log('❌ 未找到测试用户');
      return;
    }

    console.log('✅ 找到测试用户，ID:', users[0]._key);

    // 加密新密码
    console.log('🔐 加密新密码...');
    const newPassword = 'lekairong8888';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    console.log('🔄 更新密码...');
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
      key: users[0]._key,
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ 密码更新成功！');
    console.log('');
    console.log('📋 更新后的登录信息:');
    console.log('   邮箱: admin@legezhixiao.com');
    console.log('   用户名: test');
    console.log('   密码: lekairong8888');
    console.log('   角色: admin');
    console.log('');
    console.log('🎉 密码已成功修改！');

  } catch (error) {
    console.error('❌ 密码更新失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  updateTestUserPassword();
}

export { updateTestUserPassword };
