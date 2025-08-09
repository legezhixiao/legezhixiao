# AI服务配置指南

## SiliconFlow服务（推荐）

### 1. 注册SiliconFlow账号

访问 [SiliconFlow官网](https://cloud.siliconflow.cn) 注册账号

### 2. 获取API密钥

1. 登录SiliconFlow控制台
2. 在API管理页面创建新的API密钥
3. 复制API密钥备用

### 3. 配置AI助手

1. 打开AI助手窗口
2. 点击设置按钮（齿轮图标）
3. 选择"SiliconFlow"作为服务提供商
4. 输入API密钥
5. 确认配置：
   - API地址：`https://api.siliconflow.cn/v1/chat/completions`
   - 模型：`deepseek-ai/DeepSeek-V3`
6. 测试连接并保存

### 优势

- 高质量中文支持
- 国内访问稳定
- 性价比优秀
- 无需复杂部署

## 其他服务商

# 或者下载其他模型

ollama pull llama3.1:latest
ollama pull deepseek-coder:latest

````

### 3. 启动服务

```bash
ollama serve
````

### 4. 测试服务

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:latest",
  "messages": [
    {"role": "user", "content": "你好"}
  ]
}'
```

## 云端AI服务

### OpenAI GPT

- 注册：https://platform.openai.com/
- 获取API密钥
- 配置API地址：https://api.openai.com/v1/chat/completions

### DeepSeek AI

- 注册：https://platform.deepseek.com/
- 获取API密钥
- 配置API地址：https://api.deepseek.com/chat/completions

### 智谱AI

- 注册：https://open.bigmodel.cn/
- 获取API密钥
- 配置API地址：https://open.bigmodel.cn/api/paas/v4/chat/completions

## 使用说明

1. 点击AI助手窗口中的设置按钮⚙️
2. 选择AI服务提供商
3. 填写相应的配置信息
4. 点击"测试连接"验证配置
5. 保存配置并开始使用

## 故障排除

### Ollama服务无法启动

- 检查端口11434是否被占用
- 确保Ollama正确安装
- 重启Ollama服务

### API调用失败

- 检查网络连接
- 验证API密钥是否正确
- 确认API地址格式正确

### 模型响应质量不佳

- 尝试不同的模型
- 调整请求参数
- 提供更具体的上下文信息
