import React, { useState, useEffect } from 'react';
import { Spin, Typography, Progress, Button } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AIThinkingIndicatorProps {
  visible: boolean;
  position?: 'top-right' | 'bottom-right' | 'inline';
  steps?: string[];
  currentStep?: number;
  showProgress?: boolean;
  compact?: boolean;
  onToggleDetails?: () => void;
}

const AIThinkingIndicator: React.FC<AIThinkingIndicatorProps> = ({
  visible,
  position = 'top-right',
  steps = [],
  currentStep = 0,
  showProgress = false,
  compact = true,
  onToggleDetails
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animationDots, setAnimationDots] = useState('');

  // 动画效果
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setAnimationDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return {
          position: 'fixed' as const,
          top: '20px',
          right: '20px',
          zIndex: 1000,
        };
      case 'bottom-right':
        return {
          position: 'fixed' as const,
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        };
      case 'inline':
      default:
        return {
          display: 'flex',
          margin: '4px 8px',
        };
    }
  };

  const compactView = (
    <div style={{
      ...getPositionStyles(),
      background: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backdropFilter: 'blur(4px)',
      fontSize: '13px',
      maxWidth: '280px',
      cursor: steps.length > 0 ? 'pointer' : 'default',
      transition: 'all 0.3s ease'
    }}
    onClick={() => steps.length > 0 && setShowDetails(!showDetails)}
    >
      <Spin size="small" style={{ color: 'white' }} />
      <Text style={{ color: 'white', margin: 0, fontSize: '13px' }}>
        思考中{animationDots}
      </Text>
      {steps.length > 0 && (
        <Button
          type="text"
          size="small"
          icon={showDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          style={{ color: 'white', padding: '2px 4px', height: 'auto' }}
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
            onToggleDetails?.();
          }}
        />
      )}
    </div>
  );

  const detailView = (
    <div style={{
      ...getPositionStyles(),
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #e9ecef',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '300px',
      maxWidth: '400px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Spin size="small" />
          <Text strong style={{ fontSize: '14px' }}>AI 思考过程</Text>
        </div>
        <Button
          type="text"
          size="small"
          icon={<EyeInvisibleOutlined />}
          onClick={() => setShowDetails(false)}
        />
      </div>
      
      {showProgress && steps.length > 0 && (
        <Progress 
          percent={Math.round((currentStep / steps.length) * 100)} 
          size="small" 
          style={{ marginBottom: '12px' }}
          strokeColor="#1890ff"
        />
      )}
      
      {steps.length > 0 && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ 
              padding: '4px 0',
              color: index === currentStep ? '#1890ff' : index < currentStep ? '#52c41a' : '#d9d9d9',
              fontWeight: index === currentStep ? 'bold' : 'normal'
            }}>
              {index + 1}. {step}
              {index === currentStep && <span style={{ marginLeft: '4px' }}>{animationDots}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return compact && !showDetails ? compactView : detailView;
};

export default AIThinkingIndicator;
