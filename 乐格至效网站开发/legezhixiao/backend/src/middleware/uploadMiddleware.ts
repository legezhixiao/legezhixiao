import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';
import { AppError } from '../types';

// 支持的文件类型
const SUPPORTED_NOVEL_FORMATS = {
  'text/plain': '.txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/pdf': '.pdf',
  'text/markdown': '.md',
  'text/x-markdown': '.md',
  'application/json': '.json',
  'text/html': '.html',
  'application/rtf': '.rtf'
};

// 最大文件大小 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 确保上传目录存在
const ensureUploadDirectories = async () => {
  const uploadDirs = [
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../uploads/novels'),
    path.join(__dirname, '../../uploads/avatars'),
    path.join(__dirname, '../../uploads/temp')
  ];

  for (const dir of uploadDirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// 文件存储配置
const storage = multer.diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb: Function) => {
    try {
      await ensureUploadDirectories();
      
      // 根据文件类型决定存储目录
      let uploadPath = path.join(__dirname, '../../uploads');
      
      if (file.fieldname === 'avatar') {
        uploadPath = path.join(uploadPath, 'avatars');
      } else if (file.fieldname === 'novel') {
        uploadPath = path.join(uploadPath, 'novels');
      } else {
        uploadPath = path.join(uploadPath, 'temp');
      }
      
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  // 检查文件类型
  if (!SUPPORTED_NOVEL_FORMATS[file.mimetype as keyof typeof SUPPORTED_NOVEL_FORMATS]) {
    const error = new AppError(
      `不支持的文件类型: ${file.mimetype}。支持的格式: ${Object.values(SUPPORTED_NOVEL_FORMATS).join(', ')}`,
      400
    );
    return cb(error, false);
  }

  // 检查文件名
  if (!file.originalname) {
    const error = new AppError('文件名不能为空', 400);
    return cb(error, false);
  }

  // 检查文件扩展名
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = Object.values(SUPPORTED_NOVEL_FORMATS);
  
  if (!allowedExtensions.includes(fileExtension)) {
    const error = new AppError(
      `不支持的文件扩展名: ${fileExtension}。支持的扩展名: ${allowedExtensions.join(', ')}`,
      400
    );
    return cb(error, false);
  }

  cb(null, true);
};

// 创建 multer 实例
export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // 一次只能上传一个文件
  }
});

// 小说文件上传中间件
export const uploadNovelFile = uploadMiddleware.single('novel');

// 头像上传中间件
export const uploadAvatar = uploadMiddleware.single('avatar');

// 文件验证函数
export const validateUploadedFile = (file: Express.Multer.File | undefined) => {
  if (!file) {
    throw new AppError('未找到上传的文件', 400);
  }

  // 验证文件大小
  if (file.size === 0) {
    throw new AppError('文件不能为空', 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(`文件大小超过限制 (${MAX_FILE_SIZE / 1024 / 1024}MB)`, 400);
  }

  return true;
};

// 获取文件信息
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${file.fieldname === 'avatar' ? 'avatars' : file.fieldname === 'novel' ? 'novels' : 'temp'}/${file.filename}`
  };
};

// 清理临时文件
export const cleanupTempFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // 忽略文件不存在的错误
    console.warn(`清理临时文件失败: ${filePath}`, error);
  }
};

// 支持的文件格式列表（用于前端显示）
export const getSupportedFormats = () => {
  return {
    mimeTypes: Object.keys(SUPPORTED_NOVEL_FORMATS),
    extensions: Object.values(SUPPORTED_NOVEL_FORMATS),
    maxSize: MAX_FILE_SIZE,
    maxSizeMB: MAX_FILE_SIZE / 1024 / 1024
  };
};
