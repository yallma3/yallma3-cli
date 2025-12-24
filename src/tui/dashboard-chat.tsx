import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { WorkspaceStorage } from '../storage/workspace.js';
import { WebSocketClient, ConsoleEvent } from '../core/websocket-client.js';
import { WorkspaceData } from '../models/workspace.js';
import { hasEncryptedData, decryptWorkspace } from '../utils/encryption.js';
import * as fs from 'fs';
import * as path from 'path';
import { Paths } from '../config/paths.js';

interface DashboardChatProps {
  ws: WebSocketClient;
  onExit: () => void;
}

type Mode = 'workspace-select' | 'chat' | 'password' | 'prompt';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'info' | 'success' | 'error';
  content: string;
  timestamp: number;
}

interface PromptState {
  active: boolean;
  promptId: string;
  message: string;
}

export const DashboardChat: React.FC<DashboardChatProps> = ({ ws, onExit }) => {
  const [mode, setMode] = useState<Mode>('workspace-select');
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceData | null>(null);
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [wsConnected, setWsConnected] = useState(ws.isConnected());
  const [workspaceList, setWorkspaceList] = useState<WorkspaceData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [promptMode, setPromptMode] = useState<PromptState | null>(null);
  const [promptInput, setPromptInput] = useState('');

  const { exit } = useApp();

  // Load workspaces on mount
  useEffect(() => {
    try {
      const ws = WorkspaceStorage.loadAll();
      setWorkspaceList(ws);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, []);

  // WebSocket setup
  useEffect(() => {
    ws.setWarnOnUnhandledRunWorkflow(false);

    const handleStatus = (status: string) => {
      setWsConnected(status === 'connected');
    };

    const handleConsole = (event: ConsoleEvent) => {
      const msg = event.message || '';
      const msgLower = msg.toLowerCase();
      const isPrompt =
        event.type === 'console_prompt' ||
        event.type === 'console_input' ||
        event.promptId ||
        event.details?.promptId ||
        (msgLower.includes('enter') && msgLower.includes('input')) ||
        msgLower.includes('please enter') ||
        msgLower.includes('provide input') ||
        msgLower === 'input:' ||
        msgLower.endsWith(':');

      if (isPrompt) {
        const promptId = event.promptId ||
                        event.details?.promptId ||
                        event.id ||
                        `prompt-${Date.now()}`;
        addMessage('system', msg);

        setPromptMode({
          active: true,
          promptId: promptId,
          message: event.message
        });
        setPromptInput('');
        setMode('prompt');
        return;
      }

      // Detect different message types and add with appropriate styling
      if (msgLower.includes('starting workspace')) {
        addMessage('info', msg);
      } else if (msgLower.includes('main agent initializing')) {
        addMessage('info', msg);
      } else if (msgLower.includes('running task')) {
        addMessage('info', msg);
      } else if (msgLower.includes('loaded workflow')) {
        addMessage('success', msg);
      } else if (msgLower.includes('task') && msgLower.includes('completed successfully')) {
        addMessage('success', msg);
        setIsExecuting(false);
      } else if (msgLower.includes('workspace completed successfully')) {
        addMessage('success', msg);
      } else if (msg.startsWith('Output:') || msgLower.startsWith('output:')) {
        // Display output messages with SUCCESS styling
        addMessage('success', msg);
      } else if (msgLower.includes('console output:') || msgLower.includes('result:')) {
        // Capture console output or result messages
        addMessage('success', msg);
      } else if (msgLower.includes('results saved to')) {
        // Skip displaying "Results saved to..." messages
        return;
      } else if (msgLower.includes('error') || msgLower.includes('failed')) {
        addMessage('error', msg);
      } else {
        addMessage('system', msg);
      }

      console.log('ℹ️  Regular console message (not a prompt)');
    };

    const handleWorkflowResult = (msg: any) => {
      setIsExecuting(false);
      if (msg.data?.success) {
        addMessage('success', '✓ Workflow completed successfully');
        
        // Display the output if it exists
        if (msg.data.result !== undefined && msg.data.result !== null) {
          const output = typeof msg.data.result === 'string' 
            ? msg.data.result 
            : JSON.stringify(msg.data.result, null, 2);
          addMessage('success', `Output: ${output}`);
        }
      } else {
        addMessage('error', `✗ Workflow failed: ${msg.data?.error || 'Unknown error'}`);
      }
    };

    const handleRunWorkflow = async ({ requestId, workflowId }: any) => {
      if (!workspace) {
        ws.sendMessage({ type: 'error', id: requestId, data: { error: 'No workspace loaded' }});
        return;
      }

      try {
        const flowsDir = Paths.getWorkflowsDir();
        const workflowPath = path.join(flowsDir, `${workflowId}.json`);

        if (!fs.existsSync(workflowPath)) {
          throw new Error(`Workflow not found: ${workflowId}.json`);
        }

        const content = fs.readFileSync(workflowPath, 'utf-8');
        const file = JSON.parse(content);

        if (!file.canvasState?.nodes) {
          throw new Error('Invalid workflow structure');
        }

        ws.sendWorkflowJson(requestId, file.canvasState);
        addMessage('success', `✓ Loaded workflow: ${file.name} (${file.canvasState.nodes.length} nodes)`);
      } catch (error: any) {
        ws.sendMessage({ type: 'error', id: requestId, data: { error: error.message }});
        addMessage('error', `✗ ${error.message}`);
      }
    };

    const handleInputResolved = (data: any) => {
      console.log('✓ Input resolved:', data);
      addMessage('success', '✓ Input accepted by server');
    };

    ws.on('status', handleStatus);
    ws.on('console', handleConsole);
    ws.on('workflow_result', handleWorkflowResult);
    ws.on('run_workflow', handleRunWorkflow);
    ws.on('input_resolved', handleInputResolved);

    return () => {
      ws.off('status', handleStatus);
      ws.off('console', handleConsole);
      ws.off('workflow_result', handleWorkflowResult);
      ws.off('run_workflow', handleRunWorkflow);
      ws.off('input_resolved', handleInputResolved);
    };
  }, [ws, workspace]);

  const addMessage = (role: 'user' | 'assistant' | 'system' | 'info' | 'success' | 'error', content: string) => {
    const id = `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => [...prev, { id, role, content, timestamp: Date.now() }]);
  };

  // Keyboard handlers
  useInput((inp, key) => {
    if (key.escape && mode === 'prompt') {
      setMode('chat');
      setPromptMode(null);
      setPromptInput('');
      addMessage('system', '✗ Prompt cancelled');
      return;
    }

    if (key.escape && mode === 'workspace-select') {
      onExit();
      exit();
    }

    if (key.escape && mode === 'chat') {
      setMode('workspace-select');
      setWorkspace(null);
      setMessages([]);
      setInput('');
    }

    if (key.escape && mode === 'password') {
      setMode('workspace-select');
      setPendingWorkspace(null);
      setPassword('');
      setPasswordError(null);
    }

    // Navigation in workspace select
    if (mode === 'workspace-select' && !key.ctrl && !key.meta) {
      if (key.upArrow) {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      }
      if (key.downArrow) {
        setSelectedIndex(prev => Math.min(workspaceList.length - 1, prev + 1));
      }
      if (key.return && workspaceList.length > 0) {
        handleSelectWorkspace(workspaceList[selectedIndex]);
      }
    }

    // Quick run with Ctrl+R
    if (key.ctrl && inp === 'r' && mode === 'chat' && workspace && wsConnected && !isExecuting) {
      handleRun();
    }
  });

  const handleSelectWorkspace = (ws: WorkspaceData) => {
    if (hasEncryptedData(ws)) {
      setPendingWorkspace(ws);
      setPasswordError(null);
      setMode('password');
    } else {
      setWorkspace(ws);
      setMode('chat');
      addMessage('system', `✓ Loaded workspace: ${ws.name}`);
      addMessage('system', `${ws.agents.length} agents • ${ws.tasks.length} tasks • ${ws.workflows.length} workflows`);
      addMessage('system', 'Type /help to see available commands');
    }
  };

  const handlePasswordSubmit = () => {
    if (!pendingWorkspace || !password) return;

    try {
      const decrypted = decryptWorkspace(pendingWorkspace, password);
      setWorkspace(decrypted);
      setPendingWorkspace(null);
      setPassword('');
      setPasswordError(null);
      setMode('chat');
      addMessage('system', `✓ Loaded workspace: ${decrypted.name}`);
      addMessage('system', `${decrypted.agents.length} agents • ${decrypted.tasks.length} tasks • ${decrypted.workflows.length} workflows`);
      addMessage('system', 'Type /help to see available commands');
    } catch (err: any) {
      setPasswordError('Invalid password');
    }
  };

  const handlePromptSubmit = () => {
    if (!promptMode || !promptInput.trim()) return;

    const response = promptInput.trim();

    console.log('📤 SENDING CONSOLE INPUT:');
    console.log('  Prompt ID:', promptMode.promptId);
    console.log('  Input:', response);

    // Send the response back to server
    ws.sendConsoleInput(promptMode.promptId, response);

    addMessage('user', `[Input] ${response}`);

    // Clear prompt mode
    setPromptInput('');
    setPromptMode(null);
    setMode('chat');
  };

  const handleSubmit = () => {
    if (!input.trim() || !workspace) return;

    const userInput = input.trim();
    setInput('');

    // Handle slash commands
    if (userInput.startsWith('/')) {
      handleCommand(userInput);
      return;
    }

    // Regular message
    addMessage('user', userInput);
    addMessage('system', 'Use /run to execute, /info for details, or /help for all commands');
  };

  const handleCommand = (cmd: string) => {
    const parts = cmd.slice(1).split(' ');
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'run':
        handleRun();
        break;
      case 'info':
        showWorkspaceInfo();
        break;
      case 'tasks':
        showTasks();
        break;
      case 'agents':
        showAgents();
        break;
      case 'workflows':
        showWorkflows();
        break;
      case 'env':
        showEnvironment();
        break;
      case 'prompts':
        getPendingPrompts();
        break;
      case 'clear':
        setMessages([]);
        addMessage('system', '✓ Chat cleared');
        break;
      case 'help':
        showHelp();
        break;
      default:
        addMessage('system', `✗ Unknown command: /${command}. Type /help for available commands.`);
    }
  };

  const handleRun = () => {
    if (!workspace || !wsConnected || isExecuting) {
      if (!wsConnected) {
        addMessage('error', '✗ Cannot run: API not connected');
      } else if (isExecuting) {
        addMessage('error', '✗ Workspace is already running');
      }
      return;
    }

    setIsExecuting(true);
    addMessage('info', `▶ Running workspace: ${workspace.name}...`);
    ws.runWorkspace(workspace.id, workspace);
  };

  const getPendingPrompts = () => {
    addMessage('info', '🔍 Checking for pending prompts...');
    ws.getPendingPrompts();
  };

  const showWorkspaceInfo = () => {
    if (!workspace) return;

    const info = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 Workspace: ${workspace.name}`,
      `🆔 ID: ${workspace.id.substring(0, 12)}...`,
      `🤖 LLM: ${workspace.mainLLM.provider} - ${workspace.mainLLM.model.name}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👥 Sub Agents: ${workspace.agents.length}`,
      `📋 Tasks: ${workspace.tasks.length}`,
      `⚙️  Workflows: ${workspace.workflows.length}`,
      `🔗 Connections: ${workspace.connections?.length || 0}`,
      `🔐 Environment Variables: ${workspace.environmentVariables?.length || 0}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 Created: ${new Date(workspace.createdAt).toLocaleString()}`,
      `📅 Updated: ${new Date(workspace.updatedAt).toLocaleString()}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');

    addMessage('system', info);
  };

  const showTasks = () => {
    if (!workspace || !workspace.tasks || workspace.tasks.length === 0) {
      addMessage('system', '📋 No tasks defined in this workspace');
      return;
    }

    const taskList = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📋 Tasks (${workspace.tasks.length}):`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...workspace.tasks.map((task, i) =>
        `${i + 1}. ${task.title || task.description?.substring(0, 50) || 'Unnamed task'}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');

    addMessage('system', taskList);
  };

  const showAgents = () => {
    if (!workspace || !workspace.agents || workspace.agents.length === 0) {
      addMessage('system', '👥 No sub agents defined in this workspace');
      return;
    }

    const agentList = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👥 Sub Agents (${workspace.agents.length}):`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...workspace.agents.map((agent, i) =>
        `${i + 1}. ${agent.name || 'Unnamed agent'} - ${agent.role || 'No role'}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');

    addMessage('system', agentList);
  };

  const showWorkflows = () => {
    if (!workspace || !workspace.workflows || workspace.workflows.length === 0) {
      addMessage('system', '⚙️  No workflows defined in this workspace');
      return;
    }

    const workflowList = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `⚙️  Workflows (${workspace.workflows.length}):`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...workspace.workflows.map((wf, i) => {
        const workflowName = wf.name || wf.id;
        const nodeCount = wf.canvasState?.nodes?.length || 0;
        return `${i + 1}. ${workflowName} (${nodeCount} nodes)`;
      }),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');

    addMessage('system', workflowList);
  };

  const showEnvironment = () => {
    if (!workspace || !workspace.environmentVariables || workspace.environmentVariables.length === 0) {
      addMessage('system', '🔐 No environment variables defined');
      return;
    }

    const envList = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔐 Environment Variables (${workspace.environmentVariables.length}):`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...workspace.environmentVariables.map((env, i) => {
        const displayValue = env.sensitive
          ? '********'
          : (env.value.length > 30 ? env.value.substring(0, 30) + '...' : env.value);
        return `${i + 1}. ${env.key} = ${displayValue}`;
      }),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');

    addMessage('system', envList);
  };

  const showHelp = () => {
    const help = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✨ yaLLMa3 Studio - Available Commands`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `📊 Workspace Management:`,
      `  /info       - Show workspace details`,
      `  /tasks      - List all tasks`,
      `  /agents     - List all sub agents`,
      `  /workflows  - List all workflows`,
      `  /env        - Show environment variables`,
      ``,
      `▶️  Execution:`,
      `  /run        - Execute the workspace`,
      `  Ctrl+R      - Quick run (shortcut)`,
      `  /prompts    - Check for pending prompts`,
      ``,
      `🛠️  Utilities:`,
      `  /clear      - Clear chat history`,
      `  /help       - Show this help`,
      ``,
      `⌨️  Navigation:`,
      `  Esc         - Go back / Exit`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');

    addMessage('system', help);
  };

  // Render workspace selector
  if (mode === 'workspace-select') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color="#f4c430">✨ yaLLMa3 Studio</Text>
          <Text color="#888888"> - Select a workspace</Text>
        </Box>

        {workspaceList.length === 0 ? (
          <Box flexDirection="column" marginTop={1}>
            <Text color="#888888">No workspaces found.</Text>
            <Text color="#888888">Create a workspace in the Studio application first.</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {workspaceList.map((ws, idx) => (
              <Box key={ws.id}>
                <Text color={idx === selectedIndex ? '#f4c430' : '#e0e0e0'} bold={idx === selectedIndex}>
                  {idx === selectedIndex ? '❯ ' : '  '}
                  {ws.name}
                  {hasEncryptedData(ws) && <Text color="#FFA726"> 🔒</Text>}
                </Text>
                <Text color="#888888"> - {ws.agents.length} agents, {ws.tasks.length} tasks</Text>
              </Box>
            ))}
          </Box>
        )}

        <Box marginTop={2}>
          <Text color="#888888">↑/↓: Navigate | Enter: Select | Esc: Exit</Text>
        </Box>
      </Box>
    );
  }

  // Render password prompt
  if (mode === 'password') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color="#f4c430">🔒 Password Required</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="#888888">Workspace: </Text>
          <Text bold color="#f4c430">{pendingWorkspace?.name}</Text>
        </Box>

        {passwordError && (
          <Box marginBottom={1}>
            <Text color="#ef4444">✗ {passwordError}</Text>
          </Box>
        )}

        <Box marginBottom={1}>
          <Text color="#888888">Password: </Text>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handlePasswordSubmit}
            mask="*"
          />
        </Box>

        <Box marginTop={1}>
          <Text color="#888888">Enter: Submit | Esc: Cancel</Text>
        </Box>
      </Box>
    );
  }

  // Render prompt mode (interactive input)
  if (mode === 'prompt' && promptMode) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color="#f4c430">⚠️  Input Required</Text>
        </Box>

        <Box marginBottom={1} flexDirection="column">
          <Text color="#e0e0e0">{promptMode.message}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="#888888">Prompt ID: </Text>
          <Text color="#666666">{promptMode.promptId.substring(0, 24)}...</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="#f4c430">❯ </Text>
          <TextInput
            value={promptInput}
            onChange={setPromptInput}
            onSubmit={handlePromptSubmit}
            placeholder="Type your response..."
            focus={true}
          />
        </Box>

        <Box marginTop={1}>
          <Text color="#888888">Enter: Submit Response | Esc: Cancel</Text>
        </Box>
      </Box>
    );
  }

  // Render chat interface (main mode)
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="#f4c430">✨ {workspace?.name || 'yaLLMa3 Studio'}</Text>
        <Text color="#888888"> • </Text>
        {wsConnected ? (
          <Text color="#4ade80">● Connected</Text>
        ) : (
          <Text color="#ef4444">○ Disconnected</Text>
        )}
        {isExecuting && (
          <>
            <Text color="#888888"> • </Text>
            <Text color="#f4c430">
              <Spinner type="dots" />
            </Text>
            <Text color="#f4c430"> Running</Text>
          </>
        )}
      </Box>

      {/* Messages */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.length === 0 ? (
          <Text color="#888888">Type /help for available commands</Text>
        ) : (
          messages.slice(-15).map((msg) => (
            <Box key={msg.id} marginBottom={1} flexDirection="column">
              {msg.role === 'user' && (
                <Box>
                  <Text bold color="#60a5fa">You: </Text>
                  <Text color="#e0e0e0">{msg.content}</Text>
                </Box>
              )}
              {msg.role === 'assistant' && (
                <Box>
                  <Text bold color="#4ade80">AI: </Text>
                  <Text color="#e0e0e0">{msg.content}</Text>
                </Box>
              )}
              {msg.role === 'system' && (
                <Text color="#888888">{msg.content}</Text>
              )}
              {msg.role === 'info' && (
                <Box>
                  <Text color="#60a5fa" bold>[INFO] </Text>
                  <Text color="#e0e0e0">{msg.content}</Text>
                </Box>
              )}
              {msg.role === 'success' && (
                <Box>
                  <Text color="#4ade80" bold>[SUCCESS] </Text>
                  <Text color="#e0e0e0">{msg.content}</Text>
                </Box>
              )}
              {msg.role === 'error' && (
                <Box>
                  <Text color="#ef4444" bold>[ERROR] </Text>
                  <Text color="#e0e0e0">{msg.content}</Text>
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Input */}
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="#f4c430">❯ </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Type /help for commands..."
          />
        </Box>

        <Box marginTop={1}>
          <Text color="#888888">
            /run: Execute | /info: Details | /tasks /agents /workflows /env /prompts | /clear | Ctrl+R | Esc: Back
          </Text>
        </Box>
      </Box>
    </Box>
  );
};