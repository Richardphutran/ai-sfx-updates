/**
 * Lemon Squeezy configuration for AI SFX Generator
 * Update these values with your actual Lemon Squeezy product information
 */

export const LEMON_SQUEEZY_CONFIG = {
  // Your Lemon Squeezy store ID
  STORE_ID: process.env.LEMON_SQUEEZY_STORE_ID || 'your_store_id_here',
  
  // Your AI SFX Generator product ID
  PRODUCT_ID: process.env.LEMON_SQUEEZY_PRODUCT_ID || 'your_product_id_here',
  
  // Optional: Specific variant ID if you have multiple pricing tiers
  VARIANT_ID: process.env.LEMON_SQUEEZY_VARIANT_ID || undefined,
  
  // API base URL (shouldn't need to change)
  API_BASE_URL: 'https://api.lemonsqueezy.com/v1',
  
  // Cache settings
  CACHE_DURATION_DAYS: 7,
  VALIDATION_INTERVAL_HOURS: 24,
  
  // Development/testing license keys
  DEV_LICENSE_KEYS: {
    'DEV_LICENSE_2024': 'sk-your-elevenlabs-dev-key',
    'DEMO_KEY_123': 'sk-your-elevenlabs-demo-key',
    'TEST_OFFLINE_2024': 'sk-your-elevenlabs-test-key'
  }
};

/**
 * Instructions for setup:
 * 
 * 1. Create your product in Lemon Squeezy dashboard
 * 2. Enable license keys for the product
 * 3. Get your Store ID and Product ID from the dashboard
 * 4. Update the values above or set environment variables:
 *    - LEMON_SQUEEZY_STORE_ID
 *    - LEMON_SQUEEZY_PRODUCT_ID
 *    - LEMON_SQUEEZY_VARIANT_ID (optional)
 * 
 * 5. For testing, you can add temporary license keys to DEV_LICENSE_KEYS
 * 6. In production, remove dev keys and rely on Lemon Squeezy validation
 */