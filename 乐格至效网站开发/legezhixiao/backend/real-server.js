const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5173;

// 基础中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    message: '真实后端服务运行正常'
  });
});

// 基本的写作API路由
app.get('/api/writing/projects', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '项目列表（演示）'
  });
});

app.post('/api/writing/projects', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'demo-project-' + Date.now(),
      title: req.body.title || '演示项目',
      createdAt: new Date()
    },
    message: '项目创建成功（演示）'
  });
});

app.get('/api/writing/projects/:projectId/chapters', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '章节列表（演示）'
  });
});

app.post('/api/writing/projects/template', (req, res) => {
  const { templateType } = req.body;
  
  let template = {};
  switch (templateType) {
    case 'fantasy':
      template = {
        title: '奇幻小说项目',
        genre: '奇幻',
        description: '一个奇幻世界的冒险故事',
        targetWords: 80000,
        chapters: [
          { title: '第一章 序幕', content: '', order: 1 },
          { title: '第二章 觉醒', content: '', order: 2 },
          { title: '第三章 冒险开始', content: '', order: 3 }
        ],
        characters: [
          { name: '主角', type: 'protagonist', importance: 'main' },
          { name: '导师', type: 'mentor', importance: 'supporting' },
          { name: '反派', type: 'antagonist', importance: 'main' }
        ]
      };
      break;
    case 'modern':
      template = {
        title: '现代都市小说',
        genre: '都市',
        description: '现代都市背景的故事',
        targetWords: 100000
      };
      break;
    case 'romance':
      template = {
        title: '浪漫爱情小说',
        genre: '言情',
        description: '一段美好的爱情故事',
        targetWords: 60000
      };
      break;
    default:
      template = {
        title: '新项目',
        genre: '未分类',
        description: '请描述您的故事',
        targetWords: 50000
      };
  }

  res.json({
    success: true,
    data: template
  });
});

app.get('/api/stats/projects/:projectId/stats/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalWords: 0,
      totalChapters: 0,
      totalCharacters: 0,
      lastWritingSession: null
    },
    message: '统计概览（演示）'
  });
});

app.get('/api/stats/projects/:projectId/stats/heatmap', (req, res) => {
  res.json({
    success: true,
    data: {
      heatmapData: [],
      dateRange: '30天'
    },
    message: '热力图数据（演示）'
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('错误:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 真实后端服务器运行在 http://localhost:${PORT}`);
  console.log(`📖 API 基础路径: http://localhost:${PORT}/api`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`✅ 写作工具API已启动`);
});
