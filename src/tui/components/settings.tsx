// src/tui/components/settings.tsx - Settings panel
import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ConfigManager } from '../../config/index.js';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const config = ConfigManager.get();

  useInput((input, key) => {
    if (key.escape) {
      onClose();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="#f4c430">Settings</Text>
      </Box>

      <Box borderStyle="round" borderColor="#3a3a3a" padding={1} flexDirection="column">
        <Text bold color="#fbbf24">API Configuration</Text>
        <Box marginTop={1}>
          <Text color="#888888">URL: </Text>
          <Text color="#e0e0e0">{config.api.url}</Text>
        </Box>
        <Box>
          <Text color="#888888">Timeout: </Text>
          <Text color="#e0e0e0">{config.api.timeout}s</Text>
        </Box>

        <Box marginTop={2}>
          <Text bold color="#fbbf24">Default LLM</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="#888888">Provider: </Text>
          <Text color="#60a5fa">{config.defaults.llm_provider}</Text>
        </Box>
        <Box>
          <Text color="#888888">Model: </Text>
          <Text color="#e0e0e0">{config.defaults.llm_model}</Text>
        </Box>

        <Box marginTop={2}>
          <Text bold color="#fbbf24">Storage</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="#888888">Path: </Text>
          <Text color="#e0e0e0">{config.storage.path}</Text>
        </Box>
      </Box>

      <Box marginTop={2}>
        <Text color="#888888">ESC: Close</Text>
      </Box>
    </Box>
  );
};