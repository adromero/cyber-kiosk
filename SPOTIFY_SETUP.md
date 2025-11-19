# Spotify Integration Setup Guide

## Quick Overview

Your kiosk now uses **Spotify OAuth with PKCE** (Proof Key for Code Exchange), which means:
- ✅ **NO client secret needed** - more secure for your Raspberry Pi
- ✅ **One-time setup** - about 2 minutes
- ✅ **No username/password in code** - OAuth handles authentication securely

## Why OAuth Instead of Username/Password?

Spotify **does not support** username/password authentication via their API. OAuth is the **only way** to:
- Control playback (play/pause/skip)
- Access your playlists and library
- Get currently playing track
- View recently played tracks

## Setup Steps

### 1. Create a Spotify App (30 seconds)

1. Go to: https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click **"Create app"**
4. Fill in:
   - **App name**: `Cyber Kiosk` (or whatever you want)
   - **App description**: `Home dashboard music controller`
   - **Redirect URI**: `http://192.168.68.73:3001/spotify/callback`
     - Note: Spotify no longer allows localhost - use your Pi's local IP
     - Also add: `http://100.81.117.18:3001/spotify/callback` (your Tailscale IP)
   - **Which API/SDKs are you planning to use?**: Select **"Web API"**
5. Click **Save**

### 2. Get Your Client ID (10 seconds)

1. Click on your newly created app
2. Click **"Settings"**
3. Copy the **Client ID** (long string of letters/numbers)

### 3. Add to Your Kiosk (30 seconds)

1. Edit `/home/alfon/Projects/cyber-kiosk/.env`
2. Find the line: `# SPOTIFY_CLIENT_ID=your_spotify_client_id_here`
3. Uncomment it and paste your Client ID:
   ```
   SPOTIFY_CLIENT_ID=abc123yourActualClientIdHere456
   ```
4. Save the file

### 4. Restart the Kiosk

```bash
pkill -f system-monitor.js
node system-monitor.js &
```

Or restart the whole kiosk interface.

### 5. Connect Spotify (in the kiosk UI)

1. Open the kiosk in your browser: `http://localhost:3001`
2. Click on the **Music panel** (Panel 5)
3. Click **"CONNECT_SPOTIFY"**
4. You'll be redirected to Spotify's login page
5. Log in and click **"Agree"** to authorize the app
6. You'll be redirected back to your kiosk - done!

## What Happens During OAuth?

1. **You click "CONNECT_SPOTIFY"** → Kiosk generates a secure PKCE code
2. **Spotify login page** → You authorize the app to access your account
3. **Redirect back** → Spotify sends an authorization code
4. **Token exchange** → Kiosk exchanges code + PKCE verifier for access token
5. **Done!** → Kiosk can now control your Spotify playback

## Security Notes

- **PKCE** means no client secret is stored on your Pi (more secure)
- Tokens are saved to `.spotify_tokens.json` (automatically refreshed)
- Only works on localhost - your tokens stay on your network
- To revoke access: Go to spotify.com/account/apps and remove "Cyber Kiosk"

## Troubleshooting

**"Spotify Client ID not configured"**
- Make sure you added `SPOTIFY_CLIENT_ID` to `.env` file
- Restart the server after editing `.env`

**"Invalid redirect URI" or "INVALID_CLIENT: Invalid redirect URI"**
- Make sure you added BOTH redirect URIs in Spotify Developer Dashboard:
  - `http://192.168.68.73:3001/spotify/callback` (local network)
  - `http://100.81.117.18:3001/spotify/callback` (Tailscale VPN)
- The redirect URI must **exactly match** how you access the kiosk
- If accessing via local IP: Use `http://192.168.68.73:3001`
- If accessing via Tailscale: Use `http://100.81.117.18:3001`
- Port must match (default is 3001)
- Note: Spotify no longer accepts `localhost` redirect URIs

**"Session expired"**
- The PKCE code expires quickly - just click "CONNECT_SPOTIFY" again

**"Not authenticated"**
- Your token may have expired - click "DISCONNECT" then reconnect

**Need to access from the Pi's touchscreen?**
- Since Spotify doesn't allow localhost, you'll need to access via:
  - `http://192.168.68.73:3001` (use the Pi's local IP instead of localhost)

## What Can You Do With It?

Once connected:
- **Main panel**: See currently playing track, play/pause/skip
- **Modal view**: Click panel for full interface with:
  - Full playback controls
  - Your playlists (coming soon: click to play)
  - Recently played tracks
  - Active devices
  - Disconnect option

## Technical Details

**Authentication Flow**: OAuth 2.0 Authorization Code Flow with PKCE
**Token Storage**: `.spotify_tokens.json` (local file)
**Token Refresh**: Automatic (tokens refresh before expiring)
**Scopes Requested**:
- `user-read-playback-state` - See what's playing
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - Current track info
- `playlist-read-private` - Your private playlists
- `playlist-read-collaborative` - Collaborative playlists
- `user-library-read` - Your saved tracks
- `user-top-read` - Your top artists/tracks
- `user-read-recently-played` - Recently played

## Files Modified

- `system-monitor.js` - PKCE implementation
- `.env` - Spotify configuration
- `js/panels/music-panel.js` - Frontend (no changes needed)
