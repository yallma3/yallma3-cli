# yallma3-cli

Terminal UI for the yaLLMa3 AI Agent Development Environment.

---

## Prerequisites

Before running this project, ensure you have the following installed:

### Required

* **Node.js v18+**
* **TypeScript v5+**
* **npm**

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Getting Started

### 1. Development Mode

Run the Terminal UI with hot reload:

```bash
npm run dev
```

---

### 2. Production Mode

Build the project:

```bash
npm run build
```

Run the built version:

```bash
npm start
```

---

## Server Information

The CLI connects to the yaLLMa3 Core WebSocket server:

* **WebSocket Server:** `ws://localhost:3001`
* **Health Check:** `http://localhost:3001/health`

---

## Project Structure

```
src/
├── config/          # Configuration and paths
├── core/            # WebSocket client
├── models/          # Workspace & LLM models
├── storage/         # Local workspace storage
├── tui/             # Ink-based Terminal UI
│   ├── components/  # TUI components
│   ├── dashboard-chat.tsx
│   ├── dashboard-classic.tsx
│   └── mode-selector.tsx
├── utils/           # Encryption & helpers
└── index-tui.tsx    # TUI entry point
```

