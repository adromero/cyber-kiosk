# Proposal 3: Multi-User SaaS Dashboard Platform

## Executive Summary

Transform the cyber-kiosk into a public-facing, multi-user web application where users can create accounts and customize their own personal cyberpunk dashboard in their browser. No local installation required - each user gets their own themed, configurable dashboard accessible from anywhere.

**Product Name Ideas:**
- CyberDash
- NeonHub
- Matrix Dashboard
- CyberSpace Terminal
- Retro Grid

---

## 1. Product Vision

### 1.1 What It Is

A **personal dashboard as a service** that provides:
- Customizable information panels (weather, news, markets, etc.)
- Multiple aesthetic themes (Cyberpunk, Hip-Hop, California)
- Music integration (Spotify)
- Productivity tools (timer, alarms)
- Responsive design (mobile to desktop)
- Zero installation - just sign up and go

### 1.2 What It's NOT

This is NOT:
- A system monitoring tool (removed: CPU temp, disk usage, etc.)
- A network management tool (removed: Pi-hole, network stats)
- A photo frame server (removed: frame-sync functionality)
- A self-hosted solution (it's cloud-hosted SaaS)

### 1.3 Target Users

**Primary Personas:**
1. **Tech Enthusiast**: Wants a cool, retro-futuristic start page
2. **Productivity User**: Needs centralized info dashboard
3. **Music Lover**: Wants weather + news + Spotify in one place
4. **Aesthetic-Driven User**: Just wants it to look cool

**Use Cases:**
- Browser start page replacement
- Secondary monitor dashboard
- Morning routine information hub
- Productivity/focus environment
- Cyberpunk aesthetic experience

---

## 2. Architecture Overview

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Internet                                               │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Users (browsers)                                 │ │
│  │  - Desktop                                        │ │
│  │  - Mobile                                         │ │
│  │  - Tablet                                         │ │
│  └──────────────────────┬───────────────────────────┘ │
│                         │ HTTPS                        │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐ │
│  │  CDN / Load Balancer                             │ │
│  │  (Cloudflare / AWS CloudFront)                   │ │
│  └──────────────────────┬───────────────────────────┘ │
│                         │                              │
│         ┌───────────────┴──────────────┐              │
│         ▼                                ▼             │
│  ┌──────────────┐                ┌──────────────┐    │
│  │   Frontend   │                │   Backend    │    │
│  │   (Static)   │                │   API Server │    │
│  │              │                │              │    │
│  │  - React/Vue │◄──REST/WS────►│  - Node.js   │    │
│  │  - Themes    │                │  - Express   │    │
│  │  - Panels    │                │  - Auth      │    │
│  └──────────────┘                └──────┬───────┘    │
│                                          │             │
│                    ┌─────────────────────┼──────────┐ │
│                    ▼                     ▼          ▼ │
│         ┌──────────────────┐  ┌────────────┐  ┌─────────┐
│         │   PostgreSQL     │  │   Redis    │  │  S3     │
│         │   (User Data)    │  │  (Cache/   │  │ (Static │
│         │                  │  │  Sessions) │  │ Assets) │
│         └──────────────────┘  └────────────┘  └─────────┘
│                                                         │
│         External APIs:                                  │
│         - OpenWeather                                   │
│         - NY Times                                      │
│         - YouTube                                       │
│         - Spotify                                       │
│         - Alpha Vantage                                 │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom theme system
- **State Management**: Zustand or Redux Toolkit
- **Routing**: React Router
- **API Client**: Axios with interceptors
- **Real-time**: Socket.io client

**Backend:**
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Authentication**: Passport.js + JWT
- **Database ORM**: Prisma
- **WebSocket**: Socket.io
- **API Security**: Helmet, CORS, Rate limiting
- **Background Jobs**: Bull (Redis-based queue)
- **Email**: SendGrid or AWS SES

**Database:**
- **Primary**: PostgreSQL 15+ (user data, settings)
- **Cache/Sessions**: Redis 7+
- **Search** (optional): Elasticsearch

**Infrastructure:**
- **Hosting**: AWS / DigitalOcean / Railway
- **CDN**: Cloudflare
- **Storage**: AWS S3 / Cloudflare R2
- **Monitoring**: Sentry + DataDog / New Relic
- **Logging**: Winston → CloudWatch

---

## 3. Features & Functionality

### 3.1 Core Features (From Proposal 1)

**Included Panels:**
- ✅ Weather Widget (personal zip code)
- ✅ News Feed (Hacker News, Dev.to, NY Times)
- ✅ Markets/Financial Data
- ✅ Video Player (YouTube)
- ✅ Music Player (Spotify integration)
- ✅ Timer & Alarm
- ✅ Cyberspace iframe (optional)

**Themes:**
- ✅ Cyberpunk (default)
- ✅ Hip-Hop
- ✅ California
- 🆕 Additional community themes

**Responsive Design:**
- ✅ Mobile (4-6" screens)
- ✅ Tablet (7-10" screens)
- ✅ Desktop (11"+ screens)

### 3.2 Removed Features (Not Applicable for Web SaaS)

**Excluded from web version:**
- ❌ System monitoring (CPU temp, memory, disk)
- ❌ Pi-hole integration
- ❌ Network statistics
- ❌ Photo frame/screensaver server
- ❌ Local file system access
- ❌ Raspberry Pi specific features

### 3.3 New SaaS-Specific Features

**User Management:**
- User registration & login
- Email verification
- Password reset
- Profile management
- Account deletion

**Settings & Preferences:**
- Panel configuration (saved to database)
- Theme selection (persisted)
- Personal API keys (encrypted storage)
- Notification preferences
- Privacy settings

**Subscription Management:**
- Free tier with limitations
- Premium tier features
- Billing integration (Stripe)
- Usage tracking

**Social Features (Optional):**
- Public dashboard sharing
- Theme marketplace
- Dashboard templates
- Community themes

---

## 4. Database Schema

### 4.1 Core Tables

**File: `database/schema.sql`**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'cyberpunk',
  zip_code VARCHAR(10),
  timezone VARCHAR(50),
  temperature_unit VARCHAR(10) DEFAULT 'F',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  data JSONB, -- Additional preferences
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Panel configurations
CREATE TABLE panel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  panel_id VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL,
  size VARCHAR(20),
  visible BOOLEAN DEFAULT TRUE,
  settings JSONB, -- Panel-specific settings
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, panel_id)
);

-- User timers
CREATE TABLE timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  duration_seconds INTEGER NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'stopped', -- stopped, running, paused
  sound VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User alarms
CREATE TABLE alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  time TIME NOT NULL,
  days_of_week INTEGER[], -- 0-6 (Sunday-Saturday)
  enabled BOOLEAN DEFAULT TRUE,
  sound VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spotify tokens (encrypted)
CREATE TABLE spotify_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT NOT NULL, -- Encrypted
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API keys (encrypted) - for users who want to use their own keys
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL, -- 'openweather', 'nytimes', etc.
  api_key TEXT NOT NULL, -- Encrypted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, service)
);

-- Session management
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);

-- Usage tracking (for analytics & billing)
CREATE TABLE usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at);

-- Subscription plans
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB,
  limits JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(20), -- active, canceled, past_due
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_panel_configs_user ON panel_configs(user_id);
CREATE INDEX idx_timers_user ON timers(user_id);
CREATE INDEX idx_alarms_user ON alarms(user_id);
```

### 4.2 Prisma Schema

**File: `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                   String             @id @default(uuid())
  email                String             @unique
  username             String             @unique
  passwordHash         String             @map("password_hash")
  emailVerified        Boolean            @default(false) @map("email_verified")
  verificationToken    String?            @map("verification_token")
  resetToken           String?            @map("reset_token")
  resetTokenExpires    DateTime?          @map("reset_token_expires")
  subscriptionTier     String             @default("free") @map("subscription_tier")
  subscriptionExpires  DateTime?          @map("subscription_expires")
  createdAt            DateTime           @default(now()) @map("created_at")
  updatedAt            DateTime           @updatedAt @map("updated_at")
  lastLogin            DateTime?          @map("last_login")

  preferences          UserPreferences?
  panelConfigs         PanelConfig[]
  timers               Timer[]
  alarms               Alarm[]
  spotifyToken         SpotifyToken?
  apiKeys              UserApiKey[]
  subscription         Subscription?
  usageLogs            UsageLog[]

  @@map("users")
}

model UserPreferences {
  userId              String    @id @map("user_id")
  theme               String    @default("cyberpunk")
  zipCode             String?   @map("zip_code")
  timezone            String?
  temperatureUnit     String    @default("F") @map("temperature_unit")
  notificationsEnabled Boolean  @default(true) @map("notifications_enabled")
  data                Json?
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

model PanelConfig {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  panelId   String    @map("panel_id")
  position  Int
  size      String?
  visible   Boolean   @default(true)
  settings  Json?
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, panelId])
  @@map("panel_configs")
}

model Timer {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  name            String?
  durationSeconds Int       @map("duration_seconds")
  endTime         DateTime? @map("end_time")
  status          String    @default("stopped")
  sound           String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("timers")
}

model Alarm {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  name        String?
  time        DateTime  @db.Time
  daysOfWeek  Int[]     @map("days_of_week")
  enabled     Boolean   @default(true)
  sound       String?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("alarms")
}

model SpotifyToken {
  userId       String    @id @map("user_id")
  accessToken  String    @map("access_token")
  refreshToken String    @map("refresh_token")
  expiresAt    DateTime  @map("expires_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("spotify_tokens")
}

model UserApiKey {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  service   String
  apiKey    String    @map("api_key")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, service])
  @@map("user_api_keys")
}

model SubscriptionPlan {
  id           String         @id
  name         String
  priceMonthly Decimal?       @map("price_monthly") @db.Decimal(10, 2)
  priceYearly  Decimal?       @map("price_yearly") @db.Decimal(10, 2)
  features     Json
  limits       Json
  active       Boolean        @default(true)
  createdAt    DateTime       @default(now()) @map("created_at")

  subscriptions Subscription[]

  @@map("subscription_plans")
}

model Subscription {
  id                   String           @id @default(uuid())
  userId               String           @unique @map("user_id")
  planId               String           @map("plan_id")
  stripeSubscriptionId String?          @map("stripe_subscription_id")
  status               String
  currentPeriodStart   DateTime?        @map("current_period_start")
  currentPeriodEnd     DateTime?        @map("current_period_end")
  createdAt            DateTime         @default(now()) @map("created_at")
  updatedAt            DateTime         @updatedAt @map("updated_at")

  user                 User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan                 SubscriptionPlan @relation(fields: [planId], references: [id])

  @@map("subscriptions")
}

model UsageLog {
  id        BigInt    @id @default(autoincrement())
  userId    String    @map("user_id")
  action    String
  metadata  Json?
  createdAt DateTime  @default(now()) @map("created_at")

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("usage_logs")
}
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

**Registration:**
```
User → POST /api/auth/register
     ↓
  Validate input
     ↓
  Hash password (bcrypt)
     ↓
  Create user record
     ↓
  Generate verification token
     ↓
  Send verification email
     ↓
  Return success (login not allowed until verified)
```

**Login:**
```
User → POST /api/auth/login
     ↓
  Find user by email
     ↓
  Verify email confirmed
     ↓
  Compare password hash
     ↓
  Generate JWT token
     ↓
  Create session (Redis)
     ↓
  Return JWT + user data
```

**Token Refresh:**
```
User → POST /api/auth/refresh
     ↓
  Validate refresh token
     ↓
  Generate new access token
     ↓
  Return new token
```

### 5.2 JWT Structure

```javascript
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "username": "cyberuser",
  "tier": "premium",
  "iat": 1234567890,
  "exp": 1234657890
}
```

### 5.3 Authorization Middleware

**File: `backend/middleware/auth.js`**

```javascript
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      tier: user.subscriptionTier
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireTier(tier) {
  return (req, res, next) => {
    const tiers = ['free', 'premium', 'pro'];
    const userTierIndex = tiers.indexOf(req.user.tier);
    const requiredTierIndex = tiers.indexOf(tier);

    if (userTierIndex < requiredTierIndex) {
      return res.status(403).json({ error: 'Upgrade required' });
    }

    next();
  };
}

module.exports = { requireAuth, requireTier };
```

---

## 6. API Design

### 6.1 API Endpoints

**Authentication:**
```
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login
POST   /api/auth/logout                # Logout
POST   /api/auth/refresh               # Refresh JWT token
POST   /api/auth/verify-email          # Verify email
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password        # Reset password
GET    /api/auth/me                    # Get current user
```

**User Profile:**
```
GET    /api/users/profile              # Get user profile
PUT    /api/users/profile              # Update profile
DELETE /api/users/account              # Delete account
PUT    /api/users/password             # Change password
```

**Preferences:**
```
GET    /api/preferences                # Get user preferences
PUT    /api/preferences                # Update preferences
PUT    /api/preferences/theme          # Update theme
PUT    /api/preferences/location       # Update location
```

**Panel Configuration:**
```
GET    /api/panels                     # Get user's panel config
PUT    /api/panels                     # Update entire panel config
PUT    /api/panels/:panelId            # Update specific panel
POST   /api/panels/:panelId/enable     # Enable panel
POST   /api/panels/:panelId/disable    # Disable panel
POST   /api/panels/reset               # Reset to defaults
```

**Timers:**
```
GET    /api/timers                     # Get all user timers
POST   /api/timers                     # Create timer
GET    /api/timers/:id                 # Get timer
PUT    /api/timers/:id                 # Update timer
DELETE /api/timers/:id                 # Delete timer
POST   /api/timers/:id/start           # Start timer
POST   /api/timers/:id/pause           # Pause timer
POST   /api/timers/:id/stop            # Stop timer
```

**Alarms:**
```
GET    /api/alarms                     # Get all user alarms
POST   /api/alarms                     # Create alarm
GET    /api/alarms/:id                 # Get alarm
PUT    /api/alarms/:id                 # Update alarm
DELETE /api/alarms/:id                 # Delete alarm
POST   /api/alarms/:id/toggle          # Enable/disable alarm
```

**Data Proxy APIs (server calls external APIs with server keys):**
```
GET    /api/data/weather               # Get weather data
GET    /api/data/weather/forecast      # Get forecast
GET    /api/data/news/hackernews       # Get HN stories
GET    /api/data/news/nytimes          # Get NYT articles
GET    /api/data/news/devto            # Get Dev.to articles
GET    /api/data/markets               # Get market data
GET    /api/data/youtube/search        # Search YouTube
```

**Spotify Integration:**
```
GET    /api/spotify/auth               # Initiate OAuth
GET    /api/spotify/callback           # OAuth callback
GET    /api/spotify/status             # Get connection status
DELETE /api/spotify/disconnect         # Disconnect Spotify
GET    /api/spotify/player             # Get playback state
POST   /api/spotify/player/play        # Play
POST   /api/spotify/player/pause       # Pause
POST   /api/spotify/player/next        # Next track
POST   /api/spotify/player/previous    # Previous track
POST   /api/spotify/player/volume      # Set volume
```

**Subscription:**
```
GET    /api/subscription               # Get subscription status
POST   /api/subscription/checkout      # Create checkout session
POST   /api/subscription/portal        # Billing portal
POST   /api/subscription/cancel        # Cancel subscription
POST   /api/webhook/stripe             # Stripe webhooks
```

### 6.2 Rate Limiting

**By Tier:**

```javascript
const rateLimits = {
  free: {
    api: 100,      // requests per minute
    data: 20,      // data endpoint requests per hour
  },
  premium: {
    api: 300,
    data: 60,
  },
  pro: {
    api: 1000,
    data: 200,
  }
};
```

**Implementation:**

**File: `backend/middleware/rate-limit.js`**

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

function createRateLimiter(tier) {
  const limits = rateLimits[tier];

  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: `rate-limit:${tier}:`
    }),
    windowMs: 60 * 1000, // 1 minute
    max: limits.api,
    message: 'Too many requests, please upgrade your plan',
    standardHeaders: true,
    legacyHeaders: false
  });
}

module.exports = { createRateLimiter };
```

---

## 7. Subscription Tiers & Monetization

### 7.1 Subscription Plans

**Free Tier:**
- ✅ Basic panels (weather, news, markets)
- ✅ 3 timers max
- ✅ 5 alarms max
- ✅ Cyberpunk theme only
- ✅ Mobile + desktop responsive
- ❌ Spotify integration
- ❌ Custom themes
- ❌ Panel customization
- **Rate Limits**: 100 API calls/min, 20 data requests/hour
- **Price**: FREE

**Premium Tier ($4.99/month or $49/year):**
- ✅ All Free features
- ✅ Unlimited timers & alarms
- ✅ Spotify integration
- ✅ All themes (Cyberpunk, Hip-Hop, California)
- ✅ Full panel customization
- ✅ Video/YouTube panel
- ✅ Priority support
- **Rate Limits**: 300 API calls/min, 60 data requests/hour
- **Price**: $4.99/month or $49/year (save 18%)

**Pro Tier ($9.99/month or $99/year):**
- ✅ All Premium features
- ✅ Custom theme creator
- ✅ Public dashboard sharing
- ✅ Analytics & insights
- ✅ API access for automation
- ✅ Multiple dashboards (up to 5)
- ✅ White-label option
- **Rate Limits**: 1000 API calls/min, 200 data requests/hour
- **Price**: $9.99/month or $99/year (save 17%)

### 7.2 Feature Flags

**File: `backend/utils/feature-flags.js`**

```javascript
const features = {
  spotify: {
    free: false,
    premium: true,
    pro: true
  },
  themes: {
    free: ['cyberpunk'],
    premium: ['cyberpunk', 'hiphop', 'california'],
    pro: ['cyberpunk', 'hiphop', 'california', 'custom']
  },
  panelCustomization: {
    free: false,
    premium: true,
    pro: true
  },
  videoPanel: {
    free: false,
    premium: true,
    pro: true
  },
  maxTimers: {
    free: 3,
    premium: -1, // unlimited
    pro: -1
  },
  maxAlarms: {
    free: 5,
    premium: -1,
    pro: -1
  },
  multipleDashboards: {
    free: 1,
    premium: 1,
    pro: 5
  }
};

function hasFeature(userTier, feature) {
  return features[feature]?.[userTier] || false;
}

function getFeatureLimit(userTier, feature) {
  return features[feature]?.[userTier] || 0;
}

module.exports = { hasFeature, getFeatureLimit };
```

---

## 8. Security Considerations

### 8.1 Security Measures

**Authentication Security:**
- Bcrypt password hashing (12 rounds)
- JWT with short expiry (15 min access, 7 day refresh)
- HTTP-only cookies for refresh tokens
- CSRF protection
- Email verification required
- Rate limiting on auth endpoints

**Data Security:**
- All API keys encrypted at rest (AES-256)
- Spotify tokens encrypted
- Database connection over SSL
- Secrets in environment variables (never committed)
- SQL injection prevention (Prisma ORM)

**API Security:**
- CORS whitelist
- Helmet.js security headers
- Rate limiting by user tier
- Input validation (Joi/Zod)
- XSS protection
- Content Security Policy (CSP)

**Infrastructure Security:**
- HTTPS only (TLS 1.3)
- Secure session storage (Redis)
- Regular dependency updates
- Automated security scanning
- DDoS protection (Cloudflare)

### 8.2 Privacy & Compliance

**Data Collection:**
- Minimal personal data (email, username)
- Optional location (zip code) for weather
- Usage analytics (anonymized)
- No tracking cookies
- No data selling

**GDPR Compliance:**
- Right to access data
- Right to deletion
- Data export functionality
- Clear privacy policy
- Cookie consent banner

**CCPA Compliance:**
- Do Not Sell option
- Data disclosure
- Opt-out mechanisms

---

## 9. Frontend Architecture

### 9.1 React Application Structure

```
frontend/
├── src/
│   ├── main.tsx                      # App entry point
│   ├── App.tsx                       # Root component
│   ├── routes/
│   │   ├── index.tsx                 # Route definitions
│   │   ├── ProtectedRoute.tsx        # Auth guard
│   │   └── PublicRoute.tsx           # Public only routes
│   ├── pages/
│   │   ├── Landing.tsx               # Marketing landing page
│   │   ├── Login.tsx                 # Login page
│   │   ├── Register.tsx              # Registration page
│   │   ├── Dashboard.tsx             # Main dashboard
│   │   ├── Settings.tsx              # Settings page
│   │   └── Pricing.tsx               # Pricing page
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── panels/
│   │   │   ├── PanelContainer.tsx    # Panel wrapper
│   │   │   ├── WeatherPanel.tsx
│   │   │   ├── NewsPanel.tsx
│   │   │   ├── MarketsPanel.tsx
│   │   │   ├── VideoPanel.tsx
│   │   │   ├── MusicPanel.tsx
│   │   │   └── TimerPanel.tsx
│   │   ├── settings/
│   │   │   ├── ProfileSettings.tsx
│   │   │   ├── PanelSettings.tsx
│   │   │   ├── ThemeSettings.tsx
│   │   │   └── SubscriptionSettings.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Loading.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                # Auth context hook
│   │   ├── useTheme.ts               # Theme management
│   │   ├── usePanels.ts              # Panel state
│   │   ├── useWebSocket.ts           # WebSocket connection
│   │   └── useSubscription.ts        # Subscription status
│   ├── store/
│   │   ├── index.ts                  # Store setup
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── panelSlice.ts
│   │   │   ├── themeSlice.ts
│   │   │   └── preferencesSlice.ts
│   │   └── middleware/
│   │       └── api.ts                # API middleware
│   ├── services/
│   │   ├── api.ts                    # Axios instance
│   │   ├── auth.ts                   # Auth API calls
│   │   ├── panels.ts                 # Panel API calls
│   │   ├── data.ts                   # Data proxy calls
│   │   └── websocket.ts              # WebSocket client
│   ├── themes/
│   │   ├── themeManager.ts           # Theme system
│   │   └── definitions/
│   │       ├── cyberpunk.ts
│   │       ├── hiphop.ts
│   │       └── california.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   └── types/
│       ├── user.ts
│       ├── panel.ts
│       ├── theme.ts
│       └── api.ts
```

### 9.2 State Management

**Zustand Store Example:**

**File: `frontend/src/store/useAuthStore.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  tier: 'free' | 'premium' | 'pro';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, username: string, password: string) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.clear();
      },

      register: async (email, username, password) => {
        await api.post('/auth/register', { email, username, password });
      },

      refreshToken: async () => {
        const response = await api.post('/auth/refresh');
        const { token } = response.data;
        set({ token });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

---

## 10. Deployment Strategy

### 10.1 Hosting Options

**Option A: Railway (Recommended for MVP)**
- **Pros**: Easy setup, automatic deploys, built-in PostgreSQL/Redis
- **Cons**: Can get expensive at scale
- **Cost**: ~$20-50/month to start

**Option B: AWS**
- **Compute**: ECS/Fargate or EC2
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3
- **CDN**: CloudFront
- **Cost**: ~$50-150/month depending on usage

**Option C: DigitalOcean**
- **Compute**: App Platform or Droplets
- **Database**: Managed PostgreSQL
- **Cache**: Managed Redis
- **Storage**: Spaces
- **Cost**: ~$30-100/month

### 10.2 CI/CD Pipeline

**GitHub Actions Workflow:**

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: frontend/dist

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway-app/deploy@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: frontend-build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cyberdash
          directory: dist
```

### 10.3 Environment Variables

**Backend .env:**
```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.cyberdash.app
FRONTEND_URL=https://cyberdash.app

# Database
DATABASE_URL=postgresql://user:pass@host:5432/cyberdash
REDIS_URL=redis://default:pass@host:6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@cyberdash.app

# External APIs
OPENWEATHER_API_KEY=xxxxx
NYT_API_KEY=xxxxx
YOUTUBE_API_KEY=xxxxx
ALPHA_VANTAGE_API_KEY=xxxxx

# Spotify
SPOTIFY_CLIENT_ID=xxxxx
SPOTIFY_CLIENT_SECRET=xxxxx
SPOTIFY_REDIRECT_URI=https://api.cyberdash.app/api/spotify/callback

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Encryption
ENCRYPTION_KEY=32-byte-hex-key-for-aes-256

# Security
CORS_ORIGINS=https://cyberdash.app,https://www.cyberdash.app

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 11. Marketing & Launch Strategy

### 11.1 Landing Page

**Sections:**
1. **Hero**: "Your Cyberpunk Command Center"
2. **Demo**: Embedded live demo (read-only)
3. **Features**: Visual showcase of panels
4. **Themes**: Theme previews
5. **Pricing**: Clear tier comparison
6. **Testimonials**: (future)
7. **FAQ**: Common questions
8. **CTA**: "Start Your Free Dashboard"

### 11.2 Launch Checklist

**Pre-Launch:**
- [ ] Product Hunt page ready
- [ ] Twitter/X account created
- [ ] Reddit posts prepared (/r/selfhosted, /r/cyberpunk, /r/productivity)
- [ ] Hacker News post ready
- [ ] Blog post written
- [ ] Demo video created
- [ ] Screenshots prepared

**Launch Day:**
- [ ] Submit to Product Hunt
- [ ] Post on Twitter
- [ ] Post on Reddit
- [ ] Submit to Hacker News
- [ ] Email beta users
- [ ] Announce on Discord/Slack communities

**Post-Launch:**
- [ ] Monitor user feedback
- [ ] Fix critical bugs quickly
- [ ] Engage with community
- [ ] Collect testimonials
- [ ] Iterate based on feedback

### 11.3 Growth Strategy

**Organic:**
- SEO optimization
- Content marketing (blog about productivity, cyberpunk culture)
- Open source components (theme system as separate library)
- API access for developers
- Integration with browser extensions

**Paid:**
- Google Ads (productivity keywords)
- Reddit Ads (targeted subreddits)
- Twitter/X Ads
- Retargeting campaigns

**Partnerships:**
- Spotify (featured app?)
- Developer influencers
- Tech YouTubers
- Productivity bloggers

---

## 12. Metrics & Analytics

### 12.1 Key Metrics

**Acquisition:**
- Visitor to signup conversion rate
- Traffic sources
- Signup completion rate
- Email verification rate

**Activation:**
- Time to first panel configuration
- Panels enabled in first session
- Theme changes
- Setting customizations

**Retention:**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- Churn rate by tier

**Revenue:**
- Free to Premium conversion rate
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)
- Churn by tier

**Engagement:**
- Average session duration
- Panels per user
- API calls per user
- Feature usage by tier

### 12.2 Analytics Implementation

**Tools:**
- **Plausible Analytics**: Privacy-friendly website analytics
- **PostHog**: Product analytics and feature flags
- **Stripe Dashboard**: Revenue metrics
- **Custom Dashboard**: In-app analytics

---

## 13. Implementation Timeline

### Phase 1: MVP Backend (Weeks 1-3)
- [ ] Set up project structure
- [ ] Database schema & Prisma setup
- [ ] Authentication system (register, login, JWT)
- [ ] User preferences API
- [ ] Panel configuration API
- [ ] Data proxy APIs (weather, news, markets)
- [ ] Rate limiting
- [ ] Basic error handling

### Phase 2: MVP Frontend (Weeks 3-5)
- [ ] React app setup with TypeScript
- [ ] Authentication pages (login, register)
- [ ] Dashboard layout
- [ ] Panel system implementation
- [ ] Weather panel
- [ ] News panel
- [ ] Markets panel
- [ ] Settings page
- [ ] Theme system (Cyberpunk only)
- [ ] Responsive design

### Phase 3: Premium Features (Weeks 5-7)
- [ ] Spotify integration backend
- [ ] Music player panel
- [ ] Video/YouTube panel
- [ ] Timer & Alarm functionality
- [ ] Additional themes (Hip-Hop, California)
- [ ] Full panel customization
- [ ] WebSocket real-time updates

### Phase 4: Subscriptions & Billing (Weeks 7-8)
- [ ] Stripe integration
- [ ] Subscription plans setup
- [ ] Payment flow
- [ ] Billing portal
- [ ] Feature flags by tier
- [ ] Upgrade/downgrade flow
- [ ] Invoice emails

### Phase 5: Polish & Launch Prep (Weeks 8-10)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Landing page
- [ ] Documentation
- [ ] Email templates
- [ ] Terms of Service & Privacy Policy
- [ ] Security audit
- [ ] Load testing

### Phase 6: Beta Launch (Week 10)
- [ ] Deploy to production
- [ ] Invite beta users
- [ ] Monitor for issues
- [ ] Collect feedback
- [ ] Iterate quickly

### Phase 7: Public Launch (Week 12)
- [ ] Product Hunt launch
- [ ] Social media campaign
- [ ] Press outreach
- [ ] Community engagement
- [ ] Continuous monitoring

---

## 14. Success Criteria

### Technical Success
- [ ] 99.9% uptime
- [ ] < 2s page load time
- [ ] < 100ms API response time
- [ ] Zero security incidents
- [ ] < 1% error rate

### Business Success
- [ ] 1,000 registered users (Month 1)
- [ ] 5% free to premium conversion rate
- [ ] $5,000 MRR (Month 3)
- [ ] 70% user retention (30 days)
- [ ] 4+ star rating

### User Success
- [ ] Net Promoter Score (NPS) > 50
- [ ] < 5% churn rate
- [ ] Average session > 5 minutes
- [ ] > 80% use 3+ panels
- [ ] Positive reviews/testimonials

---

## 15. Risks & Mitigation

### Technical Risks

**Risk: API Rate Limits**
- **Impact**: Can't serve data to users
- **Mitigation**: Caching, user API key option, fallback data

**Risk: Database Performance**
- **Impact**: Slow app, bad UX
- **Mitigation**: Indexes, query optimization, read replicas

**Risk: Security Breach**
- **Impact**: Data leak, reputation damage
- **Mitigation**: Security audit, encryption, monitoring

### Business Risks

**Risk: Low Conversion Rate**
- **Impact**: No revenue
- **Mitigation**: A/B testing, improve free tier, better onboarding

**Risk: High Churn**
- **Impact**: Unsustainable growth
- **Mitigation**: User feedback, feature development, engagement campaigns

**Risk: API Costs Too High**
- **Impact**: Negative margins
- **Mitigation**: Tier limits, caching, user API keys

---

## 16. Future Roadmap (Post-Launch)

### Q1 Features
- Mobile app (React Native)
- Public dashboard sharing
- Dashboard templates
- Community theme marketplace
- Widgets API for developers

### Q2 Features
- Calendar integration (Google, Outlook)
- Email integration
- To-do list panel
- Notes panel
- Collaboration features (team dashboards)

### Q3 Features
- Custom widget builder
- Advanced analytics
- White-label option for Pro tier
- API webhooks
- Zapier integration

### Q4 Features
- AI-powered suggestions
- Voice control
- Browser extension
- Desktop app (Electron)
- Enterprise tier

---

## 17. Conclusion

This SaaS version of the cyber-kiosk transforms a local Raspberry Pi project into a globally accessible web service. By removing hardware-specific features (system monitoring, Pi-hole, photo frame) and adding multi-user capabilities, authentication, and subscriptions, it becomes a viable commercial product.

**Key Differentiators:**
- Unique cyberpunk aesthetic (underserved market)
- Multiple themes for different tastes
- Responsive design (mobile to desktop)
- Privacy-focused (minimal data collection)
- Reasonable pricing ($4.99/month)
- Modern tech stack

**Total Development Time**: ~12 weeks to public launch

**Estimated Launch Costs**:
- Infrastructure: $50-100/month
- Domain: $15/year
- Email service: $15/month
- Monitoring: $50/month
- **Total**: ~$130/month

**Break-even**: ~26 premium subscribers (achievable in Month 2-3)

This is a viable SaaS product with clear monetization, achievable technical scope, and a differentiated position in the personal dashboard market.
