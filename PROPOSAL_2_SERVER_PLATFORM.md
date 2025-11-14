# Proposal 2: Unified Home Server Platform & Dashboard

## Executive Summary

Create a modular server platform and companion dashboard that consolidates home services (Pi-hole, photo frame sync, and future services) into a unified management interface. The platform shares theming capabilities with the main kiosk application, allowing consistent visual experience across all home hub components.

---

## 1. Architecture Overview

### 1.1 System Design Philosophy

**Separation of Concerns:**
- **Server Backend**: Headless service aggregator running on Pi
- **Dashboard Frontend**: Web-based management interface
- **Data Services**: Modular plugins for different server types
- **Shared Theme Engine**: Common styling between kiosk and server dashboard

**Key Principles:**
- Microservices-oriented for each server type
- RESTful APIs for all communication
- Plugin architecture for extensibility
- Shared component library with kiosk
- Single source of truth for themes

### 1.2 Project Structure

```
cyber-server/                    # New separate repository/directory
├── backend/                     # Server platform backend
│   ├── core/                   # Core server engine
│   ├── services/               # Service plugins
│   ├── api/                    # REST API routes
│   └── config/                 # Server configuration
├── frontend/                    # Dashboard web interface
│   ├── src/
│   │   ├── components/         # React/Vue components
│   │   ├── panels/             # Server-specific panels
│   │   ├── themes/             # Shared theme system
│   │   └── utils/              # Utilities
│   └── public/                 # Static assets
├── shared/                      # Code shared with cyber-kiosk
│   ├── themes/                 # Theme definitions (symlinked)
│   └── components/             # Common UI components
└── services/                    # Service implementations
    ├── pihole/                 # Pi-hole integration
    ├── frame-sync/             # Photo frame server
    └── plugins/                # Future service plugins
```

### 1.3 Relationship to Cyber-Kiosk

```
┌─────────────────────────────────────────────────┐
│  Home Network                                   │
│                                                 │
│  ┌──────────────┐         ┌──────────────┐    │
│  │ Cyber-Kiosk  │←─API──→│ Cyber-Server │    │
│  │  (Frontend)  │         │  (Backend)   │    │
│  │              │         │              │    │
│  │ - Weather    │         │ - Pi-hole    │    │
│  │ - News       │         │ - Frame Sync │    │
│  │ - Music      │         │ - Network    │    │
│  │ - Timer      │         │ - Services   │    │
│  └──────────────┘         └──────────────┘    │
│         │                        │             │
│         └────── Shared Themes ───┘             │
│                                                 │
│  ┌───────────────────────────────────────┐    │
│  │ Server Dashboard (localhost:3002)     │    │
│  │                                       │    │
│  │ - Service Management                 │    │
│  │ - Configuration                      │    │
│  │ - Monitoring                         │    │
│  │ - Stats & Analytics                  │    │
│  └───────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Core Service Engine

**File: `backend/core/service-manager.js`**

```javascript
/**
 * Service Manager - Orchestrates all server services
 * - Service lifecycle management (start, stop, restart)
 * - Health monitoring
 * - Inter-service communication
 * - Event bus for service events
 */

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.eventBus = new EventEmitter();
  }

  async registerService(serviceDefinition) {
    // Load service plugin
    // Initialize service
    // Register health checks
    // Add to service registry
  }

  async startService(serviceId) { }
  async stopService(serviceId) { }
  async restartService(serviceId) { }

  getServiceStatus(serviceId) { }
  getAllServicesStatus() { }

  // Event handling
  on(event, handler) { }
  emit(event, data) { }
}
```

### 2.2 Service Plugin Interface

**File: `backend/core/base-service.js`**

```javascript
/**
 * Base Service Class
 * All service plugins extend this class
 */

class BaseService {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this.status = 'stopped';
    this.config = config;
  }

  // Lifecycle methods - must be implemented
  async initialize() { }
  async start() { }
  async stop() { }
  async restart() { }

  // Health check - must be implemented
  async healthCheck() { }

  // Data methods
  async getData() { }
  async getStats() { }

  // Configuration
  async getConfig() { }
  async updateConfig(newConfig) { }

  // API routes - returns Express router
  getRoutes() { }
}
```

---

## 3. Service Implementations

### 3.1 Pi-hole Service Plugin

**File: `services/pihole/pihole-service.js`**

**Functionality:**
- Wraps existing Pi-hole integration from system-monitor.js
- Provides real-time stats to dashboard
- Enables/disables blocking via API
- Whitelist/blacklist management
- Query log access
- Group management

**API Endpoints:**
```javascript
GET  /api/services/pihole/status        // Status and stats
GET  /api/services/pihole/queries       // Recent queries
GET  /api/services/pihole/blocked       // Blocked domains
GET  /api/services/pihole/top-blocked   // Top blocked domains
GET  /api/services/pihole/top-clients   // Top client activity
POST /api/services/pihole/enable        // Enable blocking
POST /api/services/pihole/disable       // Disable blocking (with timer)
POST /api/services/pihole/whitelist     // Add to whitelist
POST /api/services/pihole/blacklist     // Add to blacklist
GET  /api/services/pihole/config        // Get configuration
POST /api/services/pihole/config        // Update configuration
```

**Dashboard Panel UI:**
```
┌─────────────────────────────────────┐
│ Pi-hole Network Shield              │
├─────────────────────────────────────┤
│                                     │
│  STATUS: ● ACTIVE    [DISABLE (5m)] │
│                                     │
│  ┌────────────┐  ┌────────────┐   │
│  │ 45,234     │  │ 8,912      │   │
│  │ QUERIES    │  │ BLOCKED    │   │
│  └────────────┘  └────────────┘   │
│                                     │
│  BLOCKING: 19.7%                    │
│  ████████░░░░░░░░░░                │
│                                     │
│  Top Blocked Domains:               │
│  1. doubleclick.net      2,341      │
│  2. google-analytics.com 1,892      │
│  3. facebook.com         1,234      │
│                                     │
│  [View Logs] [Whitelist] [Settings] │
└─────────────────────────────────────┘
```

### 3.2 Frame-Sync Service Plugin

**File: `services/frame-sync/frame-sync-service.js`**

**Functionality:**
- Photo upload and management
- Device registration and management
- Image distribution to e-paper displays
- Rotation scheduling
- Album/collection organization
- Image optimization and conversion

**Architecture:**
```
Frame-Sync Service
├── Upload Manager
│   ├── Multi-file upload
│   ├── Format validation
│   ├── Image optimization
│   └── Thumbnail generation
├── Device Manager
│   ├── Device registration
│   ├── Device-specific image pools
│   ├── Assignment rules
│   └── Health monitoring
├── Distribution Engine
│   ├── Image rotation scheduler
│   ├── Device-specific delivery
│   ├── CDN integration (optional)
│   └── Sync status tracking
└── Storage Manager
    ├── File system storage
    ├── Database metadata
    ├── Album organization
    └── Cleanup/archival
```

**API Endpoints:**
```javascript
// Device Management
POST /api/services/frame-sync/devices/register      // Register new device
GET  /api/services/frame-sync/devices               // List all devices
GET  /api/services/frame-sync/devices/:id           // Get device details
PUT  /api/services/frame-sync/devices/:id           // Update device
DELETE /api/services/frame-sync/devices/:id         // Remove device

// Image Management
POST /api/services/frame-sync/images/upload         // Upload images
GET  /api/services/frame-sync/images                // List all images
GET  /api/services/frame-sync/images/:id            // Get image details
DELETE /api/services/frame-sync/images/:id          // Delete image
POST /api/services/frame-sync/images/:id/assign    // Assign to device(s)

// Album Management
POST /api/services/frame-sync/albums                // Create album
GET  /api/services/frame-sync/albums                // List albums
GET  /api/services/frame-sync/albums/:id            // Get album
PUT  /api/services/frame-sync/albums/:id            // Update album
DELETE /api/services/frame-sync/albums/:id          // Delete album

// Sync & Status
GET  /api/services/frame-sync/status                // Service status
GET  /api/services/frame-sync/devices/:id/images   // Images for device
POST /api/services/frame-sync/devices/:id/sync     // Trigger sync
GET  /api/services/frame-sync/stats                 // Usage statistics
```

**Database Schema:**

**New File: `services/frame-sync/schema.sql`**
```sql
-- Devices table
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  resolution TEXT,
  last_sync TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images table
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploader_name TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  format TEXT,
  album_id TEXT,
  FOREIGN KEY (album_id) REFERENCES albums(id)
);

-- Device-Image assignments
CREATE TABLE device_images (
  device_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rotation_order INTEGER,
  PRIMARY KEY (device_id, image_id),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);

-- Albums
CREATE TABLE albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync history
CREATE TABLE sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT,
  FOREIGN KEY (device_id) REFERENCES devices(id),
  FOREIGN KEY (image_id) REFERENCES images(id)
);
```

**Dashboard Panel UI:**
```
┌─────────────────────────────────────┐
│ Frame-Sync Photo Server             │
├─────────────────────────────────────┤
│                                     │
│  DEVICES: 3 online   IMAGES: 487    │
│                                     │
│  ┌─ Devices ─────────────────────┐ │
│  │ ● Cyber Kiosk       287 imgs  │ │
│  │ ● Living Room Frame  150 imgs │ │
│  │ ● Office Display      50 imgs │ │
│  └───────────────────────────────┘ │
│                                     │
│  Recent Uploads:                    │
│  ┌─┬─┬─┬─┬─┐                       │
│  │█│█│█│█│█│ +482 more             │
│  └─┴─┴─┴─┴─┘                       │
│                                     │
│  [Upload] [Manage] [Albums]         │
└─────────────────────────────────────┘
```

### 3.3 Future Service Plugin Template

**Example: Network Monitor Service**

**File: `services/network-monitor/network-monitor-service.js`**

**Functionality:**
- Real-time bandwidth monitoring
- Device discovery on network
- Connection history
- Speed tests
- Port scanning
- Network map visualization

**This demonstrates extensibility - new services can be added following the same pattern**

---

## 4. Dashboard Frontend

### 4.1 Technology Stack

**Recommendation: Vue.js 3 (Composition API)**

**Reasoning:**
- Lighter than React (better for Pi)
- Progressive framework
- Excellent reactivity system
- Easy to integrate with existing kiosk code
- Strong TypeScript support

**Alternative: Vanilla JS + Web Components**
- No framework overhead
- Maximum performance
- Easier integration with kiosk
- More manual work

### 4.2 Component Architecture

**File: `frontend/src/main.js`**
```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { ThemeManager } from '@shared/themes/theme-manager'
import { ServiceAPI } from './api/service-api'

const app = createApp(App)

// Initialize theme manager (shared with kiosk)
const themeManager = new ThemeManager()
app.config.globalProperties.$theme = themeManager

// Initialize service API client
const serviceAPI = new ServiceAPI()
app.config.globalProperties.$api = serviceAPI

app.mount('#app')
```

**File: `frontend/src/App.vue`**
```vue
<template>
  <div class="server-dashboard" :data-theme="currentTheme">
    <Header />
    <Sidebar :services="services" />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'
import Footer from './components/Footer.vue'

const currentTheme = ref('cyberpunk')
const services = ref([])

onMounted(async () => {
  // Load theme preference
  currentTheme.value = localStorage.getItem('theme') || 'cyberpunk'

  // Load available services
  services.value = await $api.getServices()
})
</script>
```

### 4.3 Service Panel Components

**File: `frontend/src/panels/ServicePanel.vue`**
```vue
<template>
  <div class="service-panel">
    <div class="panel-header">
      <h2>{{ service.name }}</h2>
      <div class="panel-controls">
        <button @click="refreshData">Refresh</button>
        <button @click="openSettings">Settings</button>
      </div>
    </div>

    <div class="panel-content">
      <!-- Dynamic component based on service type -->
      <component
        :is="serviceComponent"
        :service-id="serviceId"
        :data="serviceData"
        @update="handleUpdate"
      />
    </div>

    <div class="panel-footer">
      <span class="status" :class="service.status">
        {{ service.status }}
      </span>
      <span class="last-update">
        Updated: {{ lastUpdate }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PiholePanel from './PiholePanel.vue'
import FrameSyncPanel from './FrameSyncPanel.vue'

const props = defineProps(['serviceId'])

const service = ref(null)
const serviceData = ref(null)
const lastUpdate = ref(null)

const serviceComponent = computed(() => {
  const components = {
    'pihole': PiholePanel,
    'frame-sync': FrameSyncPanel
  }
  return components[service.value?.type] || null
})

async function refreshData() {
  serviceData.value = await $api.getServiceData(props.serviceId)
  lastUpdate.value = new Date().toLocaleTimeString()
}

onMounted(async () => {
  service.value = await $api.getService(props.serviceId)
  await refreshData()

  // Auto-refresh every 30 seconds
  setInterval(refreshData, 30000)
})
</script>
```

### 4.4 Dashboard Layouts

**Home/Overview Page:**
```
┌────────────────────────────────────────────┐
│  [Logo] Cyber Server  [Theme] [Settings]   │
├────────────────────────────────────────────┤
│                                            │
│  System Status: ● ONLINE                   │
│  5 Services Running                        │
│                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Pi-hole  │ │  Frame   │ │ Network  │  │
│  │   ●      │ │  Sync ●  │ │  Mon  ●  │  │
│  │ ACTIVE   │ │ ACTIVE   │ │ ACTIVE   │  │
│  └──────────┘ └──────────┘ └──────────┘  │
│                                            │
│  Quick Stats:                              │
│  • 45,234 DNS queries today                │
│  • 8,912 threats blocked                   │
│  • 487 photos synced                       │
│  • 3 devices online                        │
│                                            │
│  [Manage Services] [View Logs]             │
└────────────────────────────────────────────┘
```

**Service Detail Page (Pi-hole Example):**
```
┌────────────────────────────────────────────┐
│  ← Back    Pi-hole Service    [Settings]   │
├────────────────────────────────────────────┤
│                                            │
│  ┌─ Status ────────────────────────────┐  │
│  │ ● ACTIVE   Uptime: 7d 12h 34m       │  │
│  │ [Disable for 5m] [Restart]          │  │
│  └─────────────────────────────────────┘  │
│                                            │
│  ┌─ Statistics ─────────────────────────┐ │
│  │  Today's Activity:                   │ │
│  │  ┌──────────────┐ ┌──────────────┐  │ │
│  │  │  45,234      │ │  8,912       │  │ │
│  │  │  Queries     │ │  Blocked     │  │ │
│  │  └──────────────┘ └──────────────┘  │ │
│  │                                      │ │
│  │  Block Rate: 19.7%                   │ │
│  │  ████████░░░░░░░░░░░░                │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ Top Blocked Domains ────────────────┐ │
│  │ 1. doubleclick.net          2,341    │ │
│  │ 2. google-analytics.com     1,892    │ │
│  │ 3. facebook.com             1,234    │ │
│  │ 4. ads.youtube.com            987    │ │
│  │ 5. tracker.example.com        765    │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [View Full Logs] [Manage Lists]           │
└────────────────────────────────────────────┘
```

---

## 5. Shared Theme System

### 5.1 Theme Architecture

**Goal:** Single source of truth for themes used by both kiosk and server dashboard

**Directory Structure:**
```
shared/themes/
├── theme-manager.js         # Theme management logic
├── theme-schema.json        # Theme definition schema
└── definitions/
    ├── cyberpunk.json       # Cyberpunk theme definition
    ├── hiphop.json          # Hip-hop theme definition
    └── california.json      # California theme definition
```

### 5.2 Theme Definition Schema

**File: `shared/themes/theme-schema.json`**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "version": { "type": "string" },
    "author": { "type": "string" },
    "colors": {
      "type": "object",
      "properties": {
        "primary": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "secondary": { "type": "string" },
        "accent": { "type": "string" },
        "background": {
          "type": "object",
          "properties": {
            "primary": { "type": "string" },
            "secondary": { "type": "string" }
          }
        },
        "text": {
          "type": "object",
          "properties": {
            "primary": { "type": "string" },
            "secondary": { "type": "string" }
          }
        }
      }
    },
    "typography": {
      "type": "object",
      "properties": {
        "fontFamily": { "type": "string" },
        "headingFont": { "type": "string" },
        "monoFont": { "type": "string" },
        "baseFontSize": { "type": "string" }
      }
    },
    "effects": {
      "type": "object",
      "properties": {
        "shadows": { "type": "boolean" },
        "animations": { "type": "boolean" },
        "overlays": { "type": "array" }
      }
    },
    "components": {
      "type": "object",
      "description": "Component-specific theme overrides"
    }
  }
}
```

### 5.3 Cyberpunk Theme Definition

**File: `shared/themes/definitions/cyberpunk.json`**
```json
{
  "id": "cyberpunk",
  "name": "Cyberpunk",
  "version": "1.0.0",
  "author": "Cyber Kiosk Team",
  "colors": {
    "primary": "#00ffff",
    "secondary": "#ff00ff",
    "accent": "#ffaa00",
    "highlight": "#00ff41",
    "error": "#ff0040",
    "background": {
      "primary": "#0a0a0a",
      "secondary": "#050505"
    },
    "text": {
      "primary": "#e0e0e0",
      "secondary": "#b0b0b0"
    }
  },
  "typography": {
    "fontFamily": "'VT323', monospace",
    "headingFont": "'VT323', monospace",
    "monoFont": "'Share Tech Mono', monospace",
    "baseFontSize": "16px"
  },
  "effects": {
    "shadows": true,
    "animations": true,
    "overlays": [
      {
        "type": "crt",
        "enabled": true
      },
      {
        "type": "scanlines",
        "enabled": true
      },
      {
        "type": "flicker",
        "enabled": true,
        "intensity": 0.3
      }
    ]
  },
  "components": {
    "panel": {
      "borderWidth": "2px",
      "borderStyle": "solid",
      "borderColor": "#00ffff",
      "backgroundColor": "rgba(0, 255, 255, 0.05)",
      "boxShadow": "0 0 15px rgba(0, 255, 255, 0.3)"
    },
    "button": {
      "backgroundColor": "transparent",
      "borderColor": "#00ffff",
      "color": "#00ffff",
      "hoverBackgroundColor": "rgba(0, 255, 255, 0.2)",
      "hoverBoxShadow": "0 0 20px rgba(0, 255, 255, 0.5)"
    }
  }
}
```

### 5.4 Theme Manager (Shared)

**File: `shared/themes/theme-manager.js`**
```javascript
/**
 * Theme Manager - Shared between Kiosk and Server Dashboard
 * Loads theme definitions and applies them to the UI
 */

class ThemeManager {
  constructor() {
    this.currentTheme = null
    this.themes = new Map()
    this.loadThemes()
  }

  async loadThemes() {
    // Load all theme definitions
    const themeFiles = ['cyberpunk', 'hiphop', 'california']

    for (const themeId of themeFiles) {
      const theme = await this.loadThemeDefinition(themeId)
      this.themes.set(themeId, theme)
    }
  }

  async loadThemeDefinition(themeId) {
    const response = await fetch(`/shared/themes/definitions/${themeId}.json`)
    return await response.json()
  }

  applyTheme(themeId) {
    const theme = this.themes.get(themeId)
    if (!theme) {
      console.error(`Theme ${themeId} not found`)
      return
    }

    this.currentTheme = theme
    this.applyColors(theme.colors)
    this.applyTypography(theme.typography)
    this.applyEffects(theme.effects)
    this.applyComponents(theme.components)

    localStorage.setItem('theme', themeId)
    document.documentElement.setAttribute('data-theme', themeId)
  }

  applyColors(colors) {
    const root = document.documentElement
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--bg-primary', colors.background.primary)
    root.style.setProperty('--bg-secondary', colors.background.secondary)
    root.style.setProperty('--text-primary', colors.text.primary)
    root.style.setProperty('--text-secondary', colors.text.secondary)
    // ... etc
  }

  applyTypography(typography) {
    const root = document.documentElement
    root.style.setProperty('--font-family', typography.fontFamily)
    root.style.setProperty('--font-heading', typography.headingFont)
    root.style.setProperty('--font-mono', typography.monoFont)
    root.style.setProperty('--font-size-base', typography.baseFontSize)
  }

  applyEffects(effects) {
    // Apply overlays, animations, etc.
    if (effects.overlays) {
      effects.overlays.forEach(overlay => {
        if (overlay.enabled) {
          this.enableOverlay(overlay.type, overlay)
        }
      })
    }
  }

  applyComponents(components) {
    // Apply component-specific styles
    for (const [component, styles] of Object.entries(components)) {
      this.applyComponentStyles(component, styles)
    }
  }

  enableOverlay(type, config) {
    // Create and inject overlay elements
    // e.g., CRT effect, scanlines, etc.
  }

  applyComponentStyles(component, styles) {
    // Apply styles to specific component types
    const prefix = `--${component}`
    const root = document.documentElement

    for (const [key, value] of Object.entries(styles)) {
      root.style.setProperty(`${prefix}-${key}`, value)
    }
  }

  getAvailableThemes() {
    return Array.from(this.themes.values()).map(theme => ({
      id: theme.id,
      name: theme.name,
      author: theme.author
    }))
  }

  getCurrentTheme() {
    return this.currentTheme
  }
}

export { ThemeManager }
```

### 5.5 Theme Usage in Both Apps

**Kiosk Integration:**
```javascript
// In cyber-kiosk/js/app.js
import { ThemeManager } from '../shared/themes/theme-manager.js'

const themeManager = new ThemeManager()
themeManager.applyTheme(localStorage.getItem('theme') || 'cyberpunk')
```

**Server Dashboard Integration:**
```javascript
// In cyber-server/frontend/src/main.js
import { ThemeManager } from '@shared/themes/theme-manager'

const themeManager = new ThemeManager()
app.config.globalProperties.$theme = themeManager
```

**Synchronization:**
- Both apps read from same theme definitions
- Theme changes in one app can trigger sync to other
- Theme preferences stored in shared location (browser localStorage or server config)

---

## 6. API Design

### 6.1 RESTful API Structure

**Base URL:** `http://localhost:3002/api`

**Service Management:**
```
GET    /services                      # List all services
GET    /services/:id                  # Get service details
POST   /services/:id/start            # Start service
POST   /services/:id/stop             # Stop service
POST   /services/:id/restart          # Restart service
GET    /services/:id/status           # Get service status
GET    /services/:id/config           # Get service config
PUT    /services/:id/config           # Update service config
GET    /services/:id/logs             # Get service logs
```

**Pi-hole Service:**
```
GET    /services/pihole/stats         # Current statistics
GET    /services/pihole/queries       # Query log
GET    /services/pihole/blocked       # Blocked domains
POST   /services/pihole/whitelist     # Manage whitelist
POST   /services/pihole/blacklist     # Manage blacklist
POST   /services/pihole/enable        # Enable blocking
POST   /services/pihole/disable       # Disable blocking
```

**Frame-Sync Service:**
```
GET    /services/frame-sync/devices              # List devices
POST   /services/frame-sync/devices/register     # Register device
GET    /services/frame-sync/images               # List images
POST   /services/frame-sync/images/upload        # Upload image(s)
GET    /services/frame-sync/albums               # List albums
POST   /services/frame-sync/albums               # Create album
```

### 6.2 WebSocket Events (Real-time Updates)

**Connection:** `ws://localhost:3002/ws`

**Events:**
```javascript
// Server → Client
{
  "type": "service.status",
  "serviceId": "pihole",
  "status": "running",
  "timestamp": "2025-01-15T10:30:00Z"
}

{
  "type": "service.data",
  "serviceId": "pihole",
  "data": {
    "queries": 45234,
    "blocked": 8912,
    "percentage": 19.7
  }
}

{
  "type": "device.sync",
  "serviceId": "frame-sync",
  "deviceId": "cyber-kiosk-001",
  "status": "synced",
  "imageCount": 287
}

// Client → Server
{
  "type": "subscribe",
  "serviceId": "pihole"
}

{
  "type": "unsubscribe",
  "serviceId": "pihole"
}
```

---

## 7. Integration with Existing Kiosk

### 7.1 Kiosk Consuming Server APIs

**Current State:**
- Kiosk calls system-monitor.js endpoints directly
- Pi-hole stats fetched from `/pihole`
- Network stats from `/network`

**New State:**
- Kiosk calls cyber-server APIs
- Frame-sync images fetched from `/services/frame-sync/devices/:id/images`
- All server stats consolidated

**Migration Path:**

**Option A: Unified Server (Recommended)**
1. Merge system-monitor.js into cyber-server
2. Move all existing endpoints to new service structure
3. Update kiosk to use new API base URL
4. Maintain backward compatibility during transition

**Option B: Separate Servers**
1. Keep system-monitor.js for kiosk-specific functions
2. Run cyber-server on different port (3002)
3. Kiosk calls both servers as needed
4. API gateway to unify endpoints (future enhancement)

### 7.2 Panels Consuming Server Data

**Existing Panels Updated:**

**Pi-hole Panel in Kiosk:**
```javascript
// OLD: Direct system-monitor.js call
const stats = await fetch('http://localhost:3001/pihole')

// NEW: Cyber-server service call
const stats = await fetch('http://localhost:3002/api/services/pihole/stats')
```

**Frame-Sync Screensaver:**
```javascript
// OLD: Direct e-paper server call
const images = await fetch(`${EPAPER_SERVER_URL}/api/devices/${deviceId}/images`)

// NEW: Cyber-server service call
const images = await fetch(`http://localhost:3002/api/services/frame-sync/devices/${deviceId}/images`)
```

**New Panels Added:**

**Server Status Panel (Optional for Kiosk):**
- Shows all cyber-server services status
- Quick access to server dashboard
- Service health indicators

---

## 8. Deployment & Configuration

### 8.1 Installation Script

**New File: `cyber-server/setup.sh`**

```bash
#!/bin/bash

echo "=== CYBER SERVER PLATFORM SETUP ==="
echo ""

# Check for dependencies
echo "Checking dependencies..."
command -v node >/dev/null 2>&1 || { echo "Node.js required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm required but not installed. Aborting." >&2; exit 1; }

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install
cd ..

# Service selection
echo ""
echo "Which services would you like to enable?"
read -p "Enable Pi-hole integration? [Y/n]: " enable_pihole
read -p "Enable Frame-Sync photo server? [Y/n]: " enable_frame_sync
read -p "Enable Network Monitor? [y/N]: " enable_network

# Theme selection
echo ""
echo "Choose default theme:"
echo "1) Cyberpunk"
echo "2) Hip-Hop"
echo "3) California"
read -p "Selection [1]: " theme_choice

# Port configuration
echo ""
read -p "Server port [3002]: " server_port
server_port=${server_port:-3002}

# Generate configuration
echo ""
echo "Generating configuration..."

cat > backend/config/server.json <<EOF
{
  "port": ${server_port},
  "services": {
    "pihole": {
      "enabled": $([ "${enable_pihole:-Y}" = "Y" ] && echo "true" || echo "false")
    },
    "frame-sync": {
      "enabled": $([ "${enable_frame_sync:-Y}" = "Y" ] && echo "true" || echo "false"),
      "uploadDir": "./uploads",
      "databasePath": "./data/frame-sync.db"
    },
    "network-monitor": {
      "enabled": $([ "${enable_network:-N}" = "Y" ] && echo "true" || echo "false")
    }
  },
  "theme": "$([ "$theme_choice" = "2" ] && echo "hiphop" || [ "$theme_choice" = "3" ] && echo "california" || echo "cyberpunk")"
}
EOF

# Create necessary directories
mkdir -p backend/data
mkdir -p backend/uploads
mkdir -p backend/logs

# Initialize Frame-Sync database
if [ "${enable_frame_sync:-Y}" = "Y" ]; then
  echo "Initializing Frame-Sync database..."
  sqlite3 backend/data/frame-sync.db < services/frame-sync/schema.sql
fi

# Build frontend
echo ""
echo "Building frontend..."
cd frontend && npm run build
cd ..

# Create systemd service
echo ""
read -p "Install as systemd service? [y/N]: " install_service

if [ "$install_service" = "y" ] || [ "$install_service" = "Y" ]; then
  cat > /tmp/cyber-server.service <<EOF
[Unit]
Description=Cyber Server Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node backend/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

  sudo cp /tmp/cyber-server.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable cyber-server
  sudo systemctl start cyber-server

  echo "Systemd service installed and started"
fi

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "Server will be available at: http://localhost:${server_port}"
echo ""
if [ "$install_service" != "y" ] && [ "$install_service" != "Y" ]; then
  echo "To start the server manually:"
  echo "  cd backend && node server.js"
fi
echo ""
```

### 8.2 Environment Configuration

**File: `cyber-server/backend/.env`**
```bash
# Server Configuration
PORT=3002
NODE_ENV=production

# Security
CORS_ORIGINS=http://localhost:3001,http://localhost:3002
API_KEY_REQUIRED=false

# Pi-hole Integration
PIHOLE_ENABLED=true
PIHOLE_DB_PATH=/etc/pihole/pihole-FTL.db
PIHOLE_GRAVITY_DB_PATH=/etc/pihole/gravity.db

# Frame-Sync Configuration
FRAME_SYNC_ENABLED=true
FRAME_SYNC_UPLOAD_DIR=./uploads
FRAME_SYNC_DATABASE=./data/frame-sync.db
FRAME_SYNC_MAX_UPLOAD_SIZE=10MB
FRAME_SYNC_ALLOWED_FORMATS=jpg,jpeg,png,gif,webp

# Network Monitor
NETWORK_MONITOR_ENABLED=true
NETWORK_INTERFACE=auto

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/server.log

# Theme
DEFAULT_THEME=cyberpunk
```

---

## 9. Implementation Phases

### Phase 1: Core Platform (Week 1-2)
- [ ] Set up project structure
- [ ] Implement service manager
- [ ] Create base service class
- [ ] Build REST API foundation
- [ ] Set up WebSocket server

### Phase 2: Pi-hole Service (Week 2-3)
- [ ] Extract Pi-hole logic from system-monitor.js
- [ ] Implement Pi-hole service plugin
- [ ] Create Pi-hole API endpoints
- [ ] Build Pi-hole dashboard panel
- [ ] Test integration with existing kiosk

### Phase 3: Frame-Sync Service (Week 3-5)
- [ ] Design Frame-Sync architecture
- [ ] Implement database schema
- [ ] Create device registration system
- [ ] Build image upload and management
- [ ] Implement distribution engine
- [ ] Create Frame-Sync dashboard panel
- [ ] Migrate existing e-paper frame integration

### Phase 4: Dashboard Frontend (Week 5-7)
- [ ] Set up Vue.js project
- [ ] Create core components (Header, Sidebar, etc.)
- [ ] Build service panel components
- [ ] Implement service management UI
- [ ] Add real-time updates via WebSocket
- [ ] Create responsive layouts

### Phase 5: Theme Integration (Week 7-8)
- [ ] Extract theme system to shared library
- [ ] Convert existing themes to JSON format
- [ ] Implement theme manager
- [ ] Integrate with both kiosk and server dashboard
- [ ] Test theme switching across apps

### Phase 6: Testing & Polish (Week 8-9)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment scripts

---

## 10. File Structure Summary

```
cyber-server/
├── backend/
│   ├── server.js                    # Main server entry
│   ├── core/
│   │   ├── service-manager.js       # Service orchestration
│   │   ├── base-service.js          # Service base class
│   │   ├── api-router.js            # API route handling
│   │   └── websocket-server.js      # WebSocket server
│   ├── api/
│   │   ├── routes/
│   │   │   ├── services.js          # Service management routes
│   │   │   ├── config.js            # Configuration routes
│   │   │   └── health.js            # Health check routes
│   │   └── middleware/
│   │       ├── auth.js              # Authentication
│   │       ├── cors.js              # CORS handling
│   │       └── logger.js            # Request logging
│   ├── config/
│   │   ├── server.json              # Server configuration
│   │   └── services.json            # Service registry
│   ├── data/                        # SQLite databases
│   ├── logs/                        # Log files
│   └── uploads/                     # Uploaded files
│
├── services/
│   ├── pihole/
│   │   ├── pihole-service.js        # Pi-hole service implementation
│   │   ├── pihole-api.js            # Pi-hole API routes
│   │   └── pihole-queries.js        # Database queries
│   ├── frame-sync/
│   │   ├── frame-sync-service.js    # Frame-Sync service
│   │   ├── frame-sync-api.js        # Frame-Sync API routes
│   │   ├── device-manager.js        # Device management
│   │   ├── image-manager.js         # Image handling
│   │   ├── sync-engine.js           # Sync logic
│   │   └── schema.sql               # Database schema
│   └── network-monitor/
│       ├── network-service.js       # Network monitoring
│       └── network-api.js           # Network API routes
│
├── frontend/
│   ├── src/
│   │   ├── main.js                  # Vue app entry
│   │   ├── App.vue                  # Root component
│   │   ├── router.js                # Vue Router
│   │   ├── components/
│   │   │   ├── Header.vue
│   │   │   ├── Sidebar.vue
│   │   │   ├── Footer.vue
│   │   │   └── ServiceCard.vue
│   │   ├── panels/
│   │   │   ├── ServicePanel.vue     # Generic service panel
│   │   │   ├── PiholePanel.vue      # Pi-hole panel
│   │   │   ├── FrameSyncPanel.vue   # Frame-Sync panel
│   │   │   └── NetworkPanel.vue     # Network panel
│   │   ├── views/
│   │   │   ├── Dashboard.vue        # Main dashboard view
│   │   │   ├── ServiceDetail.vue    # Service detail view
│   │   │   └── Settings.vue         # Settings view
│   │   ├── api/
│   │   │   └── service-api.js       # API client
│   │   └── utils/
│   │       └── websocket.js         # WebSocket client
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── package.json
│   └── vite.config.js
│
├── shared/                          # Shared with cyber-kiosk
│   ├── themes/
│   │   ├── theme-manager.js         # Theme management
│   │   ├── theme-schema.json        # Theme schema
│   │   └── definitions/
│   │       ├── cyberpunk.json       # Cyberpunk theme
│   │       ├── hiphop.json          # Hip-Hop theme
│   │       └── california.json      # California theme
│   └── components/
│       └── ThemeSelector.vue        # Theme selector component
│
├── docs/
│   ├── API.md                       # API documentation
│   ├── SERVICES.md                  # Service development guide
│   └── DEPLOYMENT.md                # Deployment guide
│
├── scripts/
│   ├── setup.sh                     # Installation script
│   ├── migrate.sh                   # Migration script
│   └── backup.sh                    # Backup script
│
├── package.json
├── .env.example
└── README.md
```

---

## 11. Security Considerations

### 11.1 Authentication & Authorization

**Service Access:**
- Optional API key authentication for external access
- IP-based restrictions (localhost only by default)
- Role-based access control for multi-user scenarios

**File Uploads:**
- File type validation
- Size limits
- Malware scanning (optional)
- Sandboxed upload directory

### 11.2 Data Protection

**Database Security:**
- SQLite with proper file permissions
- Prepared statements to prevent SQL injection
- Regular backups

**API Security:**
- Rate limiting
- CORS restrictions
- Input validation and sanitization
- HTTPS support for production

---

## 12. Monitoring & Logging

### 12.1 Service Health Monitoring

**Health Checks:**
- Periodic service status checks
- Automatic restart on failure
- Health check endpoints for each service

**Metrics Collection:**
- Request/response times
- Error rates
- Resource usage (CPU, memory, disk)
- Service-specific metrics

### 12.2 Logging System

**Log Levels:**
- DEBUG: Detailed diagnostic information
- INFO: General informational messages
- WARN: Warning messages
- ERROR: Error messages
- FATAL: Critical errors

**Log Rotation:**
- Daily log rotation
- Compression of old logs
- Retention policy (30 days default)

---

## 13. Future Enhancements

### 13.1 Additional Services (Post-MVP)

**Planned Services:**
- **Media Server**: Plex/Jellyfin integration
- **Smart Home**: Home Assistant integration
- **VPN Manager**: WireGuard/OpenVPN management
- **Backup Service**: Automated backup management
- **DNS Manager**: Custom DNS configuration

### 13.2 Advanced Features

- **Mobile App**: React Native companion app
- **Cloud Sync**: Optional cloud backup and sync
- **Plugin Marketplace**: Community-contributed services
- **Multi-Device**: Support for multiple Pi servers
- **Analytics Dashboard**: Advanced metrics and graphs
- **Notification System**: Email/SMS/Push notifications
- **Scheduled Tasks**: Cron-like job scheduler

---

## 14. Success Metrics

### Performance
- [ ] Service startup < 5 seconds
- [ ] API response time < 100ms (average)
- [ ] Dashboard load time < 2 seconds
- [ ] Real-time updates latency < 500ms

### Reliability
- [ ] 99.9% uptime for core services
- [ ] Automatic recovery from failures
- [ ] Zero data loss during crashes

### Usability
- [ ] Theme switching works in both apps
- [ ] Service management is intuitive
- [ ] Documentation is comprehensive
- [ ] Installation is straightforward

---

## 15. Conclusion

This proposal outlines a comprehensive server platform that:

1. **Consolidates** existing services (Pi-hole, Frame-Sync) into unified architecture
2. **Extends** functionality with modular service plugins
3. **Shares** theming system with cyber-kiosk for consistent experience
4. **Enables** future growth through plugin architecture
5. **Maintains** security and performance standards

The platform serves as the backend infrastructure for the home hub ecosystem, with the cyber-kiosk as the primary user-facing interface and the server dashboard as the management interface.
