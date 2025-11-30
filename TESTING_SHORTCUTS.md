# Testing Shortcuts & Quick Reference

## Browser Developer Tools

### Opening DevTools
- **Chrome/Edge**: `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- **Firefox**: `F12` or `Ctrl+Shift+I` / `Cmd+Option+I`
- **Safari**: `Cmd+Option+I` (must enable Developer menu first)

### Useful DevTools Tabs
1. **Console** - View JavaScript errors and logs
2. **Network** - See which files loaded/failed
3. **Elements** - Inspect HTML/CSS
4. **Application** - View localStorage/sessionStorage
5. **Performance** - Record and analyze performance

### Responsive Design Testing
- **Chrome**: `Ctrl+Shift+M` / `Cmd+Shift+M` (Toggle Device Toolbar)
- **Firefox**: `Ctrl+Shift+M` / `Cmd+Shift+M` (Responsive Design Mode)

### Quick Actions
- **Hard Refresh** (bypass cache): `Ctrl+Shift+R` / `Cmd+Shift+R`
- **Clear Console**: Type `clear()` or click trash icon
- **Take Screenshot**: DevTools → Device Toolbar → ⋮ menu → Capture screenshot

---

## Cyber-Kiosk Keyboard Shortcuts

### Dashboard
- Click **time** in header → Opens Timer/Alarm modal
- Click **date** in header → Opens Calendar modal
- `ESC` → Closes any open modal

### Browser Console Testing Commands

```javascript
// Check current theme
localStorage.getItem('theme')

// Switch theme manually
themeManager.switchTheme('cyberpunk')  // or 'hiphop' or 'california'

// Check current profile
localStorage.getItem('currentProfile')

// View all profiles
fetch('/profiles').then(r => r.json()).then(console.log)

// Check panel configuration
fetch('/config/panels').then(r => r.json()).then(console.log)

// Force refresh stats
fetch('/stats').then(r => r.json()).then(console.log)

// Test health endpoint
fetch('/health').then(r => r.json()).then(console.log)
```

---

## Common Testing Scenarios

### Test #1: Clean Slate
1. Clear all localStorage: `localStorage.clear()`
2. Hard refresh: `Ctrl+Shift+R`
3. Verify defaults load correctly

### Test #2: Theme Persistence
1. Switch to Hip-Hop theme
2. Close browser completely
3. Reopen to `http://192.168.68.73:3001`
4. Verify Hip-Hop theme is still active

### Test #3: Profile Switching
1. Create profile "Test User" with 😎 emoji
2. Change theme to California
3. Switch back to default profile
4. Verify theme reverted to original
5. Switch to "Test User" again
6. Verify California theme is active

### Test #4: Panel Customization
1. Go to Settings → Panels
2. Disable News panel
3. Save settings
4. Return to dashboard
5. Verify News panel is hidden
6. Refresh page
7. Verify News panel stays hidden

### Test #5: Timer Functionality
1. Click time in header
2. Create 10-second timer
3. Start timer
4. Watch countdown
5. Verify sound plays at 00:00
6. Verify browser notification (if allowed)

### Test #6: Calendar Events
1. Click date in header
2. Create event "Test Meeting" today at 2:00 PM
3. Close modal
4. Verify Calendar widget shows event
5. Refresh page
6. Verify event persists

### Test #7: Responsive Breakpoints
1. Open DevTools responsive mode
2. Test these widths:
   - 375px (iPhone SE)
   - 768px (iPad)
   - 1024px (iPad Pro landscape)
   - 1920px (Desktop)
3. Verify layout changes appropriately

### Test #8: Grid Layout Editor
1. Settings → Panels → Grid Layout
2. Change to 2 rows × 3 columns
3. Place Weather in top-left
4. Place Timer in bottom-right
5. Save
6. Return to dashboard
7. Verify panels match layout

---

## Performance Testing

### Measure Page Load Time
```javascript
// In console:
performance.timing.loadEventEnd - performance.timing.navigationStart
```

### Check Memory Usage
1. Chrome → Task Manager (`Shift+Esc`)
2. Find your tab
3. Note "Memory footprint"
4. Use for 5 minutes
5. Check if memory increased significantly

### Monitor Network Activity
1. Open DevTools → Network tab
2. Hard refresh page
3. Look for:
   - Failed requests (red)
   - Slow requests (> 1 second)
   - Large files (> 1MB)

---

## Simulating Network Conditions

### Chrome DevTools
1. Open DevTools → Network tab
2. Click "No throttling" dropdown
3. Choose:
   - **Fast 3G** - Simulates mobile connection
   - **Slow 3G** - Simulates poor connection
   - **Offline** - Test offline behavior

### Test Offline Behavior
1. Set network to Offline
2. Try to refresh dashboard
3. Observe error handling
4. Switch back to Online
5. Verify auto-recovery

---

## Debugging Tips

### If Page Won't Load
1. Check Console for errors
2. Check Network tab for failed requests
3. Verify server is running: `http://192.168.68.73:3001/health`
4. Check firewall on Pi: `sudo ufw status`

### If Theme Won't Switch
1. Check Console for errors
2. Verify theme file exists: `/css/themes/[themename].css`
3. Check localStorage: `localStorage.getItem('theme')`
4. Try manual switch in console: `themeManager.switchTheme('cyberpunk')`

### If Panels Won't Display
1. Check Console for errors
2. Verify panel enabled: Settings → Panels
3. Check grid layout: Settings → Panels → Grid Layout
4. Verify panel code loaded: Check Network tab for panel file

### If Settings Won't Save
1. Check Console for errors
2. Verify `/config/panels` endpoint: `fetch('/config/panels').then(r => r.json()).then(console.log)`
3. Check Network tab for POST request
4. Look for server errors in terminal running system-monitor.js

---

## Cross-Browser Testing Matrix

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| Dashboard loads | ☐ | ☐ | ☐ |
| Themes work | ☐ | ☐ | ☐ |
| Profiles work | ☐ | ☐ | ☐ |
| Settings save | ☐ | ☐ | ☐ |
| Timers work | ☐ | ☐ | ☐ |
| Calendar works | ☐ | ☐ | ☐ |
| Modals work | ☐ | ☐ | ☐ |
| Responsive layout | ☐ | ☐ | ☐ |

---

## Quick Verification Checklist

Before marking testing complete, verify:

- ✓ No console errors on fresh load
- ✓ All panels display content
- ✓ Theme switching works (all 3 themes)
- ✓ Profile creation/switching works
- ✓ Settings persist after refresh
- ✓ Timer counts down and alerts
- ✓ Calendar events save and display
- ✓ Responsive at 375px, 768px, 1920px
- ✓ Layout editor saves correctly
- ✓ Backend API responds to all endpoints
- ✓ Performance is acceptable (< 3s load)

---

## Contact / Report Issues

If you find critical bugs during testing, document in `TESTING_BUGS.md` and we'll prioritize fixes before moving to Phase 5.

Happy Testing! 🧪
