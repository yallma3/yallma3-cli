import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import SelectInput from 'ink-select-input';
import { WorkspaceStorage } from '../storage/workspace.js';
import { WebSocketClient, ConsoleEvent } from '../core/websocket-client.js';
import { WorkspaceData } from '../models/workspace.js';
import { AgentManager } from './components/agent-manager.js';
import { TaskManager } from './components/task-manager.js';
import { EnvManager } from './components/env-manager.js';
import { WorkflowManager } from './components/workflow-manager.js';
import { PasswordInput } from './components/password-input.js';
import { hasEncryptedData, decryptWorkspace } from '../utils/encryption.js';
import * as fs from 'fs';
import * as path from 'path';
import { Paths } from '../config/paths.js';

interface DashboardClassicProps {
  ws: WebSocketClient;
  onExit: () => void;
}

type View = 'list' | 'password' | 'workspace' | 'execution';
type Tab = 'workspace' | 'tasks' | 'agents' | 'workflows' | 'env';

export const DashboardClassic: React.FC<DashboardClassicProps> = ({ ws, onExit }) => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('workspace');
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceData | null>(null);
  const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceData | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(ws.isConnected());
  const [consoleMessages, setConsoleMessages] = useState<ConsoleEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const [pendingPrompt, setPendingPrompt] = useState<ConsoleEvent | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isAwaitingInput, setIsAwaitingInput] = useState(false);
  
  const { exit } = useApp();
  const { stdout } = useStdout();

  useEffect(() => {
    if (stdout) {
      stdout.write('\x1Bc');
    }
  }, [stdout]);

  useEffect(() => {
    ws.setWarnOnUnhandledRunWorkflow(false);
  }, [ws]);

  // WebSocket event listeners
  useEffect(() => {
    const handleStatus = (status: string) => {
      setWsConnected(status === 'connected');
    };

    const handleConsole = (event: ConsoleEvent) => {
      console.log('📥 Console event received:', {
        type: event.type,
        promptId: event.promptId,
        message: event.message,
        fullEvent: event
      });
      
      setConsoleMessages(prev => [...prev.slice(-100), event]);
      
      if ((event.type === 'console_prompt' || event.message?.toLowerCase().includes('please enter your input')) && event.promptId) {
        console.log('🔔 Prompt detected, promptId:', event.promptId);
        console.log('Setting isAwaitingInput to TRUE');
        setPendingPrompt(event);
        setIsAwaitingInput(true);
        setInputValue('');
      }
      
      // Also handle generic INPUT type
      if (event.type?.toLowerCase() === 'input' && event.promptId) {
        console.log('🔔 INPUT type detected, promptId:', event.promptId);
        setPendingPrompt(event);
        setIsAwaitingInput(true);
        setInputValue('');
      }
      
      // ✅ Handle input resolution
      if (event.type === 'console_input' && event.promptId === pendingPrompt?.promptId) {
        console.log('✅ Input resolved for prompt:', event.promptId);
        setPendingPrompt(null);
        setIsAwaitingInput(false);
        setInputValue('');
      }
      
      if (event.message && event.message.includes('Workspace completed successfully')) {
        setTimeout(() => {
          setIsRunning(false);
        }, 500);
      }
    };

    const handleInputResolved = (data: any) => {
      console.log('✅ Input resolved event:', data);
      setPendingPrompt(null);
      setIsAwaitingInput(false);
      setInputValue('');
    };

    const handleWorkflowResult = (message: any) => {
      console.log('Workflow result received:', message);
      
      if (message.data) {
        let resultMessage = '';
        
        if (message.data.result !== undefined) {
          resultMessage = `Workflow Result: ${JSON.stringify(message.data.result, null, 2)}`;
        } else if (message.data.output !== undefined) {
          resultMessage = `Workflow Output: ${message.data.output}`;
        } else if (message.data.success) {
          resultMessage = `Workflow completed: ${message.data.workflowName || 'Unknown'}`;
        } else {
          resultMessage = `Workflow failed: ${message.data.error || 'Unknown error'}`;
        }

        const completionEvent: ConsoleEvent = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: message.data?.success ? 'success' : 'error',
          message: resultMessage,
          details: message.data,
        };
        setConsoleMessages(prev => [...prev.slice(-100), completionEvent]);
      }
      
      setIsRunning(false);
    };

    ws.on('status', handleStatus);
    ws.on('console', handleConsole);
    ws.on('input_resolved', handleInputResolved);
    ws.on('workflow_result', handleWorkflowResult);

    return () => {
      ws.off('status', handleStatus);
      ws.off('console', handleConsole);
      ws.off('input_resolved', handleInputResolved);
      ws.off('workflow_result', handleWorkflowResult);
    };
  }, [ws, pendingPrompt]);

  // Handle run_workflow requests
  useEffect(() => {
    const handleRunWorkflow = async ({ requestId, workflowId }: any) => {
      console.log(`\n=== HANDLING RUN_WORKFLOW REQUEST ===`);
      console.log(`Request ID: ${requestId}`);
      console.log(`Workflow ID: ${workflowId}`);

      if (!selectedWorkspace) {
        console.error('ERROR: No workspace loaded');
        ws.sendMessage({
          type: 'error',
          id: requestId,
          data: { error: 'No workspace loaded in CLI' }
        });
        
        const errorEvent: ConsoleEvent = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'error',
          message: `Server requested workflow ${workflowId} but no workspace is loaded`
        };
        setConsoleMessages(prev => [...prev.slice(-100), errorEvent]);
        return;
      }

      try {
        const flowsDir = Paths.getWorkflowsDir();
        const workflowPath = path.join(flowsDir, `${workflowId}.json`);

        console.log(`Looking for workflow file: ${workflowPath}`);

        if (!fs.existsSync(workflowPath)) {
          throw new Error(`Workflow file not found: ${workflowId}.json`);
        }

        const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
        const workflowFile = JSON.parse(workflowContent);

        const canvasState = workflowFile.canvasState;

        if (!canvasState) {
          throw new Error(`Workflow ${workflowId} missing canvasState`);
        }

        if (!canvasState.nodes || !Array.isArray(canvasState.nodes)) {
          throw new Error(`Workflow ${workflowId} canvasState missing nodes array`);
        }

        ws.sendWorkflowJson(requestId, canvasState);
        
        console.log(`✅ Successfully sent workflow with ${canvasState.nodes.length} nodes`);

        const successEvent: ConsoleEvent = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'info',
          message: `Sent workflow "${workflowFile.name}" with ${canvasState.nodes.length} nodes`
        };
        setConsoleMessages(prev => [...prev.slice(-100), successEvent]);

      } catch (error: any) {
        console.error(`ERROR in run_workflow handler:`, error);
        
        ws.sendMessage({
          type: 'error',
          id: requestId,
          data: { 
            error: error.message,
            workflowId: workflowId,
            workspace: selectedWorkspace.name
          }
        });
        
        const errorEvent: ConsoleEvent = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'error',
          message: `Failed to load workflow ${workflowId}: ${error.message}`
        };
        setConsoleMessages(prev => [...prev.slice(-100), errorEvent]);
      }
    };

    ws.on('run_workflow', handleRunWorkflow);

    return () => {
      ws.off('run_workflow', handleRunWorkflow);
    };
  }, [ws, selectedWorkspace]);

  // Global key handlers
  useInput((input, key) => {
    if (isAwaitingInput && currentView === 'execution') {
      if (key.escape) {
        setPendingPrompt(null);
        setIsAwaitingInput(false);
        setInputValue('');
      }
      return;
    }
    
    // Normal navigation
    if (key.escape || (key.ctrl && input === 'c')) {
      if (currentView === 'list') {
        onExit();
        exit();
      } else if (currentView === 'password') {
        setPendingWorkspace(null);
        setPasswordError(null);
        setCurrentView('list');
      } else if (currentView === 'execution') {
        setIsRunning(false);
        setConsoleMessages([]);
        setPendingPrompt(null);
        setIsAwaitingInput(false);
        setInputValue('');
        setCurrentView('workspace');
      } else if (currentView === 'workspace') {
        setSelectedWorkspace(null);
        setActiveTab('workspace');
        setCurrentView('list');
      }
    }

    if (currentView === 'workspace' && !isRunning) {
      if (input === '1') setActiveTab('workspace');
      if (input === '2') setActiveTab('tasks');
      if (input === '3') setActiveTab('agents');
      if (input === '4') setActiveTab('workflows');
      if (input === '5') setActiveTab('env');
      
      if (input === 'r' && wsConnected && selectedWorkspace) {
        handleRunWorkspace();
      }
    }
  });

  const handleRunWorkspace = () => {
    if (!selectedWorkspace || !wsConnected) return;

    setIsRunning(true);
    setConsoleMessages([]);
    setPendingPrompt(null);
    setIsAwaitingInput(false);
    setInputValue('');
    setCurrentView('execution');

    const startEvent: ConsoleEvent = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: 'system',
      message: `Starting workspace: ${selectedWorkspace.name}`,
    };
    setConsoleMessages([startEvent]);

    ws.runWorkspace(selectedWorkspace.id, selectedWorkspace);
  };

  const handleWorkspaceSelect = (workspace: WorkspaceData, password?: string) => {
    try {
      let loadedWorkspace = workspace;

      if (hasEncryptedData(workspace)) {
        if (!password) {
          setPendingWorkspace(workspace);
          setPasswordError(null);
          setCurrentView('password');
          return;
        }

        loadedWorkspace = decryptWorkspace(workspace, password);
      }

      setSelectedWorkspace(loadedWorkspace);
      setPendingWorkspace(null);
      setPasswordError(null);
      setActiveTab('workspace');
      setCurrentView('workspace');
    } catch (err: any) {
      if (err.message.includes('decrypt') || err.message.includes('password')) {
        setPasswordError('Invalid password. Please try again.');
      } else {
        setPasswordError(err.message);
      }
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (pendingWorkspace) {
      handleWorkspaceSelect(pendingWorkspace, password);
    }
  };

  const handlePasswordCancel = () => {
    setPendingWorkspace(null);
    setPasswordError(null);
    setCurrentView('list');
  };

  const handleWorkspaceUpdate = (updated: WorkspaceData) => {
    setSelectedWorkspace(updated);
    WorkspaceStorage.save(updated);
  };

  const handleInputSubmit = (value: string) => {
    if (pendingPrompt && value.trim()) {
      console.log('📤 Submitting input:', value);
      ws.sendConsoleInput(pendingPrompt.promptId!, value.trim());
      
      // Add input echo to console
      const inputEcho: ConsoleEvent = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'info',
        message: `> ${value.trim()}`,
      };
      setConsoleMessages(prev => [...prev.slice(-100), inputEcho]);
      
      // Clear input state
      setPendingPrompt(null);
      setIsAwaitingInput(false);
      setInputValue('');
    }
  };

  return (
    <Box key="dashboard-root" flexDirection="column" width="100%" height="100%">
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="round" borderColor="#f4c430" paddingX={2} paddingY={1}>
          <Text bold color="#f4c430">✨ yaLLMa3 Studio </Text>
          <Text color="#888888">- AI Agent Development Environment</Text>
          <Box marginLeft={2}>
            {wsConnected ? (
              <Text color="#4ade80">● API Connected</Text>
            ) : (
              <Text color="#ef4444">○ API Disconnected</Text>
            )}
          </Box>
        </Box>

        <Box flexDirection="column" marginTop={1}>
          {currentView === 'list' && (
            <WorkspaceListView key="workspace-list" onSelect={handleWorkspaceSelect} />
          )}

          {currentView === 'password' && (
            <PasswordInput
              key="password-input"
              message={passwordError || `Enter password to decrypt "${pendingWorkspace?.name}"`}
              onSubmit={handlePasswordSubmit}
              onCancel={handlePasswordCancel}
            />
          )}

          {currentView === 'workspace' && selectedWorkspace && (
            <WorkspaceTabsView
              key={`workspace-${selectedWorkspace.id}`}
              workspace={selectedWorkspace}
              activeTab={activeTab}
              wsConnected={wsConnected}
              onUpdate={handleWorkspaceUpdate}
            />
          )}

          {currentView === 'execution' && selectedWorkspace && (
            <ExecutionView
              key={`execution-${selectedWorkspace.id}`}
              workspace={selectedWorkspace}
              messages={consoleMessages}
              isRunning={isRunning}
              pendingPrompt={pendingPrompt}
              inputValue={inputValue}
              isAwaitingInput={isAwaitingInput}
              onInputChange={setInputValue}
              onInputSubmit={handleInputSubmit}
            />
          )}
        </Box>

        <Box marginTop={1} borderStyle="single" borderColor="#3a3a3a" paddingX={1}>
          <Text color="#888888">
            {currentView === 'list' && 'ESC: Exit | Up/Down: Navigate | Enter: Select'}
            {currentView === 'password' && 'ESC: Cancel | Enter: Submit'}
            {currentView === 'workspace' && '1-5: Switch Tab | R: Run | ESC: Back'}
            {currentView === 'execution' && !isAwaitingInput && 'ESC: Stop Execution'}
            {currentView === 'execution' && isAwaitingInput && 'Type your response and press Enter | ESC: Cancel'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
interface WorkspaceListViewProps {
  onSelect: (workspace: WorkspaceData) => void;
}

const WorkspaceListView: React.FC<WorkspaceListViewProps> = ({ onSelect }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const ws = WorkspaceStorage.loadAll();
      setWorkspaces(ws);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Box paddingX={2}>
        <Text color="#f4c430">
          <Spinner type="dots" />
        </Text>
        <Text color="#888888"> Loading workspaces...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box paddingX={2}>
        <Text color="#ef4444">Error: {error}</Text>
      </Box>
    );
  }

  const items = workspaces.map(ws => ({
    label: `${ws.name} - ${ws.agents?.length || 0} agents, ${ws.tasks?.length || 0} tasks ${hasEncryptedData(ws) ? '🔒' : ''}`,
    value: ws.id,
  }));

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={1}>
        <Text bold color="#f4c430">Workspaces ({workspaces.length})</Text>
      </Box>

      {workspaces.length === 0 ? (
        <Box borderStyle="round" borderColor="#3a3a3a" padding={1}>
          <Text color="#888888">No workspaces found. Create one in Studio first.</Text>
        </Box>
      ) : (
        <SelectInput
          items={items}
          onSelect={(item) => {
            const ws = workspaces.find(w => w.id === item.value);
            if (ws) onSelect(ws);
          }}
        />
      )}
    </Box>
  );
};
interface WorkspaceTabsViewProps {
  workspace: WorkspaceData;
  activeTab: Tab;
  wsConnected: boolean;
  onUpdate: (workspace: WorkspaceData) => void;
}

const WorkspaceTabsView: React.FC<WorkspaceTabsViewProps> = ({
  workspace,
  activeTab,
  wsConnected,
  onUpdate,
}) => {
  const tabs: { id: Tab; label: string; key: string }[] = [
    { id: 'workspace', label: 'Workspace', key: '1' },
    { id: 'tasks', label: 'Tasks', key: '2' },
    { id: 'agents', label: 'Sub Agents', key: '3' },
    { id: 'workflows', label: 'Tools & AI Workflows', key: '4' },
    { id: 'env', label: 'Environment Variables', key: '5' },
  ];

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={1} borderStyle="round" borderColor="#3a3a3a" padding={1}>
        <Box flexDirection="column">
          <Box>
            <Text bold color="#f4c430">{workspace.name}</Text>
            {hasEncryptedData(workspace) && <Text color="#FFA726"> 🔒</Text>}
          </Box>
          {workspace.description && (
            <Text color="#888888">{workspace.description}</Text>
          )}
          <Box marginTop={1}>
            <Text color="#888888">ID: </Text>
            <Text color="#e0e0e0">{workspace.id.substring(0, 12)}</Text>
            <Text color="#888888"> | LLM: </Text>
            <Text color="#60a5fa">{workspace.mainLLM.provider}</Text>
            <Text color="#e0e0e0"> - {workspace.mainLLM.model.name}</Text>
          </Box>
        </Box>
      </Box>

      <Box marginBottom={1}>
        {tabs.map((tab, i) => (
          <Box key={tab.id} marginRight={i < tabs.length - 1 ? 2 : 0}>
            <Text
              bold={tab.id === activeTab}
              color={tab.id === activeTab ? '#f4c430' : '#888888'}
            >
              [{tab.key}] {tab.label}
            </Text>
          </Box>
        ))}
        <Box marginLeft={4}>
          <Text color={wsConnected ? '#4ade80' : '#888888'}>
            {wsConnected ? '[R] Run ▶' : '[R] Run (No API)'}
          </Text>
        </Box>
      </Box>

      <Box borderStyle="round" borderColor="#3a3a3a" padding={1}>
        {activeTab === 'workspace' && <WorkspaceInfoTab workspace={workspace} />}
        {activeTab === 'tasks' && (
          <TaskManager
            workspace={workspace}
            onUpdate={onUpdate}
            onClose={() => {}}
          />
        )}
        {activeTab === 'agents' && (
          <AgentManager
            workspace={workspace}
            onUpdate={onUpdate}
            onClose={() => {}}
          />
        )}
        {activeTab === 'workflows' && (
          <WorkflowManager
            workspace={workspace}
            onClose={() => {}}
          />
        )}
        {activeTab === 'env' && (
          <EnvManager
            workspace={workspace}
            onUpdate={onUpdate}
            onClose={() => {}}
          />
        )}
      </Box>
    </Box>
  );
};

const WorkspaceInfoTab: React.FC<{ workspace: WorkspaceData }> = ({ workspace }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="#fbbf24">Workspace Details</Text>
      </Box>

      <Box flexDirection="column">
        <Box>
          <Text color="#888888">Created: </Text>
          <Text color="#e0e0e0">{new Date(workspace.createdAt).toLocaleString()}</Text>
        </Box>
        <Box>
          <Text color="#888888">Updated: </Text>
          <Text color="#e0e0e0">{new Date(workspace.updatedAt).toLocaleString()}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="#888888">Tasks: </Text>
          <Text bold color="#f4c430">{workspace.tasks?.length || 0}</Text>
        </Box>
        <Box>
          <Text color="#888888">Sub Agents: </Text>
          <Text bold color="#4ade80">{workspace.agents?.length || 0}</Text>
        </Box>
        <Box>
          <Text color="#888888">Workflows: </Text>
          <Text bold color="#60a5fa">{workspace.workflows?.length || 0}</Text>
        </Box>
        <Box>
          <Text color="#888888">Connections: </Text>
          <Text bold color="#fbbf24">{workspace.connections?.length || 0}</Text>
        </Box>
        <Box>
          <Text color="#888888">Environment Variables: </Text>
          <Text bold color="#8b5cf6">{workspace.environmentVariables?.length || 0}</Text>
        </Box>
      </Box>
    </Box>
  );
};
interface ExecutionViewProps {
  workspace: WorkspaceData;
  messages: ConsoleEvent[];
  isRunning: boolean;
  pendingPrompt: ConsoleEvent | null;
  inputValue: string;
  isAwaitingInput: boolean;
  onInputChange: (value: string) => void;
  onInputSubmit: (value: string) => void;
}

const ExecutionView: React.FC<ExecutionViewProps> = ({ 
  workspace, 
  messages, 
  isRunning,
  pendingPrompt,
  inputValue,
  isAwaitingInput,
  onInputChange,
  onInputSubmit
}) => {
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

  const stats = messages.reduce(
    (acc, msg) => {
      if (msg.type === 'error') acc.errors++;
      if (msg.type === 'warning') acc.warnings++;
      if (msg.type === 'success') acc.successes++;
      return acc;
    },
    { errors: 0, warnings: 0, successes: 0 }
  );

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={1} borderStyle="round" borderColor="#3a3a3a" padding={1}>
        <Box flexDirection="column">
          <Box>
            <Text bold color="#f4c430">👁️  Event Console - {workspace.name}</Text>
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
            {isAwaitingInput && (
              <Box marginLeft={2}>
                <Text bold color="#f4c430">⌨️ Awaiting Input</Text>
              </Box>
            )}
          </Box>

          <Box marginTop={1}>
            <Box marginRight={3}>
              <Text color="#888888">Total: </Text>
              <Text bold color="#e0e0e0">{messages.length}</Text>
            </Box>
            <Box marginRight={3}>
              <Text color="#4ade80">✓ {stats.successes}</Text>
            </Box>
            <Box marginRight={3}>
              <Text color="#fbbf24">⚠ {stats.warnings}</Text>
            </Box>
            <Box>
              <Text color="#ef4444">✗ {stats.errors}</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#3a3a3a"
        padding={1}
        height={isAwaitingInput ? 16 : 20}
      >
        {messages.length === 0 ? (
          <Box justifyContent="center" alignItems="center">
            <Text color="#888888">
              No events to display. Events will appear here as they occur.
            </Text>
          </Box>
        ) : (
          messages.slice(-15).map((msg, i) => (
            <Box key={i} marginBottom={0} flexDirection="column">
              <Box>
                <Text color="#888888">{new Date(msg.timestamp).toLocaleTimeString()} </Text>
                <Text color={getMessageColor(msg.type)}>
                  {getMessageIcon(msg.type)} [{msg.type.toUpperCase()}]
                </Text>
                <Text color="#e0e0e0"> {msg.message}</Text>
              </Box>
              {msg.details && (
                <Box marginLeft={4} marginTop={0}>
                  <Text color="#888888">
                    {JSON.stringify(msg.details, null, 2).split('\n').slice(0, 5).join('\n')}
                    {JSON.stringify(msg.details, null, 2).split('\n').length > 5 ? '...' : ''}
                  </Text>
                </Box>
              )}
              {msg.results && (
                <Box marginLeft={4} marginTop={0}>
                  <Text color="#4ade80">
                    Results: {JSON.stringify(msg.results)}
                  </Text>
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>
      {isAwaitingInput && pendingPrompt && (
        <Box 
          marginTop={1} 
          paddingX={1}
          paddingY={1}
          borderStyle="single" 
          borderColor="#f4c430"
          flexDirection="column"
        >
          <Box paddingX={1} paddingBottom={1}>
            <Text bold color="#f4c430">{pendingPrompt.message}</Text>
          </Box>
          <Box paddingX={1}>
            <Text backgroundColor="#1a1a1a">
              <TextInput
                value={inputValue}
                onChange={onInputChange}
                onSubmit={onInputSubmit}
                placeholder="Type your response here..."
                showCursor={true}
              />
            </Text>
          </Box>
        </Box>
      )}

      {messages.length > 15 && !isAwaitingInput && (
        <Box marginTop={1}>
          <Text color="#888888">Showing last 15 of {messages.length} messages</Text>
        </Box>
      )}
    </Box>
  );
};