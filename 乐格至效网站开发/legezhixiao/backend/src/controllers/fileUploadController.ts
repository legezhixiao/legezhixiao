import { Request, Response } from 'express';
import { databaseConfig } from '../config/database';
import { NovelCreationService } from '../services/novelCreationService';
import { FileParsingService } from '../services/fileParsingService';
import { validateUploadedFile, getFileInfo, cleanupTempFile, getSupportedFormats } from '../middleware/uploadMiddleware';
import { logger } from '../utils/logger';
import path from 'path';

export class FileUploadController {
  private novelService: NovelCreationService;
  private fileParsingService: FileParsingService;

  constructor() {
    this.novelService = new NovelCreationService();
    this.fileParsingService = new FileParsingService();
  }

  // 获取支持的文件格式
  public getSupportedFormats = async (req: Request, res: Response): Promise<void> => {
    try {
      const formats = getSupportedFormats();
      res.json({
        success: true,
        data: formats
      });
    } catch (error) {
      logger.error('获取支持格式失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  };

  // 上传小说文件并解析
  public uploadNovelFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const file = req.file;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      // 验证上传的文件
      validateUploadedFile(file);
      
      if (!file) {
        res.status(400).json({ error: '未找到上传的文件' });
        return;
      }

      // 获取文件信息
      const fileInfo = getFileInfo(file);
      
      logger.info(`用户 ${userId} 上传文件: ${fileInfo.originalName}`);

      // 解析文件内容
      const content = await this.fileParsingService.parseFile(file.path, file.mimetype);
      
      // 分析小说内容
  const analysis = await this.fileParsingService.analyzeNovelContent(content);

      // 清理临时文件
      await cleanupTempFile(file.path);

      res.json({
        success: true,
        message: '文件上传并解析成功',
        data: {
          fileInfo: {
            originalName: fileInfo.originalName,
            size: fileInfo.size,
            mimetype: file.mimetype
          },
          analysis: {
            totalWords: analysis.totalWords,
            estimatedChapters: analysis.estimatedChapters,
            summary: analysis.summary,
            chaptersPreview: analysis.chapters.slice(0, 3).map(ch => ({
              title: ch.title,
              order: ch.order,
              wordCount: this.countWords(ch.content),
              preview: ch.content.substring(0, 200) + (ch.content.length > 200 ? '...' : '')
            }))
          },
          importOptions: {
            canCreateProject: true,
            canImportToExisting: true,
            suggestedProjectName: this.extractProjectName(fileInfo.originalName)
          }
        }
      });

    } catch (error) {
      logger.error('文件上传失败:', error);
      
      // 清理上传的文件
      if (req.file) {
        await cleanupTempFile(req.file.path);
      }

      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: '文件上传失败' });
      }
    }
  };

  // 导入小说内容到新项目
  public importToNewProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const file = req.file;
      const { projectTitle, projectDescription, genre } = req.body;

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      // 验证上传的文件
      validateUploadedFile(file);
      
      if (!file) {
        res.status(400).json({ error: '未找到上传的文件' });
        return;
      }

      // 解析文件内容
      const content = await this.fileParsingService.parseFile(file.path, file.mimetype);
  const analysis = await this.fileParsingService.analyzeNovelContent(content);

      // 创建新项目
      const projectData = {
        title: projectTitle || this.extractProjectName(file.originalname),
        description: projectDescription || analysis.summary,
        genre: genre || '其他',
        targetWords: Math.max(analysis.totalWords, 50000), // 至少设置5万字目标
        status: 'draft'
      };

      const project = await this.novelService.createProject(userId, projectData);

      // 导入章节
      const createdChapters = [];
      for (const chapterData of analysis.chapters) {
        const chapter = await this.novelService.createChapter(project.id, {
          title: chapterData.title,
          content: chapterData.content,
          order: chapterData.order,
          wordCount: this.countWords(chapterData.content),
          status: 'draft'
        });
        createdChapters.push(chapter);
      }

      // 更新项目字数统计
      const { Project } = databaseConfig.models!;
      await Project.update(
        { 
          currentWordCount: analysis.totalWords,
          chapterCount: analysis.chapters.length
        },
        { where: { id: project.id } }
      );

      // 清理临时文件
      await cleanupTempFile(file.path);

      logger.info(`用户 ${userId} 成功导入小说 "${projectData.title}"，共 ${analysis.chapters.length} 章，${analysis.totalWords} 字`);

      res.status(201).json({
        success: true,
        message: '小说导入成功',
        data: {
          project: {
            id: project.id,
            title: project.title,
            description: project.description,
            genre: project.genre,
            currentWordCount: analysis.totalWords,
            chapterCount: analysis.chapters.length
          },
          chapters: createdChapters.map(ch => ({
            id: ch.id,
            title: ch.title,
            order: ch.order,
            wordCount: ch.wordCount,
            status: ch.status
          })),
          statistics: {
            totalWords: analysis.totalWords,
            totalChapters: analysis.chapters.length,
            importedFrom: file.originalname
          }
        }
      });

    } catch (error) {
      logger.error('导入小说到新项目失败:', error);
      
      // 清理上传的文件
      if (req.file) {
        await cleanupTempFile(req.file.path);
      }

      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: '导入失败' });
      }
    }
  };

  // 导入小说内容到现有项目
  public importToExistingProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const file = req.file;
      const { projectId, importMode = 'append' } = req.body; // append: 追加, replace: 替换

      if (!userId) {
        res.status(401).json({ error: '未授权访问' });
        return;
      }

      if (!projectId) {
        res.status(400).json({ error: '项目ID不能为空' });
        return;
      }

      // 验证上传的文件
      validateUploadedFile(file);
      
      if (!file) {
        res.status(400).json({ error: '未找到上传的文件' });
        return;
      }

      // 验证项目权限
      const { Project, Chapter } = databaseConfig.models!;
      const project = await Project.findOne({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }

      // 解析文件内容
      const content = await this.fileParsingService.parseFile(file.path, file.mimetype);
  const analysis = await this.fileParsingService.analyzeNovelContent(content);

      let createdChapters = [];
      let originalWordCount = project.currentWordCount || 0;

      if (importMode === 'replace') {
        // 替换模式：删除现有章节
        await Chapter.destroy({ where: { projectId } });
        originalWordCount = 0;
        
        // 重新创建章节
        for (const chapterData of analysis.chapters) {
          const chapter = await this.novelService.createChapter(projectId, {
            title: chapterData.title,
            content: chapterData.content,
            order: chapterData.order,
            wordCount: this.countWords(chapterData.content),
            status: 'draft'
          });
          createdChapters.push(chapter);
        }
      } else {
        // 追加模式：在现有章节后添加
        const maxOrderResult = await Chapter.max('order', { where: { projectId } });
        const maxOrder = typeof maxOrderResult === 'number' ? maxOrderResult : 0;
        
        for (let i = 0; i < analysis.chapters.length; i++) {
          const chapterData = analysis.chapters[i];
          const chapter = await this.novelService.createChapter(projectId, {
            title: chapterData.title,
            content: chapterData.content,
            order: maxOrder + i + 1,
            wordCount: this.countWords(chapterData.content),
            status: 'draft'
          });
          createdChapters.push(chapter);
        }
      }

      // 更新项目统计
      const originalCount = project.currentWordCount || 0;
      const newWordCount = importMode === 'replace' ? 
        analysis.totalWords : 
        originalCount + analysis.totalWords;
      
      const totalChapters = await Chapter.count({ where: { projectId } });

      await project.update({
        currentWordCount: newWordCount,
        chapterCount: totalChapters
      });

      // 清理临时文件
      await cleanupTempFile(file.path);

      logger.info(`用户 ${userId} 成功导入内容到项目 "${project.title}"，模式: ${importMode}，新增 ${analysis.chapters.length} 章，${analysis.totalWords} 字`);

      res.json({
        success: true,
        message: `内容${importMode === 'replace' ? '替换' : '追加'}导入成功`,
        data: {
          project: {
            id: project.id,
            title: project.title,
            currentWordCount: newWordCount,
            chapterCount: totalChapters
          },
          importedChapters: createdChapters.map(ch => ({
            id: ch.id,
            title: ch.title,
            order: ch.order,
            wordCount: ch.wordCount,
            status: ch.status
          })),
          statistics: {
            importMode,
            newWords: analysis.totalWords,
            newChapters: analysis.chapters.length,
            totalWords: newWordCount,
            totalChapters,
            importedFrom: file.originalname
          }
        }
      });

    } catch (error) {
      logger.error('导入小说到现有项目失败:', error);
      
      // 清理上传的文件
      if (req.file) {
        await cleanupTempFile(req.file.path);
      }

      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: '导入失败' });
      }
    }
  };

  // 工具方法：计算字数
  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(word => word.length > 0).length;
    return chineseChars + englishWords;
  }

  // 工具方法：从文件名提取项目名
  private extractProjectName(filename: string): string {
    const name = path.parse(filename).name;
    // 移除常见的后缀和前缀
    return name
      .replace(/[-_]*(novel|book|story|小说|故事|作品)[-_]*/gi, '')
      .replace(/[-_]+/g, ' ')
      .trim() || '导入的小说';
  }
}
