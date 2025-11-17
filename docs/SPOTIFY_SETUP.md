# Spotify Integration Setup Guide

This guide will help you set up Spotify integration for the Cyber Kiosk music panel.

## Overview

The music panel uses Spotify's Web API with OAuth 2.0 authentication to:
- Display currently playing track with album art
- Control playback (play/pause/next/previous)
- View playlists and recently played tracks
- Monitor available playback devices

## Prerequisites

- A Spotify account (free or premium)
- Node.js and npm installed
- Cyber Kiosk system monitor running on port 3001

## Step 1: Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create app"**
4. Fill in the app details:
   - **App name**: `Cyber Kiosk` (or any name you prefer)
   - **App description**: `Music player for Raspberry Pi kiosk`
   - **Redirect URI**: `http://localhost:3001/spotify/callback`
   - **API used**: Select "Web API"
5. Accept the Terms of Service
6. Click **"Save"**

## Step 2: Get Your Credentials

1. In your newly created app's dashboard, click **"Settings"**
2. You'll see:
   - **Client ID** - Copy this
   - **Client Secret** - Click "View client secret" and copy it

**IMPORTANT**: Keep your Client Secret private! Never commit it to version control.

## Step 3: Configure the Kiosk

1. Open or create the `.env` file in your cyber-kiosk directory:
   ```bash
   cd /home/alfon/Projects/cyber-kiosk
   nano .env
   ```

2. Add your Spotify credentials:
   ```bash
   # Spotify OAuth Credentials
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   SPOTIFY_REDIRECT_URI=http://localhost:3001/spotify/callback
   ```

3. Save the file (Ctrl+O, Enter, Ctrl+X in nano)

## Step 4: Restart the System Monitor

Restart the system monitor to load the new credentials:

```bash
# If running manually:
pkill -f system-monitor.js
npm start

# If running as a service:
sudo systemctl restart cyber-kiosk-monitor
```

## Step 5: Connect Your Spotify Account

1. Open the Cyber Kiosk in your browser:
   ```
   http://localhost:3001
   ```

2. Find the **SPOTIFY** panel on the dashboard

3. Click **"CONNECT_SPOTIFY"** button

4. The browser will navigate to Spotify's authorization page

5. Log in to Spotify (if not already logged in) and click **"Agree"** to authorize the app

6. You'll be automatically redirected back to the kiosk, now connected to Spotify!

## Using the Music Panel

### Main Panel (Compact View)
- **Album Art**: Shows currently playing track's album cover
- **Play/Pause**: Center button to control playback
- **Previous/Next**: Skip tracks
- **Track Info**: Displays song and artist name

### Modal View (Click panel to expand)
- **PLAYER Tab**: Full playback controls with progress bar
- **PLAYLISTS Tab**: Browse your Spotify playlists
- **RECENT Tab**: View recently played tracks
- **DISCONNECT**: Log out of Spotify

## Troubleshooting

### "NOT_CONNECTED" status
- Check that your Spotify credentials are correct in `.env`
- Restart the system monitor
- Try connecting again

### "Spotify credentials not configured"
- Make sure you've added `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env`
- Verify there are no extra spaces or quotes around the values

### Playback controls don't work
- Make sure you have an active Spotify playback session
- Open Spotify on your phone/computer and start playing music
- The kiosk can only control active playback, not start playback from scratch

### "Authentication rejected" errors
- Your tokens may have expired
- Click DISCONNECT in the modal, then reconnect
- Check that your redirect URI matches exactly: `http://localhost:3001/spotify/callback`

### Can't control playback on specific device
- The music panel controls whatever device is currently active in Spotify
- To control a specific device, start playback on that device first
- Premium users can transfer playback between devices

## API Rate Limits

Spotify's Web API has rate limits:
- The kiosk updates every 5 seconds (panel view)
- Modal view updates every 2 seconds when open
- These intervals are conservative and shouldn't hit rate limits

## Notes

- **Spotify Premium**: Not required! Free accounts can use the API
- **Playback Control**: Free users can only control Spotify Connect devices (like Spotify on your phone)
- **Token Storage**: Tokens are stored securely in `.spotify_tokens.json` (git-ignored)
- **Token Refresh**: Access tokens auto-refresh every hour using your refresh token

## Security

- Never share your Client Secret
- `.spotify_tokens.json` is automatically git-ignored
- Tokens are stored locally and never sent to external services
- The kiosk only requests the minimum required Spotify scopes

## Uninstalling

To remove Spotify integration:

1. Click DISCONNECT in the music panel modal
2. Remove credentials from `.env`:
   ```bash
   # Remove or comment out these lines:
   # SPOTIFY_CLIENT_ID=...
   # SPOTIFY_CLIENT_SECRET=...
   # SPOTIFY_REDIRECT_URI=...
   ```
3. Delete token file:
   ```bash
   rm .spotify_tokens.json
   ```
4. Restart system monitor

## Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify OAuth Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

---

**Enjoy your music! 🎵**
