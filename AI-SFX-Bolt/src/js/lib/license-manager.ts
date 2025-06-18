/**
 * License management system for AI SFX Generator
 * Handles license key validation, storage, and API key mapping
 */

import { SecureStorage } from './security-manager';
import { errorManager } from './error-manager';
import { LemonSqueezyManager } from './lemon-squeezy-manager';

/**
 * License validation result interface
 */
interface LicenseValidationResult {
  valid: boolean;
  apiKey?: string;
  error?: string;
  expiresAt?: Date;
}

/**
 * License manager class for handling license operations
 */
export class LicenseManager {
  private static readonly LICENSE_STORAGE_KEY = 'ai_sfx_license_v1';
  private static readonly API_KEY_MAP: Record<string, string> = {
    // Development/testing license keys mapped to API keys
    'DEV_LICENSE_2024': 'your_elevenlabs_api_key_here',
    'DEMO_KEY_123': 'demo_api_key_here',
    // Production license keys will be added here
  };

  /**
   * Validate a license key using Lemon Squeezy API
   */
  static async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      // Basic validation
      if (!licenseKey || licenseKey.trim().length === 0) {
        return { valid: false, error: 'License key cannot be empty' };
      }

      // Use Lemon Squeezy for validation
      const result = await LemonSqueezyManager.validateLicense(licenseKey.trim());
      
      if (result.valid && result.apiKey) {
        return {
          valid: true,
          apiKey: result.apiKey,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default 1 year
        };
      }

      return { 
        valid: false, 
        error: result.error || 'Invalid license key' 
      };

    } catch (error) {
      console.error('License validation error:', error);
      return { valid: false, error: 'License validation failed' };
    }
  }

  /**
   * Store license information securely
   */
  private static storeLicense(licenseKey: string, apiKey: string): void {
    try {
      const licenseData = {
        licenseKey,
        apiKey,
        validatedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
      };

      localStorage.setItem(this.LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
      
      // Also store the API key in secure storage
      SecureStorage.storeAPIKey(apiKey);
      
    } catch (error) {
      console.error('Failed to store license:', error);
    }
  }

  /**
   * Check if there's a stored valid license (uses Lemon Squeezy cache)
   */
  static getStoredLicense(): LicenseValidationResult | null {
    try {
      const result = LemonSqueezyManager.hasValidLicense();
      
      if (result.isLicensed && result.apiKey) {
        return {
          valid: true,
          apiKey: result.apiKey,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve stored license:', error);
      return null;
    }
  }

  /**
   * Clear stored license (for logout/expiration)
   */
  static clearLicense(): void {
    try {
      localStorage.removeItem(this.LICENSE_STORAGE_KEY);
      SecureStorage.clearAPIKey();
      LemonSqueezyManager.logout();
    } catch (error) {
      console.error('Failed to clear license:', error);
    }
  }

  /**
   * Check if user has a valid license
   */
  static isLicensed(): boolean {
    const stored = this.getStoredLicense();
    return stored?.valid === true;
  }

  /**
   * Get the API key from stored license
   */
  static getAPIKey(): string {
    const stored = this.getStoredLicense();
    return stored?.apiKey || '';
  }

  /**
   * Initialize license system on app start
   */
  static initialize(): { isLicensed: boolean; apiKey: string } {
    return LemonSqueezyManager.initialize();
  }

  /**
   * Process license key input (for UI integration)
   */
  static async processLicenseInput(input: string): Promise<{
    success: boolean;
    apiKey?: string;
    error?: string;
  }> {
    return LemonSqueezyManager.processLicenseInput(input);
  }
}