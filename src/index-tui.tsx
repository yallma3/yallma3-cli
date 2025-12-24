import React, { useState } from 'react';
import { render } from 'ink';
import meow from 'meow';
import { ModeSelector } from './tui/components/mode-selector.js';
import { DashboardClassic } from './tui/dashboard-classic.js';
import { DashboardChat } from './tui/dashboard-chat.js';
import { WebSocketClient } from './core/websocket-client.js';
import { ConfigManager } from './config/index.js';

const cli = meow(`
  Usage
    $ yallma3 [options]

  Options
    --mode <type>     Start directly with mode: classic or chat
    --api-url <url>   WebSocket API URL (default: ws://localhost:3001)
    --no-connect      Don't auto-connect to API
    --help, -h        Show help
    --version, -v     Show version

  Examples
    $ yallma3
    $ yallma3 --mode classic
    $ yallma3 --mode chat --api-url ws://localhost:8080
    $ yallma3 --no-connect
`, {
  importMeta: import.meta,
  flags: {
    help: { type: 'boolean', shortFlag: 'h' },
    version: { type: 'boolean', shortFlag: 'v' },
    mode: { type: 'string' },
    apiUrl: { type: 'string', default: 'ws://localhost:3001' },
    noConnect: { type: 'boolean', default: false },
  },
});
const App: React.FC<{ 
  ws: WebSocketClient; 
  initialMode?: 'classic' | 'chat';
  onExit: () => void;
}> = ({ ws, initialMode, onExit }) => {
  const [selectedMode, setSelectedMode] = useState<'classic' | 'chat' | null>(initialMode || null);

  if (!selectedMode) {
    return <ModeSelector onSelect={setSelectedMode} />;
  }

  if (selectedMode === 'classic') {
    return <DashboardClassic ws={ws} onExit={onExit} />;
  }

  return <DashboardChat ws={ws} onExit={onExit} />;
};

async function main() {
  // Enter alternate screen buffer (prevents scrollback)
  process.stdout.write('\x1b[?1049h\x1b[H');
  
  ConfigManager.initialize();
  
  const config = ConfigManager.get();
  const apiUrl = cli.flags.apiUrl || config.api.url;
  
  // Validate mode flag if provided
  const initialMode = cli.flags.mode as 'classic' | 'chat' | undefined;
  if (initialMode && initialMode !== 'classic' && initialMode !== 'chat') {
    console.error('Error: --mode must be either "classic" or "chat"');
    process.exit(1);
  }
  
  const ws = new WebSocketClient(apiUrl, false);

  // Auto-connect if enabled
  if (!cli.flags.noConnect) {
    try {
      await ws.connect();
    } catch (err) {
    }
  }
  const cleanup = () => {
    if (ws.isConnected()) {
      ws.disconnect();
    }
    process.stdout.write('\x1b[?1049l'); 
    process.exit(0);
  };

  const { waitUntilExit } = render(
    <App 
      ws={ws}
      initialMode={initialMode}
      onExit={cleanup}
    />
  );
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  await waitUntilExit();
  process.stdout.write('\x1b[?1049l');
}

main().catch((error) => {
  process.stdout.write('\x1b[?1049l');
  console.error('Fatal error:', error);
  process.exit(1);
});