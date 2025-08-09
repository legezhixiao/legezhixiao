/**
 * 日志监控面板
 * 在开发环境中显示实时日志
 */

import React, { useState, useEffect } from 'react';
import { apiLogger, LogLevel, LogEntry } from '../utils/apiLogger';

interface LogMonitorProps {
  visible?: boolean;
  onToggle?: () => void;
}

const LogMonitor: React.FC<LogMonitorProps> = ({ visible = false, onToggle }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.DEBUG);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLogs = apiLogger.getLogs(filterLevel);
      setLogs(newLogs);
    }, 1000);

    return () => clearInterval(interval);
  }, [filterLevel]);

  const clearLogs = () => {
    apiLogger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    const logData = apiLogger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frontend-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG: return '#6b7280';
      case LogLevel.INFO: return '#3b82f6';
      case LogLevel.WARN: return '#f59e0b';
      case LogLevel.ERROR: return '#ef4444';
      default: return '#000000';
    }
  };

  const getLevelIcon = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  };

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '20px',
        }}
        title="打开日志监控"
      >
        📋
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isMinimized ? '300px' : '600px',
        height: isMinimized ? '50px' : '400px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '8px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #374151',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: '10px',
          backgroundColor: '#1f2937',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span style={{ fontWeight: 'bold' }}>
          📋 日志监控 ({logs.length})
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ❌
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* 控制栏 */}
          <div
            style={{
              padding: '10px',
              backgroundColor: '#111827',
              borderBottom: '1px solid #374151',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(Number(e.target.value) as LogLevel)}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                padding: '4px 8px',
              }}
            >
              <option value={LogLevel.DEBUG}>All (Debug+)</option>
              <option value={LogLevel.INFO}>Info+</option>
              <option value={LogLevel.WARN}>Warn+</option>
              <option value={LogLevel.ERROR}>Error Only</option>
            </select>

            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              自动滚动
            </label>

            <button
              onClick={clearLogs}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              清空
            </button>

            <button
              onClick={exportLogs}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              导出
            </button>
          </div>

          {/* 日志列表 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '10px',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px' }}>
                暂无日志
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '4px',
                    padding: '4px',
                    borderRadius: '2px',
                    backgroundColor: log.level >= LogLevel.ERROR ? 'rgba(239, 68, 68, 0.1)' :
                                    log.level >= LogLevel.WARN ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{getLevelIcon(log.level)}</span>
                    <span style={{ color: '#6b7280', fontSize: '10px' }}>
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span
                      style={{
                        color: getLevelColor(log.level),
                        fontWeight: 'bold',
                        fontSize: '10px',
                      }}
                    >
                      [{log.category}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                  {log.data && (
                    <div
                      style={{
                        marginLeft: '24px',
                        marginTop: '2px',
                        color: '#9ca3af',
                        fontSize: '10px',
                      }}
                    >
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                  {log.stack && (
                    <div
                      style={{
                        marginLeft: '24px',
                        marginTop: '2px',
                        color: '#f87171',
                        fontSize: '9px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {log.stack}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LogMonitor;
