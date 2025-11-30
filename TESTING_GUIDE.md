# Cyber-Kiosk Testing Guide

## Network Access Setup

### On Your Raspberry Pi (Server)

**Server Status:**
- ✅ Server is running on port 3001
- ✅ Listening on all interfaces (accessible from network)
- 🌐 Local IP: `192.168.68.73`
- 🔗 Tailscale IP: `100.81.117.18`

**Access URLs:**
- **Local Network**: `http://192.168.68.73:3001`
- **Tailscale VPN**: `http://100.81.117.18:3001`

### On Your Laptop (Client)

1. **Ensure you're on the same network** as the Pi
   - Connect to the same WiFi network
   - OR use Tailscale for remote access

2. **Open browser and navigate to:**
   - `http://192.168.68.73:3001` (local network)
   - OR `http://100.81.117.18:3001` (Tailscale)

3. **If connection fails**, check firewall:
   ```bash
   # On the Pi, check if firewall is blocking
   sudo ufw status
   # If active and blocking, allow port 3001:
   sudo ufw allow 3001/tcp
   ```

---

## Comprehensive Testing Checklist

### ✅ Phase 1: Basic Connectivity

- [ ] Can access `http://192.168.68.73:3001` from laptop
- [ ] Dashboard loads without errors
- [ ] Check browser console for errors (F12 → Console)
- [ ] All CSS and JS files load successfully (F12 → Network)

### ✅ Phase 2: Layout & Responsiveness

- [ ] **Desktop View (1920x1080)**
  - [ ] Grid layout displays correctly (3 columns recommended)
  - [ ] All panels visible and proportional
  - [ ] Header shows time, date, profile switcher
  - [ ] No overlapping elements

- [ ] **Tablet View (768px wide)**
  - [ ] Grid adjusts to 2 columns
  - [ ] Panels reflow correctly
  - [ ] Touch-friendly button sizes

- [ ] **Mobile View (375px wide)**
  - [ ] Single column layout
  - [ ] Vertical scrolling works
  - [ ] Profile switcher hides name (emoji only)

**How to test**: Use browser DevTools (F12 → Toggle Device Toolbar)

### ✅ Phase 3: Panel Functionality

#### Weather Panel
- [ ] Displays current temperature
- [ ] Shows weather condition icon/description
- [ ] Location shown correctly
- [ ] Data refreshes (check timestamp)

#### News Panel
- [ ] Headlines load
- [ ] Scrolling works smoothly
- [ ] Links are clickable (if applicable)
- [ ] Auto-refresh works

#### Markets Panel
- [ ] Stock data displays
- [ ] Price changes show colors (green/red)
- [ ] Updates at refresh interval

#### Timer Panel
- [ ] Click header "time" to open timer modal
- [ ] Can create new timer with custom duration
- [ ] Quick preset buttons work (5m, 15m, 30m, 1hr)
- [ ] Timer counts down correctly
- [ ] Pause/Resume buttons work
- [ ] Stop button works
- [ ] Timer completion plays sound alert
- [ ] Can create alarms with time picker
- [ ] Alarms can be enabled/disabled
- [ ] Alarms trigger at correct time
- [ ] Multiple timers can run simultaneously
- [ ] Timers persist after page reload (localStorage)

#### Calendar Panel
- [ ] Click header "date" to open calendar modal
- [ ] Month view navigation works (prev/next)
- [ ] Can create events (all 5 types: reminder, meeting, task, birthday, other)
- [ ] Events display on correct dates
- [ ] Can delete events
- [ ] Widget shows today's events (day view)
- [ ] Widget navigation arrows work (prev/next day)
- [ ] "Jump to Today" button works
- [ ] Click widget header opens full calendar modal
- [ ] Events persist after page reload (localStorage)

#### Video Panel
- [ ] Thumbnail rotates every 30 seconds
- [ ] Click thumbnail opens modal
- [ ] YouTube video plays in modal
- [ ] Video selector list shows all videos
- [ ] Can switch videos
- [ ] ESC key closes modal
- [ ] Modal overlay closes on click

#### System Panel
- [ ] Widget shows CPU temp, usage stats
- [ ] Color coding works (green < 60%, amber 60-80%, red > 80%)
- [ ] Click widget opens detailed modal
- [ ] Modal shows all stats (CPU, GPU, Memory, Disk, Uptime, Load)
- [ ] Refresh button updates stats
- [ ] Auto-refreshes every 15 seconds
- [ ] ESC key closes modal

#### Music Panel (Spotify)
- [ ] Shows "Connect Spotify" if not connected
- [ ] OAuth flow works (if you test connection)
- [ ] Shows current track (if connected)
- [ ] Playback controls work (if connected)

### ✅ Phase 4: Theme System

- [ ] **Test Cyberpunk Theme**
  - [ ] Neon cyan/magenta/amber colors
  - [ ] CRT scanline effects visible
  - [ ] VT323 monospace font
  - [ ] Panel borders glow on hover
  - [ ] Loading animations work

- [ ] **Test Hip-Hop Theme**
  - [ ] Purple gradient background
  - [ ] Gold/orange/purple color scheme
  - [ ] Lilita One bubble font for headers
  - [ ] Graffiti drip separators visible
  - [ ] Boombox speaker grille patterns
  - [ ] Boom-bap bounce animations

- [ ] **Test California Theme**
  - [ ] Sunset orange/blue colors
  - [ ] Light background (sand/sunlight)
  - [ ] Pacifico cursive font
  - [ ] Beach/surf aesthetic
  - [ ] Smooth fade transitions

- [ ] **Theme Switching**
  - [ ] Settings → Theme tab shows all 3 themes
  - [ ] Theme preview cards display correctly
  - [ ] Click theme card switches immediately
  - [ ] Theme persists after page reload
  - [ ] Profile switcher changes theme when switching profiles

### ✅ Phase 5: User Profiles

- [ ] **Profile Switcher (Dashboard Header)**
  - [ ] Button shows current profile emoji + name
  - [ ] Click opens dropdown menu
  - [ ] Dropdown shows all profiles
  - [ ] Active profile has visual indicator
  - [ ] Can switch profiles from dropdown
  - [ ] "Manage Profiles" link goes to settings

- [ ] **Profile Management (Settings Page)**
  - [ ] Settings → Profiles tab loads
  - [ ] Current profile banner shows correctly
  - [ ] Profile list shows all profiles
  - [ ] Timestamps are relative ("Just now", "2 min ago")
  - [ ] Can create new profile (prompts for name + emoji)
  - [ ] Can switch profiles (SWITCH button)
  - [ ] Can edit profile (EDIT button)
  - [ ] Can delete profile (DELETE button with confirmation)
  - [ ] Profile list refreshes on changes

- [ ] **Profile Persistence**
  - [ ] Switching profile changes theme
  - [ ] Switching profile changes panel layout
  - [ ] Switching profile changes settings (CRT effects, animations, etc.)
  - [ ] Current profile persists after page reload
  - [ ] Profile data survives server restart

- [ ] **Backend API**
  - [ ] GET `/profiles` returns all profiles
  - [ ] POST `/profiles` creates new profile
  - [ ] GET `/profiles/:id` returns specific profile
  - [ ] PUT `/profiles/:id` updates profile
  - [ ] DELETE `/profiles/:id` deletes profile
  - [ ] Profile JSON files created in `config/profiles/`

### ✅ Phase 6: Settings Page

- [ ] Navigate to settings (gear icon in header)
- [ ] All 5 tabs visible: Profiles, Theme, Panels, Display, About

- [ ] **Profiles Tab**
  - [ ] (Tested above in Profile Management)

- [ ] **Theme Tab**
  - [ ] 3 theme preview cards
  - [ ] Theme selection works
  - [ ] Preview accurately represents theme

- [ ] **Panels Tab**
  - [ ] Toggle switches for all 8 panels
  - [ ] Panel enable/disable works
  - [ ] Grid layout editor displays
  - [ ] Can change grid dimensions (rows/cols)
  - [ ] Can place panels by clicking grid cells
  - [ ] Can drag panels to move them
  - [ ] Can resize panels
  - [ ] Preview matches actual layout

- [ ] **Display Tab**
  - [ ] CRT Effects toggle works
  - [ ] Animations toggle works
  - [ ] Font size slider changes text size
  - [ ] Refresh interval updates correctly

- [ ] **About Tab**
  - [ ] Shows version info
  - [ ] Shows system stats
  - [ ] Links work (if any)

- [ ] **Settings Persistence**
  - [ ] Click "Save Settings" saves all changes
  - [ ] Settings persist after page reload
  - [ ] "Reset to Defaults" restores original settings
  - [ ] Unsaved changes warning shows if navigating away

### ✅ Phase 7: Performance

- [ ] **Page Load**
  - [ ] Initial load < 3 seconds
  - [ ] No console errors
  - [ ] All resources load successfully

- [ ] **Responsiveness**
  - [ ] UI feels snappy (no lag)
  - [ ] Animations run at 60fps
  - [ ] No janky scrolling
  - [ ] Panel updates don't freeze UI

- [ ] **Memory Usage**
  - [ ] Browser memory stays reasonable (< 500MB)
  - [ ] No memory leaks after extended use
  - [ ] Check with browser Task Manager (Shift+Esc in Chrome)

### ✅ Phase 8: Cross-Browser Testing

- [ ] **Chrome/Chromium**
  - [ ] All features work
  - [ ] No console errors

- [ ] **Firefox**
  - [ ] All features work
  - [ ] No console errors
  - [ ] Check for browser-specific CSS issues

- [ ] **Safari (if available)**
  - [ ] All features work
  - [ ] No console errors

### ✅ Phase 9: Mobile Testing (Optional)

- [ ] Open on mobile browser (`http://192.168.68.73:3001`)
- [ ] Layout adapts to small screen
- [ ] Touch interactions work
- [ ] Modals are usable
- [ ] Text is readable without zooming

---

## Bug Report Template

When you find issues, document them like this:

```markdown
### Bug #1: [Short Description]

**Severity**: Critical / High / Medium / Low
**Browser**: Chrome 120 / Firefox 121 / Safari 17
**Screen Size**: 1920x1080 / 768px / 375px

**Steps to Reproduce**:
1. Navigate to settings
2. Click Theme tab
3. Select Hip-Hop theme
4. ...

**Expected Behavior**: Theme should switch immediately

**Actual Behavior**: Page freezes for 5 seconds

**Console Errors**:
```
TypeError: Cannot read property 'apply' of undefined
  at ThemeManager.js:45
```

**Screenshots**: (if applicable)
```

---

## Performance Benchmarks

Document these metrics:

- **Initial Page Load**: _____ seconds
- **Theme Switch Time**: _____ seconds
- **Settings Save Time**: _____ seconds
- **Profile Switch Time**: _____ seconds
- **API Response Time** (weather/news/stats): _____ ms

---

## Known Issues (Pre-Testing)

Document any known issues before testing:

1. **Timer panel pause/stop buttons** - May have event delegation issues (Session 4 notes)
2. **Spotify integration** - Requires OAuth setup (may not be configured)
3. **Music panel** - Will show "Connect Spotify" if no credentials

---

## Testing Completion Checklist

- [ ] All basic connectivity tests pass
- [ ] All panel functionality tests pass
- [ ] All theme tests pass
- [ ] All profile tests pass
- [ ] All settings tests pass
- [ ] Performance is acceptable
- [ ] Cross-browser tests pass
- [ ] All bugs documented
- [ ] Ready for Phase 5 (Install & Migration)

---

## Next Steps After Testing

1. Review all bugs found
2. Prioritize fixes (critical first)
3. Fix any blockers
4. Retest fixes
5. Update progress.json with test results
6. Proceed to Phase 4.7 (API Key Settings) or Phase 5 (Install & Migration)
