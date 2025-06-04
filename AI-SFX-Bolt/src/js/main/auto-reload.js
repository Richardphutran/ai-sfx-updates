/**
 * Auto-reload mechanism for CEP panels
 * This script runs in the browser context and automatically reloads
 * the page when the dev server becomes available
 */

(function() {
  // Only run in development (when loaded from localhost)
  if (!window.location.hostname.includes('localhost')) {
    return;
  }

  // Check if we're on the error page
  const isErrorPage = document.title === 'Page failed to load' || 
                     document.body?.textContent?.includes('ERR_CONNECTION_REFUSED');

  if (!isErrorPage) {
    // Page loaded successfully, no need to auto-reload
    return;
  }

  console.log('🔄 Auto-reload: Detected connection error, will retry...');

  // Extract the original URL from the error page
  const errorText = document.body?.textContent || '';
  const urlMatch = errorText.match(/URL:\s*(http:\/\/localhost:\d+\/[^\s]+)/);
  const targetUrl = urlMatch ? urlMatch[1] : window.location.href;

  let retryCount = 0;
  const maxRetries = 120; // 2 minutes max
  const retryInterval = 1000; // Check every second

  function tryReload() {
    retryCount++;
    
    // Try to fetch the target URL
    fetch(targetUrl, { mode: 'no-cors' })
      .then(() => {
        console.log('✅ Dev server is now available! Reloading...');
        // Small delay to ensure server is fully ready
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 500);
      })
      .catch(() => {
        if (retryCount < maxRetries) {
          // Show status to user
          if (retryCount % 5 === 0) {
            console.log(`⏳ Waiting for dev server... (${retryCount}s)`);
          }
          // Keep trying
          setTimeout(tryReload, retryInterval);
        } else {
          console.error('❌ Dev server did not start after 2 minutes');
          // Show user-friendly message
          document.body.innerHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2>Waiting for Development Server...</h2>
              <p>Please start the dev server with:</p>
              <pre style="background: #f0f0f0; padding: 10px; display: inline-block;">npm run dev</pre>
              <p>or</p>
              <pre style="background: #f0f0f0; padding: 10px; display: inline-block;">python3 start_plugin.py</pre>
              <p style="margin-top: 20px;">
                <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">
                  Retry Now
                </button>
              </p>
            </div>
          `;
        }
      });
  }

  // Start checking immediately
  tryReload();
})();