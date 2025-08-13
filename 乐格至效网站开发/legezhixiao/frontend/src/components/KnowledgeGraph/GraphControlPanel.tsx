import React from 'react';
import { Button, Space, Tooltip, Slider, Select, Switch } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  UndoOutlined,
  FullscreenOutlined,
  DragOutlined
} from '@ant-design/icons';

interface GraphControlPanelProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  onLayoutChange: (layout: string) => void;
  onDragModeToggle: (enabled: boolean) => void;
  zoomLevel: number;
  currentLayout: string;
  isDragMode: boolean;
}

export const GraphControlPanel: React.FC<GraphControlPanelProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onFullscreen,
  onLayoutChange,
  onDragModeToggle,
  zoomLevel,
  currentLayout,
  isDragMode
}) => {
  return (
    <div className="graph-control-panel" style={{
      position: 'absolute',
      right: 16,
      top: 16,
      background: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <Space direction="vertical" size="small">
        <div>
          <Tooltip title="放大">
            <Button icon={<ZoomInOutlined />} onClick={onZoomIn} />
          </Tooltip>
          <Slider
            vertical
            min={0.1}
            max={2}
            step={0.1}
            value={zoomLevel}
            style={{ height: 100, margin: '16px 0' }}
          />
          <Tooltip title="缩小">
            <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} />
          </Tooltip>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          <Space direction="vertical" size="small">
            <Tooltip title="重置视图">
              <Button icon={<UndoOutlined />} onClick={onReset} />
            </Tooltip>
            <Tooltip title="全屏显示">
              <Button icon={<FullscreenOutlined />} onClick={onFullscreen} />
            </Tooltip>
          </Space>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          <Space direction="vertical" size="small">
            <Select
              style={{ width: '100%' }}
              value={currentLayout}
              onChange={onLayoutChange}
              options={[
                { label: '力导向布局', value: 'force' },
                { label: '环形布局', value: 'circular' },
                { label: '树形布局', value: 'tree' }
              ]}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ marginRight: 8 }}><DragOutlined /> 拖拽模式</span>
              <Switch checked={isDragMode} onChange={onDragModeToggle} />
            </div>
          </Space>
        </div>
      </Space>
    </div>
  );
};
