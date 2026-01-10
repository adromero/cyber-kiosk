# Burn-in Prevention for Always-On Display

Your Cyber Kiosk includes multiple layers of protection against screen burn-in for 24/7 operation.

## Active Protection Features

### 1. **Subtle Movement Animations**
- Entire display slowly floats (±2px) over 2-minute cycles
- Widgets gently "breathe" with opacity changes (90-second cycles)
- Random position shifts every 5 minutes (±2px)
- **Impact**: Prevents static elements from permanently imprinting

### 2. **Auto-Dimming**
- Screen automatically dims to 40% brightness after 30 minutes of inactivity
- Instantly brightens on any touch, mouse, or keyboard interaction
- **Impact**: Reduces pixel wear during idle periods

### 3. **Dynamic Content**
- YouTube video thumbnails rotate every 30 seconds
- News feeds cycle through 3 sources (Hacker News, NY Times, Dev.to) every 5 minutes
- Weather/financial data toggles every 5 minutes
- Clock updates every second
- **Impact**: Constant content changes prevent static burn-in

### 4. **Visual Effects**
- CRT scanlines overlay constantly moves
- Subtle flicker animation varies pixel intensity
- **Impact**: No pixel stays at constant brightness for long

## Configuration

### Adjust Auto-Dim Timing
Edit `js/app.js` in your project directory:
```javascript
const INACTIVITY_TIMEOUT = 1800000; // Change value (in milliseconds)
// 1800000 = 30 minutes
// 3600000 = 1 hour
// 600000 = 10 minutes
```

### Adjust Video Thumbnail Rotation Speed
Edit the CONFIG section in `js/app.js`:
```javascript
imageChangeInterval: 30000
```
Values in milliseconds:
- 30000 = 30 seconds
- 60000 = 1 minute
- 15000 = 15 seconds

### Disable Auto-Dim (Not Recommended)
Comment out this line in `js/app.js`:
```javascript
// resetInactivityTimer();
```

## Additional Hardware Recommendations

### 1. **Reduce Screen Brightness**
Lower the physical brightness of your display to 60-70% if possible. This significantly extends screen life.

### 2. **Enable Screen Saver (Optional)**
If you want complete blackout during extended idle:
```bash
sudo apt-get install xscreensaver
```
Configure to blank screen after 1-2 hours in display settings.

### 3. **Daily Reboot (Optional)**
Add a cron job to reboot daily at 4 AM:
```bash
crontab -e
# Add: 0 4 * * * /sbin/shutdown -r now
```

## LCD vs OLED Considerations

- **LCD displays** (most common): Burn-in is rare but can occur. The built-in protections are sufficient.
- **OLED displays**: More susceptible to burn-in. Consider:
  - Reducing brightness to 50%
  - Faster video thumbnail rotation (15 seconds)
  - Shorter auto-dim timeout (15 minutes)
  - Full screen blank after 2 hours

## Monitoring for Burn-in

To test for burn-in:
1. Display a solid white background: Create an HTML file with white background
2. Look for ghost images or discoloration
3. Test quarterly or whenever concerned

## Summary

With these protections, your 7-inch display should last for years of 24/7 operation:
✅ Constant content movement (CSS animations + JS repositioning)
✅ Auto-dimming during inactivity
✅ Rotating dynamic content
✅ No truly static elements

**You should not worry about burn-in with this configuration.**
