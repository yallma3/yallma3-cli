import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

// Panel Component - Bordered container with optional title
interface PanelProps {
  title?: string;
  children: React.ReactNode;
  borderColor?: string;
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  padding?: number;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  borderColor = '#3a3a3a',
  borderStyle = 'round',
  padding = 1,
}) => {
  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={0}>
          <Text bold color={borderColor}>
            {title}
          </Text>
        </Box>
      )}
      <Box
        borderStyle={borderStyle}
        borderColor={borderColor}
        padding={padding}
        flexDirection="column"
      >
        {children}
      </Box>
    </Box>
  );
};

// Badge Component - Status indicator
interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const colors = {
    success: '#4ade80',
    error: '#ef4444',
    warning: '#fbbf24',
    info: '#60a5fa',
    default: '#888888',
  } as const;

  const icons = {
    success: 'v',
    error: 'x',
    warning: '!',
    info: 'i',
    default: '*',
  } as const;

  return (
    <Box borderStyle="round" borderColor={colors[variant]} paddingX={1}>
      <Text color={colors[variant]}>
        {icons[variant]} {label}
      </Text>
    </Box>
  );
};

// Metric Card - Display key metrics
interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  color = '#f4c430',
  trend,
}) => {
  const trendIcons = {
    up: '^',
    down: 'v',
    neutral: '-',
  } as const;

  return (
    <Box
      borderStyle="round"
      borderColor={color}
      padding={1}
      flexDirection="column"
      width={20}
    >
      <Box>
        <Text>{icon} </Text>
        <Text bold color={color}>
          {value}
        </Text>
        {trend && (
          <Text
            color={
              trend === 'up'
                ? '#4ade80'
                : trend === 'down'
                  ? '#ef4444'
                  : '#888888'
            }
          >
            {' '}
            {trendIcons[trend]}
          </Text>
        )}
      </Box>
      <Text color="#888888">{label}</Text>
    </Box>
  );
};

// Timeline Component - Show event history
interface TimelineEvent {
  timestamp: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
}

export const Timeline: React.FC<TimelineProps> = ({ events, maxItems = 10 }) => {
  const recentEvents = events.slice(-maxItems);

  const getColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#4ade80';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#60a5fa';
      default:
        return '#888888';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'v';
      case 'error':
        return 'x';
      case 'info':
        return 'i';
      default:
        return '*';
    }
  };

  return (
    <Box flexDirection="column">
      {recentEvents.map((event, i) => (
        <Box key={i} marginBottom={0}>
          <Text color={getColor(event.type)}>{getIcon(event.type)}</Text>
          <Text color="#888888">
            {' '}
            {new Date(event.timestamp).toLocaleTimeString()}{' '}
          </Text>
          <Text color="#e0e0e0">{event.message}</Text>
        </Box>
      ))}
    </Box>
  );
};

// Tabs Component - Tabbed navigation
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        {tabs.map((tab) => (
          <Box key={tab.id} marginRight={2}>
            <Text
              bold={tab.id === activeTab}
              color={tab.id === activeTab ? '#f4c430' : '#888888'}
            >
              {tab.label}
            </Text>
          </Box>
        ))}
      </Box>
      <Box>{tabs.find((t) => t.id === activeTab)?.content}</Box>
    </Box>
  );
};

// Loading Spinner with custom messages
interface LoadingProps {
  message?: string;
  type?: 'dots' | 'line' | 'star';
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  type = 'dots',
}) => {
  return (
    <Box>
      <Text color="#f4c430">
        <Spinner type={type} />
      </Text>
      <Text color="#888888"> {message}</Text>
    </Box>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '[]',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      paddingY={3}
    >
      <Text color="#f4c430">{icon}</Text>
      <Text bold color="#fbbf24">
        {title}
      </Text>
      {message && (
        <Box marginTop={1}>
          <Text color="#888888">{message}</Text>
        </Box>
      )}
      {actionLabel && onAction && (
        <Box marginTop={2}>
          <Text color="#f4c430">-{'>'} {actionLabel}</Text>
        </Box>
      )}
    </Box>
  );
};

// Progress Bar Component
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
  color = '#f4c430',
}) => {
  const percentage = Math.round((value / max) * 100);
  const barWidth = 30;
  const filledWidth = Math.round((value / max) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  return (
    <Box>
      {label && <Text color={color}>{label}: </Text>}
      <Text color={color}>{'='.repeat(filledWidth)}</Text>
      <Text color="#3a3a3a">{'-'.repeat(emptyWidth)}</Text>
      <Text color="#e0e0e0"> {percentage}%</Text>
    </Box>
  );
};
