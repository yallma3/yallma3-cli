import CryptoJS from 'crypto-js';

const ENCRYPTION_PREFIX = 'enc_';

export function encryptValue(value: string, password: string): string {
  const encrypted = CryptoJS.AES.encrypt(value, password).toString();
  return ENCRYPTION_PREFIX + encrypted;
}

export function decryptValue(encryptedValue: string, password: string): string {
  let encrypted = encryptedValue;
  
  if (encrypted.startsWith(ENCRYPTION_PREFIX)) {
    encrypted = encrypted.substring(ENCRYPTION_PREFIX.length);
  }
  
  try {
    const decryptedBytes = CryptoJS.AES.decrypt(encrypted, password);
    const decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Invalid password or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt: Invalid password or corrupted data');
  }
}

export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  if (value.startsWith(ENCRYPTION_PREFIX)) {
    return true;
  }
  
  if (value.startsWith('U2FsdGVkX1')) {
    return true;
  }
  
  return false;
}

export function decryptWorkspace(workspace: any, password: string): any {
  const decrypted = JSON.parse(JSON.stringify(workspace)); 
  
  try {
    if (decrypted.apiKey && isEncrypted(decrypted.apiKey)) {
      decrypted.apiKey = decryptValue(decrypted.apiKey, password);
    }

    if (decrypted.environmentVariables && Array.isArray(decrypted.environmentVariables)) {
      decrypted.environmentVariables = decrypted.environmentVariables.map((envVar: any) => {
        if (envVar.sensitive && envVar.value && isEncrypted(envVar.value)) {
          return {
            ...envVar,
            value: decryptValue(envVar.value, password)
          };
        }
        return envVar;
      });
    }

    if (decrypted.agents && Array.isArray(decrypted.agents)) {
      decrypted.agents = decrypted.agents.map((agent: any) => {
        if (agent.apiKey && isEncrypted(agent.apiKey)) {
          return {
            ...agent,
            apiKey: decryptValue(agent.apiKey, password)
          };
        }
        return agent;
      });
    }

    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt workspace. Invalid password or corrupted data.');
  }
}

export function encryptWorkspace(workspace: any, password: string): any {
  const encrypted = JSON.parse(JSON.stringify(workspace)); 
  
  if (encrypted.apiKey && !isEncrypted(encrypted.apiKey)) {
    encrypted.apiKey = encryptValue(encrypted.apiKey, password);
  }

  if (encrypted.environmentVariables && Array.isArray(encrypted.environmentVariables)) {
    encrypted.environmentVariables = encrypted.environmentVariables.map((envVar: any) => {
      if (envVar.sensitive && envVar.value && !isEncrypted(envVar.value)) {
        return {
          ...envVar,
          value: encryptValue(envVar.value, password)
        };
      }
      return envVar;
    });
  }

  if (encrypted.agents && Array.isArray(encrypted.agents)) {
    encrypted.agents = encrypted.agents.map((agent: any) => {
      if (agent.apiKey && !isEncrypted(agent.apiKey)) {
        return {
          ...agent,
          apiKey: encryptValue(agent.apiKey, password)
        };
      }
      return agent;
    });
  }

  return encrypted;
}

export function validatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} {
  if (password.length < 6) {
    return { strength: 'weak', message: 'Password too short (minimum 6 characters)' };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length >= 12 && score >= 3) {
    return { strength: 'strong', message: 'Strong password' };
  } else if (password.length >= 8 && score >= 2) {
    return { strength: 'medium', message: 'Medium strength password' };
  } else {
    return { strength: 'weak', message: 'Weak password - add uppercase, numbers, or symbols' };
  }
}

export function hasEncryptedData(workspace: any): boolean {
  if (workspace.apiKey && isEncrypted(workspace.apiKey)) {
    return true;
  }

  if (workspace.environmentVariables && Array.isArray(workspace.environmentVariables)) {
    const hasEncryptedEnv = workspace.environmentVariables.some((envVar: any) => 
      envVar.sensitive && envVar.value && isEncrypted(envVar.value)
    );
    if (hasEncryptedEnv) return true;
  }

  if (workspace.agents && Array.isArray(workspace.agents)) {
    const hasEncryptedAgent = workspace.agents.some((agent: any) => 
      agent.apiKey && isEncrypted(agent.apiKey)
    );
    if (hasEncryptedAgent) return true;
  }

  return false;
}