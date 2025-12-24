// src/tui/mode-selector.tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

interface ModeSelectorProps {
  onSelect: (mode: 'classic' | 'chat') => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
  const items = [
    {
      label: '📊 Classic Mode - Tabbed interface with workspace details',
      value: 'classic' as const,
    },
    {
      label: '💬 Chat Mode - Conversational interface with commands',
      value: 'chat' as const,
    },
  ];

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1} borderStyle="round" borderColor="#f4c430" paddingX={2} paddingY={1}>
        <Text bold color="#f4c430">✨ yaLLMa3 Studio</Text>
        <Text color="#888888"> - Choose Your Interface</Text>
      </Box>

      <Box flexDirection="column" marginY={1} paddingX={2}>
        <Box marginBottom={1}>
          <Text color="#e0e0e0">
            Select how you want to interact with your AI agents:
          </Text>
        </Box>

        <Box marginBottom={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="#f4c430">📊 Classic Mode:</Text>
          </Box>
          <Box paddingLeft={2} flexDirection="column">
            <Text color="#888888">• Tab-based navigation (Workspace, Tasks, Agents, Workflows, Env)</Text>
            <Text color="#888888">• Visual event console with real-time updates</Text>
            <Text color="#888888">• Interactive input prompts with dedicated UI</Text>
            <Text color="#888888">• Best for detailed workspace management</Text>
          </Box>
        </Box>

        <Box marginBottom={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="#60a5fa">💬 Chat Mode:</Text>
          </Box>
          <Box paddingLeft={2} flexDirection="column">
            <Text color="#888888">• Chat-style interface with slash commands</Text>
            <Text color="#888888">• Quick access via /run, /info, /tasks, etc.</Text>
            <Text color="#888888">• Conversational workflow execution</Text>
            <Text color="#888888">• Best for rapid iteration and testing</Text>
          </Box>
        </Box>

        <SelectInput
          items={items}
          onSelect={(item) => onSelect(item.value)}
        />
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="#3a3a3a" paddingX={1}>
        <Text color="#888888">↑/↓: Navigate | Enter: Select | ESC: Exit</Text>
      </Box>
    </Box>
  );
};