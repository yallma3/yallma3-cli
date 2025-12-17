// src/tui/components/password-input.tsx - NEW FILE
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface PasswordInputProps {
  message: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  message,
  onSubmit,
  onCancel,
}) => {
  const [password, setPassword] = useState('');

  useInput((input, key) => {
    if (key.return) {
      if (password.length > 0) {
        onSubmit(password);
      }
    } else if (key.escape) {
      onCancel();
    } else if (key.backspace || key.delete) {
      setPassword(prev => prev.slice(0, -1));
    } else if (key.ctrl && input === 'c') {
      onCancel();
    } else if (input && !key.ctrl && !key.meta && input.length === 1) {
      // Only accept single printable characters
      const charCode = input.charCodeAt(0);
      if (charCode >= 32 && charCode <= 126) {
        setPassword(prev => prev + input);
      }
    }
  });

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={1} borderStyle="round" borderColor="#FFA726" padding={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="#FFA726">🔒 Password Required</Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="#e0e0e0">{message}</Text>
          </Box>

          <Box>
            <Text color="#fbbf24">Password: </Text>
            <Text color="#e0e0e0">{'*'.repeat(password.length)}</Text>
            {password.length === 0 && <Text color="#888888">█</Text>}
          </Box>

          <Box marginTop={1}>
            <Text color="#888888">Enter: Submit | ESC: Cancel</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};