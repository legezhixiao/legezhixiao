import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Card,
  Button,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  message,
  Drawer,
  Select,
  Slider
} from 'antd'
import {
  SaveOutlined,
  SettingOutlined,
  FullscreenOutlined
} from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useAppStore } from '../../store/appStore'

const { Text } = Typography

interface ChapterEditorProps {
  chapterId?: string
  projectId?: string
  initialContent?: string
  onContentChange?: (content: string) => void
  onSave?: (content: string) => Promise<void>
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapterId: _chapterId,
  projectId: _projectId,
  initialContent = '',
  onContentChange,
  onSave,
}) => {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const [content, setContent] = useState(initialContent)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { preferences, updatePreferences } = useAppStore()

  // 写作统计
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    paragraphs: 0,
    sentences: 0,
    readingTime: 0
  })

  // 计算写作统计
  const calculateStats = useCallback((text: string) => {
    const words = text.trim() ? text.replace(/\s+/g, ' ').split(' ').length : 0
    const characters = text.replace(/\s/g, '').length
    const paragraphs = text.split('\n\n').filter(p => p.trim()).length
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim()).length
    const readingTime = Math.ceil(words / 200) // 假设每分钟200字

    setStats({
      words,
      characters,
      paragraphs,
      sentences,
      readingTime
    })
  }, [])

  // 内容变化处理
  const handleContentChange = useCallback((value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)
    calculateStats(newContent)
    onContentChange?.(newContent)
  }, [onContentChange, calculateStats])

  // 保存功能
  const handleSave = useCallback(async () => {
    setIsAutoSaving(true)
    try {
      await onSave?.(content)
      setLastSaved(new Date())
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setIsAutoSaving(false)
    }
  }, [content, onSave])

  // 自动保存
  useEffect(() => {
    if (!preferences.autoSave) return

    const timer = setTimeout(() => {
      if (content !== initialContent) {
        handleSave()
      }
    }, preferences.autoSaveInterval * 1000)

    return () => clearTimeout(timer)
  }, [content, initialContent, preferences.autoSave, preferences.autoSaveInterval, handleSave])

  // 快捷键绑定
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'f':
            e.preventDefault()
            setIsFullscreen(!isFullscreen)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, isFullscreen])

  // 编辑器配置
  const editorOptions = {
    fontSize: preferences.fontSize || 14,
    lineHeight: preferences.lineHeight || 1.6,
    wordWrap: 'on' as const,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    lineNumbers: 'off' as const,
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 0,
    renderLineHighlight: 'none' as const,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    contextmenu: false,
    padding: { top: 20, bottom: 20 }
  }

  const editorElement = (
    <div style={{ height: isFullscreen ? '100vh' : '500px' }}>
      <Editor
        defaultLanguage="markdown"
        value={content}
        onChange={handleContentChange}
        options={editorOptions}
        theme={preferences.theme === 'dark' ? 'vs-dark' : 'vs'}
        onMount={(editor) => {
          editorRef.current = editor
        }}
      />
    </div>
  )

  const toolbar = (
    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
      <Col>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={isAutoSaving}
          >
            保存
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          >
            设置
          </Button>
          <Button
            icon={<FullscreenOutlined />}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
        </Space>
      </Col>
      <Col>
        <Space size="large">
          <Statistic
            title="字数"
            value={stats.words}
            valueStyle={{ fontSize: 16 }}
          />
          <Statistic
            title="段落"
            value={stats.paragraphs}
            valueStyle={{ fontSize: 16 }}
          />
          <Statistic
            title="阅读时间"
            value={stats.readingTime}
            suffix="分钟"
            valueStyle={{ fontSize: 16 }}
          />
        </Space>
      </Col>
    </Row>
  )

  const settingsDrawer = (
    <Drawer
      title="编辑器设置"
      placement="right"
      onClose={() => setSettingsVisible(false)}
      open={settingsVisible}
      width={400}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>主题</Text>
          <Select
            value={preferences.theme}
            onChange={(value) => updatePreferences({ theme: value })}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Select.Option value="light">浅色</Select.Option>
            <Select.Option value="dark">深色</Select.Option>
          </Select>
        </div>

        <div>
          <Text strong>字体大小: {preferences.fontSize}px</Text>
          <Slider
            min={12}
            max={24}
            value={preferences.fontSize}
            onChange={(value) => updatePreferences({ fontSize: value })}
            style={{ marginTop: 8 }}
          />
        </div>

        <div>
          <Text strong>行高: {preferences.lineHeight}</Text>
          <Slider
            min={1.2}
            max={2.4}
            step={0.1}
            value={preferences.lineHeight}
            onChange={(value) => updatePreferences({ lineHeight: value })}
            style={{ marginTop: 8 }}
          />
        </div>

        <div>
          <Text strong>自动保存间隔: {preferences.autoSaveInterval}秒</Text>
          <Slider
            min={10}
            max={300}
            step={10}
            value={preferences.autoSaveInterval}
            onChange={(value) => updatePreferences({ autoSaveInterval: value })}
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </Drawer>
  )

  if (isFullscreen) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: '#fff', 
        zIndex: 9999,
        padding: 20
      }}>
        {toolbar}
        {editorElement}
        {settingsDrawer}
      </div>
    )
  }

  return (
    <Card>
      {toolbar}
      {editorElement}
      {settingsDrawer}
      
      {lastSaved && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            最后保存: {lastSaved.toLocaleTimeString()}
          </Text>
        </div>
      )}
    </Card>
  )
}

export default ChapterEditor
