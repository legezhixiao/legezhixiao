import React, { useRef, useEffect, useState } from 'react'
import { Layout, Button, Space, Spin, message } from 'antd'
import { 
  SaveOutlined, 
  RobotOutlined, 
  HistoryOutlined,
  SettingOutlined 
} from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useParams } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { useEditor } from '../contexts/EditorContext'
import WritingStats from '../components/Writing/WritingStats'
import ChapterNavigation from '../components/Writing/ChapterNavigation'

const { Content, Sider } = Layout

const WritingInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentProject, preferences } = useAppStore()
  const { content, setContent, setIsWritingPage } = useEditor()
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  // 设置为写作页面
  useEffect(() => {
    setIsWritingPage(true)
    return () => setIsWritingPage(false)
  }, [])

  // 自动保存功能
  useEffect(() => {
    if (!preferences.autoSave) return

    const interval = setInterval(() => {
      if (content && content.length > 0) {
        // TODO: 实现自动保存逻辑
        console.log('自动保存中...')
      }
    }, preferences.autoSaveInterval * 1000)

    return () => clearInterval(interval)
  }, [content, preferences.autoSave, preferences.autoSaveInterval])

  // 统计字数
  useEffect(() => {
    const count = content.replace(/\s+/g, '').length
    setWordCount(count)
  }, [content])

  const handleEditorDidMount = (editor: MonacoEditor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor

    // 配置编辑器选项
    editor.updateOptions({
      fontSize: 16,
      lineHeight: 1.6,
      wordWrap: 'on',
      minimap: { enabled: false },
      lineNumbers: 'on',
      folding: true,
      renderWhitespace: 'boundary',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue()
      setContent(value)
      setWordCount(value.length)
    })

    // 监听光标位置变化 - 用于AI建议
    editor.onDidChangeCursorPosition((e) => {
      if (preferences.enableAISuggestions) {
        // TODO: 基于光标位置触发AI建议
        console.log('光标位置变化:', e.position)
      }
    })

    // 自定义快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      handleAIGenerate()
    })
  }

  const handleSave = async () => {
    try {
      // TODO: 实现保存逻辑
      console.log('保存内容:', content)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleAIGenerate = async () => {
    if (!editorRef.current) return
    
    setIsGenerating(true)
    try {
      const position = editorRef.current.getPosition()
      const currentText = editorRef.current.getValue()
      
      // TODO: 调用AI生成API
      console.log('AI生成请求:', { position, currentText })
      
      // 模拟AI生成
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const generatedText = '这是AI生成的示例文本...'
      
      // 简单插入文本，避免monaco全局变量问题
      if (position) {
        const lines = currentText.split('\n')
        const lineText = lines[position.lineNumber - 1] || ''
        const newLineText = lineText.slice(0, position.column - 1) + generatedText + lineText.slice(position.column - 1)
        lines[position.lineNumber - 1] = newLineText
        const newContent = lines.join('\n')
        editorRef.current.setValue(newContent)
      }
      
      message.success('AI生成完成')
    } catch (error) {
      message.error('AI生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!currentProject) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>请先选择一个小说</p>
      </div>
    )
  }

  return (
    <Layout style={{ height: '100%' }}>
      {/* 左侧章节导航 */}
      <Sider width={250} style={{ 
        background: '#fafafa', 
        borderRight: '1px solid #e8e8e8'
      }}>
        <ChapterNavigation projectId={id!} />
      </Sider>

      {/* 主编辑区域 */}
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 工具栏 */}
        <div 
          className="tech-card"
          style={{ 
            borderRadius: 0, 
            borderLeft: 0, 
            borderRight: 0,
            borderTop: 0,
            padding: '12px 16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button 
                icon={<SaveOutlined />} 
                onClick={handleSave}
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }}
              >
                保存 (Ctrl+S)
              </Button>
              <Button 
                icon={<RobotOutlined />} 
                loading={isGenerating}
                onClick={handleAIGenerate}
                type="primary"
                className="tech-button-enhanced"
              >
                AI生成 (Ctrl+G)
              </Button>
              <Button 
                icon={<HistoryOutlined />}
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }}
              >
                版本历史
              </Button>
              <Button 
                icon={<SettingOutlined />}
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }}
              >
                编辑器设置
              </Button>
            </Space>
            
            <WritingStats 
              wordCount={wordCount}
              targetWords={currentProject.targetWords}
              sessionTime={0}
            />
          </div>
        </div>

        {/* 编辑器区域 */}
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            {isGenerating && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}>
                <Spin size="large" tip="AI正在生成内容..." />
              </div>
            )}
            
            <Editor
              height="100%"
              language="markdown"
              theme={preferences.editorTheme}
              value={content}
              onMount={handleEditorDidMount}
              options={{
                automaticLayout: true,
                fontSize: preferences.fontSize,
                wordWrap: preferences.wordWrap ? 'on' : 'off',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 20, bottom: 20 },
                lineHeight: 1.6,
                fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
              }}
            />
          </div>
        </div>
      </Content>
    </Layout>
  )
}

export default WritingInterface
