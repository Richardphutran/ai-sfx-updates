/**
 * Production-grade security manager for AI SFX Generator
 * Handles API key encryption, input sanitization, and security validation
 */

import { ErrorUtils } from './error-manager';

/**
 * Simple encryption for API keys (browser-safe)
 * Note: This is obfuscation, not true encryption. For true security,
 * sensitive data should be handled server-side.
 */
class SimpleEncryption {
  private static readonly key = 'AI_SFX_2024_SECURE_KEY_v1';
  
  static encrypt(text: string): string {
    if (!text) return '';
    
    try {
      // Simple XOR cipher with base64 encoding
      const key = this.key;
      let encrypted = '';
      
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
      }
      
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return text; // Fallback to plain text
    }
  }
  
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      const decoded = atob(encryptedText);
      const key = this.key;
      let decrypted = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText; // Fallback to original
    }
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize file paths to prevent directory traversal
   */
  static sanitizeFilePath(path: string): string {
    if (!path || typeof path !== 'string') return '';
    
    return path
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/\\/g, '/') // Normalize path separators
      .trim();
  }
  
  /**
   * Sanitize prompts for API calls
   */
  static sanitizePrompt(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') return '';
    
    return prompt
      .trim()
      .substring(0, 500) // Limit length
      .replace(/[<>{}]/g, '') // Remove potential code injection chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\W+|\W+$/g, ''); // Remove leading/trailing non-word chars
  }
  
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(html: string): string {
    if (!html || typeof html !== 'string') return '';
    
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Validate API key format
   */
  static validateAPIKey(apiKey: string): { valid: boolean; reason?: string } {
    if (!apiKey || typeof apiKey !== 'string') {
      return { valid: false, reason: 'API key is required' };
    }
    
    if (apiKey.length < 10) {
      return { valid: false, reason: 'API key too short' };
    }
    
    if (apiKey.length > 200) {
      return { valid: false, reason: 'API key too long' };
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
      return { valid: false, reason: 'API key contains invalid characters' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate file extension
   */
  static validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
    if (!filename || typeof filename !== 'string') return false;
    
    const ext = filename.toLowerCase().split('.').pop();
    return allowedExtensions.includes(ext || '');
  }
  
  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return 'untitled';
    
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100) // Limit length
      .trim();
  }
}

/**
 * Secure storage manager for API keys and sensitive data
 */
export class SecureStorage {
  private static readonly API_KEY_STORAGE_KEY = 'ai_sfx_api_key_v2';
  private static readonly STORAGE_VERSION = '1.0';
  
  /**
   * Store API key securely
   */
  static storeAPIKey(apiKey: string): boolean {
    try {
      // Validate first
      const validation = InputSanitizer.validateAPIKey(apiKey);
      if (!validation.valid) {
        ErrorUtils.handleValidationError(`Invalid API key: ${validation.reason}`);
        return false;
      }
      
      // Encrypt and store
      const encrypted = SimpleEncryption.encrypt(apiKey);
      const storageData = {
        data: encrypted,
        version: this.STORAGE_VERSION,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.API_KEY_STORAGE_KEY, JSON.stringify(storageData));
      return true;
    } catch (error) {
      ErrorUtils.handleValidationError('Failed to store API key securely');
      return false;
    }
  }
  
  /**
   * Retrieve API key securely
   */
  static getAPIKey(): string {
    try {
      const stored = localStorage.getItem(this.API_KEY_STORAGE_KEY);
      if (!stored) return '';
      
      const storageData = JSON.parse(stored);
      
      // Version compatibility check
      if (storageData.version !== this.STORAGE_VERSION) {
        console.warn('API key storage version mismatch, clearing...');
        this.clearAPIKey();
        return '';
      }
      
      return SimpleEncryption.decrypt(storageData.data);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      this.clearAPIKey(); // Clear corrupted data
      return '';
    }
  }
  
  /**
   * Clear stored API key
   */
  static clearAPIKey(): void {
    localStorage.removeItem(this.API_KEY_STORAGE_KEY);
  }
  
  /**
   * Check if API key exists
   */
  static hasAPIKey(): boolean {
    return this.getAPIKey().length > 0;
  }
  
  /**
   * Get masked API key for display (show only first/last few chars)
   */
  static getMaskedAPIKey(): string {
    const apiKey = this.getAPIKey();
    if (!apiKey || apiKey.length < 8) return '';
    
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }
}

/**
 * Security validation utilities
 */
export class SecurityValidator {
  /**
   * Validate request before API call
   */
  static validateAPIRequest(prompt: string, apiKey: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    } else if (prompt.length > 500) {
      errors.push('Prompt too long (max 500 characters)');
    }
    
    // Validate API key
    const keyValidation = InputSanitizer.validateAPIKey(apiKey);
    if (!keyValidation.valid) {
      errors.push(keyValidation.reason || 'Invalid API key');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate file operation
   */
  static validateFileOperation(operation: string, path: string): { valid: boolean; error?: string } {
    const sanitizedPath = InputSanitizer.sanitizeFilePath(path);
    
    if (sanitizedPath !== path) {
      return {
        valid: false,
        error: 'Invalid file path detected'
      };
    }
    
    // Check for suspicious operations
    const suspiciousPatterns = [
      /system32/i,
      /windows/i,
      /etc\/passwd/i,
      /\.\./, // Directory traversal
      /\0/, // Null bytes
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(path)) {
        return {
          valid: false,
          error: 'Potentially unsafe file path'
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Rate limiting for API calls
   */
  static readonly rateLimiter = (() => {
    const calls: number[] = [];
    const maxCalls = 10; // Max calls per minute
    const timeWindow = 60000; // 1 minute
    
    return {
      canMakeRequest(): boolean {
        const now = Date.now();
        
        // Remove old calls outside time window
        while (calls.length > 0 && calls[0] < now - timeWindow) {
          calls.shift();
        }
        
        // Check if under limit
        if (calls.length >= maxCalls) {
          return false;
        }
        
        // Record this call
        calls.push(now);
        return true;
      },
      
      getRemainingCalls(): number {
        const now = Date.now();
        const recentCalls = calls.filter(time => time > now - timeWindow);
        return Math.max(0, maxCalls - recentCalls.length);
      },
      
      getTimeUntilReset(): number {
        if (calls.length === 0) return 0;
        const oldestCall = calls[0];
        const resetTime = oldestCall + timeWindow;
        return Math.max(0, resetTime - Date.now());
      }
    };
  })();
}

/**
 * Main security manager orchestrating all security features
 */
export class SecurityManager {
  /**
   * Initialize security systems
   */
  static initialize(): void {
    console.log('🔒 Security Manager initialized');
    
    // Check for existing API key and validate
    if (SecureStorage.hasAPIKey()) {
      const apiKey = SecureStorage.getAPIKey();
      const validation = InputSanitizer.validateAPIKey(apiKey);
      
      if (!validation.valid) {
        console.warn('Stored API key invalid, clearing...');
        SecureStorage.clearAPIKey();
      }
    }
  }
  
  /**
   * Secure API call wrapper
   */
  static async secureAPICall<T>(
    prompt: string,
    apiKey: string,
    apiFunction: (sanitizedPrompt: string, validatedKey: string) => Promise<T>
  ): Promise<T> {
    // Rate limiting check
    if (!SecurityValidator.rateLimiter.canMakeRequest()) {
      const remaining = SecurityValidator.rateLimiter.getTimeUntilReset();
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(remaining / 1000)} seconds.`);
    }
    
    // Validate request
    const validation = SecurityValidator.validateAPIRequest(prompt, apiKey);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Sanitize inputs
    const sanitizedPrompt = InputSanitizer.sanitizePrompt(prompt);
    
    // Make secure API call
    return await apiFunction(sanitizedPrompt, apiKey);
  }
  
  /**
   * Get security status for debugging
   */
  static getSecurityStatus() {
    return {
      hasStoredAPIKey: SecureStorage.hasAPIKey(),
      maskedAPIKey: SecureStorage.getMaskedAPIKey(),
      remainingAPICalls: SecurityValidator.rateLimiter.getRemainingCalls(),
      timeUntilReset: SecurityValidator.rateLimiter.getTimeUntilReset(),
      storageVersion: SecureStorage['STORAGE_VERSION']
    };
  }
}