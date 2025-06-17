/**
 * Connection Manager for CEP Smart Loader
 * Handles automatic dev/prod mode switching with reconnection
 */
class ConnectionManager {
    constructor(options) {
        this.devUrl = options.devUrl || 'http://localhost:3040/main/index.html';
        this.prodPath = options.prodPath || './index.html';
        this.onModeChange = options.onModeChange || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        
        this.checkInterval = options.checkInterval || 2000;
        this.retryInterval = options.retryInterval || 3000;
        
        this.currentMode = null;
        this.isChecking = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.checkTimer = null;
        this.lastDevServerCheck = 0;
    }
    
    start() {
        this.checkConnection();
        this.startMonitoring();
    }
    
    stop() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
    }
    
    async checkConnection() {
        if (this.isChecking) return;
        
        this.isChecking = true;
        const now = Date.now();
        
        // Throttle checks to avoid hammering the server
        if (now - this.lastDevServerCheck < 1000) {
            this.isChecking = false;
            return;
        }
        
        this.lastDevServerCheck = now;
        
        try {
            // Try to connect to dev server
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(this.devUrl, {
                method: 'HEAD',
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok || response.status === 0) {
                // Dev server is available
                this.handleDevAvailable();
            } else {
                // Dev server returned an error
                this.handleDevUnavailable();
            }
        } catch (error) {
            // Network error or timeout
            this.handleDevUnavailable();
        } finally {
            this.isChecking = false;
        }
    }
    
    handleDevAvailable() {
        if (this.currentMode !== 'dev') {
            console.log('Development server detected, switching to dev mode');
            this.currentMode = 'dev';
            this.retryCount = 0;
            this.onModeChange('dev', this.devUrl);
            this.onStatusChange('dev', 'DEV MODE');
        }
    }
    
    handleDevUnavailable() {
        if (this.currentMode !== 'prod') {
            console.log('Development server unavailable, switching to production mode');
            this.currentMode = 'prod';
            this.onModeChange('prod', this.prodPath);
            this.onStatusChange('prod', 'PROD MODE');
        }
        
        // Continue checking for dev server to come back
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            this.onStatusChange('connecting', `Retrying... (${this.retryCount}/${this.maxRetries})`);
        }
    }
    
    startMonitoring() {
        // Check periodically for mode changes
        this.checkTimer = setInterval(() => {
            // Only check for dev server if we're in prod mode
            // or if we haven't exceeded max retries
            if (this.currentMode === 'prod' || this.retryCount < this.maxRetries) {
                this.checkConnection();
            }
        }, this.currentMode === 'dev' ? this.checkInterval * 2 : this.retryInterval);
    }
    
    // Force reconnection attempt
    forceReconnect() {
        this.retryCount = 0;
        this.checkConnection();
    }
    
    // Get current status
    getStatus() {
        return {
            mode: this.currentMode,
            isChecking: this.isChecking,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries
        };
    }
}

// Also add a simple dev server health check endpoint
class DevServerHealthCheck {
    static async isHealthy(url) {
        try {
            const healthUrl = new URL(url);
            healthUrl.pathname = '/';
            
            const response = await fetch(healthUrl.toString(), {
                method: 'HEAD',
                mode: 'cors',
                timeout: 1000
            });
            
            return response.ok || response.status === 0;
        } catch (error) {
            return false;
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConnectionManager, DevServerHealthCheck };
}