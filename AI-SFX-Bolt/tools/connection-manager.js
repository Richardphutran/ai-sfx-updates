/**
 * Smart Connection Manager for CEP Panels
 * Automatically switches between development and production modes
 * Solves ERR_CONNECTION_REFUSED issues by falling back to built assets
 */

class ConnectionManager {
    constructor(options) {
        this.devUrl = options.devUrl;
        this.prodUrl = options.prodUrl;
        this.containerId = options.containerId;
        this.indicatorId = options.indicatorId;
        this.loadingId = options.loadingId;
        this.checkInterval = options.checkInterval || 5000;
        this.timeout = options.timeout || 3000;
        
        this.currentMode = null;
        this.isDevAvailable = false;
        this.intervalId = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    start() {
        console.log('🚀 Starting Smart Connection Manager...');
        this.checkDevServer().then(available => {
            this.isDevAvailable = available;
            this.loadApp();
            this.startMonitoring();
        });
    }
    
    async checkDevServer() {
        try {
            console.log(`🔍 Checking dev server at ${this.devUrl}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(this.devUrl, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('✅ Dev server is available');
                return true;
            } else {
                console.log(`❌ Dev server returned ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Dev server check failed: ${error.message}`);
            return false;
        }
    }
    
    loadApp() {
        const container = document.getElementById(this.containerId);
        const indicator = document.getElementById(this.indicatorId);
        const loading = document.getElementById(this.loadingId);
        
        if (!container || !indicator) {
            console.error('❌ Required elements not found');
            return;
        }
        
        // Clear loading message
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (this.isDevAvailable) {
            this.loadDevMode(container, indicator);
        } else {
            this.loadProdMode(container, indicator);
        }
    }
    
    loadDevMode(container, indicator) {
        console.log('🔧 Loading in DEV MODE');
        this.currentMode = 'dev';
        
        // Update indicator
        indicator.textContent = 'DEV MODE';
        indicator.className = 'mode-indicator mode-dev';
        
        // Create iframe for dev server
        container.innerHTML = `<iframe src="${this.devUrl}" frameborder="0"></iframe>`;
        
        // Handle iframe load errors
        const iframe = container.querySelector('iframe');
        iframe.onerror = () => {
            console.log('❌ Dev mode iframe failed to load, switching to production');
            this.isDevAvailable = false;
            this.loadProdMode(container, indicator);
        };
    }
    
    loadProdMode(container, indicator) {
        console.log('📦 Loading in PROD MODE');
        this.currentMode = 'prod';
        
        // Update indicator
        indicator.textContent = 'PROD MODE';
        indicator.className = 'mode-indicator mode-prod';
        
        // Create iframe for production build
        container.innerHTML = `<iframe src="${this.prodUrl}" frameborder="0"></iframe>`;
        
        // Handle iframe load errors
        const iframe = container.querySelector('iframe');
        iframe.onerror = () => {
            console.error('❌ Production mode also failed to load');
            container.innerHTML = `
                <div class="error">
                    <h3>⚠️ Failed to Load</h3>
                    <p>Both development and production modes failed to load.</p>
                    <p>Please check the console for errors and try refreshing.</p>
                    <button onclick="window.connectionManager.forceReload()">🔄 Retry</button>
                </div>
            `;
        };
    }
    
    startMonitoring() {
        // Only monitor if we're in production mode
        // If dev server comes back online, we want to switch back
        this.intervalId = setInterval(async () => {
            if (this.currentMode === 'prod') {
                const devAvailable = await this.checkDevServer();
                if (devAvailable && !this.isDevAvailable) {
                    console.log('🔄 Dev server is back online, switching to dev mode');
                    this.isDevAvailable = true;
                    this.loadApp();
                }
            } else if (this.currentMode === 'dev') {
                // Occasionally check if dev server is still alive
                const devAvailable = await this.checkDevServer();
                if (!devAvailable && this.isDevAvailable) {
                    console.log('💥 Dev server went offline, switching to production mode');
                    this.isDevAvailable = false;
                    this.loadApp();
                }
            }
        }, this.checkInterval);
    }
    
    forceReload() {
        console.log('🔄 Force reloading...');
        this.retryCount++;
        
        if (this.retryCount > this.maxRetries) {
            console.log('❌ Max retries reached, giving up');
            return;
        }
        
        // Reset state and reload
        this.isDevAvailable = false;
        this.currentMode = null;
        
        const loading = document.getElementById(this.loadingId);
        const container = document.getElementById(this.containerId);
        
        if (loading) {
            loading.style.display = 'block';
            loading.textContent = `🔄 Retrying... (${this.retryCount}/${this.maxRetries})`;
        }
        
        if (container) {
            container.innerHTML = loading ? '' : '<div class="loading">🔄 Reloading...</div>';
        }
        
        // Wait a moment then restart
        setTimeout(() => {
            this.start();
        }, 1000);
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// Make it globally available
window.ConnectionManager = ConnectionManager;