import React, { useState } from 'react'
import { List, Button, Input, Space, Typography, Tag } from 'antd'
import { PlusOutlined, BookOutlined, DeleteOutlined } from '@ant-design/icons'

const { Text } = Typography

interface Chapter {
  id: string
  number: number
  title: string
  wordCount: number
  status: 'draft' | 'writing' | 'completed'
}

interface ChapterNavigationProps {
  projectId: string
}

// 模拟数据
const mockChapters: Chapter[] = [
  {
    id: '1',
    number: 1,
    title: '开篇：新的开始',
    wordCount: 2500,
    status: 'completed',
  },
  {
    id: '2',
    number: 2,
    title: '第二章：遇见',
    wordCount: 3200,
    status: 'completed',
  },
  {
    id: '3',
    number: 3,
    title: '第三章：冒险',
    wordCount: 1800,
    status: 'writing',
  },
]

const ChapterNavigation: React.FC<ChapterNavigationProps> = () => {
  const [chapters, setChapters] = useState<Chapter[]>(mockChapters)
  const [selectedChapter, setSelectedChapter] = useState<string>('3')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)

  const getStatusColor = (status: Chapter['status']) => {
    switch (status) {
      case 'draft': return 'default'
      case 'writing': return 'processing'
      case 'completed': return 'success'
      default: return 'default'
    }
  }

  const getStatusText = (status: Chapter['status']) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'writing': return '编写中'
      case 'completed': return '已完成'
      default: return '未知'
    }
  }

  const handleChapterClick = (chapterId: string) => {
    setSelectedChapter(chapterId)
    // TODO: 加载章节内容
    console.log('切换到章节:', chapterId)
  }

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return

    const newChapter: Chapter = {
      id: Date.now().toString(),
      number: chapters.length + 1,
      title: newChapterTitle,
      wordCount: 0,
      status: 'draft',
    }

    setChapters([...chapters, newChapter])
    setNewChapterTitle('')
    setShowAddInput(false)
    setSelectedChapter(newChapter.id)
  }

  const handleDeleteChapter = (chapterId: string) => {
    setChapters(chapters.filter(c => c.id !== chapterId))
    if (selectedChapter === chapterId) {
      setSelectedChapter(chapters[0]?.id || '')
    }
  }

  return (
    <div 
      className="tech-card"
      style={{ 
        height: '100%', 
        borderRadius: 0, 
        borderLeft: 0, 
        borderTop: 0, 
        borderBottom: 0,
        padding: '16px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#333',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          章节列表
        </h3>
        <Button 
          type="text" 
          icon={<PlusOutlined />} 
          size="small"
          onClick={() => setShowAddInput(true)}
          style={{
            color: '#1890ff',
            borderColor: '#1890ff'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        {showAddInput ? (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="章节标题"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onPressEnter={handleAddChapter}
              autoFocus
              className="tech-input"
            />
            <Button 
              type="primary" 
              onClick={handleAddChapter}
              className="tech-button-enhanced"
            >
              添加
            </Button>
            <Button 
              onClick={() => setShowAddInput(false)}
              style={{
                borderColor: '#1890ff',
                color: '#1890ff'
              }}
            >
              取消
            </Button>
          </Space.Compact>
        ) : null}
      </div>

      <List
        size="small"
        dataSource={chapters}
        renderItem={(chapter) => (
          <List.Item
            style={{
              cursor: 'pointer',
              padding: '8px 12px',
              background: selectedChapter === chapter.id ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
              borderRadius: '6px',
              marginBottom: '4px',
              border: selectedChapter === chapter.id ? '1px solid rgba(24, 144, 255, 0.3)' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleChapterClick(chapter.id)}
            onMouseEnter={(e) => {
              if (selectedChapter !== chapter.id) {
                e.currentTarget.style.background = 'rgba(24, 144, 255, 0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedChapter !== chapter.id) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
            actions={[
              <Button
                key="delete"
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteChapter(chapter.id)
                }}
              />
            ]}
          >
            <List.Item.Meta
              avatar={<BookOutlined style={{ fontSize: '16px' }} />}
              title={
                <div>
                  <Text strong style={{ fontSize: '14px' }}>
                    第{chapter.number}章
                  </Text>
                  <br />
                  <Text style={{ fontSize: '12px' }}>
                    {chapter.title}
                  </Text>
                </div>
              }
              description={
                <Space direction="vertical" size={2}>
                  <div>
                    <Tag color={getStatusColor(chapter.status)}>
                      {getStatusText(chapter.status)}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {chapter.wordCount.toLocaleString()} 字
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}

export default ChapterNavigation
