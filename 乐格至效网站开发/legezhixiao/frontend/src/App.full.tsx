import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 导入错误边界和加载组件
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { PageLoading } from './components/UI/LoadingStates';

// 导入提供者
import { EditorProvider } from './contexts/EditorContext';
import { AIProvider } from './contexts/AIContext';

// 导入应用核心组件
import AppHeader from './components/Layout/AppHeader';
import Sidebar from './components/Layout/Sidebar';

// 导入页面组件
import ProjectSettings from './pages/ProjectSettings';
import NovelWorkspace from './pages/NovelWorkspace';
// import ChapterEditPage from './pages/ChapterEditPage';
// import ProjectsPage from './pages/ProjectsPage';
// import WritingPage from './pages/WritingPage';
// import TestRxDBPage from './pages/TestRxDBPage';
// import RxDBTestPage from './pages/RxDBTestPage'; // 已删除

// 导入存储 - 暂时注释，等需要时再启用
// import { useAppStore } from './store/appStore';

// 应用主题配置
const appTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontSize: 14,
  },
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider 
        locale={zhCN} 
        theme={appTheme}
      >
        <Router>
          <ErrorBoundary>
            <Suspense fallback={<PageLoading tip="应用加载中..." />}>
              <EditorProvider>
                <ErrorBoundary>
                  <AIProvider>
                    <ErrorBoundary>
                      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                        {/* 应用头部 */}
                        <AppHeader />
                        
                        <div style={{ display: 'flex', flex: 1 }}>
                          {/* 侧边栏 */}
                          <Sidebar collapsed={false} />
                          
                          {/* 主内容区域 */}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ padding: '20px' }}>
                              {/* 路由配置 */}
                              <Routes>
                                <Route path="/" element={<NovelWorkspace />} />
                                <Route path="/workspace" element={<NovelWorkspace />} />
                                <Route path="/projects/:projectId" element={<ProjectSettings />} />
                                {/* <Route path="/rxdb-test" element={<RxDBTestPage />} /> */}
                              </Routes>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ErrorBoundary>
                  </AIProvider>
                </ErrorBoundary>
              </EditorProvider>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
