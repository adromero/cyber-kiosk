# Configuration Reference

Complete guide to configuring Cyber Kiosk.

## Configuration File

All user-configurable settings are in `config.json` in the project root.

### Creating config.json

If you haven't created it yet:

```bash
cp config.example.json config.json
nano config.json
```

### Configuration Options

```json
{
  "zipCode": "90210",
  "weatherApiKey": "YOUR_OPENWEATHERMAP_API_KEY",
  "nytApiKey": "YOUR_NYT_API_KEY",
  "youtubeApiKey": "YOUR_YOUTUBE_API_KEY",
  "imageChangeInterval": 30000,
  "weatherUpdateInterval": 600000,
  "newsUpdateInterval": 300000,
  "weatherCycleInterval": 300000,
  "systemMonitorUrl": "http://localhost:3001/stats",
  "systemUpdateInterval": 30000
}
```

### Option Details

#### `zipCode` (string)
- **Default:** `"90210"`
- **Description:** US ZIP code for weather data
- **Example:** `"10001"`, `"90210"`, `"60601"`

#### `weatherApiKey` (string)
- **Required:** Yes (for weather feature)
- **Description:** OpenWeatherMap API key
- **Get it:** https://openweathermap.org/api
- **Free tier:** 1,000 calls/day

#### `nytApiKey` (string)
- **Required:** Yes (for NY Times news)
- **Description:** New York Times API key
- **Get it:** https://developer.nytimes.com/
- **Free tier:** 500 calls/day

#### `youtubeApiKey` (string)
- **Required:** No (thumbnails work without it)
- **Description:** YouTube Data API v3 key for video search
- **Get it:** https://console.cloud.google.com/apis/credentials
- **Free tier:** 10,000 quota units/day

#### `imageChangeInterval` (number)
- **Default:** `30000` (30 seconds)
- **Description:** Video thumbnail rotation interval in milliseconds
- **Range:** 10000-300000 (10s - 5min)
- **Example:** `60000` for 1 minute

#### `weatherUpdateInterval` (number)
- **Default:** `600000` (10 minutes)
- **Description:** Weather data refresh interval
- **Range:** 300000+ (5+ minutes recommended)

#### `newsUpdateInterval` (number)
- **Default:** `300000` (5 minutes)
- **Description:** News source rotation interval
- **Note:** Cycles through Hacker News, NY Times, Dev.to

#### `weatherCycleInterval` (number)
- **Default:** `300000` (5 minutes)
- **Description:** Weather/Financial data toggle interval
- **Note:** Alternates between weather view and markets view

#### `systemMonitorUrl` (string)
- **Default:** `"http://localhost:3001/stats"`
- **Description:** System monitor API endpoint
- **Change if:** Running monitor on different port

#### `systemUpdateInterval` (number)
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

## Environment Variables

### Alpha Vantage API Key (Financial Data)

Set in environment or systemd service:

**For current session:**
```bash
export ALPHA_VANTAGE_API_KEY=your_key_here
npm start
```

**For systemd service:**
Edit `/etc/systemd/system/cyber-kiosk-monitor.service`:
```ini
[Service]
Environment="ALPHA_VANTAGE_API_KEY=your_key_here"
```

Then restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart cyber-kiosk-monitor
```

**Permanently:**
```bash
echo 'export ALPHA_VANTAGE_API_KEY=your_key_here' >> ~/.bashrc
source ~/.bashrc
```

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

And update `config.json`:
```json
{
  "systemMonitorUrl": "http://localhost:YOUR_PORT/stats"
}
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
- `REDDIT` - Reddit r/cyberdeck (uncomment in code)

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
```json
{
  "imageChangeInterval": 60000,
  "weatherUpdateInterval": 1800000,
  "newsUpdateInterval": 600000,
  "systemUpdateInterval": 60000
}
```

### High-Refresh Mode
```json
{
  "imageChangeInterval": 15000,
  "weatherUpdateInterval": 300000,
  "newsUpdateInterval": 180000,
  "systemUpdateInterval": 15000
}
```

### Minimal Mode (No API Keys)
```json
{
  "zipCode": "90210",
  "weatherApiKey": "YOUR_OPENWEATHERMAP_API_KEY",
  "nytApiKey": "YOUR_NYT_API_KEY",
  "youtubeApiKey": "YOUR_YOUTUBE_API_KEY"
}
```

Dashboard will show:
- Time and date (always works)
- System stats (works with monitor running)
- YouTube thumbnails (works without API key)
- Hacker News (no API key required)
- Dev.to (no API key required)

## Validation

Test your configuration:

```bash
# Check config.json syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"

# Test system monitor
curl http://localhost:3001/health

# Test weather API
curl "https://api.openweathermap.org/data/2.5/weather?zip=YOUR_ZIP,us&appid=YOUR_KEY"

# View console logs
chromium-browser index.html
# Press F12 → Console tab
```

## Security Best Practices

1. **Never commit config.json to Git:**
   ```bash
   # Verify it's gitignored
   git status
   # Should NOT show config.json
   ```

2. **Restrict file permissions:**
   ```bash
   chmod 600 config.json
   ```

3. **Use environment variables for production:**
   - Especially for systemd services
   - Keep secrets out of config files when possible

4. **Rotate API keys periodically:**
   - Most services allow key regeneration
   - Update config.json after rotation

## Troubleshooting Configuration

### Config not loading
- Check file exists: `ls -la config.json`
- Verify JSON syntax: `node -e "require('./config.json')"`
- Check browser console for errors

### API calls failing
- Verify API keys in config.json
- Test APIs directly with curl
- Check API rate limits
- Ensure internet connection

### Changes not applying
- Hard refresh browser: Ctrl+Shift+R
- Clear browser cache
- Restart system monitor: `sudo systemctl restart cyber-kiosk-monitor`

## See Also

- [Installation Guide](INSTALLATION.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Contributing](../CONTRIBUTING.md)
