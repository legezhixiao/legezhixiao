import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';

// 导入错误处理工具
import { logError, safeRequire, startupStep } from './utils/errorLogger';

// 加载环境变量
dotenv.config();

console.log('\n🚀 乐格智小后端服务器启动中...\n');

// 导入配置和工具
let logger: any, stream: any;
let databaseConfig: any;
let errorHandler: any, notFound: any;

try {
  const path = require('path');
  const loggerPath = path.join(__dirname, 'utils', 'logger');
  console.log(`🔍 正在导入模块: ${loggerPath}`);
  const loggerModule = require(loggerPath);
  logger = loggerModule.logger;
  stream = loggerModule.stream;
  console.log('✅ logger 导入成功');
} catch (error) {
  console.error('❌ 无法启动：日志模块导入失败');
  console.error('错误详情:', error);
  process.exit(1);
}

try {
  const path = require('path');
  const dbConfigPath = path.join(__dirname, 'config', 'databaseAdapter');
  console.log(`🔍 正在导入模块: ${dbConfigPath}`);
  databaseConfig = require(dbConfigPath).default;
  console.log('✅ 数据库适配器 导入成功');
} catch (error) {
  logError('数据库适配器导入', error);
  process.exit(1);
}

try {
  const path = require('path');
  const errorHandlerPath = path.join(__dirname, 'middleware', 'errorHandler');
  const notFoundPath = path.join(__dirname, 'middleware', 'notFound');
  console.log(`🔍 正在导入模块: ${errorHandlerPath}`);
  console.log(`🔍 正在导入模块: ${notFoundPath}`);
  errorHandler = require(errorHandlerPath).errorHandler;
  notFound = require(notFoundPath).notFound;
  console.log('✅ middleware 导入成功');
} catch (error) {
  logError('中间件导入', error);
  process.exit(1);
}

// 导入路由
let authRoutes: any, userRoutes: any, projectRoutes: any, chapterRoutes: any;
let aiRoutes: any, writingRoutes: any, writingStatsRoutes: any, logRoutes: any, uploadRoutes: any;
let knowledgeGraphRoutes: any;

try {
  console.log('导入路由模块...');
  const path = require('path');
  
  authRoutes = require(path.join(__dirname, 'routes', 'auth')).default;
  console.log('✅ auth routes 导入成功');
  
  userRoutes = require(path.join(__dirname, 'routes', 'user')).default;
  console.log('✅ user routes 导入成功');
  
  projectRoutes = require(path.join(__dirname, 'routes', 'project')).default;
  console.log('✅ project routes 导入成功');
  
  chapterRoutes = require(path.join(__dirname, 'routes', 'chapter.new')).default;
  console.log('✅ chapter routes 导入成功');
  
  aiRoutes = require(path.join(__dirname, 'routes', 'ai')).default;
  console.log('✅ ai routes 导入成功');
  
  writingRoutes = require(path.join(__dirname, 'routes', 'writing')).default;
  console.log('✅ writing routes 导入成功');
  
  writingStatsRoutes = require(path.join(__dirname, 'routes', 'writingStats')).default;
  console.log('✅ writingStats routes 导入成功');
  
  logRoutes = require(path.join(__dirname, 'routes', 'logs')).default;
  console.log('✅ logs routes 导入成功');
  
  uploadRoutes = require(path.join(__dirname, 'routes', 'upload')).default;
  console.log('✅ upload routes 导入成功');
  
  knowledgeGraphRoutes = require(path.join(__dirname, 'routes', 'knowledgeGraph')).default;
  console.log('✅ knowledge graph routes 导入成功');
  
  console.log('✅ 所有路由模块导入成功');
} catch (error) {
  logError('路由导入', error);
  process.exit(1);
}

// 添加调试日志
console.log('=== 服务器启动调试信息 ===');
console.log('环境变量已加载');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

let app: express.Application;
let server: any;

try {
  console.log('创建 Express 应用...');
  app = express();
  
  console.log('创建 HTTP 服务器...');
  server = createServer(app);
  
  console.log('HTTP 服务器创建成功');
} catch (error) {
  console.error('初始化服务器组件时出错:', error);
  process.exit(1);
}

// 基础配置
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));

// 限流配置
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 最大请求数
  message: {
    error: '请求过于频繁，请稍后再试',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 请求日志
app.use(morgan('combined', { stream }));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 压缩响应
app.use(compression());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// 根路径重定向到API文档
app.get('/', (req, res) => {
  res.redirect('/api');
});

// favicon处理
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// 健康检查端点
app.get('/health', (req, res) => {
  const dbStatus = databaseConfig.getConnectionStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    databases: dbStatus,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API 健康检查端点
app.get('/api/health', (req, res) => {
  const dbStatus = databaseConfig.getConnectionStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    databases: dbStatus,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API 路由
const dbStatusRoutes = require(path.join(__dirname, 'routes', 'dbStatus')).default;
console.log('✅ dbStatus routes 导入成功');
app.use('/api/db-status', dbStatusRoutes);
console.log('✅ /api/db-status 路由已注册');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/stats', writingStatsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
console.log('✅ /api/knowledge-graph 路由已注册');

// RxDB 同步路由
startupStep('同步路由', () => {
  const syncRoutes = safeRequire('./routes/sync');
  if (syncRoutes) {
    app.use('/api/sync', syncRoutes.default || syncRoutes);
    console.log('✅ 同步路由已加载');
  }
});

// API 根路径
app.get('/api', (req, res) => {
  res.json({
    message: '乐格智小 API 服务器',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      chapters: '/api/chapters',
      ai: '/api/ai',
      writing: '/api/writing',
      stats: '/api/stats',
      logs: '/api/logs',
      upload: '/api/upload',
      health: '/health'
    }
  });
});

// 404 处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 服务器启动函数
async function startServer() {
  try {
    // 连接数据库
    try {
      await startupStep('连接数据库', async () => {
        await databaseConfig.initialize();
        logger.info('数据库连接成功 (ArangoDB + 兼容层)');
      });
    } catch (error) {
      logger.warn('数据库连接失败，继续以模拟模式启动');
    }

    // 创建上传目录
    await startupStep('创建上传目录', async () => {
      const uploadsDir = path.join(__dirname, '../uploads');
      const avatarsDir = path.join(uploadsDir, 'avatars');
      const assetsDir = path.join(__dirname, '../assets');

      // 确保目录存在
      const fs = require('fs').promises;
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(avatarsDir, { recursive: true });
      await fs.mkdir(assetsDir, { recursive: true });
    });

    // 启动服务器
    await startupStep('启动HTTP服务器', () => {
      return new Promise<void>((resolve, reject) => {
        server.listen(PORT, (err?: Error) => {
          if (err) {
            reject(err);
          } else {
            logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
            logger.info(`📖 API 文档: http://localhost:${PORT}/api`);
            logger.info(`🔧 环境: ${NODE_ENV}`);
            logger.info(`💾 数据库状态:`, databaseConfig.getConnectionStatus());
            resolve();
          }
        });
      });
    });

  } catch (error) {
    logError('服务器启动', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，开始优雅关闭...');
  server.close(async () => {
    await databaseConfig.disconnect();
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，开始优雅关闭...');
  server.close(async () => {
    await databaseConfig.disconnect();
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

// 未捕获异常处理 - 改进版本，避免因文件描述符问题导致退出
process.on('uncaughtException', (error) => {
  logger.error('未捕获异常:', error);
  
  // 如果是文件描述符错误，记录但不退出
  if ((error as any).code === 'EBADF' || error.message.includes('bad file descriptor')) {
    logger.warn('忽略文件描述符错误，服务器继续运行');
    return;
  }
  
  // 其他严重错误才退出
  logger.error('严重错误，服务器即将退出');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
  logger.error('Promise:', promise);
  
  // 对于某些可恢复的错误，只记录不退出
  if (reason && typeof reason === 'object' && (reason as any).code === 'EBADF') {
    logger.warn('忽略 Promise 中的文件描述符错误');
    return;
  }
  
  // 严重的 Promise 拒绝才退出
  logger.error('严重的 Promise 拒绝，服务器即将退出');
  process.exit(1);
});

// 启动服务器
if (require.main === module) {
  startServer();
}

export { app, server };
export default app;
