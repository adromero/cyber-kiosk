#!/bin/bash

# Setup script for Alpha Vantage API key
# Get your free API key from: https://www.alphavantage.co/support/#api-key

echo "=== Cyber Kiosk Financial API Setup ==="
echo ""
echo "This script will configure your Alpha Vantage API key for real-time financial data."
echo ""
echo "If you don't have an API key yet:"
echo "1. Visit: https://www.alphavantage.co/support/#api-key"
echo "2. Fill out the form to get a free API key"
echo "3. Copy the API key and paste it here"
echo ""

# Prompt for API key
read -p "Enter your Alpha Vantage API key (or press Enter to skip): " api_key

if [ -z "$api_key" ]; then
    echo ""
    echo "No API key provided. The system will continue using simulated data."
    echo "You can run this script again later to set up real data."
    exit 0
fi

# Update the systemd service file
echo ""
echo "Updating systemd service configuration..."

sudo tee /etc/systemd/system/cyber-kiosk-monitor.service > /dev/null << EOF
[Unit]
Description=Cyber Kiosk System Monitor Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/cyber-kiosk
Environment="ALPHA_VANTAGE_API_KEY=$api_key"
ExecStart=/usr/bin/node /home/pi/cyber-kiosk/system-monitor.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload and restart the service
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Restarting cyber-kiosk-monitor service..."
sudo systemctl restart cyber-kiosk-monitor.service

# Wait a moment and check status
sleep 2
echo ""
echo "Service status:"
sudo systemctl status cyber-kiosk-monitor.service --no-pager -n 5

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Your financial data should now display real market information."
echo "Note: Data refreshes every 30 minutes to stay within API rate limits."
echo ""
echo "To verify real data is being used, check the logs:"
echo "  sudo journalctl -u cyber-kiosk-monitor.service -f"
echo ""
