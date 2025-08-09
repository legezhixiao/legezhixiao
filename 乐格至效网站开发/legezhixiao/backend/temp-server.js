const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ArangoDB 启动中，后端服务正常',
        timestamp: new Date().toISOString(),
        database: 'connecting'
    });
});

// 用户认证端点（临时）
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@legezhixiao.com' && password === '88888888') {
        res.json({
            success: true,
            message: '登录成功',
            token: 'temp_token_' + Date.now(),
            user: {
                id: '1',
                email: 'admin@legezhixiao.com',
                username: 'admin',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: '用户名或密码错误'
        });
    }
});

// 项目列表端点（临时）
app.get('/api/projects', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                title: '测试小说项目',
                description: '这是一个测试项目',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ],
        message: 'ArangoDB 启动中，返回模拟数据'
    });
});

// 捕获所有其他路由，返回前端应用
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 临时后端服务器启动成功!`);
    console.log(`📍 地址: http://localhost:${PORT}`);
    console.log(`🏥 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`⚠️  注意: 这是临时服务器，ArangoDB 启动完成后将切换回完整服务器\n`);
});
