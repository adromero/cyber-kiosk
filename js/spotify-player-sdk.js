/**
 * SpotifyPlayerSDK - Web Playback SDK Wrapper
 * Encapsulates Spotify Web Playback SDK functionality
 * Provides event-based interface for music panel integration
 */

class SpotifyPlayerSDK extends EventTarget {
    constructor() {
        super();

        // Player instance
        this.player = null;
        this.deviceId = null;
        this.isReady = false;
        this.accessToken = null;

        // Current state
        this.currentState = null;
        this.isActive = false;
    }

    /**
     * Load Spotify Web Playback SDK script
     */
    loadSDK() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.Spotify) {
                console.log('> Spotify SDK already loaded');
                resolve();
                return;
            }

            console.log('> Loading Spotify Web Playback SDK...');

            // Set up the ready callback before loading script
            window.onSpotifyWebPlaybackSDKReady = () => {
                console.log('> Spotify Web Playback SDK ready');
                resolve();
            };

            // Load SDK script
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            script.onerror = () => {
                reject(new Error('Failed to load Spotify SDK script'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Initialize the player
     * @param {string} accessToken - Spotify access token
     * @param {string} deviceName - Name for this player device
     */
    async init(accessToken, deviceName = 'Cyber Kiosk') {
        try {
            this.accessToken = accessToken;

            // Load SDK
            await this.loadSDK();

            // Create player instance
            this.player = new window.Spotify.Player({
                name: deviceName,
                getOAuthToken: cb => {
                    cb(this.accessToken);
                },
                volume: 0.5
            });

            // Set up event listeners
            this.setupEventListeners();

            console.log('> Spotify player initialized');
        } catch (error) {
            console.error('> Error initializing Spotify player:', error);
            throw error;
        }
    }

    /**
     * Set up SDK event listeners
     */
    setupEventListeners() {
        // Ready event
        this.player.addListener('ready', ({ device_id }) => {
            console.log('> Spotify player ready with device ID:', device_id);
            this.deviceId = device_id;
            this.isReady = true;
            this.dispatchEvent(new CustomEvent('ready', {
                detail: { device_id }
            }));
        });

        // Not ready event
        this.player.addListener('not_ready', ({ device_id }) => {
            console.log('> Spotify player offline:', device_id);
            this.isReady = false;
            this.dispatchEvent(new CustomEvent('not_ready', {
                detail: { device_id }
            }));
        });

        // Player state changed
        this.player.addListener('player_state_changed', state => {
            console.log('> Player state changed:', state);
            this.currentState = state;
            this.isActive = state !== null;
            this.dispatchEvent(new CustomEvent('player_state_changed', {
                detail: state
            }));
        });

        // Error handlers
        this.player.addListener('initialization_error', ({ message }) => {
            console.error('> Spotify initialization error:', message);
            this.dispatchEvent(new CustomEvent('initialization_error', {
                detail: { message }
            }));
        });

        this.player.addListener('authentication_error', ({ message }) => {
            console.error('> Spotify authentication error:', message);
            this.dispatchEvent(new CustomEvent('authentication_error', {
                detail: { message }
            }));
        });

        this.player.addListener('account_error', ({ message }) => {
            console.error('> Spotify account error:', message);
            this.dispatchEvent(new CustomEvent('account_error', {
                detail: { message }
            }));
        });

        this.player.addListener('playback_error', ({ message }) => {
            console.error('> Spotify playback error:', message);
            this.dispatchEvent(new CustomEvent('playback_error', {
                detail: { message }
            }));
        });
    }

    /**
     * Connect to Spotify
     */
    async connect() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        const success = await this.player.connect();
        if (success) {
            console.log('> Spotify player connected successfully');
        } else {
            throw new Error('Failed to connect Spotify player');
        }

        return success;
    }

    /**
     * Disconnect from Spotify
     */
    disconnect() {
        if (this.player) {
            this.player.disconnect();
            console.log('> Spotify player disconnected');
        }
    }

    /**
     * Play/resume playback
     * @param {Object} options - Playback options (context_uri, uris, etc.)
     */
    async play(options = {}) {
        if (!this.isReady) {
            throw new Error('Player not ready');
        }

        // If options provided, use Spotify API to start playback
        if (Object.keys(options).length > 0) {
            // Need to use API to start specific content
            const response = await fetch('/spotify/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: this.deviceId,
                    ...options
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start playback');
            }
        } else {
            // Just resume current playback
            await this.player.resume();
        }
    }

    /**
     * Pause playback
     */
    async pause() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        await this.player.pause();
    }

    /**
     * Resume playback
     */
    async resume() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        await this.player.resume();
    }

    /**
     * Toggle play/pause
     */
    async togglePlay() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        await this.player.togglePlay();
    }

    /**
     * Skip to next track
     */
    async nextTrack() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        await this.player.nextTrack();
    }

    /**
     * Skip to previous track
     */
    async previousTrack() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        await this.player.previousTrack();
    }

    /**
     * Seek to position
     * @param {number} positionMs - Position in milliseconds
     */
    async seek(positionMs) {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        await this.player.seek(positionMs);
    }

    /**
     * Set volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    async setVolume(volume) {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        await this.player.setVolume(volume);
    }

    /**
     * Get current volume
     */
    async getVolume() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        return await this.player.getVolume();
    }

    /**
     * Get current player state
     */
    async getCurrentState() {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        return await this.player.getCurrentState();
    }

    /**
     * Get device ID
     */
    getDeviceId() {
        return this.deviceId;
    }

    /**
     * Check if player is ready
     */
    isPlayerReady() {
        return this.isReady;
    }

    /**
     * Update access token (for token refresh)
     * @param {string} newToken - New access token
     */
    updateToken(newToken) {
        this.accessToken = newToken;
        console.log('> Spotify SDK token updated');
    }
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpotifyPlayerSDK;
}
