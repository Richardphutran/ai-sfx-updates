/**
 * Auto-reconnect functionality for CEP panels
 * Handles the ERR_CONNECTION_REFUSED issue when dev server isn't ready
 */

export function initAutoReconnect() {
  // Only run in development
  if (!window.location.hostname.includes('localhost')) {
    return;
  }

  // Check if page failed to load - improved detection
  const checkPageError = () => {
    // Only trigger if we're actually on an error page
    const isErrorPage = (
      document.title === 'Page failed to load' || 
      document.body?.innerHTML?.includes('ERR_CONNECTION_REFUSED') ||
      document.body?.innerHTML?.includes('Failed to fetch')
    ) && 
    // Prevent false positives on normal pages
    !document.querySelector('[data-plugin="ai-sfx"]') &&
    !document.querySelector('.plugin-container');
    
    if (isErrorPage) {
      handleConnectionError();
    }
  };

  // Handle connection errors
  const handleConnectionError = () => {
    const targetUrl = window.location.href;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes
    
    const tryConnect = () => {
      attempts++;
      
      // Try to fetch from dev server
      fetch(targetUrl.replace(/^http/, 'http'), { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        })
        .catch(() => {
          if (attempts < maxAttempts) {
            setTimeout(tryConnect, 1000);
          } else {
            showManualInstructions();
          }
        });
    };
    
    // Start reconnection attempts
    tryConnect();
    
    // Update UI to show waiting state
    if (document.body) {
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
      document.body.style.fontFamily = 'Arial, sans-serif';
      document.body.style.display = 'flex';
      document.body.style.alignItems = 'center';
      document.body.style.justifyContent = 'center';
      document.body.style.height = '100vh';
      document.body.style.margin = '0';
      
      document.body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
          <h2 style="margin: 0 0 10px 0;">Waiting for Dev Server...</h2>
          <p style="margin: 0; opacity: 0.7;">The plugin will reload automatically when ready</p>
          <div style="margin-top: 20px; font-size: 12px; opacity: 0.5;">
            <span id="attempt-counter">Attempt 1</span>
          </div>
        </div>
      `;
      
      // Update attempt counter
      setInterval(() => {
        const counter = document.getElementById('attempt-counter');
        if (counter) {
          counter.textContent = `Attempt ${attempts}`;
        }
      }, 1000);
    }
  };

  const showManualInstructions = () => {
    if (document.body) {
      document.body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
          <h2 style="margin: 0 0 20px 0;">Dev Server Not Running</h2>
          <p style="margin: 0 0 20px 0;">Please start the development server:</p>
          <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px; display: inline-block;">npm run dev</pre>
          <p style="margin: 20px 0;">or</p>
          <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px; display: inline-block;">python3 start_plugin.py</pre>
          <button onclick="location.reload()" style="
            margin-top: 20px;
            padding: 10px 20px;
            background: #007ACC;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">Retry</button>
        </div>
      `;
    }
  };

  // Check immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPageError);
  } else {
    checkPageError();
  }
  
  // Also check on any error event
  window.addEventListener('error', (e) => {
    if (e.message?.includes('Failed to fetch') || e.message?.includes('ERR_CONNECTION_REFUSED')) {
      handleConnectionError();
    }
  });
}

// Auto-initialize
initAutoReconnect();