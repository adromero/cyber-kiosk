#!/bin/bash

# Cyber Kiosk Setup Script
# Interactive installation and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════╗"
echo "║                                           ║"
echo "║         CYBER KIOSK SETUP v2.1            ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check Node.js
echo -e "${CYAN}[1/7] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found!${NC}"
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"
fi

# Step 2: Check npm
echo -e "${CYAN}[2/7] Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found!${NC}"
    sudo apt-get install -y npm
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm $NPM_VERSION found${NC}"
fi

# Step 3: Install npm dependencies
echo -e "${CYAN}[3/7] Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 4: Check for Chromium
echo -e "${CYAN}[4/7] Checking Chromium browser...${NC}"
if ! command -v chromium-browser &> /dev/null; then
    echo -e "${YELLOW}⚠ Chromium not found. Install it for kiosk mode:${NC}"
    echo "  sudo apt-get install chromium-browser"
else
    echo -e "${GREEN}✓ Chromium browser found${NC}"
fi

# Step 5: Create config.json
echo -e "${CYAN}[5/7] Configuring API keys...${NC}"
if [ -f "config.json" ]; then
    echo -e "${YELLOW}⚠ config.json already exists. Skipping...${NC}"
    read -p "Do you want to reconfigure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✓ Using existing config${NC}"
    else
        rm config.json
    fi
fi

if [ ! -f "config.json" ]; then
    echo -e "${YELLOW}Creating config.json from template...${NC}"
    cp config.example.json config.json

    echo ""
    echo -e "${CYAN}Let's configure your API keys (press Enter to skip):${NC}"
    echo ""

    # Zip Code
    read -p "Enter your ZIP code (default: 90210): " ZIP_CODE
    ZIP_CODE=${ZIP_CODE:-90210}

    # OpenWeatherMap API Key
    echo -e "${YELLOW}Get OpenWeatherMap API key: https://openweathermap.org/api${NC}"
    read -p "Enter OpenWeatherMap API key (optional): " WEATHER_KEY

    # NY Times API Key
    echo -e "${YELLOW}Get NY Times API key: https://developer.nytimes.com/${NC}"
    read -p "Enter NY Times API key (optional): " NYT_KEY

    # YouTube API Key
    echo -e "${YELLOW}Get YouTube API key: https://console.cloud.google.com/apis/credentials${NC}"
    read -p "Enter YouTube API key (optional): " YOUTUBE_KEY

    # Update config.json
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        sed -i '' "s/90210/$ZIP_CODE/g" config.json
        [ ! -z "$WEATHER_KEY" ] && sed -i '' "s/YOUR_OPENWEATHERMAP_API_KEY/$WEATHER_KEY/g" config.json
        [ ! -z "$NYT_KEY" ] && sed -i '' "s/YOUR_NYT_API_KEY/$NYT_KEY/g" config.json
        [ ! -z "$YOUTUBE_KEY" ] && sed -i '' "s/YOUR_YOUTUBE_API_KEY/$YOUTUBE_KEY/g" config.json
    else
        # Linux
        sed -i "s/90210/$ZIP_CODE/g" config.json
        [ ! -z "$WEATHER_KEY" ] && sed -i "s/YOUR_OPENWEATHERMAP_API_KEY/$WEATHER_KEY/g" config.json
        [ ! -z "$NYT_KEY" ] && sed -i "s/YOUR_NYT_API_KEY/$NYT_KEY/g" config.json
        [ ! -z "$YOUTUBE_KEY" ] && sed -i "s/YOUR_YOUTUBE_API_KEY/$YOUTUBE_KEY/g" config.json
    fi

    echo -e "${GREEN}✓ config.json created${NC}"
    echo -e "${YELLOW}You can edit config.json anytime to update your settings${NC}"
fi

# Step 6: Test system monitor
echo -e "${CYAN}[6/7] Testing system monitor...${NC}"
node system-monitor.js &
MONITOR_PID=$!
sleep 3

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ System monitor is working${NC}"
else
    echo -e "${RED}✗ System monitor failed to start${NC}"
fi

kill $MONITOR_PID 2>/dev/null || true

# Step 7: Optional - Setup autostart
echo -e "${CYAN}[7/7] Setup autostart (optional)${NC}"
read -p "Do you want to setup autostart on boot? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setting up systemd service...${NC}"

    # Create service file
    SERVICE_FILE="/tmp/cyber-kiosk-monitor.service"
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Cyber Kiosk System Monitor
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$(which node) $SCRIPT_DIR/system-monitor.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

    sudo mv "$SERVICE_FILE" /etc/systemd/system/cyber-kiosk-monitor.service
    sudo systemctl daemon-reload
    sudo systemctl enable cyber-kiosk-monitor.service
    sudo systemctl start cyber-kiosk-monitor.service

    echo -e "${GREEN}✓ Systemd service created and started${NC}"
    echo -e "${YELLOW}To setup dashboard autostart, see docs/AUTOSTART_SETUP.md${NC}"
else
    echo -e "${YELLOW}Skipping autostart setup${NC}"
fi

# Final instructions
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}║         SETUP COMPLETE!                   ║${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "  1. Start system monitor: ${YELLOW}npm start${NC}"
echo -e "  2. Launch dashboard: ${YELLOW}./launch-kiosk.sh${NC}"
echo -e "  3. Or test in browser: ${YELLOW}chromium-browser index.html${NC}"
echo ""
echo -e "${CYAN}Configuration:${NC}"
echo -e "  - Edit ${YELLOW}config.json${NC} to update API keys"
echo -e "  - Edit ${YELLOW}js/app.js${NC} to customize YouTube videos"
echo -e "  - See ${YELLOW}docs/${NC} for more information"
echo ""
echo -e "${CYAN}Troubleshooting:${NC}"
echo -e "  - View logs: ${YELLOW}sudo journalctl -u cyber-kiosk-monitor -f${NC}"
echo -e "  - Check service: ${YELLOW}sudo systemctl status cyber-kiosk-monitor${NC}"
echo -e "  - See ${YELLOW}docs/TROUBLESHOOTING.md${NC}"
echo ""
echo -e "${GREEN}Enjoy your Cyber Kiosk! 🚀${NC}"
