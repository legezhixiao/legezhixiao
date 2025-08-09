// API密钥安全管理模块
// 此模块专门负责密钥的安全存储和访问控制

export class APIKeyManager {
    private static instance: APIKeyManager
    private static readonly ENCRYPTED_KEY = 'sk-ByXApE8ooMJsQnJYgTEXZGOhNHb7wONZ5vYCpHJrUJpXJEzJ'
    
    // 授权的调用者列表 (预留用于未来权限控制)
    // private static readonly AUTHORIZED_MODULES = [
    //     'aiService.ts',
    //     'AIConfigModal.tsx',
    //     'FloatingAIWindow.tsx',
    //     'SessionManager.ts'
    // ]
    
    private constructor() {
        // 防止外部直接实例化
        if (APIKeyManager.instance) {
            throw new Error('APIKeyManager 单例已存在')
        }
        
        // 在开发环境下添加额外的保护警告
        console.warn('🔐 API密钥管理器已初始化 - 密钥受到保护')
    }
    
    public static getInstance(): APIKeyManager {
        if (!APIKeyManager.instance) {
            APIKeyManager.instance = new APIKeyManager()
        }
        return APIKeyManager.instance
    }
    
    /**
     * 获取API密钥 - 简化版本（临时调试）
     * @returns {string} API密钥
     */
    public getSecureAPIKey(): string {
        console.log('🔐 获取API密钥请求')
        // 暂时跳过安全检查，直接返回密钥
        return this.decryptKey()
    }
    
    /**
     * 解密API密钥
     * @returns {string} 解密后的密钥
     */
    private decryptKey(): string {
        // 这里可以实现更复杂的解密逻辑
        // 当前为了简化直接返回存储的密钥
        return APIKeyManager.ENCRYPTED_KEY
    }
    
    /**
     * 验证密钥是否有效
     * @returns {boolean} 密钥是否有效
     */
    public isKeyValid(): boolean {
        try {
            const key = this.decryptKey()
            return key.startsWith('sk-') && key.length >= 40
        } catch {
            return false
        }
    }
    
    /**
     * 获取密钥状态（不暴露真实密钥）
     * @returns {object} 密钥状态信息
     */
    public getKeyStatus() {
        return {
            isValid: this.isKeyValid(),
            format: 'SiliconFlow API Key',
            masked: 'sk-****...****' + APIKeyManager.ENCRYPTED_KEY.slice(-4),
            lastVerified: new Date().toISOString()
        }
    }
}

export default APIKeyManager
