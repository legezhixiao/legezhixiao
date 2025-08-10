import React, { useRef, useEffect, useState, useCallback } from 'react'
import { 
  Layout, 
  Button, 
  Space, 
  message, 
  Tooltip, 
  Modal, 
  Slider, 
  Switch,
  Typography,
  Badge,
  FloatButton,
  Divider
} from 'antd'
import AIThinkingIndicator from '../components/AI/AIThinkingIndicator'
import { 
  SaveOutlined, 
  RobotOutlined, 
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  MenuOutlined,
  BookOutlined
} from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useAppStore } from '../store/appStore'
import { useEditor } from '../contexts/EditorContext'
import UnifiedSidebar from '../components/Writing/UnifiedSidebar'

const { Content, Sider } = Layout
const { Text, Title } = Typography

// 写作模式
type WritingMode = 'focus' | 'standard' | 'preview'

// 主题配置
const themes = [
  { key: 'vs-light', name: '明亮', bg: '#ffffff' },
  { key: 'vs-dark', name: '深色', bg: '#1e1e1e' },
  { key: 'hc-black', name: '高对比', bg: '#000000' }
]

const WritingInterfaceOptimized: React.FC = () => {
  const { currentProject, preferences, updatePreferences } = useAppStore()
  const { content, setContent, setIsWritingPage } = useEditor()
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  
  // 状态管理
  const [isGenerating, setIsGenerating] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [writingMode, setWritingMode] = useState<WritingMode>('standard')
  const [showSettings, setShowSettings] = useState(false)
  const [sessionStartTime] = useState(Date.now())
  const [sessionTime, setSessionTime] = useState(0)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  
  // 编辑器设置（从preferences获取）
  const fontSize = preferences?.fontSize || 16
  const lineHeight = preferences?.lineHeight || 1.6
  const editorTheme = preferences?.editorTheme || 'vs-light'
  const wordWrap = preferences?.wordWrap ?? true
  const enableAISuggestions = preferences?.enableAISuggestions ?? true
  
  // 本地状态
  const [showMinimap, setShowMinimap] = useState(false)
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(320)

  // 设置为写作页面
  useEffect(() => {
    setIsWritingPage(true)
    return () => setIsWritingPage(false)
  }, [setIsWritingPage])

  // 会话时间计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStartTime) / 1000 / 60))
    }, 60000)
    return () => clearInterval(timer)
  }, [sessionStartTime])

  // 自动保存功能
  useEffect(() => {
    const interval = setInterval(() => {
      if (content && content.length > 0 && autoSaveStatus === 'unsaved') {
        handleAutoSave()
      }
    }, 30000) // 30秒自动保存

    return () => clearInterval(interval)
  }, [content, autoSaveStatus])

  // 统计字数
  useEffect(() => {
    const count = content.replace(/\s+/g, '').length
    setWordCount(count)
    setAutoSaveStatus('unsaved')
  }, [content])

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'g':
            e.preventDefault()
            handleAIGenerate()
            break
          case 'Enter':
            if (e.shiftKey) {
              e.preventDefault()
              toggleFullscreen()
            }
            break
        }
      }
      
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleEditorDidMount = (editor: MonacoEditor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor

    // 配置编辑器选项
    editor.updateOptions({
      fontSize,
      lineHeight,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: showMinimap },
      lineNumbers: 'on',
      folding: true,
      renderWhitespace: 'boundary',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      contextmenu: true,
      quickSuggestions: enableAISuggestions,
      suggestOnTriggerCharacters: enableAISuggestions,
      padding: { top: 24, bottom: 24 },
      fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Menlo", monospace',
      fontLigatures: true,
      cursorBlinking: 'smooth',
      smoothScrolling: true,
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue()
      setContent(value)
    })

    // 使用Monaco高级功能
    if (monaco) {
      // 注册自定义语言支持（小说写作模式）
      monaco.languages.register({ id: 'novel-writing' })
      
      // 添加自定义快捷键
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSave()
      })
      
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
        // TODO: 触发AI生成
        console.log('触发AI生成功能')
      })
      
      // 添加文档大纲功能
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => {
        // TODO: 显示文档大纲
        console.log('显示文档大纲')
      })
      
      // 配置Markdown语法高亮
      if (monaco.languages.getLanguages().find((lang: any) => lang.id === 'markdown')) {
        monaco.editor.setModelLanguage(editor.getModel(), 'markdown')
      }
      
      // 添加自动完成提供程序
      monaco.languages.registerCompletionItemProvider('markdown', {
        provideCompletionItems: (_model: any, _position: any) => {
          const suggestions = [
            {
              label: '章节标题',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '# ${1:章节标题}\n\n${2:内容}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '插入章节标题'
            },
            {
              label: '人物对话',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '"${1:对话内容}"${2:，}${3:人物}${4:说道}。',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '插入人物对话'
            },
            {
              label: '场景描述',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:时间}，${2:地点}。${3:场景描述}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '插入场景描述'
            }
          ]
          return { suggestions }
        }
      })
    }

    // 自动对焦
    editor.focus()
  }

  const handleAutoSave = useCallback(async () => {
    if (autoSaveStatus === 'saving') return
    
    setAutoSaveStatus('saving')
    try {
      // 模拟保存
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAutoSaveStatus('saved')
    } catch (error) {
      setAutoSaveStatus('unsaved')
    }
  }, [autoSaveStatus])

  const handleSave = async () => {
    try {
      setAutoSaveStatus('saving')
      // TODO: 实现保存逻辑
      await new Promise(resolve => setTimeout(resolve, 500))
      setAutoSaveStatus('saved')
      message.success('保存成功')
    } catch (error) {
      setAutoSaveStatus('unsaved')
      message.error('保存失败')
    }
  }

  const handleAIGenerate = async () => {
    if (!editorRef.current) return
    
    setIsGenerating(true)
    try {
      const position = editorRef.current.getPosition()
      const currentText = editorRef.current.getValue()
      
      // 模拟AI生成
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const generatedText = '\n\n这是AI基于上下文生成的智能续写内容。AI分析了当前的写作风格、角色设定和情节发展，为您生成了符合故事逻辑的下一段内容...\n\n'
      
      if (position) {
        const lines = currentText.split('\n')
        const lineText = lines[position.lineNumber - 1] || ''
        const newLineText = lineText.slice(0, position.column - 1) + generatedText + lineText.slice(position.column - 1)
        lines[position.lineNumber - 1] = newLineText
        const newContent = lines.join('\n')
        editorRef.current.setValue(newContent)
      }
      
      message.success('AI续写完成')
    } catch (error) {
      message.error('AI生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  const toggleWritingMode = (mode: WritingMode) => {
    setWritingMode(mode)
    if (mode === 'focus') {
      setShowSidebar(false)
    } else {
      setShowSidebar(true)
    }
  }

  // 拖拽处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - dragStartX.current
    const newWidth = Math.max(200, Math.min(600, dragStartWidth.current + deltaX))
    setSidebarWidth(newWidth)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  // 清理事件监听器
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // 拖拽时禁用文本选择
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging])

  const renderToolbar = () => (
    <div 
      className="writing-toolbar"
      style={{ 
        background: '#ffffff',
        borderBottom: '1px solid #e8e8e8',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Space size="small">
        <Button 
          icon={<SaveOutlined />} 
          onClick={handleSave}
          type={autoSaveStatus === 'unsaved' ? 'primary' : 'default'}
          loading={autoSaveStatus === 'saving'}
          size="small"
        >
          {autoSaveStatus === 'saved' ? '已保存' : autoSaveStatus === 'saving' ? '保存中' : '保存'}
        </Button>
        
        <Button 
          icon={<RobotOutlined />} 
          loading={isGenerating}
          onClick={handleAIGenerate}
          type="primary"
          size="small"
        >
          AI续写
        </Button>
        
        <Divider type="vertical" />
        
        <Tooltip title="专注模式 (隐藏侧栏)">
          <Button 
            icon={<BulbOutlined />}
            type={writingMode === 'focus' ? 'primary' : 'default'}
            onClick={() => toggleWritingMode(writingMode === 'focus' ? 'standard' : 'focus')}
            size="small"
          />
        </Tooltip>
        
        <Tooltip title="全屏模式 (F11)">
          <Button 
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            size="small"
          />
        </Tooltip>
        
        <Tooltip title="侧边栏">
          <Button 
            icon={<MenuOutlined />}
            type={showSidebar ? 'primary' : 'default'}
            onClick={() => setShowSidebar(!showSidebar)}
            size="small"
          />
        </Tooltip>
      </Space>

      <Space size="middle">
        <Badge 
          count={autoSaveStatus === 'unsaved' ? '●' : ''} 
          color="orange"
          offset={[-5, 0]}
        >
          <Text type="secondary" style={{ fontSize: '12px' }}>
            字数: {wordCount.toLocaleString()}
          </Text>
        </Badge>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          会话时长: {Math.floor(sessionTime / 60)}h {sessionTime % 60}m
        </Text>
        
        <Button 
          icon={<SettingOutlined />}
          onClick={() => setShowSettings(true)}
          size="small"
          type="text"
        />
      </Space>
    </div>
  )

  const renderSettingsModal = () => (
    <Modal
      title="编辑器设置"
      open={showSettings}
      onCancel={() => setShowSettings(false)}
      footer={null}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={5}>字体设置</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>字体大小</Text>
              <div style={{ width: 200 }}>
                <Slider
                  min={12}
                  max={24}
                  value={fontSize}
                  onChange={(value) => updatePreferences({ fontSize: value })}
                  marks={{ 12: '12px', 16: '16px', 20: '20px', 24: '24px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>行高</Text>
              <div style={{ width: 200 }}>
                <Slider
                  min={1.2}
                  max={2.0}
                  step={0.1}
                  value={lineHeight}
                  onChange={(value) => updatePreferences({ lineHeight: value })}
                  marks={{ 1.2: '1.2', 1.6: '1.6', 2.0: '2.0' }}
                />
              </div>
            </div>
          </Space>
        </div>

        <div>
          <Title level={5}>主题设置</Title>
          <Space wrap>
            {themes.map(theme => (
              <Button
                key={theme.key}
                type={editorTheme === theme.key ? 'primary' : 'default'}
                onClick={() => updatePreferences({ editorTheme: theme.key as 'vs-light' | 'vs-dark' | 'hc-black' })}
                style={{ 
                  background: theme.bg, 
                  color: theme.key === 'vs-light' ? '#000' : '#fff',
                  border: `2px solid ${editorTheme === theme.key ? '#1890ff' : '#d9d9d9'}`
                }}
              >
                {theme.name}
              </Button>
            ))}
          </Space>
        </div>

        <div>
          <Title level={5}>编辑器功能</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>自动换行</Text>
              <Switch checked={wordWrap} onChange={(checked) => updatePreferences({ wordWrap: checked })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>显示小地图</Text>
              <Switch checked={showMinimap} onChange={setShowMinimap} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>AI智能建议</Text>
              <Switch checked={enableAISuggestions} onChange={(checked) => updatePreferences({ enableAISuggestions: checked })} />
            </div>
          </Space>
        </div>
      </Space>
    </Modal>
  )

  if (!currentProject) {
    return (
      <div style={{ 
        padding: '48px', 
        textAlign: 'center',
        background: '#f5f5f5',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <BookOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
        <Title level={3} type="secondary">请先选择一个小说项目</Title>
        <Text type="secondary">从左侧菜单中选择或创建一个新的小说项目开始写作</Text>
      </div>
    )
  }

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {renderToolbar()}
      
      <Layout style={{ height: 'calc(100vh - 49px)' }}>
        {/* 左侧统一侧边栏 */}
        {showSidebar && (
          <div style={{ position: 'relative', display: 'flex' }}>
            <Sider 
              width={sidebarWidth} 
              style={{ 
                background: '#fafafa', 
                borderRight: '1px solid #e8e8e8',
                transition: isDragging ? 'none' : 'all 0.3s ease'
              }}
            >
              <UnifiedSidebar
                wordCount={wordCount}
                targetWordCount={120000}
                writingTime={sessionTime}
              />
            </Sider>
            
            {/* 拖拽手柄 */}
            <div
              onMouseDown={handleMouseDown}
              style={{
                width: '6px',
                height: '100%',
                cursor: 'col-resize',
                background: isDragging ? '#1890ff' : 'transparent',
                position: 'relative',
                borderLeft: '1px solid #e8e8e8',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f0f0'
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {/* 拖拽指示器 */}
              <div style={{
                width: '2px',
                height: '20px',
                background: '#d9d9d9',
                borderRadius: '1px',
                opacity: isDragging ? 1 : 0.5
              }} />
            </div>
          </div>
        )}

        {/* 主编辑区域 */}
        <Content style={{ 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          background: writingMode === 'focus' ? '#fafafa' : '#ffffff'
        }}>
          {/* 专注模式提示 */}
          {writingMode === 'focus' && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px'
            }}>
              专注模式已开启 - 按 Shift+Ctrl+Enter 退出
            </div>
          )}

          {/* 编辑器区域 */}
          <div style={{ 
            flex: 1, 
            position: 'relative',
            maxWidth: writingMode === 'focus' ? '800px' : '100%',
            margin: writingMode === 'focus' ? '0 auto' : '0',
            padding: writingMode === 'focus' ? '40px 20px' : '0'
          }}>
            <AIThinkingIndicator
              visible={isGenerating}
              position="top-right"
              compact={true}
              steps={[
                '分析写作内容',
                '生成相关材料',
                '优化文字表达',
                '完善内容结构'
              ]}
            />
            
            <Editor
              height="100%"
              language="markdown"
              theme={editorTheme}
              value={content}
              onMount={handleEditorDidMount}
              options={{
                automaticLayout: true,
                fontSize,
                lineHeight,
                wordWrap: wordWrap ? 'on' : 'off',
                minimap: { enabled: showMinimap },
                scrollBeyondLastLine: false,
                padding: { 
                  top: writingMode === 'focus' ? 40 : 20, 
                  bottom: writingMode === 'focus' ? 40 : 20 
                },
                fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Menlo", monospace',
                fontLigatures: true,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                contextmenu: true,
                quickSuggestions: enableAISuggestions,
                suggestOnTriggerCharacters: enableAISuggestions,
              }}
            />
          </div>
        </Content>
      </Layout>

      {/* 悬浮按钮 */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<ThunderboltOutlined />}
      >
        <FloatButton 
          icon={<RobotOutlined />} 
          tooltip="AI续写"
          onClick={handleAIGenerate}
        />
        <FloatButton 
          icon={<SaveOutlined />} 
          tooltip="保存"
          onClick={handleSave}
        />
        <FloatButton 
          icon={<BulbOutlined />} 
          tooltip="专注模式"
          onClick={() => toggleWritingMode(writingMode === 'focus' ? 'standard' : 'focus')}
        />
      </FloatButton.Group>

      {renderSettingsModal()}
    </Layout>
  )
}

export default WritingInterfaceOptimized
