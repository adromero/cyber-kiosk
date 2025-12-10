# NETWORK SHIELD PROJECT

> **STATUS: IMPLEMENTED** - This feature has been fully implemented in the codebase. See `system-monitor.js` for backend and `js/app.js` for frontend modal.

## Overview

Integration of Pi-hole network-wide ad blocker with the Cyber Kiosk dashboard. This document outlines the phased approach to adding network monitoring and ad-blocking capabilities.

## Project Goals

1. Install and configure Pi-hole on the Raspberry Pi
2. Enable per-device ad-blocking (manual DNS configuration)
3. Integrate Pi-hole stats into cyber-kiosk dashboard via clickable "CONNECTION:SECURE" footer
4. Add enhanced network/bandwidth monitoring via clickable "STATUS:ONLINE" footer
5. Maintain cyberpunk aesthetic and modal-based UI pattern

## Architecture

```
┌─────────────────────────────────────────┐
│     Cyber Kiosk Dashboard (Port 3000)   │
│  ┌─────────────────────────────────┐    │
│  │  CONNECTION:SECURE  →  Pi-hole  │    │
│  │  STATUS:ONLINE  →  Net Monitor  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  System Monitor Backend (Port 3001)     │
│  - Existing: CPU, Memory, Disk, Uptime  │
│  - New: Pi-hole API, Network Stats      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Pi-hole (Port 80, DNS Port 53)         │
│  - Admin dashboard at /admin            │
│  - API at /admin/api.php                │
│  - DNS resolver on port 53              │
└─────────────────────────────────────────┐
```

---

## PHASE 1: Pi-hole Installation & Testing

### Step 1.1: Install Pi-hole

```bash
# One-step automated install
curl -sSL https://install.pi-hole.net | bash
```

**Installation Options:**
- Select interface: Choose your primary network interface (likely `eth0` or `wlan0`)
- Upstream DNS: Choose any (Cloudflare, Google, OpenDNS) - you can change later
- Blocklists: Accept default blocklists
- Admin interface: YES
- Web server: YES (lighttpd)
- Logging: YES
- Privacy mode: Show everything (for testing)

**Note:** Save the admin password shown at the end of installation!

**Find your Pi's IP address:**
```bash
hostname -I
```

### Step 1.2: Access Pi-hole Dashboard

Navigate to: `http://<PI_IP_ADDRESS>/admin`

Example: `http://192.168.1.100/admin`

Default stats should show zero queries until devices are configured.

### Step 1.3: Configure Test Device (Per-Device DNS)

Choose ONE device for initial testing:

**iPhone/iPad:**
1. Settings → Wi-Fi
2. Tap (i) next to your network name
3. Scroll to DNS → Configure DNS
4. Switch from Automatic to Manual
5. Remove existing DNS servers
6. Add Server: `<PI_IP_ADDRESS>`
7. Save

**Android:**
1. Settings → Wi-Fi
2. Long-press your network → Modify Network
3. Advanced Options → IP Settings → Static
4. DNS 1: `<PI_IP_ADDRESS>`
5. DNS 2: Leave blank or use 8.8.8.8 as backup
6. Save

**macOS:**
1. System Preferences → Network
2. Select your connection → Advanced
3. DNS tab
4. Click + and add: `<PI_IP_ADDRESS>`
5. OK → Apply

**Windows:**
1. Settings → Network & Internet
2. Change adapter options → Right-click connection → Properties
3. Internet Protocol Version 4 (TCP/IPv4) → Properties
4. Use the following DNS server addresses
5. Preferred DNS: `<PI_IP_ADDRESS>`
6. OK

**Linux:**
1. Network settings → Edit connection
2. IPv4 Settings → DNS servers
3. Add: `<PI_IP_ADDRESS>`
4. Save

### Step 1.4: Test Ad Blocking

**Quick Tests:**
1. Visit: `http://pi.hole/admin` - should load Pi-hole dashboard
2. Visit: `https://ads-blocker.com/testing/` - test ad blocking
3. Browse normal sites (Reddit, news sites, YouTube)
4. Check Pi-hole dashboard for query statistics

**Validation Checklist:**
- [ ] Regular websites load normally
- [ ] Ads are blocked on test sites
- [ ] Pi-hole dashboard shows queries being logged
- [ ] No broken websites (banking, shopping, etc.)
- [ ] Mobile apps work correctly

**Troubleshooting:**
- If nothing works: Verify Pi's IP address hasn't changed
- If some sites break: Check Pi-hole whitelist, may need to whitelist specific domains
- If slow: Check Pi-hole logs for errors, restart DNS service

---

## PHASE 2: Dashboard Integration - CONNECTION:SECURE

### Step 2.1: Update Backend (system-monitor.js)

Add new endpoint to query Pi-hole API:

```javascript
// New Pi-hole stats endpoint
app.get('/api/pihole', async (req, res) => {
  try {
    const response = await fetch('http://localhost/admin/api.php?summary');
    const data = await response.json();

    res.json({
      status: 'active',
      queries_today: data.dns_queries_today,
      blocked_today: data.ads_blocked_today,
      percent_blocked: data.ads_percentage_today,
      domains_blocked: data.domains_being_blocked,
      queries_cached: data.queries_cached,
      clients: data.unique_clients,
      gravity_last_updated: data.gravity_last_updated
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});
```

**Pi-hole API Endpoints Available:**
- `/admin/api.php?summary` - Dashboard summary stats
- `/admin/api.php?topItems` - Top blocked/allowed domains
- `/admin/api.php?recentBlocked` - Recently blocked queries
- `/admin/api.php?overTimeData10mins` - Historical data for graphs

### Step 2.2: Update Frontend (index.html)

Make footer "CONNECTION:SECURE" clickable:

```javascript
// Add to existing JavaScript
document.querySelector('#connection-status').addEventListener('click', () => {
  openPiholeModal();
});

async function openPiholeModal() {
  const response = await fetch('http://localhost:3001/api/pihole');
  const data = await response.json();

  const content = `
    <div class="modal-section">
      <div class="stat-line">QUERIES TODAY: ${data.queries_today.toLocaleString()}</div>
      <div class="stat-line">BLOCKED TODAY: ${data.blocked_today.toLocaleString()}</div>
      <div class="stat-line">PERCENT BLOCKED: ${data.percent_blocked.toFixed(2)}%</div>
      <div class="stat-line">DOMAINS ON BLOCKLIST: ${data.domains_blocked.toLocaleString()}</div>
      <div class="stat-line">ACTIVE CLIENTS: ${data.clients}</div>
    </div>
  `;

  openModal('NETWORK SHIELD', content);
}
```

Update footer HTML to add ID:

```html
<span id="connection-status" style="cursor: pointer;">CONNECTION:SECURE</span>
```

---

## PHASE 3: Enhanced Network Monitoring - STATUS:ONLINE

### Step 3.1: Install vnStat (Bandwidth Tracking)

```bash
sudo apt-get update
sudo apt-get install vnstat
sudo systemctl enable vnstat
sudo systemctl start vnstat

# Initialize interface monitoring
sudo vnstat -i eth0
# or for WiFi:
sudo vnstat -i wlan0
```

Wait ~5 minutes for initial data collection.

**Test vnStat:**
```bash
vnstat -h  # Hourly stats
vnstat -d  # Daily stats
vnstat -m  # Monthly stats
```

### Step 3.2: Update Backend for Network Stats

Add new endpoint:

```javascript
app.get('/api/network', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    // Get vnStat data
    const { stdout: vnstatOutput } = await execPromise('vnstat --json');
    const vnstat = JSON.parse(vnstatOutput);

    // Get current network stats
    const { stdout: ifconfigOutput } = await execPromise('ifconfig');

    // Get active connections
    const { stdout: connectionsOutput } = await execPromise('ss -s');

    res.json({
      status: 'online',
      bandwidth: {
        today_rx: vnstat.interfaces[0].traffic.day[0].rx,
        today_tx: vnstat.interfaces[0].traffic.day[0].tx,
        month_rx: vnstat.interfaces[0].traffic.month[0].rx,
        month_tx: vnstat.interfaces[0].traffic.month[0].tx
      },
      connections: connectionsOutput,
      interface: ifconfigOutput
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});
```

### Step 3.3: Update Frontend for Network Modal

```javascript
document.querySelector('#network-status').addEventListener('click', () => {
  openNetworkModal();
});

async function openNetworkModal() {
  const response = await fetch('http://localhost:3001/api/network');
  const data = await response.json();

  const content = `
    <div class="modal-section">
      <h3>BANDWIDTH (TODAY)</h3>
      <div class="stat-line">RECEIVED: ${formatBytes(data.bandwidth.today_rx)}</div>
      <div class="stat-line">TRANSMITTED: ${formatBytes(data.bandwidth.today_tx)}</div>

      <h3>BANDWIDTH (THIS MONTH)</h3>
      <div class="stat-line">RECEIVED: ${formatBytes(data.bandwidth.month_rx)}</div>
      <div class="stat-line">TRANSMITTED: ${formatBytes(data.bandwidth.month_tx)}</div>

      <h3>CONNECTION STATUS</h3>
      <div class="stat-line">STATUS: ${data.status.toUpperCase()}</div>
      <pre>${data.connections}</pre>
    </div>
  `;

  openModal('NETWORK MONITOR', content);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

---

## PHASE 4: Expansion & Polish

### Option 4.1: Add More Devices

Once testing is successful on one device, expand to others using the same per-device DNS configuration.

**Tracking:**
- [ ] Primary phone
- [ ] Primary laptop
- [ ] Secondary devices
- [ ] Smart TV / streaming devices
- [ ] Guest devices (optional)

### Option 4.2: Network-Wide Deployment

If per-device configuration becomes tedious, switch to router-level DNS:

**Router Configuration:**
1. Access router admin panel (usually 192.168.1.1 or 192.168.0.1)
2. Find DNS settings (usually under DHCP or WAN settings)
3. Set Primary DNS: `<PI_IP_ADDRESS>`
4. Set Secondary DNS: `8.8.8.8` (fallback)
5. Save and reboot router

All devices will now automatically use Pi-hole.

### Option 4.3: Tailscale Integration

Enable ad-blocking when away from home:

1. Enable MagicDNS in Tailscale admin console
2. Add custom nameserver: `<PI_TAILSCALE_IP>`
3. Configure Pi-hole to accept queries from tailnet subnet

### Option 4.4: Dashboard Enhancements

**Visual Improvements:**
- Add CRT scanline effects to Pi-hole modal
- Animated glitch effects when blocking ads
- Real-time query counter with retro 7-segment display style
- "THREAT NEUTRALIZED" banner when ads are blocked

**Additional Data:**
- Top blocked domains (last hour)
- Top allowed domains (last hour)
- Query type breakdown (A, AAAA, PTR, etc.)
- Client activity list
- Real-time query log (scrolling terminal style)

**Charts & Graphs:**
- Historical query graph (Chart.js line chart)
- Blocked vs allowed ratio (pie chart)
- Hourly query distribution
- Bandwidth usage over time

---

## Maintenance & Troubleshooting

### Regular Maintenance

**Update Pi-hole:**
```bash
pihole -up
```

**Update blocklists:**
```bash
pihole -g
```

**Check status:**
```bash
pihole status
```

**Restart DNS:**
```bash
pihole restartdns
```

### Common Issues

**Issue: Pi-hole not blocking ads**
- Check device DNS is set correctly: `nslookup pi.hole`
- Verify Pi-hole is running: `pihole status`
- Check blocklists are updated: Pi-hole admin → Tools → Update Gravity

**Issue: Legitimate sites broken**
- Add to whitelist: Pi-hole admin → Whitelist → Add domain
- Common whitelists needed: analytics.google.com, facebook.com pixel

**Issue: Pi-hole dashboard not accessible**
- Restart lighttpd: `sudo systemctl restart lighttpd`
- Check logs: `sudo tail -f /var/log/lighttpd/error.log`

**Issue: DNS queries slow**
- Check upstream DNS performance: Pi-hole admin → Settings → DNS
- Consider switching to Cloudflare (1.1.1.1) or Google (8.8.8.8)
- Increase cache size: Edit `/etc/dnsmasq.d/01-pihole.conf`

### Performance Considerations

- Pi-hole is very lightweight (typically <100MB RAM)
- DNS queries add ~1-5ms latency (negligible)
- Web dashboard accessible at all times
- Monitor system resources via existing SYS_STATUS widget

---

## Security Notes

- Pi-hole admin dashboard accessible on local network only (default)
- Change default admin password: `pihole -a -p`
- Keep Pi-hole updated for security patches
- Monitor query logs for unusual activity
- Consider enabling DNSSEC: Pi-hole admin → Settings → DNS → DNSSEC

---

## Future Ideas

- [ ] Integration with Tailscale for remote ad-blocking
- [ ] Custom blocklists for specific threat categories
- [ ] Automated reports (daily/weekly stats)
- [ ] Telegram/Discord bot for query notifications
- [ ] Machine learning for anomaly detection in DNS queries
- [ ] Integration with other cyberdeck projects
- [ ] Custom "threat levels" based on blocked query frequency
- [ ] Geolocation visualization of blocked domains

---

## Resources

**Official Documentation:**
- Pi-hole: https://docs.pi-hole.net/
- Pi-hole API: https://discourse.pi-hole.net/t/pi-hole-api/1863
- vnStat: https://humdi.net/vnstat/

**Community Blocklists:**
- https://firebog.net/ (curated lists)
- https://github.com/mmotti/pihole-regex (regex blocking)

**Tailscale + Pi-hole:**
- https://tailscale.com/kb/1114/pi-hole/

---

**STATUS:** ✅ IMPLEMENTED (Dec 2024)
**AESTHETIC:** Neuromancer-inspired cyberpunk terminal
**INTERFACE:** Modal-based expansion system
**TARGET:** Network-wide ad blocking + dashboard integration

## Implementation Notes

The feature has been implemented with the following:

- **Backend**: `system-monitor.js` - `/pihole` and `/network` endpoints
- **Frontend**: `js/app.js` - `showPiholeModal()` and `showNetworkModal()` functions
- **Config**: `.env` variables `PIHOLE_API_URL` and `PIHOLE_PASSWORD`
- **Pi-hole v6 API**: Full authentication flow with session tokens
- **Remote server support**: Connects to Pi-hole on separate machine (Tailscale network)
