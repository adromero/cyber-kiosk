# Troubleshooting Guide

Common issues and solutions for Cyber Kiosk.

## Dashboard Issues

### Dashboard shows "API_KEY_REQUIRED"

**Symptom:** Weather or News widgets display "API_KEY_REQUIRED"

**Solution:**
```bash
# Create config.json if missing
cp config.example.json config.json

# Edit and add your API keys
nano config.json

# Hard refresh browser
# Press Ctrl+Shift+R
```

**Get API keys:**
- Weather: https://openweathermap.org/api
- News: https://developer.nytimes.com/
- YouTube: https://console.cloud.google.com/apis/credentials

### Dashboard shows blank or doesn't load

**Symptom:** White screen, no content displayed

**Solutions:**

1. **Check browser console:**
   ```
   Press F12 → Console tab
   Look for error messages
   ```

2. **Verify config.json exists:**
   ```bash
   ls -la config.json
   # If missing: cp config.example.json config.json
   ```

3. **Check system monitor is running:**
   ```bash
   curl http://localhost:3001/health
   # Should return: OK
   ```

4. **Test in regular browser first:**
   ```bash
   chromium-browser index.html
   ```

### Weather data not updating

**Symptom:** Weather shows old data or "--°"

**Solutions:**

1. **Verify API key:**
   ```bash
   # Test API directly
   curl "https://api.openweathermap.org/data/2.5/weather?zip=90210,us&appid=YOUR_API_KEY"
   ```

2. **Check rate limits:**
   - OpenWeatherMap free tier: 1,000 calls/day
   - May hit limit if refreshing too frequently

3. **Verify ZIP code format:**
   ```json
   {
     "zipCode": "90210"  // US ZIP, 5 digits
   }
   ```

4. **Check browser console:**
   ```
   F12 → Console → Look for "ERROR FETCHING WEATHER"
   ```

### Financial data shows simulated values

**Symptom:** Markets widget shows "SIMULATED" or unrealistic values

**Solution:**

Alpha Vantage API key not configured. Add it:

```bash
# For current session
export ALPHA_VANTAGE_API_KEY=your_key_here
npm start

# For systemd service
sudo nano /etc/systemd/system/cyber-kiosk-monitor.service

# Add under [Service]:
Environment="ALPHA_VANTAGE_API_KEY=your_key_here"

# Restart
sudo systemctl daemon-reload
sudo systemctl restart cyber-kiosk-monitor
```

Get free key: https://www.alphavantage.co/support/#api-key

### YouTube videos not loading

**Symptom:** Video thumbnails show broken images

**Solutions:**

1. **Check internet connection:**
   ```bash
   ping -c 3 youtube.com
   ```

2. **Verify video IDs are valid:**
   - Edit `js/app.js`
   - Test URLs: `https://www.youtube.com/watch?v=VIDEO_ID`

3. **API key for search only:**
   - Thumbnails work without API key
   - Search requires YouTube Data API v3 key

### News feeds empty or not rotating

**Symptom:** News widget shows no articles

**Solutions:**

1. **Hacker News (no API key needed):**
   ```bash
   # Test API
   curl https://hacker-news.firebaseio.com/v0/topstories.json
   ```

2. **NY Times (requires API key):**
   ```bash
   # Test API
   curl "https://api.nytimes.com/svc/topstories/v2/technology.json?api-key=YOUR_KEY"
   ```

3. **Dev.to (no API key needed):**
   ```bash
   # Test API
   curl https://dev.to/api/articles?top=7
   ```

4. **Check rotation:**
   - Sources cycle every 5 minutes by default
   - Change in `config.json`: `newsUpdateInterval`

## System Monitor Issues

### System stats showing "ERROR"

**Symptom:** SYS_STATUS widget displays "ERROR"

**Solutions:**

1. **Check if monitor is running:**
   ```bash
   sudo systemctl status cyber-kiosk-monitor

   # If not running:
   sudo systemctl start cyber-kiosk-monitor

   # If service doesn't exist:
   npm start &
   ```

2. **Check port 3001:**
   ```bash
   ss -tuln | grep 3001

   # If occupied by another process:
   sudo kill $(sudo lsof -t -i:3001)
   npm start
   ```

3. **Test API manually:**
   ```bash
   curl http://localhost:3001/stats
   curl http://localhost:3001/health
   ```

4. **View logs:**
   ```bash
   sudo journalctl -u cyber-kiosk-monitor -f
   ```

### Temperature readings show "--°C"

**Symptom:** CPU/GPU temp not displayed

**Solutions:**

1. **Check vcgencmd:**
   ```bash
   vcgencmd measure_temp
   # Should show: temp=50.0'C
   ```

2. **Check thermal zone:**
   ```bash
   cat /sys/class/thermal/thermal_zone0/temp
   # Should show: 50000 (50°C in millidegrees)
   ```

3. **Raspberry Pi specific:**
   - These commands only work on Raspberry Pi
   - On other systems, readings may be unavailable

### System monitor won't start on boot

**Symptom:** Service fails to start automatically

**Solutions:**

1. **Check service file:**
   ```bash
   sudo systemctl status cyber-kiosk-monitor
   # Look for error messages
   ```

2. **Verify paths in service:**
   ```bash
   sudo nano /etc/systemd/system/cyber-kiosk-monitor.service

   # Check these paths exist:
   WorkingDirectory=/path/to/cyber-kiosk
   ExecStart=/path/to/node /path/to/system-monitor.js
   ```

3. **Check permissions:**
   ```bash
   # Service should run as your user
   User=YOUR_USERNAME
   ```

4. **Reload and restart:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable cyber-kiosk-monitor
   sudo systemctl restart cyber-kiosk-monitor
   ```

## Kiosk Mode Issues

### Kiosk won't launch fullscreen

**Symptom:** Chromium opens in window mode

**Solutions:**

1. **Check display environment:**
   ```bash
   echo $DISPLAY
   echo $WAYLAND_DISPLAY
   # Should show values like :0 or wayland-0
   ```

2. **Verify script is executable:**
   ```bash
   chmod +x launch-kiosk.sh
   ```

3. **Run manually to see errors:**
   ```bash
   ./launch-kiosk.sh
   # Check terminal output
   ```

4. **Check logs:**
   ```bash
   cat launch-kiosk.log
   ```

### Dashboard doesn't autostart on boot

**Symptom:** Must manually launch after reboot

**Solutions for LXDE:**

1. **Check autostart file:**
   ```bash
   cat ~/.config/lxsession/LXDE-pi/autostart
   # Should contain:
   @/path/to/cyber-kiosk/launch-kiosk.sh
   ```

2. **Create if missing:**
   ```bash
   mkdir -p ~/.config/lxsession/LXDE-pi
   echo "@$HOME/cyber-kiosk/launch-kiosk.sh" >> ~/.config/lxsession/LXDE-pi/autostart
   ```

**Solutions for labwc (Wayland):**

1. **Check autostart:**
   ```bash
   cat ~/.config/labwc/autostart
   # Should contain launch command
   ```

2. **Create if missing:**
   ```bash
   mkdir -p ~/.config/labwc
   echo "$HOME/cyber-kiosk/launch-kiosk.sh &" > ~/.config/labwc/autostart
   chmod +x ~/.config/labwc/autostart
   ```

### Can't exit kiosk mode

**Symptom:** Stuck in fullscreen

**Solutions:**

1. **Click bottom-right corner:**
   - Hidden exit button
   - Will glow red on hover

2. **Keyboard shortcuts:**
   - **Alt + F4** (X11/LXDE)
   - **Super + Q** (Wayland/labwc)

3. **From another terminal (SSH):**
   ```bash
   pkill chromium-browser
   ```

4. **Switch to TTY:**
   - **Ctrl + Alt + F2**
   - Login and kill process
   - **Ctrl + Alt + F7** to return

### Screen blanking/dimming issues

**Symptom:** Screen turns off or dims unexpectedly

**Solutions:**

1. **Disable screensaver:**
   ```bash
   sudo apt-get install xscreensaver
   # Configure in desktop settings
   ```

2. **Check X11 settings:**
   ```bash
   xset s off
   xset -dpms
   xset s noblank
   ```

3. **Add to autostart:**
   ```bash
   nano ~/.config/lxsession/LXDE-pi/autostart
   # Add:
   @xset s off
   @xset -dpms
   @xset s noblank
   ```

## Performance Issues

### Dashboard is slow or laggy

**Symptom:** Animations stutter, updates are delayed

**Solutions:**

1. **Increase GPU memory:**
   ```bash
   sudo raspi-config
   # Performance Options → GPU Memory → 128 or 256
   sudo reboot
   ```

2. **Reduce update frequencies in config.json:**
   ```json
   {
     "imageChangeInterval": 60000,
     "systemUpdateInterval": 60000
   }
   ```

3. **Disable CRT effects temporarily:**
   - Edit `css/style.css`
   - Comment out `.scanlines` and animations

4. **Close other applications:**
   ```bash
   # Check memory usage
   free -h

   # List running processes
   htop
   ```

### High CPU usage

**Symptom:** Pi runs hot, fan spins loudly

**Solutions:**

1. **Check what's using CPU:**
   ```bash
   top
   # Press 'P' to sort by CPU usage
   ```

2. **Reduce system monitor frequency:**
   ```json
   {
     "systemUpdateInterval": 60000
   }
   ```

3. **Check for runaway processes:**
   ```bash
   sudo systemctl status cyber-kiosk-monitor
   # Look for restarts or errors
   ```

## Network/API Issues

### All API calls failing

**Symptom:** Multiple widgets show connection errors

**Solutions:**

1. **Check internet connection:**
   ```bash
   ping -c 3 8.8.8.8
   ping -c 3 google.com
   ```

2. **Check DNS:**
   ```bash
   cat /etc/resolv.conf
   # Should have nameservers
   ```

3. **Test specific APIs:**
   ```bash
   curl https://api.openweathermap.org/
   curl https://hacker-news.firebaseio.com/v0/topstories.json
   ```

4. **Check proxy settings:**
   ```bash
   echo $HTTP_PROXY
   echo $HTTPS_PROXY
   ```

### Rate limit errors

**Symptom:** APIs work then stop, "429 Too Many Requests"

**Solutions:**

1. **Increase update intervals:**
   ```json
   {
     "weatherUpdateInterval": 1800000,
     "newsUpdateInterval": 600000
   }
   ```

2. **Check API quotas:**
   - OpenWeatherMap: 1,000 calls/day
   - NY Times: 500 calls/day
   - YouTube: 10,000 units/day
   - Alpha Vantage: 25 calls/day

3. **Wait for quota reset:**
   - Most APIs reset daily at midnight UTC

## Display Issues

### Text too small

**Symptom:** Hard to read from distance

**Solution:** Edit `css/style.css`:
```css
.widget-title {
    font-size: 2.5rem; /* Increase from 1.5rem */
}

.stat-value {
    font-size: 3.5rem; /* Increase from 2rem */
}
```

### Colors look washed out

**Symptom:** CRT effect too strong

**Solution:** Adjust in `css/style.css`:
```css
.scanlines::before {
    opacity: 0.05; /* Reduce from 0.1 */
}
```

### Burn-in concerns

**Symptom:** Worried about static elements

**Solution:** See [Burn-in Prevention Guide](BURN_IN_PREVENTION.md)

## Getting More Help

### Enable Debug Mode

Add to browser console:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

### Collect Diagnostic Info

```bash
# System info
uname -a
node --version
npm --version
chromium-browser --version

# Service status
sudo systemctl status cyber-kiosk-monitor

# Logs
sudo journalctl -u cyber-kiosk-monitor --no-pager -n 50
cat launch-kiosk.log

# Network test
curl -v http://localhost:3001/health

# Config (remove API keys before sharing!)
cat config.json
```

### Report an Issue

Include:
1. Clear description of problem
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (Pi model, OS version)
5. Relevant logs and errors
6. Screenshots if applicable

Open issue: https://github.com/YOUR_USERNAME/cyber-kiosk/issues

## Quick Fixes

### Nuclear option - Full reset

```bash
cd ~/cyber-kiosk

# Stop services
sudo systemctl stop cyber-kiosk-monitor
pkill chromium-browser

# Reset config
cp config.example.json config.json

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart
npm start &
./launch-kiosk.sh
```

### Test in minimal mode

```bash
# Start only system monitor
npm start

# Open in regular browser (not kiosk)
chromium-browser index.html

# Check console (F12) for errors
```

---

**Still stuck? Open an issue on GitHub with details!**
