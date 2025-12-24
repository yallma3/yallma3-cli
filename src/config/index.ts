import * as fs from 'fs';
import { Paths } from './paths.js';

export interface Config {
  api: {
    url: string;
    timeout: number;
  };
  storage: {
    path: string;
  };
  defaults: {
    llm_provider: string;
    llm_model: string;
  };
  editor: {
    theme: string;
  };
}

const defaultConfig: Config = {
  api: {
    url: 'ws://localhost:3001',
    timeout: 30,
  },
  storage: {
    path: Paths.getConfigDir(),
  },
  defaults: {
    llm_provider: 'Groq',
    llm_model: 'llama-3.1-8b-instant',
  },
  editor: {
    theme: 'dark',
  },
};

let globalConfig: Config | null = null;

export class ConfigManager {
  static initialize(): void {
    Paths.ensureDirectories();

    const configPath = Paths.getConfigFilePath();
    
    if (!fs.existsSync(configPath)) {
      this.save(defaultConfig);
    }

    globalConfig = this.load();
  }

  static load(): Config {
    const configPath = Paths.getConfigFilePath();
    
    if (!fs.existsSync(configPath)) {
      return defaultConfig;
    }

    try {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading config, using defaults');
      return defaultConfig;
    }
  }

  static save(config: Config): void {
    const configPath = Paths.getConfigFilePath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    globalConfig = config;
  }

  static get(): Config {
    if (!globalConfig) {
      this.initialize();
    }
    return globalConfig!;
  }

  static set(key: string, value: any): void {
    const config = this.get();
    const keys = key.split('.');
    
    let current: any = config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        throw new Error(`Invalid config key: ${key}`);
      }
      current = current[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    if (!(lastKey in current)) {
      throw new Error(`Invalid config key: ${key}`);
    }
    
    current[lastKey] = value;
    this.save(config);
  }

  static getDefault(): Config {
    return defaultConfig;
  }
}