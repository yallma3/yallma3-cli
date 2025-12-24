import WebSocket from 'ws';
import chalk from 'chalk';
import EventEmitter from 'events';
import { ConfigManager } from '../config/index.js';


export interface SidecarCommand {
  id?: string;
  type: string;
  workspaceId?: string;
  data?: unknown;
  timestamp?: string;
  promptId?: string;
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


type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';


export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  private shouldReconnect = true;
  private connectionStatus: ConnectionStatus = 'disconnected';

  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectTimeout: NodeJS.Timeout | null = null;

  private messageQueue: SidecarCommand[] = [];
  private verbose = false;

  private warnOnUnhandledRunWorkflow = true;


  constructor(url?: string, verbose: boolean = false) {
    super();
    const config = ConfigManager.get();
    this.url = url || config.api.url;
    this.verbose = verbose;
  }


  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.verbose) console.log(chalk.gray('Already connected to WebSocket'));
      return;
    }


    if (this.ws) {
      try { this.ws.terminate(); } catch {}
      this.ws = null;
    }


    return new Promise((resolve, reject) => {
      let settled = false;


      const cleanup = () => {
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }
      };


      const safeResolve = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };


      const safeReject = (err: any) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      };


      this.connectionStatus = 'connecting';
      this.shouldReconnect = true;


      if (this.verbose) console.log(chalk.gray(`Connecting to ${this.url}...`));
      this.emit('status', 'connecting');


      try {
        this.ws = new WebSocket(this.url);


        this.ws.on('open', () => {
          if (this.verbose) console.log(chalk.green('✓ Connected to yaLLMa3 API'));
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;


          this.emit('status', 'connected');
          this.startHeartbeat();
          this.flushMessageQueue();


          safeResolve();
        });


        this.ws.on('message', (data: WebSocket.RawData) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (err) {
            console.error(chalk.red('Failed to parse WebSocket message:'), err);
          }
        });


        this.ws.on('close', () => {
          if (this.verbose) console.log(chalk.yellow('Disconnected from yaLLMa3 API'));


          const wasConnecting = this.connectionStatus === 'connecting';
          this.connectionStatus = 'disconnected';


          this.emit('status', 'disconnected');
          this.stopHeartbeat();


          if (wasConnecting) safeReject(new Error('WebSocket closed before connection established'));
          if (this.shouldReconnect) this.attemptReconnect();
        });


        this.ws.on('error', (error: any) => {
          console.error(chalk.red('WebSocket error:'), error?.message || error);
          this.connectionStatus = 'error';
          this.emit('status', 'error');
          safeReject(error);
        });


        this.connectTimeout = setTimeout(() => {
          if (this.connectionStatus === 'connecting') {
            try { this.ws?.terminate(); } catch {}
            safeReject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        console.error(chalk.red('Failed to create WebSocket connection:'), error);
        this.connectionStatus = 'error';
        this.emit('status', 'error');
        safeReject(error);
      }
    });
  }


  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();


    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }


    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }


    this.connectionStatus = 'disconnected';
    this.emit('status', 'disconnected');
  }


  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(chalk.red('Max reconnection attempts reached. Use "connect" to retry.'));
      return;
    }


    this.reconnectAttempts++;


    if (this.verbose) {
      console.log(
        chalk.yellow(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      );
    }


    setTimeout(() => {
      this.connect().catch((err) => console.error(chalk.red('Reconnection failed:'), err.message));
    }, this.reconnectInterval);
  }


  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
    }, 30000);
  }


  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }


  private handleMessage(message: SidecarCommand & Record<string, any>): void {
    if (this.verbose) console.log(chalk.gray('Received:'), message.type);
    this.emit('message', message);


    switch (message.type) {
      case 'pong':
        return;


      case 'connected':
        this.emit('connected', message);
        return;


      case 'message':
      case 'console_prompt':
      case 'console_input':
      case 'workflow_output':
        if (message.data) {
          this.emit('console', message.data as ConsoleEvent);
        }
        return;


      case 'console_input_resolved':
        console.log('✓ Console input resolved');
        this.emit('input_resolved', message.data);
        return;


      case 'workflow_result':
        console.log('Workflow result received');
        this.emit('workflow_result', message);
        return;


      case 'pending_prompts':
        console.log('Pending prompts received:', message.data);
        this.emit('pending_prompts', message.data);
        return;


      case 'error':
        console.error('Error message:', message.data);
        this.emit('error_message', message);
        return;


      case 'run_workflow': {
        const requestId = message.id;
        const workflowId = message.data;


        console.log('Run workflow request:', { requestId, workflowId });
        this.emit('run_workflow', { requestId, workflowId, raw: message });


        if (this.warnOnUnhandledRunWorkflow && this.listenerCount('run_workflow') === 0) {
          this.sendMessage({
            type: 'workflow_output',
            data: {
              id: Date.now().toString(),
              timestamp: Date.now(),
              type: 'error',
              message:
                `Received run_workflow request but no handler is attached. ` +
                `requestId=${String(requestId)} workflowId=${String(workflowId)}`,
            } satisfies ConsoleEvent,
          });
        }


        return;
      }


      default:
        if (this.verbose) console.log(chalk.gray('Unknown message type:'), message.type);
        return;
    }
  }


  sendMessage(message: SidecarCommand): void {
    if (!message.id) message.id = this.generateId();
    if (!message.timestamp) message.timestamp = new Date().toISOString();


    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      if (this.verbose) console.log(chalk.gray('Sent:'), message.type);
    } else {
      this.messageQueue.push(message);
      if (this.verbose) console.log(chalk.yellow('Queued message (not connected):'), message.type);
    }
  }


  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) this.sendMessage(msg);
    }
  }


  async runWorkspace(workspaceId: string, workspace?: any): Promise<void> {
    this.sendMessage({
      type: 'run_workspace',
      workspaceId,
      data: workspace ? JSON.stringify(workspace) : undefined,
    });
  }


  async runWorkflow(workflow: any, workspaceId: string): Promise<void> {
    this.sendMessage({
      type: 'run_workflow',
      workspaceId,
      data: JSON.stringify(workflow),
    });
  }


  sendWorkflowJson(requestId: string, workflow: any): void {
    this.sendMessage({
      type: 'workflow_json',
      id: requestId,
      data: workflow,
    });
  }


  async sendConsoleInput(promptId: string, input: string): Promise<void> {
    this.sendMessage({
      type: 'console_input',
      promptId: promptId,  
      data: { 
        promptId, 
        message: input, 
        timestamp: new Date().toISOString() 
      },
    });
  }


  async getPendingPrompts(): Promise<void> {
    this.sendMessage({ type: 'get_pending_prompts' });
  }


  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }


  getStatus(): string {
    return this.connectionStatus;
  }


  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }


  setWarnOnUnhandledRunWorkflow(enabled: boolean): void {
    this.warnOnUnhandledRunWorkflow = enabled;
  }


  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}