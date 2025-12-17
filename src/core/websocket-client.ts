// src/core/websocket-client.ts - WebSocket client for real-time API connection
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

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private shouldReconnect = true;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: SidecarCommand[] = [];
  private verbose: boolean = false;

  constructor(url?: string, verbose: boolean = false) {
    super();
    const config = ConfigManager.get();
    this.url = url || config.api.url;
    this.verbose = verbose;
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.verbose) {
        console.log(chalk.gray('Already connected to WebSocket'));
      }
      return;
    }

    return new Promise((resolve, reject) => {
      this.connectionStatus = 'connecting';
      this.shouldReconnect = true;

      if (this.verbose) {
        console.log(chalk.gray(`Connecting to ${this.url}...`));
      }

      this.emit('status', 'connecting');

      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          if (this.verbose) {
            console.log(chalk.green('✓ Connected to yaLLMa3 API'));
          }
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.emit('status', 'connected');
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
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
          if (this.verbose) {
            console.log(chalk.yellow('Disconnected from yaLLMa3 API'));
          }
          this.connectionStatus = 'disconnected';
          this.emit('status', 'disconnected');
          this.stopHeartbeat();
          
          if (this.shouldReconnect) {
            this.attemptReconnect();
          }
        });

        this.ws.on('error', (error) => {
          console.error(chalk.red('WebSocket error:'), error.message);
          this.connectionStatus = 'error';
          this.emit('status', 'error');
          reject(error);
        });

        // Timeout for connection
        setTimeout(() => {
          if (this.connectionStatus === 'connecting') {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        console.error(chalk.red('Failed to create WebSocket connection:'), error);
        this.connectionStatus = 'error';
        this.emit('status', 'error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
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
        chalk.yellow(
          `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        )
      );
    }

    setTimeout(() => {
      this.connect().catch((err) => {
        console.error(chalk.red('Reconnection failed:'), err.message);
      });
    }, this.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({
        type: 'ping',
        timestamp: new Date().toISOString(),
      });
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(message: SidecarCommand): void {
    if (this.verbose) {
      console.log(chalk.gray('Received:'), message.type);
    }

    this.emit('message', message);

    switch (message.type) {
      case 'pong':
        // Heartbeat response
        break;

      case 'connected':
        this.emit('connected', message);
        break;

      case 'message':
        if (message.data) {
          this.emit('console', message.data as ConsoleEvent);
        }
        break;

      case 'console_prompt':
      case 'console_input':
        if (message.data) {
          this.emit('console', message.data as ConsoleEvent);
        }
        break;

      case 'console_input_resolved':
        this.emit('input_resolved', message.data);
        break;

      case 'workflow_result':
        this.emit('workflow_result', message);
        break;

      case 'workflow_output':
        if (message.data) {
          this.emit('console', message.data as ConsoleEvent);
        }
        break;

      case 'error':
        this.emit('error_message', message);
        break;

      case 'pending_prompts':
        this.emit('pending_prompts', message.data);
        break;

      default:
        if (this.verbose) {
          console.log(chalk.gray('Unknown message type:'), message.type);
        }
    }
  }

  sendMessage(message: SidecarCommand): void {
    if (!message.id) {
      message.id = this.generateId();
    }

    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      
      if (this.verbose) {
        console.log(chalk.gray('Sent:'), message.type);
      }
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
      
      if (this.verbose) {
        console.log(chalk.yellow('Queued message (not connected):'), message.type);
      }
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length > 0) {
      if (this.verbose) {
        console.log(chalk.gray(`Flushing ${this.messageQueue.length} queued messages`));
      }

      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.sendMessage(message);
        }
      }
    }
  }

  // High-level API methods
  async runWorkspace(workspaceId: string, data?: any): Promise<void> {
    this.sendMessage({
      type: 'run_workspace',
      workspaceId,
      data: data ? JSON.stringify(data) : undefined,
    });
  }

  async runWorkflow(workflowId: string, workspaceId: string): Promise<void> {
    this.sendMessage({
      type: 'run_workflow',
      workspaceId,
      data: workflowId,
    });
  }

  async sendConsoleInput(promptId: string, input: string): Promise<void> {
    this.sendMessage({
      type: 'console_input',
      data: {
        promptId,
        message: input,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async getPendingPrompts(): Promise<void> {
    this.sendMessage({
      type: 'get_pending_prompts',
    });
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getStatus(): string {
    return this.connectionStatus;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}