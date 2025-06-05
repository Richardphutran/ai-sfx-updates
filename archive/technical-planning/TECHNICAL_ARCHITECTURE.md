# AI SFX Generator - Technical Architecture Plan

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CEP Plugin    │◄──►│   Backend API    │◄──►│  Eleven Labs    │
│   (Premiere)    │    │   (Node.js)      │    │     API         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       
         │                       ▼                       
         │              ┌─────────────────┐              
         │              │   PostgreSQL    │              
         │              │   Database      │              
         │              └─────────────────┘              
         │                                               
         ▼                                               
┌─────────────────┐                                     
│ Customer Portal │                                     
│   (React)       │                                     
└─────────────────┘                                     
```

## 🔑 API PROXY ARCHITECTURE

### Why You Need an API Proxy
1. **Cost Control**: Pool API keys, track usage, prevent abuse
2. **User Management**: Handle subscriptions without exposing Eleven Labs keys
3. **Rate Limiting**: Protect against excessive usage
4. **Analytics**: Track what users are generating
5. **Caching**: Reduce API costs for similar requests

### Proxy Flow
```
Plugin Request → Auth Check → Usage Check → Eleven Labs → Response
      ↓              ↓           ↓             ↓           ↓
[User Token] → [Valid User?] → [Under Limit?] → [API Call] → [Track Usage]
```

## 💾 DATABASE SCHEMA DESIGN

### Core Tables
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    status ENUM('active', 'suspended', 'trial') DEFAULT 'trial'
);

-- Subscriptions table  
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    stripe_subscription_id VARCHAR UNIQUE,
    plan_type ENUM('basic', 'pro', 'enterprise'),
    status ENUM('active', 'canceled', 'past_due'),
    current_period_start DATE,
    current_period_end DATE,
    monthly_limit INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    prompt TEXT NOT NULL,
    duration_seconds INTEGER,
    influence_level FLOAT,
    success BOOLEAN,
    cost_credits INTEGER DEFAULT 1,
    eleven_labs_cost FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    audio_file_path VARCHAR
);

-- API keys pool (for rotation)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    key_hash VARCHAR NOT NULL,
    usage_count INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 1000,
    last_used TIMESTAMP,
    status ENUM('active', 'rate_limited', 'disabled') DEFAULT 'active'
);
```

## 🔐 AUTHENTICATION SYSTEM

### JWT Token Flow
```
1. User Login → Backend validates → Returns JWT token
2. Plugin stores token securely (encrypted local storage)
3. Every API call includes token in Authorization header
4. Backend validates token + checks subscription status
5. If valid, proxy request to Eleven Labs
```

### Token Structure
```javascript
{
  "sub": "user_id",
  "email": "user@example.com", 
  "plan": "pro",
  "monthly_limit": 2000,
  "usage_this_month": 450,
  "exp": 1640995200
}
```

## 🌐 BACKEND API ENDPOINTS

### Authentication
```
POST /auth/register
POST /auth/login  
POST /auth/refresh
GET  /auth/verify
```

### Usage Management
```
GET  /usage/current        # Current month usage
GET  /usage/history        # Historical usage
POST /usage/generate       # Generate SFX (proxy to Eleven Labs)
GET  /usage/limits         # Plan limits and remaining
```

### Subscription Management
```
GET  /subscription/current
POST /subscription/create
PUT  /subscription/upgrade
POST /subscription/cancel
GET  /subscription/invoices
```

### Admin
```
GET  /admin/users
GET  /admin/usage-stats
PUT  /admin/user/:id/status
GET  /admin/api-keys
```

## 📱 PLUGIN INTEGRATION

### Authentication Flow in Plugin
```javascript
class AuthManager {
    static async login(email, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const { token, user } = await response.json();
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        return { token, user };
    }
    
    static async generateSFX(prompt, duration, influence) {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${API_BASE}/usage/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt, duration, influence })
        });
        
        if (response.status === 402) {
            throw new Error('Usage limit exceeded. Please upgrade your plan.');
        }
        
        return await response.blob();
    }
}
```

## 💳 SUBSCRIPTION BILLING

### Stripe Integration Architecture
```javascript
// Backend webhook handler
app.post('/webhooks/stripe', (req, res) => {
    const event = req.body;
    
    switch (event.type) {
        case 'invoice.payment_succeeded':
            // Reset monthly usage limits
            resetUserUsageLimit(event.data.object.customer);
            break;
            
        case 'subscription.deleted':
            // Downgrade user to free tier
            downgradeUser(event.data.object.customer);
            break;
            
        case 'invoice.payment_failed':
            // Suspend user access
            suspendUser(event.data.object.customer);
            break;
    }
    
    res.status(200).send('received');
});
```

### Plan Configuration
```javascript
const PLANS = {
    basic: {
        stripe_price_id: 'price_basic_monthly',
        monthly_limit: 500,
        price: 9.99,
        features: ['Basic generation', 'Email support']
    },
    pro: {
        stripe_price_id: 'price_pro_monthly', 
        monthly_limit: 2000,
        price: 19.99,
        features: ['Pro generation', 'Priority support', 'Advanced settings']
    },
    enterprise: {
        stripe_price_id: 'price_enterprise_monthly',
        monthly_limit: -1, // Unlimited
        price: 49.99,
        features: ['Unlimited generation', 'Phone support', 'Custom features']
    }
};
```

## 📊 USAGE TRACKING & ANALYTICS

### Real-time Usage Tracking
```javascript
class UsageTracker {
    static async trackGeneration(userId, prompt, duration, success, cost) {
        // Record in database
        await db.query(`
            INSERT INTO api_usage (user_id, prompt, duration_seconds, success, cost_credits)
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, prompt, duration, success, cost]);
        
        // Update user's monthly usage
        await db.query(`
            UPDATE user_monthly_usage 
            SET count = count + 1, cost = cost + $2
            WHERE user_id = $1 AND month = date_trunc('month', NOW())
        `, [userId, cost]);
        
        // Check if approaching limit
        const usage = await this.getCurrentUsage(userId);
        if (usage.percentage > 0.8) {
            await this.sendUsageWarning(userId);
        }
    }
}
```

## 🔄 AUTO-UPDATE SYSTEM

### Version Management
```javascript
// Plugin version check
class UpdateManager {
    static async checkForUpdates() {
        const currentVersion = PLUGIN_VERSION;
        const response = await fetch(`${API_BASE}/updates/check`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const { latest_version, download_url, changelog } = await response.json();
        
        if (this.isNewerVersion(latest_version, currentVersion)) {
            return { hasUpdate: true, latest_version, download_url, changelog };
        }
        
        return { hasUpdate: false };
    }
    
    static async downloadAndInstall(downloadUrl) {
        // Download update package
        // Verify signature
        // Install in background
        // Notify user to restart
    }
}
```

## 🛡️ SECURITY CONSIDERATIONS

### API Security
- Rate limiting per user (100 requests/hour)
- Request signing with HMAC
- Input validation and sanitization
- SQL injection prevention
- CORS configuration

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- PCI compliance for payment data
- Regular security audits
- GDPR compliance for EU users

## 📈 MONITORING & OBSERVABILITY

### Key Metrics to Track
```javascript
// Application metrics
const metrics = {
    business: {
        monthly_recurring_revenue: 0,
        active_subscriptions: 0,
        churn_rate: 0,
        average_usage_per_user: 0
    },
    technical: {
        api_response_time: 0,
        error_rate: 0,
        eleven_labs_costs: 0,
        server_uptime: 0
    },
    product: {
        daily_active_users: 0,
        generations_per_day: 0,
        feature_adoption_rates: {},
        support_ticket_volume: 0
    }
};
```

## 🚀 DEPLOYMENT STRATEGY

### Infrastructure
- **Backend**: AWS/Digital Ocean VPS with Docker
- **Database**: PostgreSQL (managed service)
- **CDN**: CloudFlare for static assets
- **Monitoring**: DataDog or New Relic
- **Error Tracking**: Sentry

### CI/CD Pipeline
```
Git Push → Tests → Build → Deploy to Staging → Manual QA → Deploy to Production
```

## 💰 COST ANALYSIS

### Monthly Operating Costs (Estimated)
- Server hosting: $20-50
- Database: $15-30
- Monitoring/logging: $20
- Email service: $10
- Stripe fees: 2.9% + $0.30 per transaction
- Domain/SSL: $2

### Revenue Projections
- 100 basic users ($9.99): $999/month
- 50 pro users ($19.99): $999.50/month
- 5 enterprise ($49.99): $249.95/month
- **Total**: ~$2,248/month potential

This gives you a solid foundation to build a professional, scalable business around your AI SFX plugin!