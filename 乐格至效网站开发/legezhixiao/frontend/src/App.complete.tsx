import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 导入错误边界和加载组件
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoading } from './components/UI/LoadingStates';

// 导入提供者
import { AuthProvider } from './contexts/AuthContext';
import { EditorProvider } from './contexts/EditorContext';
import { AIProvider } from './contexts/AIContext';

// 导入应用核心组件
import AppHeader from './components/Layout/AppHeader';
import Sidebar from './components/Layout/Sidebar';

// 导入页面组件 - 完整功能版本
import ProjectDashboard from './pages/ProjectDashboard';
import NovelWorkspace from './pages/NovelWorkspace';
import WritingInterfaceOptimized from './pages/WritingInterfaceOptimized';
import WritingInterface from './pages/WritingInterface';
import CreativeToolsPage from './pages/CreativeToolsPage';
import CharacterManagementPage from './pages/CharacterManagementPage';
import WorldBuildingPage from './pages/WorldBuildingPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import ProjectSettings from './pages/ProjectSettings';
import UploadPage from './pages/UploadPage';
import AuthPage from './pages/AuthPage';
import LoginPage from './pages/LoginPage';

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
              <AuthProvider>
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
                                {/* 完整路由配置 */}
                                <Routes>
                                  {/* 认证相关路由 */}
                                  <Route path="/login" element={<LoginPage />} />
                                  <Route path="/auth" element={<AuthPage />} />
                                  
                                  {/* 主要功能路由 */}
                                  <Route path="/" element={<ProjectDashboard />} />
                                  <Route path="/dashboard" element={<ProjectDashboard />} />
                                  <Route path="/workspace" element={<NovelWorkspace />} />
                                  
                                  {/* 写作相关 */}
                                  <Route path="/writing" element={<WritingInterfaceOptimized />} />
                                  <Route path="/writing-classic" element={<WritingInterface />} />
                                  
                                  {/* 创作工具 */}
                                  <Route path="/tools" element={<CreativeToolsPage />} />
                                  <Route path="/characters" element={<CharacterManagementPage />} />
                                  <Route path="/worldbuilding" element={<WorldBuildingPage />} />
                                  
                                  {/* 知识图谱 - 重要功能 */}
                                  <Route path="/knowledge" element={<KnowledgeGraphPage />} />
                                  <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
                                  
                                  {/* 项目管理 */}
                                  <Route path="/projects/:projectId" element={<ProjectSettings />} />
                                  <Route path="/settings" element={<ProjectSettings />} />
                                  
                                  {/* 文件上传 */}
                                  <Route path="/upload" element={<UploadPage />} />
                                  
                                  {/* 默认重定向 */}
                                  <Route path="*" element={<ProjectDashboard />} />
                                </Routes>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ErrorBoundary>
                    </AIProvider>
                  </ErrorBoundary>
                </EditorProvider>
              </AuthProvider>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
