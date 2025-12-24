import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class Paths {
  private static configDir = path.join(os.homedir(), '.yallma3');

  static getConfigDir(): string {
    return this.configDir;
  }

  static getWorkspacesDir(): string {
    return path.join(this.configDir, 'workspaces');
  }

  static getWorkflowsDir(): string {
    return path.join(this.configDir, 'flows');
  }

  static getMCPDir(): string {
    return path.join(this.configDir, 'mcp');
  }

  static getSessionDBPath(): string {
    return path.join(this.configDir, 'sessions.db');
  }

  static getConfigFilePath(): string {
    return path.join(this.configDir, 'config.json');
  }

  static ensureDirectories(): void {
    const dirs = [
      this.getConfigDir(),
      this.getWorkspacesDir(),
      this.getWorkflowsDir(),
      this.getMCPDir(),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
}