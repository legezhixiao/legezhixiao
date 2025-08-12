import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { AppError } from '../types';

// 文件解析服务
export class FileParsingService {
  
  // 解析文本文件
  private async parseTextFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.trim();
    } catch (error) {
      throw new AppError('读取文本文件失败', 500);
    }
  }

  // 解析 Markdown 文件
  private async parseMarkdownFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // 移除 Markdown 语法，保留纯文本
      return content
        .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
        .replace(/`(.*?)`/g, '$1') // 移除代码标记
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
        .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
        .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
        .replace(/^\s*>\s+/gm, '') // 移除引用标记
        .trim();
    } catch (error) {
      throw new AppError('读取 Markdown 文件失败', 500);
    }
  }

  // 解析 HTML 文件
  private async parseHtmlFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // 简单的 HTML 标签移除（生产环境建议使用更强大的 HTML 解析库）
      return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script 标签
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // 移除 style 标签
        .replace(/<[^>]+>/g, '') // 移除所有 HTML 标签
        .replace(/&nbsp;/g, ' ') // 替换 HTML 实体
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim();
    } catch (error) {
      throw new AppError('读取 HTML 文件失败', 500);
    }
  }

  // 解析 JSON 文件（假设包含 content 字段）
  private async parseJsonFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(content);
      
      // 尝试提取文本内容
      if (jsonData.content) {
        return jsonData.content;
      } else if (jsonData.text) {
        return jsonData.text;
      } else if (jsonData.chapters && Array.isArray(jsonData.chapters)) {
        // 如果是章节数组格式
        return jsonData.chapters
          .map((chapter: any) => chapter.content || chapter.text || '')
          .join('\n\n');
      } else if (typeof jsonData === 'string') {
        return jsonData;
      } else {
        // 如果找不到明确的文本字段，返回整个JSON的字符串表示
        return JSON.stringify(jsonData, null, 2);
      }
    } catch (error) {
      throw new AppError('读取或解析 JSON 文件失败', 500);
    }
  }

  // 解析 Word 文档 (.docx)
  private async parseWordDocx(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new AppError('Word文档内容为空或无法读取', 400);
      }

      // 检查是否有警告信息
      if (result.messages && result.messages.length > 0) {
        console.warn('Word文档解析警告:', result.messages);
      }

      return result.value;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('解析Word文档失败: ' + (error as Error).message, 500);
    }
  }

  // 解析旧版Word文档 (.doc) - mammoth对.doc支持有限
  private async parseWordDoc(filePath: string): Promise<string> {
    try {
      // mammoth对.doc支持有限，但我们可以尝试
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new AppError('旧版Word文档(.doc)解析支持有限，建议转换为.docx格式', 400);
      }

      return result.value;
    } catch (error) {
      throw new AppError('旧版Word文档(.doc)解析失败，建议转换为.docx格式后重试', 400);
    }
  }

  // 主要的文件解析方法
  public async parseFile(filePath: string, mimeType: string): Promise<string> {
    try {
      // 检查文件是否存在
      await fs.access(filePath);
    } catch {
      throw new AppError('文件不存在', 404);
    }

    let content = '';

    // 当MIME类型为application/octet-stream时，根据文件扩展名决定解析方式
    if (mimeType === 'application/octet-stream') {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case '.txt':
          mimeType = 'text/plain';
          break;
        case '.md':
          mimeType = 'text/markdown';
          break;
        case '.html':
          mimeType = 'text/html';
          break;
        case '.json':
          mimeType = 'application/json';
          break;
        case '.rtf':
          mimeType = 'application/rtf';
          break;
        case '.docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.doc':
          mimeType = 'application/msword';
          break;
        default:
          throw new AppError(`不支持的文件扩展名: ${ext}`, 400);
      }
    }

    switch (mimeType) {
      case 'text/plain':
        content = await this.parseTextFile(filePath);
        break;
      
      case 'text/markdown':
      case 'text/x-markdown':
        content = await this.parseMarkdownFile(filePath);
        break;
      
      case 'text/html':
        content = await this.parseHtmlFile(filePath);
        break;
      
      case 'application/json':
        content = await this.parseJsonFile(filePath);
        break;
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        content = await this.parseWordDocx(filePath);
        break;
      
      case 'application/msword':
        content = await this.parseWordDoc(filePath);
        break;
      
      case 'application/pdf':
        // PDF 需要特殊的库来解析，暂时不支持
        throw new AppError('PDF 文档解析功能正在开发中，请使用 .txt 或 .md 格式', 400);
      
      case 'application/rtf':
        // RTF 需要特殊的库来解析，暂时不支持
        throw new AppError('RTF 文档解析功能正在开发中，请使用 .txt 或 .md 格式', 400);
      
      default:
        throw new AppError(`不支持的文件类型: ${mimeType}`, 400);
    }

    // 验证内容不为空
    if (!content || content.trim().length === 0) {
      throw new AppError('文件内容为空', 400);
    }

    return content;
  }

  // 分析文件内容，提取章节信息
  public analyzeNovelContent(content: string): {
    totalWords: number;
    estimatedChapters: number;
    chapters: Array<{ title: string; content: string; order: number }>;
    summary: string;
  } {
    // 计算字数
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = content.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(word => word.length > 0).length;
    const totalWords = chineseChars + englishWords;

    // 尝试识别章节
    const chapters: Array<{ title: string; content: string; order: number }> = [];
    
    // 常见的章节标识符
    const chapterPatterns = [
      /^第[一二三四五六七八九十百千万\d]+章\s*.*/gm,
      /^第[0-9]+章\s*.*/gm,
      /^章节[0-9]+\s*.*/gm,
      /^Chapter\s+[0-9]+\s*.*/gim,
      /^第[0-9]+节\s*.*/gm,
      /^[0-9]+\.\s*.*/gm
    ];

    let chapterSplits: string[] = [];
    
    // 尝试使用不同的模式分割章节
    for (const pattern of chapterPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 1) {
        chapterSplits = content.split(pattern).filter(part => part.trim().length > 0);
        break;
      }
    }

    // 如果没有找到章节标识符，按段落数量估算章节
    if (chapterSplits.length <= 1) {
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const wordsPerChapter = 3000; // 假设每章3000字
      const estimatedChapters = Math.max(1, Math.ceil(totalWords / wordsPerChapter));
      
      // 如果内容较短，作为单章节处理
      if (totalWords < 5000 || paragraphs.length < 5) {
        chapters.push({
          title: '第一章',
          content: content.trim(),
          order: 1
        });
      } else {
        // 将内容分割为估算的章节数
        const paragraphsPerChapter = Math.ceil(paragraphs.length / estimatedChapters);
        
        for (let i = 0; i < estimatedChapters; i++) {
          const start = i * paragraphsPerChapter;
          const end = Math.min(start + paragraphsPerChapter, paragraphs.length);
          const chapterContent = paragraphs.slice(start, end).join('\n\n');
          
          if (chapterContent.trim().length > 0) {
            chapters.push({
              title: `第${i + 1}章`,
              content: chapterContent.trim(),
              order: i + 1
            });
          }
        }
      }
    } else {
      // 使用识别的章节分割
      chapterSplits.forEach((chapterContent, index) => {
        if (chapterContent.trim().length > 0) {
          // 尝试从内容开头提取章节标题
          const lines = chapterContent.trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          
          let title = `第${index + 1}章`;
          let content = chapterContent.trim();
          
          // 如果第一行看起来像标题，将其作为章节标题
          if (firstLine.length < 100 && (
            firstLine.includes('章') || 
            firstLine.includes('Chapter') ||
            /^[0-9]+\./.test(firstLine)
          )) {
            title = firstLine;
            content = lines.slice(1).join('\n').trim();
          }
          
          chapters.push({
            title: title,
            content: content,
            order: index + 1
          });
        }
      });
    }

    // 生成内容摘要
    const summary = this.generateSummary(content);

    return {
      totalWords,
      estimatedChapters: chapters.length,
      chapters,
      summary
    };
  }

  // 生成内容摘要
  private generateSummary(content: string, maxLength: number = 200): string {
    // 移除多余的空白字符
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    
    // 如果内容较短，直接返回
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }
    
    // 尝试在句子边界截断
    const sentences = cleanContent.split(/[。！？!?.]/).filter(s => s.trim().length > 0);
    let summary = '';
    
    for (const sentence of sentences) {
      if ((summary + sentence + '。').length <= maxLength) {
        summary += sentence + '。';
      } else {
        break;
      }
    }
    
    // 如果没有找到合适的句子边界，直接截断
    if (!summary) {
      summary = cleanContent.substring(0, maxLength - 3) + '...';
    }
    
    return summary.trim();
  }
}
