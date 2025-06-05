# AI SFX Generator Backend - Project Structure

## 📁 RECOMMENDED PROJECT STRUCTURE

```
ai-sfx-backend/
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
│
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   │
│   ├── config/
│   │   ├── database.js        # DB connection config
│   │   ├── stripe.js          # Stripe configuration
│   │   └── auth.js            # JWT configuration
│   │
│   ├── controllers/
│   │   ├── authController.js       # Login, register, refresh
│   │   ├── userController.js       # User management
│   │   ├── subscriptionController.js # Stripe integration
│   │   ├── usageController.js      # API usage tracking
│   │   └── adminController.js      # Admin functions
│   │
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── rateLimit.js       # Rate limiting
│   │   ├── subscription.js    # Subscription validation
│   │   └── usage.js           # Usage tracking
│   │
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Subscription.js    # Subscription model
│   │   ├── Usage.js           # API usage model
│   │   └── ApiKey.js          # API key pool model
│   │
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── user.js            # User management routes
│   │   ├── subscription.js    # Billing routes
│   │   ├── usage.js           # Usage/generation routes
│   │   └── admin.js           # Admin routes
│   │
│   ├── services/
│   │   ├── elevenLabsProxy.js # Eleven Labs API proxy
│   │   ├── stripeService.js   # Stripe billing logic
│   │   ├── emailService.js    # Email notifications
│   │   ├── usageTracker.js    # Usage calculation
│   │   └── analyticsService.js # Analytics tracking
│   │
│   ├── utils/
│   │   ├── logger.js          # Logging utility
│   │   ├── validation.js      # Input validation
│   │   ├── encryption.js      # Crypto utilities
│   │   └── constants.js       # App constants
│   │
│   └── database/
│       ├── migrations/        # Database migrations
│       ├── seeds/             # Seed data
│       └── schema.sql         # Database schema
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── docs/
│   ├── api.md                 # API documentation
│   ├── deployment.md          # Deployment guide
│   └── development.md         # Development setup
│
└── scripts/
    ├── migrate.js             # Database migrations
    ├── seed.js                # Seed database
    └── deploy.sh              # Deployment script
```

## 📋 PACKAGE.JSON TEMPLATE

```json
{
  "name": "ai-sfx-backend",
  "version": "1.0.0",
  "description": "Backend API for AI SFX Generator Plugin",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "pg": "^8.11.3",
    "stripe": "^13.6.0",
    "axios": "^1.5.0",
    "express-rate-limit": "^6.10.0",
    "express-validator": "^7.0.1",
    "winston": "^3.10.0",
    "nodemailer": "^6.9.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4",
    "supertest": "^6.3.3",
    "eslint": "^8.48.0"
  }
}
```

## 🗄️ DATABASE SCHEMA

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status user_status DEFAULT 'trial',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TYPE user_status AS ENUM ('trial', 'active', 'suspended', 'canceled');

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_type subscription_plan NOT NULL,
    status subscription_status DEFAULT 'active',
    monthly_limit INTEGER NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE subscription_plan AS ENUM ('starter', 'pro', 'studio');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete');

-- Monthly usage tracking
CREATE TABLE monthly_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of month
    generation_count INTEGER DEFAULT 0,
    overage_count INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Individual API calls
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    duration_seconds INTEGER,
    influence_level FLOAT,
    success BOOLEAN NOT NULL,
    cost_cents INTEGER NOT NULL,
    eleven_labs_cost_cents INTEGER,
    response_time_ms INTEGER,
    file_size_bytes INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API key pool for Eleven Labs
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    daily_usage INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 10000,
    monthly_cost_cents INTEGER DEFAULT 0,
    status api_key_status DEFAULT 'active',
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE api_key_status AS ENUM ('active', 'rate_limited', 'disabled');

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_monthly_usage_user_month ON monthly_usage(user_id, month);
CREATE INDEX idx_api_usage_user_created ON api_usage(user_id, created_at);
CREATE INDEX idx_api_keys_status ON api_keys(status);
```

## 🔑 ENVIRONMENT VARIABLES

```env
# Server
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_sfx_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Eleven Labs
ELEVEN_LABS_API_KEYS=key1,key2,key3  # Comma-separated for rotation

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

## 🚀 DOCKER SETUP

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY scripts/ ./scripts/

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_sfx_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_sfx_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 📝 INITIAL API ROUTES

```javascript
// src/routes/auth.js
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/verify
POST   /auth/logout

// src/routes/user.js
GET    /user/profile
PUT    /user/profile
DELETE /user/account

// src/routes/subscription.js
GET    /subscription/current
POST   /subscription/create
PUT    /subscription/upgrade
POST   /subscription/cancel
GET    /subscription/invoices
POST   /webhooks/stripe

// src/routes/usage.js
POST   /usage/generate        # Main SFX generation endpoint
GET    /usage/current         # Current month usage
GET    /usage/history         # Historical usage
GET    /usage/limits          # Plan limits

// src/routes/admin.js
GET    /admin/users
GET    /admin/usage-stats
GET    /admin/revenue
PUT    /admin/user/:id/status
```

This structure gives you a professional, scalable foundation that can handle everything from authentication to billing to usage tracking!