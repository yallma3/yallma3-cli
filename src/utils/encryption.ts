// // src/utils/encryption.ts - Encryption utilities for CLI
// import crypto from 'crypto';

// const ALGORITHM = 'aes-256-cbc';
// const ENCRYPTION_PREFIX = 'enc_';

// /**
//  * Encrypt a value using AES-256-CBC
//  */
// export function encryptValue(value: string, password: string): string {
//   const salt = crypto.randomBytes(16);
//   const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
//   const iv = crypto.randomBytes(16);
  
//   const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
//   let encrypted = cipher.update(value, 'utf8', 'base64');
//   encrypted += cipher.final('base64');
  
//   // Combine salt + iv + encrypted data
//   const combined = Buffer.concat([
//     salt,
//     iv,
//     Buffer.from(encrypted, 'base64')
//   ]);
  
//   return ENCRYPTION_PREFIX + combined.toString('base64');
// }

// /**
//  * Decrypt a value using AES-256-CBC
//  */
// export function decryptValue(encryptedValue: string, password: string): string {
//   if (!encryptedValue.startsWith(ENCRYPTION_PREFIX)) {
//     return encryptedValue; // Not encrypted
//   }
  
//   const encrypted = encryptedValue.substring(ENCRYPTION_PREFIX.length);
//   const combined = Buffer.from(encrypted, 'base64');
  
//   // Extract salt, iv, and encrypted data
//   const salt = combined.slice(0, 16);
//   const iv = combined.slice(16, 32);
//   const encryptedData = combined.slice(32);
  
//   const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
//   const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
//   let decrypted = decipher.update(encryptedData.toString('base64'), 'base64', 'utf8');
//   decrypted += decipher.final('utf8');
  
//   return decrypted;
// }

// /**
//  * Check if a value is encrypted
//  */
// export function isEncrypted(value: string): boolean {
//   return value.startsWith(ENCRYPTION_PREFIX);
// }

// /**
//  * Decrypt all sensitive fields in a workspace
//  */
// export function decryptWorkspace(workspace: any, password: string): any {
//   try {
//     // Decrypt API key if encrypted
//     if (workspace.apiKey && isEncrypted(workspace.apiKey)) {
//       workspace.apiKey = decryptValue(workspace.apiKey, password);
//     }

//     // Decrypt environment variables
//     if (workspace.environmentVariables) {
//       workspace.environmentVariables = workspace.environmentVariables.map((envVar: any) => {
//         if (envVar.sensitive && envVar.value && isEncrypted(envVar.value)) {
//           return {
//             ...envVar,
//             value: decryptValue(envVar.value, password)
//           };
//         }
//         return envVar;
//       });
//     }

//     // Decrypt agent API keys
//     if (workspace.agents) {
//       workspace.agents = workspace.agents.map((agent: any) => {
//         if (agent.apiKey && isEncrypted(agent.apiKey)) {
//           return {
//             ...agent,
//             apiKey: decryptValue(agent.apiKey, password)
//           };
//         }
//         return agent;
//       });
//     }

//     return workspace;
//   } catch (error) {
//     throw new Error('Failed to decrypt workspace. Invalid password or corrupted data.');
//   }
// }

// /**
//  * Encrypt all sensitive fields in a workspace
//  */
// export function encryptWorkspace(workspace: any, password: string): any {
//   // Encrypt API key
//   if (workspace.apiKey && !isEncrypted(workspace.apiKey)) {
//     workspace.apiKey = encryptValue(workspace.apiKey, password);
//   }

//   // Encrypt sensitive environment variables
//   if (workspace.environmentVariables) {
//     workspace.environmentVariables = workspace.environmentVariables.map((envVar: any) => {
//       if (envVar.sensitive && envVar.value && !isEncrypted(envVar.value)) {
//         return {
//           ...envVar,
//           value: encryptValue(envVar.value, password)
//         };
//       }
//       return envVar;
//     });
//   }

//   // Encrypt agent API keys
//   if (workspace.agents) {
//     workspace.agents = workspace.agents.map((agent: any) => {
//       if (agent.apiKey && !isEncrypted(agent.apiKey)) {
//         return {
//           ...agent,
//           apiKey: encryptValue(agent.apiKey, password)
//         };
//       }
//       return agent;
//     });
//   }

//   return workspace;
// }

// /**
//  * Validate password strength
//  */
// export function validatePasswordStrength(password: string): {
//   strength: 'weak' | 'medium' | 'strong';
//   message: string;
// } {
//   if (password.length < 6) {
//     return { strength: 'weak', message: 'Password too short (minimum 6 characters)' };
//   }

//   const hasUpper = /[A-Z]/.test(password);
//   const hasLower = /[a-z]/.test(password);
//   const hasNumber = /[0-9]/.test(password);
//   const hasSpecial = /[^A-Za-z0-9]/.test(password);

//   const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

//   if (password.length >= 12 && score >= 3) {
//     return { strength: 'strong', message: 'Strong password' };
//   } else if (password.length >= 8 && score >= 2) {
//     return { strength: 'medium', message: 'Medium strength password' };
//   } else {
//     return { strength: 'weak', message: 'Weak password - add uppercase, numbers, or symbols' };
//   }
// }

// /**
//  * Check if workspace has encrypted data
//  */
// export function hasEncryptedData(workspace: any): boolean {
//   // Check API key
//   if (workspace.apiKey && isEncrypted(workspace.apiKey)) {
//     return true;
//   }

//   // Check environment variables
//   if (workspace.environmentVariables) {
//     const hasEncryptedEnv = workspace.environmentVariables.some((envVar: any) => 
//       envVar.sensitive && envVar.value && isEncrypted(envVar.value)
//     );
//     if (hasEncryptedEnv) return true;
//   }

//   // Check agents
//   if (workspace.agents) {
//     const hasEncryptedAgent = workspace.agents.some((agent: any) => 
//       agent.apiKey && isEncrypted(agent.apiKey)
//     );
//     if (hasEncryptedAgent) return true;
//   }

//   return false;
// }
// src/utils/encryption.ts - Fixed encryption utilities compatible with CryptoJS
import CryptoJS from 'crypto-js';

// Use CryptoJS format to match your existing workspace files
const ENCRYPTION_PREFIX = 'enc_';

/**
 * Encrypt a value using AES (CryptoJS format)
 * Compatible with the format used in your workspace files
 */
export function encryptValue(value: string, password: string): string {
  const encrypted = CryptoJS.AES.encrypt(value, password).toString();
  return ENCRYPTION_PREFIX + encrypted;
}

/**
 * Decrypt a value using AES (CryptoJS format)
 * Compatible with the format used in your workspace files
 */
export function decryptValue(encryptedValue: string, password: string): string {
  // Handle both prefixed and non-prefixed formats
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

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  // Check for our prefix
  if (value.startsWith(ENCRYPTION_PREFIX)) {
    return true;
  }
  
  // Check for CryptoJS format (U2FsdGVkX1...)
  if (value.startsWith('U2FsdGVkX1')) {
    return true;
  }
  
  return false;
}

/**
 * Decrypt all sensitive fields in a workspace
 */
export function decryptWorkspace(workspace: any, password: string): any {
  const decrypted = JSON.parse(JSON.stringify(workspace)); // Deep clone
  
  try {
    // Decrypt API key if encrypted
    if (decrypted.apiKey && isEncrypted(decrypted.apiKey)) {
      decrypted.apiKey = decryptValue(decrypted.apiKey, password);
    }

    // Decrypt environment variables
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

    // Decrypt agent API keys
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

/**
 * Encrypt all sensitive fields in a workspace
 */
export function encryptWorkspace(workspace: any, password: string): any {
  const encrypted = JSON.parse(JSON.stringify(workspace)); // Deep clone
  
  // Encrypt API key
  if (encrypted.apiKey && !isEncrypted(encrypted.apiKey)) {
    encrypted.apiKey = encryptValue(encrypted.apiKey, password);
  }

  // Encrypt sensitive environment variables
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

  // Encrypt agent API keys
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

/**
 * Validate password strength
 */
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

/**
 * Check if workspace has encrypted data
 */
export function hasEncryptedData(workspace: any): boolean {
  // Check API key
  if (workspace.apiKey && isEncrypted(workspace.apiKey)) {
    return true;
  }

  // Check environment variables
  if (workspace.environmentVariables && Array.isArray(workspace.environmentVariables)) {
    const hasEncryptedEnv = workspace.environmentVariables.some((envVar: any) => 
      envVar.sensitive && envVar.value && isEncrypted(envVar.value)
    );
    if (hasEncryptedEnv) return true;
  }

  // Check agents
  if (workspace.agents && Array.isArray(workspace.agents)) {
    const hasEncryptedAgent = workspace.agents.some((agent: any) => 
      agent.apiKey && isEncrypted(agent.apiKey)
    );
    if (hasEncryptedAgent) return true;
  }

  return false;
}