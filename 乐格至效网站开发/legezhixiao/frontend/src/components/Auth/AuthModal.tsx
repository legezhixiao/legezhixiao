import React, { useState } from 'react'
import { Modal } from 'antd'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ResetPasswordForm from './ResetPasswordForm'

export type AuthMode = 'login' | 'register' | 'reset'

interface AuthModalProps {
    visible: boolean
    onClose: () => void
    defaultMode?: AuthMode
    onSuccess?: () => void
}

const AuthModal: React.FC<AuthModalProps> = ({
    visible,
    onClose,
    defaultMode = 'login',
    onSuccess
}) => {
    const [mode, setMode] = useState<AuthMode>(defaultMode)

    const handleSuccess = () => {
        onSuccess?.()
        onClose()
    }

    const handleClose = () => {
        setMode('login') // 重置到登录模式
        onClose()
    }

    React.useEffect(() => {
        if (visible) {
            setMode(defaultMode)
        }
    }, [visible, defaultMode])

    const renderContent = () => {
        switch (mode) {
            case 'register':
                return (
                    <RegisterForm
                        onSwitchToLogin={() => setMode('login')}
                        onSuccess={handleSuccess}
                    />
                )
            case 'reset':
                return (
                    <ResetPasswordForm
                        onSwitchToLogin={() => setMode('login')}
                    />
                )
            case 'login':
            default:
                return (
                    <LoginForm
                        onSwitchToRegister={() => setMode('register')}
                        onSwitchToReset={() => setMode('reset')}
                        onSuccess={handleSuccess}
                    />
                )
        }
    }

    return (
        <Modal
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={480}
            centered
            destroyOnClose
            maskClosable={false}
            style={{ maxWidth: '95vw' }}
        >
            {renderContent()}
        </Modal>
    )
}

export default AuthModal
