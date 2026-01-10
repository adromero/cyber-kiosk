# Cyber Kiosk

A Neuromancer-inspired cyberpunk dashboard for Raspberry Pi with touchscreen. Features real-time weather, system stats, financial data, news feeds, and YouTube integration with retro-futuristic CRT aesthetics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

## Features

- **Multi-User Profiles** - Individual user profiles with separate themes, panel layouts, and settings
- **Multiple Themes** - Switch between Cyberpunk, Hip-Hop, and California visual themes
- **Responsive Layout** - Adapts seamlessly from 4-inch mobile screens to 27-inch desktop displays
- **Customizable Panels** - Drag-and-drop layout editor with 8+ configurable panels
- **Retro CRT Display** - Scanlines, phosphor glow, and authentic terminal aesthetics
- **Live Temperature Display** - Real-time CPU temperature shown in header (updates every 15 seconds)
- **Weather & Financial Data** - Cycles between current weather/forecast and live market data (DOW, S&P 500, NASDAQ, Gold, USD/EUR)
- **YouTube Integration** - Rotating cyberpunk-themed video thumbnails with full player and search modal
- **Multi-Source News** - Rotates through Hacker News, NY Times Tech, and Dev.to every 5 minutes
- **Timer & Alarms** - Multiple countdown timers and alarms with custom sounds
- **Calendar System** - Event management with day view widget and full modal calendar
- **System Status Modal** - Click temperature to view full diagnostics (CPU/GPU temp, memory, disk, load avg, uptime)
- **Interactive Modals** - Click any widget for expanded detailed view
- **Burn-in Prevention** - Auto-dimming and subtle pixel shifting for 24/7 operation
- **Hidden Exit** - Click bottom-right corner to exit kiosk mode

## Screenshots

### Full Dashboard
<img src="screenshots/02-full-setup-clean.jpeg" alt="Cyber Kiosk Dashboard" width="600">

*Cyber Kiosk running on HOSAKA MK I cyberdeck with 7-inch display*

### Interactive Modals

<table>
  <tr>
    <td><img src="screenshots/03-news-modal-hackernews.jpeg" alt="News Modal" width="300"></td>
    <td><img src="screenshots/04-system-diagnostics-modal.jpeg" alt="System Diagnostics" width="300"></td>
    <td><img src="screenshots/05-video-player-modal.jpeg" alt="Video Player" width="300"></td>
  </tr>
  <tr>
    <td align="center"><b>News Aggregator</b></td>
    <td align="center"><b>System Diagnostics</b></td>
    <td align="center"><b>Video Player</b></td>
  </tr>
</table>

### Hardware Setup
<img src="screenshots/01-full-setup-with-keyboard.jpeg" alt="Complete Hardware Setup" width="600">

*Complete cyberdeck setup with backlit keyboard and meshtastic antenna*

## Quick Start

### Prerequisites

- Raspberry Pi (3, 4, or 5 recommended)
- Raspberry Pi OS (Debian-based)
- 7-inch touchscreen (or any display)
- Node.js 18+ and npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adromero/cyber-kiosk.git
   cd cyber-kiosk
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

   This will:
   - Check dependencies
   - Install npm packages
   - Create your `.env` file from template
   - Prompt for API keys (optional)
   - Test the system monitor

3. **Configure your API keys:**

   Edit `.env` with your API keys (all free):

   ```bash
   # Configuration
   ZIP_CODE=90210

   # API Keys
   OPENWEATHER_API_KEY=your_openweathermap_api_key
   NYT_API_KEY=your_nytimes_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ALPHA_VANTAGE_API_KEY=your_alphavantage_api_key
   ```

   Get your free API keys:
   - **Weather:** https://openweathermap.org/api
   - **News:** https://developer.nytimes.com/
   - **YouTube:** https://console.cloud.google.com/apis/credentials (Enable YouTube Data API v3)
   - **Financial (optional):** https://www.alphavantage.co/support/#api-key

   **Note:** The `.env` file is git-ignored to keep your API keys secure.

4. **Start the system monitor:**
   ```bash
   npm start
   ```

5. **Launch the dashboard:**
   ```bash
   ./launch-kiosk.sh
   ```

   Or open `index.html` directly in Chromium for testing.

## Configuration

All settings are in `.env`:

```bash
# Configuration
ZIP_CODE=90210

# API Keys
OPENWEATHER_API_KEY=your_key_here
NYT_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
```

Timing intervals are configured in `system-monitor.js` and `js/app.js`.

## User Profiles

The kiosk supports multiple user profiles, each with individual settings and preferences.

### Managing Profiles

1. **Access Settings:** Click the settings gear icon in the header or navigate to `settings.html`

2. **Profiles Tab:** The first tab shows all user profiles

3. **Create New Profile:**
   - Click "CREATE NEW PROFILE"
   - Enter a name and emoji
   - Profile starts with default settings

4. **Switch Profiles:**
   - Click the profile button in the dashboard header (shows current user emoji + name)
   - Select from the dropdown menu
   - Or use the SWITCH button in settings

5. **Edit Profile:**
   - Click EDIT on any profile card
   - Update name or emoji

6. **Delete Profile:**
   - Click DELETE on any profile card
   - At least one profile must remain

### Per-Profile Settings

Each profile stores:
- **Theme:** Cyberpunk, Hip-Hop, or California
- **Panel Layout:** Custom grid arrangement of widgets
- **Active Panels:** Which panels are enabled
- **Display Settings:** CRT effects, animations, font size
- **Refresh Intervals:** Update frequency for data

Profiles are stored in `config/profiles/` as JSON files.

### Themes

Switch between three distinct visual themes:

- **Cyberpunk:** Neon cyan/magenta with CRT effects and scanlines
- **Hip-Hop:** Gold and purple with bold typography and graffiti elements
- **California:** Sunset orange and pacific blue with smooth gradients

### Panel Customization

Available panels:
- Weather & Markets
- News Feed
- Timer & Alarms
- Calendar
- Music Player (Spotify)
- Video Player
- Cyberspace Browser
- System Monitor

Use the Layout Editor in settings to:
- Set grid dimensions (1-4 rows/columns)
- Drag panels to reposition
- Resize panel areas
- Enable/disable panels

### Customize YouTube Videos

Edit `js/app.js` and modify the `YOUTUBE_VIDEOS` array:

```javascript
const YOUTUBE_VIDEOS = [
    { id: 'VIDEO_ID', title: 'Video Title' },
    // Add more...
];
```

### Auto-Start on Boot

See [docs/AUTOSTART_SETUP.md](docs/AUTOSTART_SETUP.md) for instructions on:
- Setting up systemd service for the system monitor
- Configuring LXDE/labwc autostart for the dashboard
- Troubleshooting auto-start issues

## Project Structure

```
cyber-kiosk/
├── index.html                 # Main dashboard
├── settings.html              # Settings & configuration page
├── css/
│   ├── style.css              # Main styling
│   ├── responsive.css         # Responsive layout system
│   └── themes/                # Theme files
│       ├── base.css           # Shared base styles
│       ├── cyberpunk.css      # Cyberpunk theme
│       ├── hiphop.css         # Hip-Hop theme
│       └── california.css     # California theme
├── js/
│   ├── app.js                 # Main application logic
│   ├── theme-manager.js       # Theme switching
│   ├── profile-manager.js     # User profile management
│   ├── layout-manager.js      # Responsive layout
│   ├── settings.js            # Settings page logic
│   └── panels/                # Panel modules
│       ├── panel-registry.js  # Panel definitions
│       ├── base-panel.js      # Base panel class
│       ├── timer-panel.js     # Timer & alarms
│       ├── calendar-panel.js  # Calendar system
│       ├── music-panel.js     # Spotify integration
│       ├── video-panel.js     # Video player
│       └── system-panel.js    # System monitor
├── config/
│   ├── panels.json            # Panel configuration
│   ├── defaults.json          # Default settings
│   └── profiles/              # User profiles (JSON files)
├── system-monitor.js          # Node.js backend (port 3001)
├── .env                       # Your config with API keys (gitignored)
├── .env.example               # Config template
├── launch-kiosk.sh            # Kiosk launcher script
├── setup.sh                   # Interactive setup
├── package.json               # Node dependencies
├── docs/                      # Additional documentation
│   ├── INSTALLATION.md
│   ├── CONFIGURATION.md
│   ├── TROUBLESHOOTING.md
│   └── BURN_IN_PREVENTION.md
└── README.md                  # This file
```

## System Monitor Backend

The system monitor runs as a Node.js server on port 3001 and provides:

**System Endpoints:**
- `/stats` - CPU/GPU temp, memory, disk, load average, uptime
- `/financial` - Market data (requires Alpha Vantage API key)
- `/pihole` - Pi-hole network statistics (requires Pi-hole installation)
- `/network` - Network bandwidth and connection stats (requires vnstat)
- `/config` - Configuration loaded from .env file
- `/health` - Health check

**User Profile API:**
- `GET /profiles` - List all user profiles
- `POST /profiles` - Create new profile
- `GET /profiles/:id` - Get specific profile
- `PUT /profiles/:id` - Update profile
- `DELETE /profiles/:id` - Delete profile

**Panel Configuration:**
- `GET /config/panels` - Get panel configuration
- `POST /config/panels` - Save panel configuration

### Running as a Service

To run the system monitor automatically on boot:

```bash
# Create systemd service (see docs/AUTOSTART_SETUP.md)
sudo systemctl enable cyber-kiosk-monitor
sudo systemctl start cyber-kiosk-monitor
```

## Customization

### Theming

The color scheme is defined in `css/style.css`:

```css
:root {
    --neon-cyan: #00ffff;
    --neon-magenta: #ff00ff;
    --neon-green: #00ff00;
    --neon-amber: #ffbf00;
    --neon-purple: #8a2be2;
}
```

### Intervals

Adjust update frequencies in `js/app.js` configuration section (values in milliseconds).

## Troubleshooting

### Dashboard shows "API_KEY_REQUIRED"
- Copy `.env.example` to `.env`
- Add your API keys to `.env`
- Restart the system monitor: `sudo systemctl restart cyber-kiosk-monitor`

### System stats showing ERROR
- Ensure system monitor is running: `npm start`
- Check if port 3001 is available: `ss -tuln | grep 3001`
- View logs: `sudo journalctl -u cyber-kiosk-monitor -f`

### Financial data shows simulated values
- Add Alpha Vantage API key to `.env`:
  ```bash
  ALPHA_VANTAGE_API_KEY=your_key_here
  ```
- Restart the system monitor service

### News/Weather not updating
- Verify internet connection
- Check API keys in `.env`
- Restart system monitor: `sudo systemctl restart cyber-kiosk-monitor`
- Open browser console (F12) to see errors

For more help, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Documentation

- [Installation Guide](docs/INSTALLATION.md) - Detailed setup instructions
- [Configuration Reference](docs/CONFIGURATION.md) - All configuration options
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Burn-in Prevention](docs/BURN_IN_PREVENTION.md) - Screen protection for 24/7 operation
- [Development Log](docs/DEVELOPMENT_LOG.md) - Project history and changes

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by William Gibson's *Neuromancer*
- Cyberdeck hardware based on [HOSAKA MK I - Sprawl Edition](https://hackaday.io/project/187128-hosaka-mk-i-sprawl-edition) by back7
- Built for the Raspberry Pi community
- Thanks to all API providers (OpenWeatherMap, NY Times, YouTube, Alpha Vantage)

## Links

- [Raspberry Pi](https://www.raspberrypi.org/)
- [Node.js](https://nodejs.org/)
- [Chromium](https://www.chromium.org/)

---

**CYBER//TERMINAL_v2.1 - STATUS: ONLINE**
