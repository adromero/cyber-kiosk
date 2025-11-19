#!/bin/bash

# Cyber Kiosk Launcher
# Launches Chromium in fullscreen kiosk mode

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Log file for debugging
LOG_FILE="$SCRIPT_DIR/launch-kiosk.log"
echo "========== LAUNCH STARTED: $(date) ==========" >> "$LOG_FILE"
echo "SCRIPT_DIR: $SCRIPT_DIR" >> "$LOG_FILE"
echo "USER: $USER" >> "$LOG_FILE"
echo "DISPLAY: $DISPLAY" >> "$LOG_FILE"
echo "WAYLAND_DISPLAY: $WAYLAND_DISPLAY" >> "$LOG_FILE"
echo "XDG_SESSION_TYPE: $XDG_SESSION_TYPE" >> "$LOG_FILE"

# Wait for display server to be ready
echo "Waiting 5 seconds for display server..." >> "$LOG_FILE"
sleep 5

# Wait for system monitor server to be ready
echo "Waiting for system monitor server..." >> "$LOG_FILE"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "System monitor server is ready at attempt $i" >> "$LOG_FILE"
        break
    fi
    sleep 1
done

# Detect if we're running X11 or Wayland
echo "Configuring display settings..." >> "$LOG_FILE"
if [ "$XDG_SESSION_TYPE" = "x11" ] || [ -n "$DISPLAY" ]; then
    echo "X11 detected, configuring screen blanking and unclutter" >> "$LOG_FILE"
    # X11-specific commands
    # Disable screen blanking and power management
    xset s off 2>/dev/null
    xset -dpms 2>/dev/null
    xset s noblank 2>/dev/null

    # Hide mouse cursor after 3 seconds of inactivity
    unclutter -idle 3 &
else
    echo "Wayland detected" >> "$LOG_FILE"
fi

# Get PORT from .env file (default to 3001 if not set)
PORT=3001
if [ -f "$SCRIPT_DIR/.env" ]; then
    PORT_FROM_ENV=$(grep "^PORT=" "$SCRIPT_DIR/.env" | cut -d '=' -f2 | tr -d ' ')
    if [ ! -z "$PORT_FROM_ENV" ]; then
        PORT=$PORT_FROM_ENV
        echo "Using PORT from .env: $PORT" >> "$LOG_FILE"
    fi
fi

# Launch Chromium in kiosk mode (works in both X11 and Wayland)
echo "Launching Chromium in kiosk mode on port $PORT..." >> "$LOG_FILE"
cd "$SCRIPT_DIR"
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --disable-translate \
    --no-first-run \
    --password-store=basic \
    --check-for-update-interval=31536000 \
    --enable-logging --v=1 \
    --app="http://127.0.0.1:$PORT" \
    >> "$LOG_FILE" 2>&1
