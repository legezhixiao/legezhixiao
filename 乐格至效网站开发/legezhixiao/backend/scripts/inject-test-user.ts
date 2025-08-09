#!/usr/bin/env node
/**
 * 测试账号注入脚本
 * 创建admin@legezhixiao.com测试账号用于功能测试
 */

import bcrypt from 'bcryptjs';
import { databaseAdapter } from '../src/config/databaseAdapter';
import { dataService } from '../src/services/dataService';
import { logger } from '../src/utils/logger';

// 测试账号信息
const TEST_USER = {
  username: 'admin',
  email: 'admin@legezhixiao.com',
  password: '88888888',
  role: 'admin',
  subscription: 'premium',
  profile: {
    nickname: '管理员',
    avatar: '',
    bio: '系统管理员测试账号',
    location: '',
    website: '',
    github: '',
    twitter: ''
  },
  preferences: {
    theme: 'dark',
    language: 'zh-CN',
    notifications: {
      email: true,
      browser: true,
      mobile: false
    },
    writing: {
      autoSave: true,
      autoSaveInterval: 30,
      wordCountGoal: 2000,
      writingReminders: true
    }
  },
  isActive: true,
  emailVerified: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

async function createTestUser() {
  try {
    console.log('🚀 开始注入测试账号...');
    
    // 初始化数据库连接
    await databaseAdapter.initialize();
    console.log('✅ 数据库连接成功');
    
    // 检查用户是否已存在
    console.log('🔍 检查用户是否已存在...');
    const existingUsers = await dataService.query(
      `FOR user IN users 
       FILTER user.email == @email OR user.username == @username 
       RETURN user`,
      { email: TEST_USER.email, username: TEST_USER.username }
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️  测试用户已存在，正在更新...');
      
      // 更新现有用户
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 12);
      const updatedUser = {
        ...TEST_USER,
        password: hashedPassword,
        updatedAt: new Date()
      };
      
      const updateResult = await dataService.update('users', existingUsers[0]._key, updatedUser);
      console.log('✅ 测试用户更新成功:', {
        id: updateResult._key,
        username: updateResult.username,
        email: updateResult.email
      });
    } else {
      console.log('➕ 创建新的测试用户...');
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 12);
      const newUser = {
        ...TEST_USER,
        password: hashedPassword
      };
      
      // 创建用户
      const createdUser = await dataService.create('users', newUser);
      console.log('✅ 测试用户创建成功:', {
        id: createdUser._key,
        username: createdUser.username,
        email: createdUser.email
      });
    }
    
    // 创建一个测试项目
    console.log('📚 创建测试项目...');
    const testProject = {
      title: '测试小说项目',
      description: '这是一个用于功能测试的小说项目',
      genre: '奇幻',
      tags: ['测试', '奇幻', 'AI创作'],
      status: 'active',
      settings: {
        aiEnabled: true,
        constraintsEnabled: true,
        knowledgeGraphEnabled: true,
        writingGoal: {
          type: 'wordCount',
          target: 50000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后
        }
      },
      userId: 'admin', // 会在创建时关联到正确的用户ID
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 检查项目是否已存在
    const existingProjects = await dataService.query(
      `FOR project IN projects 
       FILTER project.title == @title 
       RETURN project`,
      { title: testProject.title }
    );
    
    if (existingProjects.length === 0) {
      const createdProject = await dataService.create('projects', testProject);
      console.log('✅ 测试项目创建成功:', {
        id: createdProject._key,
        title: createdProject.title
      });
      
      // 创建一个测试章节
      const testChapter = {
        title: '第一章：开始',
        content: '这是一个测试章节的内容。可以在这里编写小说内容，测试AI辅助功能。',
        number: 1,
        wordCount: 25,
        status: 'draft',
        projectId: createdProject._key,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const createdChapter = await dataService.create('chapters', testChapter);
      console.log('✅ 测试章节创建成功:', {
        id: createdChapter._key,
        title: createdChapter.title
      });
    } else {
      console.log('⚠️  测试项目已存在');
    }
    
    console.log('\n🎉 测试账号注入完成！');
    console.log('========================');
    console.log('📧 邮箱: admin@legezhixiao.com');
    console.log('🔑 密码: 88888888');
    console.log('👤 角色: 管理员');
    console.log('📊 订阅: 高级版');
    console.log('========================');
    console.log('现在可以使用此账号登录并进行功能测试');
    
  } catch (error) {
    console.error('❌ 注入测试账号失败:', error);
    process.exit(1);
  } finally {
    // 断开数据库连接
    try {
      await databaseAdapter.disconnect();
      console.log('✅ 数据库连接已断开');
    } catch (error) {
      console.error('⚠️  断开数据库连接时出错:', error);
    }
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTestUser();
}

export { createTestUser };
