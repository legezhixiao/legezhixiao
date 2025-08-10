import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
// import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // eslint({
        //   include: ['src/**/*.ts', 'src/**/*.tsx'],
        //   exclude: ['node_modules/**'],
        // })
    ],
    resolve: {
        alias: {
            '@': './src',
        },
    },
    server: {
        port: 5173,
        host: true, // 允许外部访问
        open: false, // 在Codespaces中不自动打开
        strictPort: true, // 强制使用5173端口，如果被占用则报错而不是切换端口
        cors: true, // 显式启用 CORS
        proxy: {
            // 所有 /api 请求都代理到后端服务器
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('后端代理请求:', req.method, req.url)
                    })
                }
            }
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    monaco: ['monaco-editor', '@monaco-editor/react'],
                    ui: ['antd'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['monaco-editor/esm/vs/language/typescript/ts.worker'],
    },
})
