import { AIServiceManager } from './aiService';

interface NovelGenerationTask {
  id: string;
  type: 'novel_generation';
  description: string;
  parameters: {
    genre: string;
    theme: string;
    characters: string[];
    length: number;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

class NovelGenerationAgent {
  private aiService = AIServiceManager.getInstance();

  async generateNovel(task: NovelGenerationTask): Promise<NovelGenerationTask> {
    task.status = 'running';

    try {
      const prompt = `
      根据以下要求生成一段小说内容：
      - 类型: ${task.parameters.genre}
      - 主题: ${task.parameters.theme}
      - 主要角色: ${task.parameters.characters.join(', ')}
      - 长度: ${task.parameters.length}字

      请确保内容具有吸引力，情节连贯，并符合类型和主题的特点。
      `;

      const response = await this.aiService.generateResponse({
        message: prompt,
        type: 'general',
        maxTokens: task.parameters.length
      });

      task.result = response.text;
      task.status = 'completed';
    } catch (error) {
      task.error = error instanceof Error ? error.message : String(error);
      task.status = 'failed';
    }

    return task;
  }
}

export { NovelGenerationAgent };
export type { NovelGenerationTask };