// src/index-tui.tsx - REPLACE THIS FILE
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { Dashboard } from './tui/dashboard.js';
import { WebSocketClient } from './core/websocket-client.js';
import { ConfigManager } from './config/index.js';

const cli = meow(`
  Usage
    $ yallma3-tui [options]

  Options
    --help, -h       Show help
    --version, -v    Show version
    --api-url        WebSocket API URL (default: ws://localhost:3001)
    --no-connect     Don't auto-connect to API

  Examples
    $ yallma3-tui
    $ yallma3-tui --api-url ws://localhost:8080
    $ yallma3-tui --no-connect
`, {
  importMeta: import.meta,
  flags: {
    help: { type: 'boolean', shortFlag: 'h' },
    version: { type: 'boolean', shortFlag: 'v' },
    apiUrl: { type: 'string', default: 'ws://localhost:3001' },
    noConnect: { type: 'boolean', default: false },
  },
});

async function main() {
  // Initialize config
  ConfigManager.initialize();
  
  const config = ConfigManager.get();
  const apiUrl = cli.flags.apiUrl || config.api.url;
  const ws = new WebSocketClient(apiUrl, false);

  // Auto-connect if enabled
  if (!cli.flags.noConnect) {
    try {
      await ws.connect();
    } catch (err) {
      // Silent fail - user can manually connect later
    }
  }

  // Render TUI
  const { waitUntilExit } = render(
    <Dashboard 
      ws={ws}
      onExit={() => {
        if (ws.isConnected()) {
          ws.disconnect();
        }
        process.exit(0);
      }}
    />
  );

  await waitUntilExit();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});