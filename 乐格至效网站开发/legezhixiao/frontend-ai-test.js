// 前端AI助手连接测试
// 在浏览器控制台中运行此脚本

console.log('🚀 开始测试前端AI助手连接...');

// 模拟前端aiService.ts中的请求
async function testFrontendAIService() {
    try {
        console.log('📡 发送请求到后端API...');
        
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                message: '前端测试：请帮我写一个短篇故事',
                type: 'general',
                maxTokens: 500
            })
        });
        
        console.log('📋 响应状态:', response.status);
        console.log('📋 响应头:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('✅ 前端AI请求成功！');
        console.log('📦 响应数据:', data);
        console.log('🤖 AI回复:', data.text);
        
        return data;
        
    } catch (error) {
        console.error('❌ 前端AI请求失败:', error);
        console.error('🔍 错误详情:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// 测试使用axios的请求 (模拟aiService中的实现)
async function testWithAxios() {
    try {
        // 检查axios是否可用
        if (typeof axios === 'undefined') {
            console.log('⚠️ axios不可用，使用fetch进行测试');
            return await testFrontendAIService();
        }
        
        console.log('📡 使用axios发送请求...');
        
        const response = await axios.post('http://localhost:3000/api/ai/chat', {
            message: 'axios测试：请生成一个简短的诗歌',
            type: 'general',
            maxTokens: 300
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('✅ axios请求成功！');
        console.log('📦 响应数据:', response.data);
        console.log('🤖 AI回复:', response.data.text);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ axios请求失败:', error);
        
        if (error.response) {
            console.error('📋 HTTP状态码:', error.response.status);
            console.error('📋 响应数据:', error.response.data);
            console.error('📋 响应头:', error.response.headers);
        } else if (error.request) {
            console.error('📋 请求配置:', error.config);
            console.error('📋 没有收到响应');
        }
        
        throw error;
    }
}

// 运行测试
console.log('🎯 开始执行测试...');

// 先测试基础连接
fetch('http://localhost:3000/api/ai')
    .then(response => response.json())
    .then(data => {
        console.log('✅ 基础连接成功:', data);
        return testWithAxios();
    })
    .then(result => {
        console.log('🎉 所有测试完成！AI助手连接正常。');
    })
    .catch(error => {
        console.error('💥 测试失败:', error);
        console.log('🔧 建议检查：');
        console.log('1. 后端服务是否在http://localhost:3000运行');
        console.log('2. CORS配置是否正确');
        console.log('3. 网络连接是否正常');
    });
