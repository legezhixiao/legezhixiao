import { RobotOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useCallback, useRef, useState } from 'react'
import './FloatingAIButton.css'

interface FloatingAIButtonProps {
    onToggleAI: () => void
    isAIVisible: boolean
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onToggleAI, isAIVisible }) => {
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const buttonRef = useRef<HTMLDivElement>(null)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)

        const rect = buttonRef.current?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            })
        }
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return

        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y

        // 只限制顶部，确保按钮不会完全消失在屏幕顶部
        const minY = -30 // 允许按钮大部分超出顶部，但保留30px可见
        
        setPosition({
            x: newX, // X轴不限制，允许完全超出左右边界
            y: Math.max(minY, newY) // Y轴只限制顶部
        })
    }, [isDragging, dragOffset])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDragging) {
            onToggleAI()
        }
    }, [isDragging, onToggleAI])

    // 添加全局鼠标事件监听器
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    return (
        <div
            ref={buttonRef}
            className={`floating-ai-button ${isDragging ? 'dragging' : ''} ${isAIVisible ? 'active' : ''}`}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 1000,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            {/* 全息投影背景效果 */}
            <div className="hologram-effect"></div>
            
            {/* 数据流效果 */}
            <div className="data-stream"></div>
            
            {/* 主按钮 */}
            <Button
                type={isAIVisible ? 'primary' : 'default'}
                shape="circle"
                size="large"
                icon={<RobotOutlined />}
                className="ai-button"
            />

            {/* 呼吸光效波纹 */}
            <div className="pulse-ring"></div>
            <div className="pulse-ring pulse-ring-delay"></div>
            
            {/* 科技感扫描线 */}
            <div className="scan-line"></div>
            <div className="scan-line scan-line-delay"></div>
            
            {/* 能量粒子效果 */}
            <div className="energy-particle"></div>
            <div className="energy-particle"></div>
            <div className="energy-particle"></div>
            <div className="energy-particle"></div>
        </div>
    )
}

export default FloatingAIButton
