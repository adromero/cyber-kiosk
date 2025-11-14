# Cyber Kiosk - Installation Guide

Complete step-by-step installation instructions for Raspberry Pi.

## Prerequisites

### Hardware
- Raspberry Pi 3, 4, or 5
- MicroSD card (16GB+ recommended)
- 7-inch touchscreen or any HDMI display
- Power supply
- (Optional) Keyboard and mouse for initial setup

### Software
- Raspberry Pi OS (Debian-based, 32-bit or 64-bit)
- Internet connection for initial setup

## Installation Methods

### Method 1: Quick Install (Recommended)

1. **Clone the repository:**
   ```bash
   cd ~
   git clone https://github.com/YOUR_USERNAME/cyber-kiosk.git
   cd cyber-kiosk
   ```

2. **Run the setup script:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   The script will:
   - Check for Node.js and install if missing
   - Install npm dependencies
   - Create .env from template
   - Prompt for API keys
   - Test the system monitor
   - (Optional) Setup systemd service

3. **Launch the dashboard:**
   ```bash
   npm start &
   ./launch-kiosk.sh
   ```

### Method 2: Manual Installation

#### Step 1: Install Node.js

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 2: Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/cyber-kiosk.git
cd cyber-kiosk
```

#### Step 3: Install Dependencies

```bash
npm install
```

#### Step 4: Configure API Keys

```bash
cp .env.example .env
nano .env
```

Edit the file with your API keys and zip code:

```bash
# API Keys
OPENWEATHER_API_KEY=YOUR_OPENWEATHERMAP_API_KEY
NYT_API_KEY=YOUR_NYT_API_KEY
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY

# Configuration
ZIP_CODE=90210

# Alpha Vantage API Key (for financial data)
ALPHA_VANTAGE_API_KEY=your_alphavantage_api_key
```

Save and exit (Ctrl+X, Y, Enter).

#### Step 5: Get API Keys

**OpenWeatherMap (Weather Data):**
1. Visit https://openweathermap.org/api
2. Sign up for free account
3. Navigate to API keys section
4. Copy your API key

**NY Times (Tech News):**
1. Visit https://developer.nytimes.com/
2. Create a free account
3. Create an app
4. Copy your API key

**YouTube Data API v3 (Video Search):**
1. Visit https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials (API key)
5. Copy your API key

**Alpha Vantage (Financial Data - Optional):**
1. Visit https://www.alphavantage.co/support/#api-key
2. Fill out form for free API key
3. Add to .env file:
   ```bash
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```

#### Step 6: Install Chromium

```bash
sudo apt-get update
sudo apt-get install -y chromium-browser unclutter
```

#### Step 7: Test Installation

```bash
# Start system monitor
npm start &

# Test in browser
chromium-browser index.html

# Or launch in kiosk mode
./launch-kiosk.sh
```

## Auto-Start on Boot

### System Monitor Service

Create systemd service for system monitor:

1. **Create service file:**
   ```bash
   sudo nano /etc/systemd/system/cyber-kiosk-monitor.service
   ```

2. **Add configuration:**
   ```ini
   [Unit]
   Description=Cyber Kiosk System Monitor
   After=network.target

   [Service]
   Type=simple
   User=YOUR_USERNAME
   WorkingDirectory=/home/YOUR_USERNAME/cyber-kiosk
   ExecStart=/usr/bin/node /home/YOUR_USERNAME/cyber-kiosk/system-monitor.js
   Restart=always
   RestartSec=10
   Environment="NODE_ENV=production"
   Environment="ALPHA_VANTAGE_API_KEY=your_key_if_needed"

   [Install]
   WantedBy=multi-user.target
   ```

   Replace `YOUR_USERNAME` with your actual username.

3. **Enable and start service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable cyber-kiosk-monitor.service
   sudo systemctl start cyber-kiosk-monitor.service
   sudo systemctl status cyber-kiosk-monitor.service
   ```

### Dashboard Auto-Launch

#### For LXDE Desktop:

1. **Edit autostart file:**
   ```bash
   mkdir -p ~/.config/lxsession/LXDE-pi
   nano ~/.config/lxsession/LXDE-pi/autostart
   ```

2. **Add line:**
   ```
   @/home/YOUR_USERNAME/cyber-kiosk/launch-kiosk.sh
   ```

3. **Make script executable:**
   ```bash
   chmod +x ~/cyber-kiosk/launch-kiosk.sh
   ```

#### For labwc (Wayland):

1. **Create autostart directory:**
   ```bash
   mkdir -p ~/.config/labwc
   ```

2. **Create autostart file:**
   ```bash
   nano ~/.config/labwc/autostart
   ```

3. **Add command:**
   ```bash
   /home/YOUR_USERNAME/cyber-kiosk/launch-kiosk.sh &
   ```

#### Test Auto-Start:

```bash
sudo reboot
```

Dashboard should launch automatically after login.

## Raspberry Pi Configuration

### Recommended Settings

```bash
sudo raspi-config
```

- **Display Options → Screen Blanking:** Disable
- **System Options → Boot:** Desktop with auto-login
- **Performance Options → GPU Memory:** 128MB minimum

### Touchscreen Calibration

If using official 7-inch touchscreen:

```bash
# Install calibration tool
sudo apt-get install xinput-calibrator

# Run calibration
xinput_calibrator
```

Follow on-screen instructions and save the configuration.

## Troubleshooting Installation

### Node.js Issues

**Problem:** Old Node.js version
```bash
# Remove old version
sudo apt-get remove nodejs
sudo apt-get autoremove

# Install latest
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Permission Issues

**Problem:** npm permission errors
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u cyber-kiosk-monitor.service -f
```

**Common issues:**
- Wrong paths in service file
- Missing environment variables
- Port 3001 already in use

### Display Issues

**Problem:** Dashboard doesn't fit screen
- Edit `css/style.css` and adjust font sizes
- Use browser zoom: Ctrl+Plus/Minus

**Problem:** Kiosk won't launch fullscreen
- Ensure X11 or Wayland session is running
- Check `launch-kiosk.sh` logs

## Next Steps

- [Configuration Guide](CONFIGURATION.md) - Customize your dashboard
- [Troubleshooting](TROUBLESHOOTING.md) - Fix common issues
- [Burn-in Prevention](BURN_IN_PREVENTION.md) - Protect your display

## Getting Help

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review logs: `sudo journalctl -u cyber-kiosk-monitor -f`
- Open an issue on GitHub

---

**Happy hacking! 🚀**
