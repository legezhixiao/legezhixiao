import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from 'antd';
import AppHeader from '../components/Layout/AppHeader';
import Sidebar from '../components/Layout/Sidebar';
import ProjectDashboard from './ProjectDashboard';
import NovelWorkspace from './NovelWorkspace';
import WritingInterfaceOptimized from './WritingInterfaceOptimized';
import CreativeToolsPage from './CreativeToolsPage';
import CharacterManagementPage from './CharacterManagementPage';
import WorldBuildingPage from './WorldBuildingPage';
import ProjectSettings from './ProjectSettings';
import KnowledgeGraphPage from './KnowledgeGraphPage';

const { Content } = Layout;

const AuthorizedRoutes: React.FC = () => {
  const { user } = useAuth();
  const [collapsed] = useState(false); // setCollapsed保留用于未来的折叠功能

  // 如果用户未登录，重定向到登录页
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout>
        <Sidebar collapsed={collapsed} />
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content style={{ 
            padding: 24, 
            margin: 0, 
            minHeight: 280,
            background: '#fff',
            borderRadius: 8
          }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProjectDashboard />} />
              <Route path="/workspace" element={<NovelWorkspace />} />
              <Route path="/writing" element={<WritingInterfaceOptimized />} />
              <Route path="/tools" element={<CreativeToolsPage />} />
              <Route path="/characters" element={<CharacterManagementPage />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
              <Route path="/project/:projectId/knowledge-graph" element={<KnowledgeGraphPage />} />
              <Route path="/worldbuilding" element={<WorldBuildingPage />} />
              <Route path="/settings" element={<ProjectSettings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AuthorizedRoutes;
