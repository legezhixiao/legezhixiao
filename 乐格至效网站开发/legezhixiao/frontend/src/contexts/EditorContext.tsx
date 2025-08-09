import React, { createContext, ReactNode, useContext, useState } from 'react'
import { sessionManager } from '../services/sessionManager'

interface EditorContextType {
    content: string
    setContent: (content: string) => void
    isWritingPage: boolean
    setIsWritingPage: (isWriting: boolean) => void
    currentProjectId: string | null
    setCurrentProjectId: (projectId: string | null) => void
    currentProjectTitle: string
    setCurrentProjectTitle: (title: string) => void
    sessionManager: typeof sessionManager
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

interface EditorProviderProps {
    children: ReactNode
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
    const [content, setContent] = useState('')
    const [isWritingPage, setIsWritingPage] = useState(false)
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
    const [currentProjectTitle, setCurrentProjectTitle] = useState('通用会话')

    return (
        <EditorContext.Provider
            value={{
                content,
                setContent,
                isWritingPage,
                setIsWritingPage,
                currentProjectId,
                setCurrentProjectId,
                currentProjectTitle,
                setCurrentProjectTitle,
                sessionManager
            }}
        >
            {children}
        </EditorContext.Provider>
    )
}

export const useEditor = () => {
    const context = useContext(EditorContext)
    if (context === undefined) {
        throw new Error('useEditor must be used within an EditorProvider')
    }
    return context
}

export { EditorContext }
