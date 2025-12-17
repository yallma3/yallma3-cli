import { v4 as uuidv4 } from 'uuid';

const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generateCleanId(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getShortTimestamp(): string {
  return Date.now().toString().slice(-6);
}

export function generateWorkspaceId(): string {
  const shortDate = getShortTimestamp();
  const randomPart = generateCleanId(3);
  return `ws-${shortDate}${randomPart}`;
}

export function generateAgentId(): string {
  const shortDate = getShortTimestamp();
  const randomPart = generateCleanId(3);
  return `ag-${shortDate}${randomPart}`;
}

export function generateTaskId(): string {
  const shortDate = getShortTimestamp();
  const randomPart = generateCleanId(3);
  return `tk-${shortDate}${randomPart}`;
}

export function generateWorkflowId(): string {
  const shortDate = getShortTimestamp();
  const randomPart = generateCleanId(3);
  return `gf-${shortDate}${randomPart}`;
}

export function generateMCPId(): string {
  const shortDate = getShortTimestamp();
  const randomPart = generateCleanId(3);
  return `mcp-${shortDate}${randomPart}`;
}

export function generateEnvVarId(): string {
  return `env-${Date.now()}`;
}

export function generateRandomId(): string {
  return uuidv4();
}

export function validateId(id: string, prefix: string): boolean {
  return id.startsWith(`${prefix}-`);
}