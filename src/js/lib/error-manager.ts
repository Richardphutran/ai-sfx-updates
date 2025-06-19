/**
 * Production-grade error management system for AI SFX Generator
 * Handles error logging, user notifications, and analytics
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  FILE_SYSTEM = 'file_system',
  API = 'api',
  UI = 'ui',
  PREMIERE = 'premiere',
  NETWORK = 'network',
  VALIDATION = 'validation'
}

export interface ErrorDetails {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  timestamp: number;
  stack?: string;
  context?: Record<string, any>;
  recoverable: boolean;
}

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

class ErrorManager {
  private errors: ErrorDetails[] = [];
  private notificationCallbacks: Set<(notification: NotificationOptions & { message: string; id: string }) => void> = new Set();
  private maxErrorHistory = 50;
  
  /**
   * Register notification callback for UI components
   */
  onNotification(callback: (notification: NotificationOptions & { message: string; id: string }) => void) {
    this.notificationCallbacks.add(callback);
    return () => this.notificationCallbacks.delete(callback);
  }

  /**
   * Handle errors with context and user notification
   */
  handleError(
    error: Error | string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    userMessage?: string
  ): string {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    const errorDetails: ErrorDetails = {
      id: errorId,
      category,
      severity,
      message: error instanceof Error ? error.message : error,
      userMessage: userMessage || this.getDefaultUserMessage(category, severity),
      timestamp,
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        timestamp: new Date(timestamp).toISOString()
      },
      recoverable: severity !== ErrorSeverity.CRITICAL
    };

    // Store error
    this.errors.unshift(errorDetails);
    if (this.errors.length > this.maxErrorHistory) {
      this.errors = this.errors.slice(0, this.maxErrorHistory);
    }

    // Log to console with context
    this.logError(errorDetails);

    // Show user notification
    this.showNotification(errorDetails);

    return errorId;
  }

  /**
   * Handle success notifications
   */
  success(message: string, duration = 2000) {
    this.notify({
      type: 'success',
      message,
      duration
    });
  }

  /**
   * Handle warning notifications  
   */
  warning(message: string, duration = 3000) {
    this.notify({
      type: 'warning', 
      message,
      duration
    });
  }

  /**
   * Handle info notifications
   */
  info(message: string, duration = 2000) {
    this.notify({
      type: 'info',
      message, 
      duration
    });
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): ErrorDetails[] {
    return [...this.errors];
  }

  /**
   * Get debug report for support
   */
  getDebugReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      errors: this.errors.slice(0, 10), // Last 10 errors
      system: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      }
    };
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errors = [];
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultUserMessage(category: ErrorCategory, severity: ErrorSeverity): string {
    const messages = {
      [ErrorCategory.FILE_SYSTEM]: {
        [ErrorSeverity.LOW]: 'File operation completed with warnings',
        [ErrorSeverity.MEDIUM]: 'File access issue - please check permissions',
        [ErrorSeverity.HIGH]: 'Unable to access file system - check folder permissions',
        [ErrorSeverity.CRITICAL]: 'Critical file system error - restart required'
      },
      [ErrorCategory.API]: {
        [ErrorSeverity.LOW]: 'API request completed with warnings',
        [ErrorSeverity.MEDIUM]: 'API connection issue - retrying...',
        [ErrorSeverity.HIGH]: 'API service unavailable - please try again',
        [ErrorSeverity.CRITICAL]: 'API authentication failed - check license key'
      },
      [ErrorCategory.PREMIERE]: {
        [ErrorSeverity.LOW]: 'Premiere operation completed with warnings',
        [ErrorSeverity.MEDIUM]: 'Timeline sync issue - refreshing...',
        [ErrorSeverity.HIGH]: 'Unable to communicate with Premiere Pro',
        [ErrorSeverity.CRITICAL]: 'Premiere Pro connection lost - restart plugin'
      },
      [ErrorCategory.UI]: {
        [ErrorSeverity.LOW]: 'Minor display issue',
        [ErrorSeverity.MEDIUM]: 'Interface issue - please refresh',
        [ErrorSeverity.HIGH]: 'UI error - some features may be unavailable', 
        [ErrorSeverity.CRITICAL]: 'Critical UI error - restart required'
      },
      [ErrorCategory.NETWORK]: {
        [ErrorSeverity.LOW]: 'Network request completed with warnings',
        [ErrorSeverity.MEDIUM]: 'Connection issue - retrying...',
        [ErrorSeverity.HIGH]: 'Network unavailable - check connection',
        [ErrorSeverity.CRITICAL]: 'Network error - service unavailable'
      },
      [ErrorCategory.VALIDATION]: {
        [ErrorSeverity.LOW]: 'Input validation warning',
        [ErrorSeverity.MEDIUM]: 'Invalid input - please check your data',
        [ErrorSeverity.HIGH]: 'Validation failed - operation cancelled',
        [ErrorSeverity.CRITICAL]: 'Critical validation error'
      }
    };

    return messages[category]?.[severity] || 'An unexpected error occurred';
  }

  private logError(error: ErrorDetails) {
    const logMessage = `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, error);
        break;
      case ErrorSeverity.LOW:
        console.info(logMessage, error);
        break;
    }
  }

  private showNotification(error: ErrorDetails) {
    // Silent operation - no popups/notifications
    // Errors are logged to console only for debugging
    return;
  }

  private notify(options: NotificationOptions & { message: string }) {
    const notification = {
      ...options,
      id: this.generateErrorId()
    };

    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (e) {
        console.error('Notification callback error:', e);
      }
    });
  }

  private getNotificationType(severity: ErrorSeverity): 'success' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  private getNotificationDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 0; // Persistent
      case ErrorSeverity.HIGH:
        return 5000;
      case ErrorSeverity.MEDIUM:
        return 3000;
      case ErrorSeverity.LOW:
        return 2000;
      default:
        return 3000;
    }
  }
}

// Singleton instance
export const errorManager = new ErrorManager();

/**
 * Utility functions for common error scenarios
 */
export const ErrorUtils = {
  /**
   * Handle file system errors
   */
  handleFileError: (error: Error, context?: Record<string, any>) => {
    return errorManager.handleError(
      error,
      ErrorCategory.FILE_SYSTEM,
      ErrorSeverity.MEDIUM,
      context
    );
  },

  /**
   * Handle API errors with retry logic awareness
   */
  handleAPIError: (error: Error, isRetryable = false, context?: Record<string, any>) => {
    const severity = isRetryable ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH;
    return errorManager.handleError(
      error,
      ErrorCategory.API,
      severity,
      context
    );
  },

  /**
   * Handle Premiere Pro integration errors
   */
  handlePremiereError: (error: Error, context?: Record<string, any>) => {
    return errorManager.handleError(
      error,
      ErrorCategory.PREMIERE,
      ErrorSeverity.MEDIUM,
      context
    );
  },

  /**
   * Handle validation errors
   */
  handleValidationError: (message: string, context?: Record<string, any>) => {
    return errorManager.handleError(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      context,
      'Please check your input and try again'
    );
  }
};