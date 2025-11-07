#!/bin/bash
# Start the system monitoring server

echo "> STARTING CYBER KIOSK SYSTEM MONITOR..."
cd "$(dirname "$0")"
node system-monitor.js
