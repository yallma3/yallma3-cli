import { LLMOption } from './llm.js';

export interface CanvasState {
  nodes: any[];
  connections?: any;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  [key: string]: any;
}

export interface Position {
  x: number;
  y: number;
}

export interface TaskSocket {
  id: number;
  title: string;
  type: 'input' | 'output';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  expectedOutput: string;
  type: string;
  executorId: string | null;
  position: Position;
  selected: boolean;
  sockets: TaskSocket[];
}

export interface TaskConnection {
  fromSocket: number;
  toSocket: number;
}

export interface Tool {
  id?: string;
  type: string;
  name: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  role?: string;
  objective?: string;
  background?: string;
  capabilities?: string;
  tools: Tool[];
  llm: LLMOption;
  apiKey?: string;
  variables?: Record<string, string>;
}

export interface WorkflowRef {
  id: string;
  name: string;
  description?: string;
  canvasState: CanvasState;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  sensitive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceData {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  description?: string;
  mainLLM: LLMOption;
  apiKey?: string;
  useSavedCredentials: boolean;
  tasks: Task[];
  connections: TaskConnection[];
  agents: Agent[];
  workflows: WorkflowRef[];
  mcpTools: Tool[];
  environmentVariables?: EnvironmentVariable[];
}

export interface ConsoleEvent {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  details?: any;
  results?: any;
  promptId?: string;
  nodeId?: number;
  nodeName?: string;
}
