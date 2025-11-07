# Cyber Kiosk - Setup Notes

## System Monitor Feature - Completed 2025-11-02

### What Was Added

Added a real-time system monitoring panel that displays Raspberry Pi hardware statistics alongside the existing image slideshow.

### Components

1. **system-monitor.js** - Node.js server that collects system stats
   - Runs on port 3001
   - Provides `/stats` and `/health` endpoints
   - Collects: CPU/GPU temp, memory, disk, load average, uptime

2. **systemd Service** - Auto-starts monitor server on boot
   - Service file: `/etc/systemd/system/cyber-kiosk-monitor.service`
   - Enabled to start automatically
   - Restarts automatically on failure

3. **Updated Dashboard Layout**
   - Bottom row has two panels side-by-side
   - Left: System Status widget (CPU temp, GPU temp, CPU usage, memory, disk, load, uptime)
   - Right: VID panel (YouTube video thumbnails cycling every 30 seconds)

4. **Updated launch-kiosk.sh**
   - Waits for monitor server to be ready before launching browser
   - Uses file:// URL instead of http.server
   - Configured in LXDE autostart

### Boot Sequence

1. Raspberry Pi boots
2. systemd starts `cyber-kiosk-monitor.service` automatically
3. User logs into LXDE desktop
4. LXDE autostart triggers `launch-kiosk.sh`
5. Script waits for monitor server health check
6. Chromium launches in fullscreen kiosk mode
7. Dashboard displays with live system stats updating every 30 seconds

### Management Commands

```bash
# Check monitor service
sudo systemctl status cyber-kiosk-monitor.service

# View logs
sudo journalctl -u cyber-kiosk-monitor.service -f

# Restart monitor
sudo systemctl restart cyber-kiosk-monitor.service

# Manual launch dashboard
cd ~/cyber-kiosk
./launch-kiosk.sh

# Test API directly
curl http://localhost:3001/stats
curl http://localhost:3001/health
```

### System Requirements

- Node.js 18.0.0+
- Raspberry Pi with vcgencmd support for temperature readings
- LXDE desktop environment
- Chromium browser

### Current Status

✅ System monitor server installed and enabled
✅ Dashboard updated with system stats panel
✅ Auto-start on boot configured
✅ Tested and verified working

The dashboard is currently running on the Raspberry Pi touchscreen with live system statistics.
