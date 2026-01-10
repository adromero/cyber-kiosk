# Configuration Reference

Complete guide to configuring Cyber Kiosk.

## Configuration File

All user-configurable settings are in `.env` in the project root.

### Creating .env

If you haven't created it yet:

```bash
cp .env.example .env
nano .env
```

Or run the interactive setup script:

```bash
./setup.sh
```

### Configuration Options

The `.env` file contains environment variables that configure the dashboard:

```bash
# Configuration
ZIP_CODE=90210

# API Keys
OPENWEATHER_API_KEY=your_openweathermap_api_key
NYT_API_KEY=your_nytimes_api_key
YOUTUBE_API_KEY=your_youtube_api_key
ALPHA_VANTAGE_API_KEY=your_alphavantage_api_key
```

### Option Details

#### `ZIP_CODE`
- **Default:** `90210`
- **Description:** US ZIP code for weather data
- **Example:** `10001`, `90210`, `60601`

#### `OPENWEATHER_API_KEY`
- **Required:** Yes (for weather feature)
- **Description:** OpenWeatherMap API key
- **Get it:** https://openweathermap.org/api
- **Free tier:** 1,000 calls/day

#### `NYT_API_KEY`
- **Required:** Yes (for NY Times news)
- **Description:** New York Times API key
- **Get it:** https://developer.nytimes.com/
- **Free tier:** 500 calls/day

#### `YOUTUBE_API_KEY`
- **Required:** No (thumbnails work without it)
- **Description:** YouTube Data API v3 key for video search
- **Get it:** https://console.cloud.google.com/apis/credentials
- **Free tier:** 10,000 quota units/day
- **Note:** Enable "YouTube Data API v3" in Google Cloud Console

#### `ALPHA_VANTAGE_API_KEY`
- **Required:** No (financial data will use simulated values)
- **Description:** Alpha Vantage API key for real-time financial market data
- **Get it:** https://www.alphavantage.co/support/#api-key
- **Free tier:** 25 API requests/day
- **Note:** Without this key, the dashboard shows simulated market data

## Update Intervals

Update intervals are configured in `js/app.js`:

```javascript
let CONFIG = {
    imageChangeInterval: 30000,        // 30 seconds - video thumbnail rotation
    weatherUpdateInterval: 600000,     // 10 minutes - weather data refresh
    newsUpdateInterval: 300000,        // 5 minutes - news source rotation
    weatherCycleInterval: 300000,      // 5 minutes - weather/financial toggle
    systemMonitorUrl: 'http://localhost:3001/stats',
    systemUpdateInterval: 30000,       // 30 seconds - system stats refresh
};
```

To change these, edit the `CONFIG` object in `js/app.js`.

### Interval Details

#### `imageChangeInterval` (milliseconds)
- **Default:** `30000` (30 seconds)
- **Description:** Video thumbnail rotation interval
- **Range:** 10000-300000 (10s - 5min)
- **Example:** `60000` for 1 minute

#### `weatherUpdateInterval` (milliseconds)
- **Default:** `600000` (10 minutes)
- **Description:** Weather data refresh interval
- **Range:** 300000+ (5+ minutes recommended)

#### `newsUpdateInterval` (milliseconds)
- **Default:** `300000` (5 minutes)
- **Description:** News source rotation interval
- **Note:** Cycles through Hacker News, NY Times, Dev.to

#### `weatherCycleInterval` (milliseconds)
- **Default:** `300000` (5 minutes)
- **Description:** Weather/Financial data toggle interval
- **Note:** Alternates between weather view and markets view

#### `systemUpdateInterval` (milliseconds)
- **Default:** `30000` (30 seconds)
- **Description:** System stats refresh interval
- **Range:** 10000-60000 (10s - 1min)

## YouTube Videos

Video thumbnails are configured in `js/app.js`:

```javascript
const YOUTUBE_VIDEOS = [
    { id: '4xDzrJKXOOY', title: 'Synthwave Goose' },
    { id: 'MV_3Dpw-BRY', title: 'Cyberpunk Music Mix' },
    // Add more videos...
];
```

### Finding Video IDs

YouTube URL format: `https://www.youtube.com/watch?v=VIDEO_ID`

Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Video ID: `dQw4w9WgXcQ`

## How Configuration Works

1. **Backend loads .env:** The Node.js server (`system-monitor.js`) reads the `.env` file on startup
2. **Backend serves config:** The `/config` endpoint serves configuration to the frontend
3. **Frontend fetches config:** `js/app.js` fetches configuration from `/config` on load
4. **Config is applied:** The frontend uses the configuration for API calls and intervals

This architecture keeps API keys secure on the server side and prevents them from being exposed in browser console or network traffic.

## Advanced Configuration

### Burn-in Prevention

Edit `js/app.js`:

```javascript
// Auto-dim timeout (milliseconds)
const INACTIVITY_TIMEOUT = 1800000; // 30 minutes

// Pixel shift interval
setInterval(() => {
    // Position shift logic
}, 300000); // Every 5 minutes
```

### Color Theme

Edit `css/style.css`:

```css
:root {
    --neon-cyan: #00ffff;      /* Primary accent */
    --neon-magenta: #ff00ff;    /* Secondary accent */
    --neon-green: #00ff00;      /* Success states */
    --neon-amber: #ffbf00;      /* Warnings */
    --neon-purple: #8a2be2;     /* Tertiary accent */
    --text-primary: #e0e0e0;    /* Main text */
    --bg-primary: #0a0a0a;      /* Background */
}
```

### System Monitor Port

Edit `system-monitor.js`:

```javascript
const PORT = 3001; // Change to desired port
```

And update `js/app.js`:
```javascript
let CONFIG = {
    systemMonitorUrl: 'http://localhost:YOUR_PORT/stats',
    // ...
};
```

### News Sources

Edit `js/app.js` to change news rotation:

```javascript
const NEWS_SOURCES = ['HACKERNEWS', 'NYTIMES', 'DEVTO'];
```

Available sources:
- `HACKERNEWS` - Hacker News (no API key required)
- `NYTIMES` - NY Times Tech (requires API key)
- `DEVTO` - Dev.to articles (no API key required)
- `REDDIT` - Reddit r/cyberdeck (code available, currently commented out)

### Font Sizes

Edit `css/style.css`:

```css
/* Make text larger for far viewing */
.widget-title {
    font-size: 2rem; /* Increase from 1.5rem */
}

.stat-value {
    font-size: 3rem; /* Increase from 2rem */
}
```

## Configuration Examples

### Low-Power Mode
Edit `js/app.js`:
```javascript
let CONFIG = {
    imageChangeInterval: 60000,
    weatherUpdateInterval: 1800000,
    newsUpdateInterval: 600000,
    systemUpdateInterval: 60000
};
```

### High-Refresh Mode
Edit `js/app.js`:
```javascript
let CONFIG = {
    imageChangeInterval: 15000,
    weatherUpdateInterval: 300000,
    newsUpdateInterval: 180000,
    systemUpdateInterval: 15000
};
```

### Minimal Mode (Minimal API Keys)
Edit `.env`:
```bash
ZIP_CODE=90210
OPENWEATHER_API_KEY=your_openweathermap_api_key
NYT_API_KEY=
YOUTUBE_API_KEY=
ALPHA_VANTAGE_API_KEY=
```

Dashboard will show:
- Time and date (always works)
- Weather data (with OPENWEATHER_API_KEY)
- System stats (works with monitor running)
- YouTube thumbnails (works without API key)
- Hacker News (no API key required)
- Dev.to (no API key required)
- Simulated financial data (without ALPHA_VANTAGE_API_KEY)

## Validation

Test your configuration:

```bash
# Check .env file exists
ls -la .env

# Test system monitor
curl http://localhost:3001/health

# Test config endpoint
curl http://localhost:3001/config

# Test weather API
curl "https://api.openweathermap.org/data/2.5/weather?zip=YOUR_ZIP,us&appid=YOUR_KEY"

# View console logs
chromium-browser index.html
# Press F12 → Console tab
```

## Security Best Practices

1. **Never commit .env to Git:**
   ```bash
   # Verify it's gitignored
   git status
   # Should NOT show .env
   ```

2. **Restrict file permissions:**
   ```bash
   chmod 600 .env
   ```

3. **Keep API keys private:**
   - Never share your `.env` file
   - Never screenshot or paste your actual API keys
   - Regenerate keys if accidentally exposed

4. **Use systemd for production:**
   - See [AUTOSTART_SETUP.md](AUTOSTART_SETUP.md)
   - System service keeps monitor running

5. **Rotate API keys periodically:**
   - Most services allow key regeneration
   - Update `.env` after rotation
   - Restart system monitor: `sudo systemctl restart cyber-kiosk-monitor`

## Troubleshooting Configuration

### Config not loading
- Check file exists: `ls -la .env`
- Verify format: Each line should be `KEY=value` with no spaces around `=`
- Check browser console for errors (F12)
- Restart system monitor: `sudo systemctl restart cyber-kiosk-monitor`

### API calls failing
- Verify API keys in `.env`
- Test APIs directly with curl
- Check API rate limits
- Ensure internet connection
- Check system monitor logs: `sudo journalctl -u cyber-kiosk-monitor -f`

### Weather shows "API_KEY_REQUIRED"
- Add OPENWEATHER_API_KEY to `.env`
- Restart system monitor
- Hard refresh browser: Ctrl+Shift+R

### Financial data shows simulated values
- Add ALPHA_VANTAGE_API_KEY to `.env`
- Restart system monitor
- Wait up to 30 minutes for cache to refresh

### Changes not applying
- Restart system monitor: `sudo systemctl restart cyber-kiosk-monitor`
- Hard refresh browser: Ctrl+Shift+R
- Clear browser cache
- Check for JavaScript errors in browser console (F12)

## Systemd Service Configuration

If running as a systemd service, the `.env` file is automatically loaded by `system-monitor.js`.

To verify the service is using your `.env`:

```bash
# Check service status
sudo systemctl status cyber-kiosk-monitor

# View service logs
sudo journalctl -u cyber-kiosk-monitor -f

# Restart service after .env changes
sudo systemctl restart cyber-kiosk-monitor
```

## See Also

- [Installation Guide](INSTALLATION.md)
- [Autostart Setup](AUTOSTART_SETUP.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [README](../README.md)
