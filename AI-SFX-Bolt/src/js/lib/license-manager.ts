/**
 * License management system for AI SFX Generator
 * Handles license key validation, storage, and API key mapping
 */

import { SecureStorage } from './security-manager';
import { errorManager } from './error-manager';

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
   * Validate a license key and return API key if valid
   */
  static async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      // Basic validation
      if (!licenseKey || licenseKey.trim().length === 0) {
        return { valid: false, error: 'License key cannot be empty' };
      }

      // Normalize license key
      const normalizedKey = licenseKey.trim().toUpperCase();

      // Check against our license database
      const apiKey = this.API_KEY_MAP[normalizedKey];
      if (apiKey && typeof apiKey === 'string') {
        
        // Store the license key securely
        this.storeLicense(normalizedKey, apiKey);
        
        return {
          valid: true,
          apiKey,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        };
      }

      // In production, this would make an API call to validate
      // For now, we'll check basic format and reject invalid keys
      if (normalizedKey.length < 8) {
        return { valid: false, error: 'License key too short' };
      }

      return { valid: false, error: 'Invalid license key' };

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
   * Check if there's a stored valid license
   */
  static getStoredLicense(): LicenseValidationResult | null {
    try {
      const stored = localStorage.getItem(this.LICENSE_STORAGE_KEY);
      if (!stored) return null;

      const licenseData = JSON.parse(stored);
      
      // Check if license has expired
      if (licenseData.expiresAt && Date.now() > licenseData.expiresAt) {
        this.clearLicense();
        return null;
      }

      return {
        valid: true,
        apiKey: licenseData.apiKey,
        expiresAt: new Date(licenseData.expiresAt)
      };

    } catch (error) {
      console.error('Failed to retrieve stored license:', error);
      this.clearLicense();
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
    const stored = this.getStoredLicense();
    
    if (stored?.valid) {
      errorManager.info('License verified successfully');
      return {
        isLicensed: true,
        apiKey: stored.apiKey || ''
      };
    }

    return {
      isLicensed: false,
      apiKey: ''
    };
  }

  /**
   * Process license key input (for UI integration)
   */
  static async processLicenseInput(input: string): Promise<{
    success: boolean;
    apiKey?: string;
    error?: string;
  }> {
    try {
      const result = await this.validateLicense(input);
      
      if (result.valid && result.apiKey) {
        errorManager.success('License activated successfully!');
        return {
          success: true,
          apiKey: result.apiKey
        };
      } else {
        errorManager.warning(result.error || 'Invalid license key');
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      const errorMessage = 'License validation failed';
      errorManager.warning(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}