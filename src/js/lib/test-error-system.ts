/**
 * Test utilities for the error handling system
 * Use these functions to test different error scenarios
 */

import { errorManager, ErrorUtils, ErrorCategory, ErrorSeverity } from './error-manager';

export const ErrorSystemTests = {
  /**
   * Test all notification types
   */
  testNotifications() {
    console.log('🧪 Testing notification types...');
    
    setTimeout(() => errorManager.success('✅ Success notification test'), 500);
    setTimeout(() => errorManager.warning('⚠️ Warning notification test'), 1000);
    setTimeout(() => errorManager.info('ℹ️ Info notification test'), 1500);
    setTimeout(() => errorManager.handleError(
      'Test error message',
      ErrorCategory.UI,
      ErrorSeverity.MEDIUM,
      { test: true },
      '❌ Error notification test'
    ), 2000);
  },

  /**
   * Test file system error handling
   */
  testFileSystemErrors() {
    console.log('🧪 Testing file system errors...');
    
    // Simulate file not found
    const fileError = new Error('ENOENT: no such file or directory');
    ErrorUtils.handleFileError(fileError, { 
      operation: 'readFile',
      path: '/nonexistent/path.mp3' 
    });
  },

  /**
   * Test API error handling
   */
  testAPIErrors() {
    console.log('🧪 Testing API errors...');
    
    // Simulate different API error scenarios
    setTimeout(() => {
      const retryableError = new Error('API rate limit exceeded');
      ErrorUtils.handleAPIError(retryableError, true, { 
        status: 429,
        endpoint: '/v1/sound-generation' 
      });
    }, 500);

    setTimeout(() => {
      const criticalError = new Error('Invalid API key');
      ErrorUtils.handleAPIError(criticalError, false, { 
        status: 401,
        endpoint: '/v1/sound-generation' 
      });
    }, 1500);
  },

  /**
   * Test Premiere Pro integration errors
   */
  testPremiereErrors() {
    console.log('🧪 Testing Premiere Pro errors...');
    
    const premiereError = new Error('ExtendScript execution failed');
    ErrorUtils.handlePremiereError(premiereError, {
      operation: 'getSequenceInfo',
      timeline: 'not available'
    });
  },

  /**
   * Test validation errors
   */
  testValidationErrors() {
    console.log('🧪 Testing validation errors...');
    
    ErrorUtils.handleValidationError('Prompt cannot be empty', {
      field: 'prompt',
      value: '',
      required: true
    });
  },

  /**
   * Test error with action button
   */
  testErrorWithAction() {
    console.log('🧪 Testing error with action...');
    
    errorManager.handleError(
      'Failed to save SFX file',
      ErrorCategory.FILE_SYSTEM,
      ErrorSeverity.HIGH,
      { filename: 'test.mp3' },
      'Could not save audio file - would you like to try a different location?'
    );
  },

  /**
   * Test persistent error
   */
  testPersistentError() {
    console.log('🧪 Testing persistent error...');
    
    errorManager.handleError(
      'License validation failed',
      ErrorCategory.API,
      ErrorSeverity.CRITICAL,
      { license: 'invalid' },
      'Your license has expired. Please renew to continue using the plugin.'
    );
  },

  /**
   * Test React Error Boundary (will crash component)
   * WARNING: This will trigger the error boundary!
   */
  testErrorBoundary() {
    console.log('🧪 Testing Error Boundary (this will crash the UI)...');
    
    // Simulate a React component crash
    setTimeout(() => {
      throw new Error('Simulated React component crash for testing Error Boundary');
    }, 1000);
  },

  /**
   * Get debug report
   */
  getDebugReport() {
    console.log('🧪 Generating debug report...');
    const report = errorManager.getDebugReport();
    console.log('Debug Report:', report);
    
    // Copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(report).then(() => {
        errorManager.success('Debug report copied to clipboard');
      });
    }
    
    return report;
  },

  /**
   * Clear error history
   */
  clearErrors() {
    console.log('🧪 Clearing error history...');
    errorManager.clearHistory();
    errorManager.success('Error history cleared');
  },

  /**
   * Run all tests in sequence
   */
  runAllTests() {
    console.log('🧪 Running comprehensive error system tests...');
    
    this.testNotifications();
    
    setTimeout(() => this.testFileSystemErrors(), 3000);
    setTimeout(() => this.testAPIErrors(), 5000);
    setTimeout(() => this.testPremiereErrors(), 8000);
    setTimeout(() => this.testValidationErrors(), 10000);
    setTimeout(() => this.testErrorWithAction(), 12000);
    
    setTimeout(() => {
      console.log('✅ All error system tests completed!');
      errorManager.success('Error system testing complete');
    }, 15000);
  }
};

// Make it available globally for console testing
(window as any).ErrorSystemTests = ErrorSystemTests;