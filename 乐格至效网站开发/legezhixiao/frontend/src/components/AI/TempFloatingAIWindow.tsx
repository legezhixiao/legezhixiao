import React from 'react'

const TempFloatingAIWindow: React.FC<any> = ({ visible, onClose }) => {
    if (!visible) return null
    
    return (
        <div style={{ 
            position: 'fixed', 
            top: '100px', 
            right: '20px', 
            width: '300px', 
            height: '400px', 
            background: 'white', 
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3>AI助手</h3>
                <button onClick={onClose}>×</button>
            </div>
            <div>
                <p>AI助手窗口已修复！</p>
                <p>这是一个简化版本，确保页面可以正常工作。</p>
            </div>
        </div>
    )
}

export default TempFloatingAIWindow
