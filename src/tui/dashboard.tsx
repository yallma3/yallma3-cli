// // // src/tui/dashboard.tsx - Main dashboard TUI with yaLLMa3 Studio theme
// // import React, { useState, useEffect } from 'react';
// // import { Box, Text, useInput, useApp } from 'ink';
// // import Spinner from 'ink-spinner';
// // import SelectInput from 'ink-select-input';
// // import TextInput from 'ink-text-input';
// // import { WorkspaceStorage } from '../storage/workspace.js';
// // import { SessionManager } from '../core/session.js';
// // import { WebSocketClient } from '../core/websocket-client.js';
// // import { WorkspaceData } from '../models/workspace.js';
// // import { AgentManager } from './components/agent-manager.js';
// // import { TaskManager } from './components/task-manager.js';
// // import { EnvManager } from './components/env-manager.js';
// // import { WorkflowManager } from './components/workflow-manager.js';
// // import { Settings } from './components/settings.js';

// // interface DashboardProps {
// //   session: SessionManager;
// //   ws: WebSocketClient;
// //   onExit: () => void;
// // }

// // type View = 'home' | 'workspaces' | 'agents' | 'tasks' | 'execution' | 'settings' | 'env' | 'workflows';

// // // Studio color palette
// // const COLORS = {
// //   primary: '#f4c430',      // Golden yellow
// //   background: '#0a0a0a',   // Pure black
// //   surface: '#1a1a1a',      // Dark gray
// //   border: '#3a3a3a',       // Medium gray
// //   text: '#e0e0e0',         // Light gray
// //   textDim: '#888888',      // Dim gray
// //   success: '#4ade80',      // Green
// //   error: '#ef4444',        // Red
// //   warning: '#fbbf24',      // Yellow/amber
// //   info: '#60a5fa',         // Blue
// //   accent: '#8b5cf6',       // Purple
// // };

// // export const Dashboard: React.FC<DashboardProps> = ({ session, ws, onExit }) => {
// //   const [currentView, setCurrentView] = useState<View>('home');
// //   const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceData | null>(
// //     session.getActiveWorkspace()
// //   );
// //   const [wsConnected, setWsConnected] = useState(ws.isConnected());
// //   const [consoleMessages, setConsoleMessages] = useState<any[]>([]);
// //   const { exit } = useApp();

// //   useEffect(() => {
// //     const handleStatus = (status: string) => {
// //       setWsConnected(status === 'connected');
// //     };

// //     const handleConsole = (message: any) => {
// //       setConsoleMessages(prev => [...prev.slice(-20), message]);
// //     };

// //     ws.on('status', handleStatus);
// //     ws.on('console', handleConsole);

// //     return () => {
// //       ws.off('status', handleStatus);
// //       ws.off('console', handleConsole);
// //     };
// //   }, [ws]);

// //   useInput((input, key) => {
// //     if (key.escape || (key.ctrl && input === 'c')) {
// //       if (currentView === 'home') {
// //         onExit();
// //         exit();
// //       } else {
// //         setCurrentView('home');
// //       }
// //     }
// //   });

// //   const renderView = () => {
// //     switch (currentView) {
// //       case 'home':
// //         return <HomeView 
// //           session={session} 
// //           ws={ws}
// //           activeWorkspace={activeWorkspace}
// //           wsConnected={wsConnected}
// //           onNavigate={setCurrentView}
// //         />;
// //       case 'workspaces':
// //         return <WorkspacesView 
// //           session={session}
// //           onBack={() => setCurrentView('home')}
// //           onSelect={(ws) => {
// //             setActiveWorkspace(ws);
// //             session.setActiveWorkspace(ws.id);
// //           }}
// //         />;
// //       case 'execution':
// //         return <ExecutionView 
// //           messages={consoleMessages}
// //           activeWorkspace={activeWorkspace}
// //           onBack={() => setCurrentView('home')}
// //         />;
// //         case 'agents':
// //         return <AgentManager 
// //           workspaceId={activeWorkspace!.id}
// //           onClose={() => setCurrentView('home')}
// //         />;
// //       case 'tasks':
// //         return <TaskManager 
// //           workspaceId={activeWorkspace!.id}
// //           onClose={() => setCurrentView('home')}
// //         />;
// //        case 'env':
// //         return activeWorkspace ? (
// //           <EnvManager 
// //             workspaceId={activeWorkspace.id}
// //             onClose={() => setCurrentView('home')}
// //           />
// //         ) : null;
// //       case 'workflows':
// //         return activeWorkspace ? (
// //           <WorkflowManager 
// //             workspaceId={activeWorkspace.id}
// //             onClose={() => setCurrentView('home')}
// //           />
// //         ) : null;
// //       case 'settings':
// //         return <Settings onClose={() => setCurrentView('home')} />;
// //       default:
// //         return <HomeView 
// //           session={session} 
// //           ws={ws}
// //           activeWorkspace={activeWorkspace}
// //           wsConnected={wsConnected}
// //           onNavigate={setCurrentView}
// //         />;
// //     }
// //   };

// //   return (
// //     <Box flexDirection="column" padding={1}>
// //       <Header wsConnected={wsConnected} activeWorkspace={activeWorkspace} />
// //       <Box flexDirection="column" marginTop={1}>
// //         {renderView()}
// //       </Box>
// //       <Footer currentView={currentView} />
// //     </Box>
// //   );
// // };

// // // Header Component with Studio styling
// // const Header: React.FC<{ wsConnected: boolean; activeWorkspace: WorkspaceData | null }> = ({
// //   wsConnected,
// //   activeWorkspace
// // }) => {
// //   return (
// //     <Box flexDirection="column" borderStyle="round" borderColor="#3a3a3a" paddingX={2} paddingY={1}>
// //       <Box>
// //         <Text bold color="#f4c430">✨ yaLLMa3 Studio </Text>
// //         <Text color="#888888">- AI Agent Development Environment</Text>
// //         <Box marginLeft={2}>
// //           {wsConnected ? (
// //             <Text color="#4ade80">● API Connected</Text>
// //           ) : (
// //             <Text color="#ef4444">○ API Disconnected</Text>
// //           )}
// //         </Box>
// //       </Box>
// //       {activeWorkspace && (
// //         <Box marginTop={1}>
// //           <Text color="#888888">Active Workspace: </Text>
// //           <Text bold color="#f4c430">{activeWorkspace.name}</Text>
// //           <Text color="#888888"> ({activeWorkspace.id.substring(0, 12)})</Text>
// //         </Box>
// //       )}
// //     </Box>
// //   );
// // };

// // // Footer Component
// // const Footer: React.FC<{ currentView: View }> = ({ currentView }) => {
// //   return (
// //     <Box marginTop={1} borderStyle="single" borderColor="#3a3a3a" paddingX={1}>
// //       <Text color="#888888">
// //         {currentView === 'home' ? 'ESC/Ctrl+C: Exit' : 'ESC: Back'} | 
// //         Tab: Navigate | Enter: Select
// //       </Text>
// //     </Box>
// //   );
// // };

// // // Home View with Studio theme
// // interface HomeViewProps {
// //   session: SessionManager;
// //   ws: WebSocketClient;
// //   activeWorkspace: WorkspaceData | null;
// //   wsConnected: boolean;
// //   onNavigate: (view: View) => void;
// // }

// // const HomeView: React.FC<HomeViewProps> = ({ 
// //   session, 
// //   ws, 
// //   activeWorkspace, 
// //   wsConnected,
// //   onNavigate 
// // }) => {
// //   const menuItems = [
// //     { label: '📋 Workspaces', value: 'workspaces' },
// //     { label: '🤖 Sub Agents', value: 'agents', disabled: !activeWorkspace },
// //     { label: '📝 Tasks', value: 'tasks', disabled: !activeWorkspace },
// //     { label: '🔧 Tools & AI Workflows', value: 'tools', disabled: !activeWorkspace },
// //     { label: '🔐 Environment Variables', value: 'env', disabled: !activeWorkspace },
// //     { label: '▶️  Run Workspace', value: 'run', disabled: !activeWorkspace || !wsConnected },
// //     { label: '👁️  Execution Monitor', value: 'execution' },
// //     { label: '⚙️  Settings', value: 'settings' },
// //     { label: '🚪 Exit', value: 'exit' },
// //   ];

// //   const handleSelect = (item: any) => {
// //     if (item.value === 'exit') {
// //       process.exit(0);
// //     } else if (item.value === 'run' && activeWorkspace) {
// //       ws.runWorkspace(activeWorkspace.id, activeWorkspace);
// //       onNavigate('execution');
// //     } else {
// //       onNavigate(item.value as View);
// //     }
// //   };

// //   return (
// //     <Box flexDirection="column" paddingX={2}>
// //       <Box marginBottom={1}>
// //         <Text bold color="#f4c430">Main Menu</Text>
// //       </Box>
      
// //       {/* Status Cards */}
// //       <Box flexDirection="row" marginBottom={2} gap={2}>
// //         <StatusCard
// //           title="Workspaces"
// //           value={WorkspaceStorage.loadAll().length}
// //           icon="📦"
// //           color="#60a5fa"
// //         />
// //         <StatusCard
// //           title="Sub Agents"
// //           value={activeWorkspace?.agents.length || 0}
// //           icon="🤖"
// //           color="#4ade80"
// //           disabled={!activeWorkspace}
// //         />
// //         <StatusCard
// //           title="Tasks"
// //           value={activeWorkspace?.tasks.length || 0}
// //           icon="📝"
// //           color="#fbbf24"
// //           disabled={!activeWorkspace}
// //         />
// //         <StatusCard
// //           title="API Status"
// //           value={wsConnected ? 'Connected' : 'Offline'}
// //           icon="🔌"
// //           color={wsConnected ? '#4ade80' : '#ef4444'}
// //         />
// //       </Box>

// //       <SelectInput items={menuItems} onSelect={handleSelect} />
      
// //       {/* Recent Activity */}
// //       <Box marginTop={2} borderStyle="single" borderColor="#3a3a3a" padding={1}>
// //         <Box flexDirection="column">
// //           <Text bold color="#888888">Recent Workspaces</Text>
// //           {session.getRecentWorkspaces().slice(0, 3).map((ws, i) => (
// //             <Box key={ws.id} marginTop={1}>
// //               <Text color="#888888">• </Text>
// //               <Text color="#e0e0e0">{ws.name}</Text>
// //               <Text color="#888888"> - {new Date(ws.updatedAt).toLocaleDateString()}</Text>
// //             </Box>
// //           ))}
// //         {session.getRecentWorkspaces().length === 0 && (
// //           <Box marginTop={1}>
// //             <Text color="#888888">No recent workspaces</Text>
// //           </Box>
// //         )}
// //         </Box>
// //       </Box>
// //     </Box>
// //   );
// // };

// // // Status Card Component with Studio colors
// // interface StatusCardProps {
// //   title: string;
// //   value: string | number;
// //   icon: string;
// //   color?: string;
// //   disabled?: boolean;
// // }

// // const StatusCard: React.FC<StatusCardProps> = ({ 
// //   title, 
// //   value, 
// //   icon, 
// //   color = '#e0e0e0',
// //   disabled = false 
// // }) => {
// //   return (
// //     <Box 
// //       borderStyle="round" 
// //       borderColor={disabled ? '#3a3a3a' : color} 
// //       paddingX={2} 
// //       paddingY={1}
// //       marginRight={2}
// //       width={20}
// //     >
// //       <Box flexDirection="column">
// //         <Box>
// //           <Text>{icon} </Text>
// //           <Text bold color={disabled ? '#888888' : color}>{value}</Text>
// //         </Box>
// //         <Text color="#888888">{title}</Text>
// //       </Box>
// //     </Box>
// //   );
// // };

// // // Workspaces View with Studio theme
// // interface WorkspacesViewProps {
// //   session: SessionManager;
// //   onBack: () => void;
// //   onSelect: (workspace: WorkspaceData) => void;
// // }

// // const WorkspacesView: React.FC<WorkspacesViewProps> = ({ session, onBack, onSelect }) => {
// //   const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [isSearching, setIsSearching] = useState(false);

// //   useEffect(() => {
// //     const loadWorkspaces = () => {
// //       const ws = WorkspaceStorage.loadAll();
// //       setWorkspaces(ws);
// //       setLoading(false);
// //     };
// //     loadWorkspaces();
// //   }, []);

// //   useInput((input, key) => {
// //     if (key.return && isSearching) {
// //       setIsSearching(false);
// //     } else if (input === '/' && !isSearching) {
// //       setIsSearching(true);
// //     } else if (key.escape) {
// //       if (isSearching) {
// //         setIsSearching(false);
// //         setSearchQuery('');
// //       } else {
// //         onBack();
// //       }
// //     }
// //   });

// //   if (loading) {
// //     return (
// //       <Box>
// //         <Text color="#f4c430">
// //           <Spinner type="dots" />
// //         </Text>
// //         <Text color="#888888"> Loading workspaces...</Text>
// //       </Box>
// //     );
// //   }

// //   const filteredWorkspaces = workspaces.filter(ws =>
// //     ws.name.toLowerCase().includes(searchQuery.toLowerCase())
// //   );

// //   const workspaceItems = filteredWorkspaces.map(ws => ({
// //     label: `${ws.name} - ${ws.agents.length} agents, ${ws.tasks.length} tasks`,
// //     value: ws.id,
// //   }));

// //   return (
// //     <Box flexDirection="column" paddingX={2}>
// //       <Box marginBottom={1}>
// //         <Text bold color="#f4c430">Workspaces ({filteredWorkspaces.length})</Text>
// //       </Box>

// //       {isSearching ? (
// //         <Box marginBottom={1}>
// //           <Text color="#fbbf24">Search: </Text>
// //           <TextInput 
// //             value={searchQuery} 
// //             onChange={setSearchQuery}
// //             placeholder="Type to filter..."
// //           />
// //         </Box>
// //       ) : (
// //         <Box marginBottom={1}>
// //           <Text color="#888888">Press / to search, ESC to go back</Text>
// //         </Box>
// //       )}

// //       {workspaceItems.length > 0 ? (
// //         <SelectInput 
// //           items={workspaceItems} 
// //           onSelect={(item) => {
// //             const workspace = workspaces.find(ws => ws.id === item.value);
// //             if (workspace) {
// //               onSelect(workspace);
// //               onBack();
// //             }
// //           }}
// //         />
// //       ) : (
// //         <Box marginTop={1}>
// //           <Text color="#fbbf24">No workspaces found</Text>
// //         </Box>
// //       )}
// //     </Box>
// //   );
// // };

// // // Execution Monitor View with Studio theme
// // interface ExecutionViewProps {
// //   messages: any[];
// //   activeWorkspace: WorkspaceData | null;
// //   onBack: () => void;
// // }

// // const ExecutionView: React.FC<ExecutionViewProps> = ({ messages, activeWorkspace, onBack }) => {
// //   const [autoScroll, setAutoScroll] = useState(true);

// //   useInput((input) => {
// //     if (input === 'a') {
// //       setAutoScroll(!autoScroll);
// //     }
// //   });

// //   return (
// //     <Box flexDirection="column" paddingX={2}>
// //       <Box marginBottom={1}>
// //         <Text bold color="#f4c430">Event Console</Text>
// //         {activeWorkspace && (
// //           <Text color="#888888"> - {activeWorkspace.name}</Text>
// //         )}
// //       </Box>

// //       <Box marginBottom={1}>
// //         <Text color="#888888">
// //           Auto-scroll: {autoScroll ? 'ON' : 'OFF'} (press 'a') | ESC: Back
// //         </Text>
// //       </Box>

// //       <Box 
// //         flexDirection="column" 
// //         borderStyle="round" 
// //         borderColor="#3a3a3a"
// //         padding={1}
// //         height={20}
// //       >
// //         {messages.length === 0 ? (
// //           <Box>
// //             <Text color="#888888">No events to display. Events will appear here as they occur.</Text>
// //           </Box>
// //         ) : (
// //           messages.slice(-15).map((msg, i) => (
// //             <Box key={i} marginBottom={0}>
// //               <Text color="#888888">{new Date(msg.timestamp).toLocaleTimeString()} </Text>
// //               <Text color={getMessageColor(msg.type)}>[{msg.type.toUpperCase()}] </Text>
// //               <Text color="#e0e0e0">{msg.message}</Text>
// //             </Box>
// //           ))
// //         )}
// //       </Box>

// //       {messages.length > 0 && (
// //         <Box marginTop={1}>
// //           <Text color="#888888">Total messages: {messages.length}</Text>
// //         </Box>
// //       )}
// //     </Box>
// //   );
// // };

// // function getMessageColor(type: string): string {
// //   switch (type) {
// //     case 'error': return '#ef4444';
// //     case 'warning': return '#fbbf24';
// //     case 'success': return '#4ade80';
// //     case 'info': return '#60a5fa';
// //     default: return '#e0e0e0';
// //   }
// // }
// // src/tui/dashboard.tsx - REPLACE ENTIRE FILE
// import React, { useState, useEffect } from 'react';
// import { Box, Text, useInput, useApp } from 'ink';
// import Spinner from 'ink-spinner';
// import SelectInput from 'ink-select-input';
// import { WorkspaceStorage } from '../storage/workspace.js';
// import { WebSocketClient, ConsoleEvent } from '../core/websocket-client.js';
// import { WorkspaceData } from '../models/workspace.js';
// import { AgentManager } from './components/agent-manager.js';
// import { TaskManager } from './components/task-manager.js';
// import { EnvManager } from './components/env-manager.js';
// import { WorkflowManager } from './components/workflow-manager.js';
// import { PasswordInput } from './components/password-input.js';
// import { hasEncryptedData, decryptWorkspace } from '../utils/encryption.js';

// interface DashboardProps {
//   ws: WebSocketClient;
//   onExit: () => void;
// }

// type View = 'list' | 'password' | 'workspace' | 'execution';
// type Tab = 'workspace' | 'tasks' | 'agents' | 'workflows' | 'env';

// export const Dashboard: React.FC<DashboardProps> = ({ ws, onExit }) => {
//   const [currentView, setCurrentView] = useState<View>('list');
//   const [activeTab, setActiveTab] = useState<Tab>('workspace');
//   const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceData | null>(null);
//   const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceData | null>(null);
//   const [passwordError, setPasswordError] = useState<string | null>(null);
//   const [wsConnected, setWsConnected] = useState(ws.isConnected());
//   const [consoleMessages, setConsoleMessages] = useState<ConsoleEvent[]>([]);
//   const [isRunning, setIsRunning] = useState(false);
//   const { exit } = useApp();

//   // WebSocket event listeners
//   useEffect(() => {
//     const handleStatus = (status: string) => {
//       setWsConnected(status === 'connected');
//     };

//     const handleConsole = (event: ConsoleEvent) => {
//       setConsoleMessages(prev => [...prev.slice(-100), event]);
//     };

//     ws.on('status', handleStatus);
//     ws.on('console', handleConsole);

//     return () => {
//       ws.off('status', handleStatus);
//       ws.off('console', handleConsole);
//     };
//   }, [ws]);

//   // Global key handlers
//   useInput((input, key) => {
//     if (key.escape || (key.ctrl && input === 'c')) {
//       if (currentView === 'list') {
//         onExit();
//         exit();
//       } else if (currentView === 'password') {
//         setPendingWorkspace(null);
//         setPasswordError(null);
//         setCurrentView('list');
//       } else if (currentView === 'execution') {
//         setIsRunning(false);
//         setConsoleMessages([]);
//         setCurrentView('workspace');
//       } else if (currentView === 'workspace') {
//         setSelectedWorkspace(null);
//         setActiveTab('workspace');
//         setCurrentView('list');
//       }
//     }

//     // Tab switching (only in workspace view)
//     if (currentView === 'workspace' && !isRunning) {
//       if (input === '1') setActiveTab('workspace');
//       if (input === '2') setActiveTab('tasks');
//       if (input === '3') setActiveTab('agents');
//       if (input === '4') setActiveTab('workflows');
//       if (input === '5') setActiveTab('env');
      
//       // Run workspace
//       if (input === 'r' && wsConnected && selectedWorkspace) {
//         setIsRunning(true);
//         setConsoleMessages([]);
//         setCurrentView('execution');
//         ws.runWorkspace(selectedWorkspace.id, selectedWorkspace);
//       }
//     }
//   });

//   const handleWorkspaceSelect = (workspace: WorkspaceData, password?: string) => {
//     try {
//       let loadedWorkspace = workspace;

//       // Check if needs decryption
//       if (hasEncryptedData(workspace)) {
//         if (!password) {
//           // Need password
//           setPendingWorkspace(workspace);
//           setPasswordError(null);
//           setCurrentView('password');
//           return;
//         }

//         // Decrypt with password
//         loadedWorkspace = decryptWorkspace(workspace, password);
//       }

//       // Success - load workspace
//       setSelectedWorkspace(loadedWorkspace);
//       setPendingWorkspace(null);
//       setPasswordError(null);
//       setActiveTab('workspace');
//       setCurrentView('workspace');
//     } catch (err: any) {
//       if (err.message.includes('decrypt') || err.message.includes('password')) {
//         setPasswordError('Invalid password. Please try again.');
//       } else {
//         setPasswordError(err.message);
//       }
//     }
//   };

//   const handlePasswordSubmit = (password: string) => {
//     if (pendingWorkspace) {
//       handleWorkspaceSelect(pendingWorkspace, password);
//     }
//   };

//   const handlePasswordCancel = () => {
//     setPendingWorkspace(null);
//     setPasswordError(null);
//     setCurrentView('list');
//   };

//   const handleWorkspaceUpdate = (updated: WorkspaceData) => {
//     setSelectedWorkspace(updated);
//     // Save to storage
//     WorkspaceStorage.save(updated);
//   };

//   return (
//     <Box flexDirection="column" padding={1}>
//       {/* Header */}
//       <Box borderStyle="round" borderColor="#f4c430" paddingX={2} paddingY={1}>
//         <Text bold color="#f4c430">✨ yaLLMa3 Studio </Text>
//         <Text color="#888888">- AI Agent Development Environment</Text>
//         <Box marginLeft={2}>
//           {wsConnected ? (
//             <Text color="#4ade80">● API Connected</Text>
//           ) : (
//             <Text color="#ef4444">○ API Disconnected</Text>
//           )}
//         </Box>
//       </Box>

//       {/* Main Content */}
//       <Box flexDirection="column" marginTop={1}>
//         {currentView === 'list' && (
//           <WorkspaceListView onSelect={handleWorkspaceSelect} />
//         )}

//         {currentView === 'password' && (
//           <PasswordInput
//             message={passwordError || `Enter password to decrypt "${pendingWorkspace?.name}"`}
//             onSubmit={handlePasswordSubmit}
//             onCancel={handlePasswordCancel}
//           />
//         )}

//         {currentView === 'workspace' && selectedWorkspace && (
//           <WorkspaceTabsView
//             workspace={selectedWorkspace}
//             activeTab={activeTab}
//             wsConnected={wsConnected}
//             onUpdate={handleWorkspaceUpdate}
//           />
//         )}

//         {currentView === 'execution' && selectedWorkspace && (
//           <ExecutionView
//             workspace={selectedWorkspace}
//             messages={consoleMessages}
//             isRunning={isRunning}
//           />
//         )}
//       </Box>

//       {/* Footer */}
//       <Box marginTop={1} borderStyle="single" borderColor="#3a3a3a" paddingX={1}>
//         <Text color="#888888">
//           {currentView === 'list' && 'ESC: Exit | Up/Down: Navigate | Enter: Select'}
//           {currentView === 'password' && 'ESC: Cancel | Enter: Submit'}
//           {currentView === 'workspace' && '1-5: Switch Tab | R: Run | ESC: Back'}
//           {currentView === 'execution' && 'ESC: Stop Execution'}
//         </Text>
//       </Box>
//     </Box>
//   );
// };

// // ========== WORKSPACE LIST VIEW ==========
// interface WorkspaceListViewProps {
//   onSelect: (workspace: WorkspaceData) => void;
// }

// const WorkspaceListView: React.FC<WorkspaceListViewProps> = ({ onSelect }) => {
//   const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     try {
//       const ws = WorkspaceStorage.loadAll();
//       setWorkspaces(ws);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   if (loading) {
//     return (
//       <Box paddingX={2}>
//         <Text color="#f4c430">
//           <Spinner type="dots" />
//         </Text>
//         <Text color="#888888"> Loading workspaces...</Text>
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box paddingX={2}>
//         <Text color="#ef4444">Error: {error}</Text>
//       </Box>
//     );
//   }

//   const items = workspaces.map(ws => ({
//     label: `${ws.name} - ${ws.agents?.length || 0} agents, ${ws.tasks?.length || 0} tasks ${hasEncryptedData(ws) ? '🔒' : ''}`,
//     value: ws.id,
//   }));

//   return (
//     <Box flexDirection="column" paddingX={2}>
//       <Box marginBottom={1}>
//         <Text bold color="#f4c430">Workspaces ({workspaces.length})</Text>
//       </Box>

//       {workspaces.length === 0 ? (
//         <Box borderStyle="round" borderColor="#3a3a3a" padding={1}>
//           <Text color="#888888">No workspaces found. Create one in Studio first.</Text>
//         </Box>
//       ) : (
//         <SelectInput
//           items={items}
//           onSelect={(item) => {
//             const ws = workspaces.find(w => w.id === item.value);
//             if (ws) onSelect(ws);
//           }}
//         />
//       )}
//     </Box>
//   );
// };

// // ========== WORKSPACE TABS VIEW ==========
// interface WorkspaceTabsViewProps {
//   workspace: WorkspaceData;
//   activeTab: Tab;
//   wsConnected: boolean;
//   onUpdate: (workspace: WorkspaceData) => void;
// }

// const WorkspaceTabsView: React.FC<WorkspaceTabsViewProps> = ({
//   workspace,
//   activeTab,
//   wsConnected,
//   onUpdate,
// }) => {
//   const tabs: { id: Tab; label: string; key: string }[] = [
//     { id: 'workspace', label: 'Workspace', key: '1' },
//     { id: 'tasks', label: 'Tasks', key: '2' },
//     { id: 'agents', label: 'Sub Agents', key: '3' },
//     { id: 'workflows', label: 'Tools & AI Workflows', key: '4' },
//     { id: 'env', label: 'Environment Variables', key: '5' },
//   ];

//   return (
//     <Box flexDirection="column" paddingX={2}>
//       {/* Workspace Header */}
//       <Box marginBottom={1} borderStyle="round" borderColor="#3a3a3a" padding={1}>
//         <Box flexDirection="column">
//           <Box>
//             <Text bold color="#f4c430">{workspace.name}</Text>
//             {hasEncryptedData(workspace) && <Text color="#FFA726"> 🔒</Text>}
//           </Box>
//           {workspace.description && (
//             <Text color="#888888">{workspace.description}</Text>
//           )}
//           <Box marginTop={1}>
//             <Text color="#888888">ID: </Text>
//             <Text color="#e0e0e0">{workspace.id.substring(0, 12)}</Text>
//             <Text color="#888888"> | LLM: </Text>
//             <Text color="#60a5fa">{workspace.mainLLM.provider}</Text>
//             <Text color="#e0e0e0"> - {workspace.mainLLM.model.name}</Text>
//           </Box>
//         </Box>
//       </Box>

//       {/* Tabs */}
//       <Box marginBottom={1}>
//         {tabs.map((tab, i) => (
//           <Box key={tab.id} marginRight={i < tabs.length - 1 ? 2 : 0}>
//             <Text
//               bold={tab.id === activeTab}
//               color={tab.id === activeTab ? '#f4c430' : '#888888'}
//             >
//               [{tab.key}] {tab.label}
//             </Text>
//           </Box>
//         ))}
//         <Box marginLeft={4}>
//           <Text color={wsConnected ? '#4ade80' : '#888888'}>
//             {wsConnected ? '[R] Run ▶' : '[R] Run (No API)'}
//           </Text>
//         </Box>
//       </Box>

//       {/* Tab Content */}
//       <Box borderStyle="round" borderColor="#3a3a3a" padding={1}>
//         {activeTab === 'workspace' && <WorkspaceInfoTab workspace={workspace} />}
//         {activeTab === 'tasks' && (
//           <TaskManager
//             workspace={workspace}
//             onUpdate={onUpdate}
//             onClose={() => {}}
//           />
//         )}
//         {activeTab === 'agents' && (
//           <AgentManager
//             workspace={workspace}
//             onUpdate={onUpdate}
//             onClose={() => {}}
//           />
//         )}
//         {activeTab === 'workflows' && (
//           <WorkflowManager
//             workspaceId={workspace.id}
//             onClose={() => {}}
//           />
//         )}
//         {activeTab === 'env' && (
//           <EnvManager
//             workspace={workspace}
//             onUpdate={onUpdate}
//             onClose={() => {}}
//           />
//         )}
//       </Box>
//     </Box>
//   );
// };

// // Workspace Info Tab
// const WorkspaceInfoTab: React.FC<{ workspace: WorkspaceData }> = ({ workspace }) => {
//   return (
//     <Box flexDirection="column">
//       <Box marginBottom={1}>
//         <Text bold color="#fbbf24">Workspace Details</Text>
//       </Box>

//       <Box flexDirection="column">
//         <Box>
//           <Text color="#888888">Created: </Text>
//           <Text color="#e0e0e0">{new Date(workspace.createdAt).toLocaleString()}</Text>
//         </Box>
//         <Box>
//           <Text color="#888888">Updated: </Text>
//           <Text color="#e0e0e0">{new Date(workspace.updatedAt).toLocaleString()}</Text>
//         </Box>
//         <Box marginTop={1}>
//           <Text color="#888888">Tasks: </Text>
//           <Text bold color="#f4c430">{workspace.tasks?.length || 0}</Text>
//         </Box>
//         <Box>
//           <Text color="#888888">Sub Agents: </Text>
//           <Text bold color="#4ade80">{workspace.agents?.length || 0}</Text>
//         </Box>
//         <Box>
//           <Text color="#888888">Workflows: </Text>
//           <Text bold color="#60a5fa">{workspace.workflows?.length || 0}</Text>
//         </Box>
//         <Box>
//           <Text color="#888888">Connections: </Text>
//           <Text bold color="#fbbf24">{workspace.connections?.length || 0}</Text>
//         </Box>
//         <Box>
//           <Text color="#888888">Environment Variables: </Text>
//           <Text bold color="#8b5cf6">{workspace.environmentVariables?.length || 0}</Text>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// // ========== EXECUTION VIEW ==========
// interface ExecutionViewProps {
//   workspace: WorkspaceData;
//   messages: ConsoleEvent[];
//   isRunning: boolean;
// }

// const ExecutionView: React.FC<ExecutionViewProps> = ({ workspace, messages, isRunning }) => {
//   const getMessageColor = (type: string): string => {
//     switch (type) {
//       case 'error': return '#ef4444';
//       case 'warning': return '#fbbf24';
//       case 'success': return '#4ade80';
//       case 'info': return '#60a5fa';
//       case 'system': return '#888888';
//       default: return '#e0e0e0';
//     }
//   };

//   const getMessageIcon = (type: string): string => {
//     switch (type) {
//       case 'error': return '✗';
//       case 'warning': return '⚠';
//       case 'success': return '✓';
//       case 'info': return 'ℹ';
//       case 'system': return '⚙';
//       default: return '•';
//     }
//   };

//   const stats = messages.reduce(
//     (acc, msg) => {
//       if (msg.type === 'error') acc.errors++;
//       if (msg.type === 'warning') acc.warnings++;
//       if (msg.type === 'success') acc.successes++;
//       return acc;
//     },
//     { errors: 0, warnings: 0, successes: 0 }
//   );

//   return (
//     <Box flexDirection="column" paddingX={2}>
//       {/* Header */}
//       <Box marginBottom={1} borderStyle="round" borderColor="#3a3a3a" padding={1}>
//         <Box flexDirection="column">
//           <Box>
//             <Text bold color="#f4c430">👁️  Event Console - {workspace.name}</Text>
//             <Box marginLeft={2}>
//               {isRunning ? (
//                 <>
//                   <Text color="#f4c430">
//                     <Spinner type="dots" />
//                   </Text>
//                   <Text color="#4ade80"> Running</Text>
//                 </>
//               ) : (
//                 <Text color="#888888">● Idle</Text>
//               )}
//             </Box>
//           </Box>

//           <Box marginTop={1}>
//             <Box marginRight={3}>
//               <Text color="#888888">Total: </Text>
//               <Text bold color="#e0e0e0">{messages.length}</Text>
//             </Box>
//             <Box marginRight={3}>
//               <Text color="#4ade80">✓ {stats.successes}</Text>
//             </Box>
//             <Box marginRight={3}>
//               <Text color="#fbbf24">⚠ {stats.warnings}</Text>
//             </Box>
//             <Box>
//               <Text color="#ef4444">✗ {stats.errors}</Text>
//             </Box>
//           </Box>
//         </Box>
//       </Box>

//       {/* Console Messages */}
//       <Box
//         flexDirection="column"
//         borderStyle="round"
//         borderColor="#3a3a3a"
//         padding={1}
//         height={20}
//       >
//         {messages.length === 0 ? (
//           <Box justifyContent="center" alignItems="center">
//             <Text color="#888888">
//               No events to display. Events will appear here as they occur.
//             </Text>
//           </Box>
//         ) : (
//           messages.slice(-15).map((msg, i) => (
//             <Box key={i} marginBottom={0}>
//               <Text color="#888888">
//                 {new Date(msg.timestamp).toLocaleTimeString()}{' '}
//               </Text>
//               <Text color={getMessageColor(msg.type)}>
//                 {getMessageIcon(msg.type)} [{msg.type.toUpperCase()}]
//               </Text>
//               <Text color="#e0e0e0"> {msg.message}</Text>
//             </Box>
//           ))
//         )}
//       </Box>

//       {messages.length > 15 && (
//         <Box marginTop={1}>
//           <Text color="#888888">Showing last 15 of {messages.length} messages</Text>
//         </Box>
//       )}
//     </Box>
//   );
// };
// src/tui/dashboard.tsx - UPDATED to pass workspace object to WorkflowManager
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
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

interface DashboardProps {
  ws: WebSocketClient;
  onExit: () => void;
}

type View = 'list' | 'password' | 'workspace' | 'execution';
type Tab = 'workspace' | 'tasks' | 'agents' | 'workflows' | 'env';

export const Dashboard: React.FC<DashboardProps> = ({ ws, onExit }) => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('workspace');
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceData | null>(null);
  const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceData | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(ws.isConnected());
  const [consoleMessages, setConsoleMessages] = useState<ConsoleEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { exit } = useApp();

  // WebSocket event listeners
  useEffect(() => {
    const handleStatus = (status: string) => {
      setWsConnected(status === 'connected');
    };

    const handleConsole = (event: ConsoleEvent) => {
      setConsoleMessages(prev => [...prev.slice(-100), event]);
    };

    ws.on('status', handleStatus);
    ws.on('console', handleConsole);

    return () => {
      ws.off('status', handleStatus);
      ws.off('console', handleConsole);
    };
  }, [ws]);

  // Global key handlers
  useInput((input, key) => {
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
        setCurrentView('workspace');
      } else if (currentView === 'workspace') {
        setSelectedWorkspace(null);
        setActiveTab('workspace');
        setCurrentView('list');
      }
    }

    // Tab switching (only in workspace view)
    if (currentView === 'workspace' && !isRunning) {
      if (input === '1') setActiveTab('workspace');
      if (input === '2') setActiveTab('tasks');
      if (input === '3') setActiveTab('agents');
      if (input === '4') setActiveTab('workflows');
      if (input === '5') setActiveTab('env');
      
      // Run workspace
      if (input === 'r' && wsConnected && selectedWorkspace) {
        setIsRunning(true);
        setConsoleMessages([]);
        setCurrentView('execution');
        ws.runWorkspace(selectedWorkspace.id, selectedWorkspace);
      }
    }
  });

  const handleWorkspaceSelect = (workspace: WorkspaceData, password?: string) => {
    try {
      let loadedWorkspace = workspace;

      // Check if needs decryption
      if (hasEncryptedData(workspace)) {
        if (!password) {
          // Need password
          setPendingWorkspace(workspace);
          setPasswordError(null);
          setCurrentView('password');
          return;
        }

        // Decrypt with password
        loadedWorkspace = decryptWorkspace(workspace, password);
      }

      // Success - load workspace
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
    // Save to storage
    WorkspaceStorage.save(updated);
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
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

      {/* Main Content */}
      <Box flexDirection="column" marginTop={1}>
        {currentView === 'list' && (
          <WorkspaceListView onSelect={handleWorkspaceSelect} />
        )}

        {currentView === 'password' && (
          <PasswordInput
            message={passwordError || `Enter password to decrypt "${pendingWorkspace?.name}"`}
            onSubmit={handlePasswordSubmit}
            onCancel={handlePasswordCancel}
          />
        )}

        {currentView === 'workspace' && selectedWorkspace && (
          <WorkspaceTabsView
            workspace={selectedWorkspace}
            activeTab={activeTab}
            wsConnected={wsConnected}
            onUpdate={handleWorkspaceUpdate}
          />
        )}

        {currentView === 'execution' && selectedWorkspace && (
          <ExecutionView
            workspace={selectedWorkspace}
            messages={consoleMessages}
            isRunning={isRunning}
          />
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" borderColor="#3a3a3a" paddingX={1}>
        <Text color="#888888">
          {currentView === 'list' && 'ESC: Exit | Up/Down: Navigate | Enter: Select'}
          {currentView === 'password' && 'ESC: Cancel | Enter: Submit'}
          {currentView === 'workspace' && '1-5: Switch Tab | R: Run | ESC: Back'}
          {currentView === 'execution' && 'ESC: Stop Execution'}
        </Text>
      </Box>
    </Box>
  );
};

// ========== WORKSPACE LIST VIEW ==========
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

// ========== WORKSPACE TABS VIEW ==========
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
      {/* Workspace Header */}
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

      {/* Tabs */}
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

      {/* Tab Content */}
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

// Workspace Info Tab
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

// ========== EXECUTION VIEW ==========
interface ExecutionViewProps {
  workspace: WorkspaceData;
  messages: ConsoleEvent[];
  isRunning: boolean;
}

const ExecutionView: React.FC<ExecutionViewProps> = ({ workspace, messages, isRunning }) => {
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
      {/* Header */}
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

      {/* Console Messages */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#3a3a3a"
        padding={1}
        height={20}
      >
        {messages.length === 0 ? (
          <Box justifyContent="center" alignItems="center">
            <Text color="#888888">
              No events to display. Events will appear here as they occur.
            </Text>
          </Box>
        ) : (
          messages.slice(-15).map((msg, i) => (
            <Box key={i} marginBottom={0}>
              <Text color="#888888">
                {new Date(msg.timestamp).toLocaleTimeString()}{' '}
              </Text>
              <Text color={getMessageColor(msg.type)}>
                {getMessageIcon(msg.type)} [{msg.type.toUpperCase()}]
              </Text>
              <Text color="#e0e0e0"> {msg.message}</Text>
            </Box>
          ))
        )}
      </Box>

      {messages.length > 15 && (
        <Box marginTop={1}>
          <Text color="#888888">Showing last 15 of {messages.length} messages</Text>
        </Box>
      )}
    </Box>
  );
};