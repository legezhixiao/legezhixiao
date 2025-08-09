import React from 'react';
import AuthModal from '../components/Auth/AuthModal';

const AuthPage: React.FC = () => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <AuthModal 
        visible={true}
        onClose={() => {}}
        defaultMode="login"
      />
    </div>
  );
};

export default AuthPage;
