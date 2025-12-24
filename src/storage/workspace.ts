import * as fs from 'fs';
import * as path from 'path';
import { Paths } from '../config/paths.js';
import { WorkspaceData } from '../models/workspace.js';
import { hasEncryptedData, decryptWorkspace } from '../utils/encryption.js';

export class WorkspaceStorage {
  static generateUniqueId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const shortDate = Date.now().toString().slice(-6);
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ws-${shortDate}${randomPart}`;
  }

  /**
   * Get the workspace file path - supports both .yallma3 and .json extensions
   */
  private static getWorkspaceFilePath(id: string): string | null {
    const workspacesDir = Paths.getWorkspacesDir();
    
    const yallmaPath = path.join(workspacesDir, `${id}.yallma3`);
    if (fs.existsSync(yallmaPath)) {
      return yallmaPath;
    }
    
    const jsonPath = path.join(workspacesDir, `${id}.json`);
    if (fs.existsSync(jsonPath)) {
      return jsonPath;
    }
    
    return null;
  }

  /**
   * Save workspace with .yallma3 extension
   */
  static save(workspace: WorkspaceData): void {
    const workspacesDir = Paths.getWorkspacesDir();
    const filePath = path.join(workspacesDir, `${workspace.id}.yallma3`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));
    } catch (err: any) {
      throw new Error(`Failed to save workspace: ${err.message}`);
    }
  }

  /**
   * Load workspace without password (keeps encrypted fields encrypted)
   * Use this for listing workspaces
   */
  static load(id: string): WorkspaceData {
    const filePath = this.getWorkspaceFilePath(id);

    if (!filePath) {
      throw new Error(`Workspace not found: ${id}`);
    }

    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const workspace = JSON.parse(data) as WorkspaceData;
      
      return workspace;
    } catch (err: any) {
      throw new Error(`Failed to load workspace: ${err.message}`);
    }
  }

  /**
   * Load workspace and decrypt if needed
   * Throws 'ENCRYPTED_WORKSPACE' error if password is required but not provided
   */
  static loadDecrypted(id: string, password?: string): WorkspaceData {
    const workspace = this.load(id);
    
    if (hasEncryptedData(workspace)) {
      if (!password) {
        throw new Error('ENCRYPTED_WORKSPACE');
      }
      
      return decryptWorkspace(workspace, password);
    }
    
    return workspace;
  }

  /**
   * Load workspace with interactive password prompt (for CLI use only)
   */
  static async loadWithPasswordPrompt(id: string): Promise<WorkspaceData> {
    try {
      return this.loadDecrypted(id);
    } catch (err: any) {
      if (err.message === 'ENCRYPTED_WORKSPACE') {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Load all workspaces (supports both .yallma3 and .json)
   */
  static loadAll(): WorkspaceData[] {
    const workspacesDir = Paths.getWorkspacesDir();
    
    if (!fs.existsSync(workspacesDir)) {
      fs.mkdirSync(workspacesDir, { recursive: true });
      return [];
    }

    try {
      const files = fs.readdirSync(workspacesDir)
        .filter(f => f.endsWith('.yallma3') || f.endsWith('.json'));
      
      const workspaces: WorkspaceData[] = [];
      
      for (const file of files) {
        try {
          const filePath = path.join(workspacesDir, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          const workspace = JSON.parse(data);
          
          // For listing, we don't decrypt - just show metadata
          workspaces.push(workspace);
        } catch (err) {
          console.warn(`Failed to load workspace from ${file}`);
        }
      }
      
      return workspaces.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err: any) {
      throw new Error(`Failed to load workspaces: ${err.message}`);
    }
  }

  /**
   * Delete workspace (supports both extensions)
   */
  static delete(id: string): void {
    const filePath = this.getWorkspaceFilePath(id);

    if (!filePath) {
      throw new Error(`Workspace not found: ${id}`);
    }

    try {
      fs.unlinkSync(filePath);
    } catch (err: any) {
      throw new Error(`Failed to delete workspace: ${err.message}`);
    }
  }

  /**
   * Check if workspace exists (supports both extensions)
   */
  static exists(id: string): boolean {
    return this.getWorkspaceFilePath(id) !== null;
  }

  /**
   * Export workspace to specified directory
   */
  static export(id: string, outputDir: string, password?: string): string {
    // Load and optionally decrypt
    const workspace = password ? this.loadDecrypted(id, password) : this.load(id);
    
    const fileName = `${workspace.name.replace(/\s+/g, '-').toLowerCase()}-${id}.yallma3`;
    const outputPath = path.resolve(outputDir, fileName);
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(workspace, null, 2));
      return outputPath;
    } catch (err: any) {
      throw new Error(`Failed to export workspace: ${err.message}`);
    }
  }

  /**
   * Import workspace from file (supports both .yallma3 and .json)
   */
  static import(filePath: string): WorkspaceData {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      const data = fs.readFileSync(fullPath, 'utf-8');
      const workspace = JSON.parse(data) as WorkspaceData;
      
      // Generate new ID to avoid conflicts
      const oldId = workspace.id;
      workspace.id = this.generateUniqueId();
      workspace.createdAt = Date.now();
      workspace.updatedAt = Date.now();
      
      // Save imported workspace with .yallma3 extension
      this.save(workspace);
      
      console.log(`Imported workspace: ${oldId} → ${workspace.id}`);
      return workspace;
    } catch (err: any) {
      throw new Error(`Failed to import workspace: ${err.message}`);
    }
  }

  /**
   * Get workspace file extension (.yallma3 or .json)
   */
  static getExtension(id: string): string | null {
    const filePath = this.getWorkspaceFilePath(id);
    if (!filePath) return null;
    return path.extname(filePath);
  }

  /**
   * Migrate .json workspace to .yallma3
   */
  static migrateToYallma3(id: string): void {
    const workspacesDir = Paths.getWorkspacesDir();
    const jsonPath = path.join(workspacesDir, `${id}.json`);
    const yallmaPath = path.join(workspacesDir, `${id}.yallma3`);

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Workspace ${id}.json not found`);
    }

    if (fs.existsSync(yallmaPath)) {
      throw new Error(`Workspace ${id}.yallma3 already exists`);
    }

    try {
      fs.copyFileSync(jsonPath, yallmaPath);
      
      fs.unlinkSync(jsonPath);
      
      console.log(`Migrated ${id}.json → ${id}.yallma3`);
    } catch (err: any) {
      throw new Error(`Failed to migrate workspace: ${err.message}`);
    }
  }

  /**
   * List all workspace IDs
   */
  static listIds(): string[] {
    const workspacesDir = Paths.getWorkspacesDir();
    
    if (!fs.existsSync(workspacesDir)) {
      return [];
    }

    return fs.readdirSync(workspacesDir)
      .filter(f => f.endsWith('.yallma3') || f.endsWith('.json'))
      .map(f => f.replace(/\.(yallma3|json)$/, ''));
  }
}