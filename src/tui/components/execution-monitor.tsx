// src/tui/components/execution-monitor.tsx - Studio themed execution monitor
import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { WebSocketClient, ConsoleEvent } from '../../core/websocket-client.js';
import { WorkspaceData } from '../../models/workspace.js';

interface ExecutionMonitorProps {
  ws: WebSocketClient;
  workspace: WorkspaceData | null;
  onClose: () => void;
}

interface ExecutionStats {
  totalMessages: number;
  errors: number;
  warnings: number;
  successes: number;
  startTime: number | null;
  endTime: number | null;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({ ws, workspace, onClose }) => {
  const [messages, setMessages] = useState<ConsoleEvent[]>([]);
  const [stats, setStats] = useState<ExecutionStats>({
    totalMessages: 0,
    errors: 0,
    warnings: 0,
    successes: 0,
    startTime: null,
    endTime: null,
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<any>(null);

  useEffect(() => {
    const handleConsole = (event: ConsoleEvent) => {
      if (!paused) {
        setMessages(prev => {
          const newMessages = [...prev, event];
          // Keep last 100 messages
          return newMessages.slice(-100);
        });

        setStats(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1,
          errors: event.type === 'error' ? prev.errors + 1 : prev.errors,
          warnings: event.type === 'warning' ? prev.warnings + 1 : prev.warnings,
          successes: event.type === 'success' ? prev.successes + 1 : prev.successes,
          startTime: prev.startTime || Date.now(),
          endTime: Date.now(),
        }));
      }
    };

    const handleStatus = (status: string) => {
      setIsRunning(status === 'connected');
    };

    ws.on('console', handleConsole);
    ws.on('status', handleStatus);

    return () => {
      ws.off('console', handleConsole);
      ws.off('status', handleStatus);
    };
  }, [ws, paused]);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
    } else if (input === 'a') {
      setAutoScroll(!autoScroll);
    } else if (input === 'p') {
      setPaused(!paused);
    } else if (input === 'c') {
      setMessages([]);
      setStats({
        totalMessages: 0,
        errors: 0,
        warnings: 0,
        successes: 0,
        startTime: null,
        endTime: null,
      });
    } else if (input === 'f') {
      // Cycle through filters: null -> error -> warning -> success -> null
      const filters = [null, 'error', 'warning', 'success'];
      const currentIndex = filters.indexOf(filterType);
      const nextIndex = (currentIndex + 1) % filters.length;
      setFilterType(filters[nextIndex]);
    }
  });

  const filteredMessages = filterType
    ? messages.filter(msg => msg.type === filterType)
    : messages;

  const getMessageColor = (type: string): string => {
    switch (type) {
      case 'error': return '#ef4444';
      case 'warning': return '#fbbf24';
      case 'success': return '#4ade80';
      case 'info': return '#60a5fa';
      case 'system': return '#888888';
      default: return '#e0e0e0';
    }
  };

  const getMessageIcon = (type: string): string => {
    switch (type) {
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'success': return '✓';
      case 'info': return 'ℹ';
      case 'system': return '⚙';
      default: return '•';
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="#3a3a3a" padding={1} flexDirection="column">
        <Box>
          <Text bold color="#f4c430">👁️  Event Console</Text>
          {workspace && (
            <>
              <Text color="#888888"> - </Text>
              <Text bold color="#e0e0e0">{workspace.name}</Text>
            </>
          )}
          <Box marginLeft={2}>
            {isRunning ? (
              <>
                <Text color="#f4c430">
                  <Spinner type="dots" />
                </Text>
                <Text color="#4ade80"> Running</Text>
              </>
            ) : (
              <Text color="#888888">● Idle</Text>
            )}
          </Box>
        </Box>

        {/* Stats Bar */}
        <Box marginTop={1}>
          <Box marginRight={4}>
            <Text color="#888888">Total: </Text>
            <Text bold color="#e0e0e0">{stats.totalMessages}</Text>
          </Box>
          <Box marginRight={4}>
            <Text color="#4ade80">✓ </Text>
            <Text bold color="#4ade80">{stats.successes}</Text>
          </Box>
          <Box marginRight={4}>
            <Text color="#fbbf24">⚠ </Text>
            <Text bold color="#fbbf24">{stats.warnings}</Text>
          </Box>
          <Box marginRight={4}>
            <Text color="#ef4444">✗ </Text>
            <Text bold color="#ef4444">{stats.errors}</Text>
          </Box>
          {stats.startTime && stats.endTime && (
            <Box>
              <Text color="#888888">Duration: </Text>
              <Text color="#e0e0e0">{formatDuration(stats.endTime - stats.startTime)}</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Controls */}
      <Box marginTop={1} padding={1} borderStyle="single" borderColor="#3a3a3a">
        <Text color="#888888">
          {autoScroll ? '📜' : '⏸️'} Auto-scroll: {autoScroll ? 'ON' : 'OFF'} (a) | 
          {paused ? ' ⏸️ PAUSED' : ' ▶️ LIVE'} (p) | 
          Clear (c) | 
          Filter: <Text color="#f4c430">{filterType || 'ALL'}</Text> (f) | 
          ESC: Close
        </Text>
      </Box>

      {/* Message Console */}
      <Box 
        flexDirection="column" 
        marginTop={1}
        borderStyle="round"
        borderColor={paused ? '#fbbf24' : '#3a3a3a'}
        padding={1}
        height={25}
      >
        {filteredMessages.length === 0 ? (
          <Box justifyContent="center" alignItems="center">
            <Text color="#888888">
              {messages.length === 0 
                ? 'No events to display. Events will appear here as they occur.' 
                : `No ${filterType} messages`
              }
            </Text>
          </Box>
        ) : (
          filteredMessages.slice(-20).map((msg, i) => (
            <Box key={i} marginBottom={0}>
              <Text color="#888888">{new Date(msg.timestamp).toLocaleTimeString()} </Text>
              <Text color={getMessageColor(msg.type)}>
                {getMessageIcon(msg.type)} [{msg.type.toUpperCase()}]
              </Text>
              <Text color="#e0e0e0"> {msg.message}</Text>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Status Footer */}
      {messages.length > 20 && (
        <Box marginTop={1}>
          <Text color="#888888">
            Showing last 20 of {filteredMessages.length} messages
            {filterType && ` (filtered by ${filterType})`}
          </Text>
        </Box>
      )}
    </Box>
  );
};

// Progress Bar Component with Studio colors
interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  label, 
  color = '#f4c430' 
}) => {
  const percentage = Math.round((value / max) * 100);
  const barWidth = 30;
  const filledWidth = Math.round((value / max) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  return (
    <Box>
      {label && <Text color={color}>{label}: </Text>}
      <Text color={color}>{'█'.repeat(filledWidth)}</Text>
      <Text color="#3a3a3a">{'░'.repeat(emptyWidth)}</Text>
      <Text color="#e0e0e0"> {percentage}%</Text>
    </Box>
  );
};

// Live Chart Component with Studio colors
interface LiveChartProps {
  data: number[];
  height?: number;
  label?: string;
}

export const LiveChart: React.FC<LiveChartProps> = ({ 
  data, 
  height = 10,
  label 
}) => {
  const max = Math.max(...data, 1);
  const normalized = data.map(v => Math.round((v / max) * height));

  return (
    <Box flexDirection="column">
      {label && (
        <Box marginBottom={1}>
          <Text bold color="#f4c430">{label}</Text>
        </Box>
      )}
      <Box borderStyle="single" borderColor="#3a3a3a" padding={1}>
        {Array.from({ length: height }).reverse().map((_, row) => (
          <Box key={row}>
            {normalized.map((val, col) => (
              <Text key={col} color={val >= row ? '#4ade80' : '#3a3a3a'}>
                {val >= row ? '█' : '·'}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};