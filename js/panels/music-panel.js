/**
 * MusicPanel - Spotify music player panel
 * Extends BasePanel to provide music playback control via Spotify API
 */

class MusicPanel extends BasePanel {
    constructor(config) {
        super(config);

        // Music state
        this.currentTrack = null;
        this.isPlaying = false;
        this.isAuthenticated = false;
        this.playlists = [];
        this.recentTracks = [];
        this.devices = [];

        // Update intervals
        this.updateInterval = 5000; // 5 seconds
        this.modalUpdateInterval = 2000; // 2 seconds when modal is open

        // Modal state
        this.isModalOpen = false;
        this.currentModalTab = 'player'; // player, playlists, recent
    }

    /**
     * Initialize the music panel
     */
    async onInit() {
        this.log('Initializing music panel');

        // Check authentication status
        await this.checkAuthStatus();

        // Check if we just returned from Spotify OAuth
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('spotify_error')) {
            this.log('Spotify authorization was denied', 'warn');
            // Clear the URL parameter
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Render initial UI
        this.render();

        // Set up event handlers
        this.setupEventHandlers();

        // Start update loop
        if (this.isAuthenticated) {
            await this.updateCurrentTrack();
            this.setInterval('update', () => this.updateCurrentTrack(), this.updateInterval);
        }

        this.log('Music panel initialized');
    }

    /**
     * Check Spotify authentication status
     */
    async checkAuthStatus() {
        try {
            const response = await fetch('/spotify/status');
            const data = await response.json();
            this.isAuthenticated = data.authenticated;
            this.hasCredentials = data.hasCredentials;

            if (!this.hasCredentials) {
                this.setStatus('NOT_CONFIGURED');
            } else if (!this.isAuthenticated) {
                this.setStatus('NOT_CONNECTED');
            } else {
                this.setStatus('ONLINE');
            }
        } catch (error) {
            this.log('Error checking auth status: ' + error.message, 'error');
            this.setStatus('ERROR');
        }
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        if (!this.elements.content) return;

        // Handle all button clicks via delegation
        this.addEventListener(this.elements.content, 'click', async (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) {
                // Check if user clicked the panel itself to open modal
                if (e.target.closest('.music-player-display')) {
                    this.showModal();
                }
                return;
            }

            const action = button.dataset.action;

            switch (action) {
                case 'login':
                    await this.login();
                    break;
                case 'play':
                    await this.play();
                    break;
                case 'pause':
                    await this.pause();
                    break;
                case 'next':
                    await this.next();
                    break;
                case 'previous':
                    await this.previous();
                    break;
            }
        });
    }

    /**
     * Render the music panel UI (main panel view - compact)
     */
    render() {
        if (!this.elements.content) return;

        if (!this.isAuthenticated) {
            this.renderNotConnected();
        } else {
            this.renderMusicPlayer();
        }
    }

    /**
     * Render not connected state
     */
    renderNotConnected() {
        if (!this.hasCredentials) {
            // Show quick setup guide
            this.elements.content.innerHTML = `
                <div class="music-not-connected">
                    <div class="music-connect-prompt">
                        <div class="music-connect-icon">⚙️</div>
                        <div class="music-connect-text">QUICK_SPOTIFY_SETUP</div>
                        <div class="music-config-hint">
                            1. Click here to create Spotify app →<br>
                            <a href="https://developer.spotify.com/dashboard/create" target="_blank" class="music-setup-link">developer.spotify.com</a><br>
                            <br>
                            2. Set redirect to:<br>
                            <code style="color: var(--neon-green); font-size: 0.8rem;">http://localhost:3001/spotify/callback</code><br>
                            <br>
                            3. Copy Client ID to .env file<br>
                            4. Restart kiosk<br>
                            <br>
                            <span style="opacity: 0.5;">Takes ~30 seconds • See docs/SPOTIFY_SETUP.md</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Show connect button
            this.elements.content.innerHTML = `
                <div class="music-not-connected">
                    <div class="music-connect-prompt">
                        <div class="music-connect-icon">♫</div>
                        <div class="music-connect-text">SPOTIFY_NOT_CONNECTED</div>
                        <button class="music-connect-btn" data-action="login">
                            CONNECT_SPOTIFY
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Render music player (compact main panel view)
     */
    renderMusicPlayer() {
        const albumArt = this.currentTrack?.album?.images?.[0]?.url || '';
        const trackName = this.currentTrack?.name || 'NO_TRACK_PLAYING';
        const artistName = this.currentTrack?.artists?.[0]?.name || '';

        this.elements.content.innerHTML = `
            <div class="music-player-display" style="cursor: pointer;">
                <div class="music-album-art">
                    ${albumArt ? `<img src="${albumArt}" alt="Album Art">` : '<div class="music-no-art">♫</div>'}
                </div>
                <div class="music-controls">
                    <button class="music-control-btn" data-action="previous" title="Previous">
                        <span class="control-icon">⏮</span>
                    </button>
                    <button class="music-control-btn music-control-play-pause" data-action="${this.isPlaying ? 'pause' : 'play'}" title="${this.isPlaying ? 'Pause' : 'Play'}">
                        <span class="control-icon">${this.isPlaying ? '⏸' : '▶'}</span>
                    </button>
                    <button class="music-control-btn" data-action="next" title="Next">
                        <span class="control-icon">⏭</span>
                    </button>
                </div>
                <div class="music-track-info">
                    <div class="music-track-name">${trackName}</div>
                    ${artistName ? `<div class="music-artist-name">${artistName}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Show modal with full music interface
     */
    showModal(initialTab = 'player') {
        this.isModalOpen = true;
        this.currentModalTab = initialTab;

        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        if (!modal || !modalTitle || !modalContent) return;

        modalTitle.textContent = '> SPOTIFY_PLAYER';
        modalContent.innerHTML = this.renderModalContent();

        // Set up modal event handlers
        this.setupModalEventHandlers();

        // Show modal
        modal.classList.add('active');

        // Update modal more frequently
        this.clearInterval('modalUpdate');
        this.setInterval('modalUpdate', () => this.updateModal(), this.modalUpdateInterval);

        // Close modal handler
        const closeBtn = document.getElementById('modal-close');
        const closeHandler = () => {
            this.closeModal();
        };
        closeBtn.addEventListener('click', closeHandler);

        // Close on overlay click
        const overlayHandler = (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        };
        modal.addEventListener('click', overlayHandler);

        // Store handlers for cleanup
        this._modalCloseHandler = closeHandler;
        this._modalOverlayHandler = overlayHandler;
    }

    /**
     * Close modal
     */
    closeModal() {
        this.isModalOpen = false;
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.classList.remove('active');
        }

        // Clean up modal event listeners
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn && this._modalCloseHandler) {
            closeBtn.removeEventListener('click', this._modalCloseHandler);
        }
        if (modal && this._modalOverlayHandler) {
            modal.removeEventListener('click', this._modalOverlayHandler);
        }

        // Stop frequent modal updates
        this.clearInterval('modalUpdate');
    }

    /**
     * Render modal content
     */
    renderModalContent() {
        return `
            <div class="music-modal-container">
                <!-- Tab Navigation -->
                <div class="music-modal-tabs">
                    <button class="music-tab-btn ${this.currentModalTab === 'player' ? 'active' : ''}" data-tab="player">
                        PLAYER
                    </button>
                    <button class="music-tab-btn ${this.currentModalTab === 'playlists' ? 'active' : ''}" data-tab="playlists">
                        PLAYLISTS
                    </button>
                    <button class="music-tab-btn ${this.currentModalTab === 'recent' ? 'active' : ''}" data-tab="recent">
                        RECENT
                    </button>
                    <button class="music-tab-btn" data-tab="logout">
                        DISCONNECT
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="music-modal-content" id="music-modal-tab-content">
                    ${this.renderModalTab()}
                </div>
            </div>
        `;
    }

    /**
     * Render current modal tab content
     */
    renderModalTab() {
        switch (this.currentModalTab) {
            case 'player':
                return this.renderPlayerTab();
            case 'playlists':
                return this.renderPlaylistsTab();
            case 'recent':
                return this.renderRecentTab();
            default:
                return '';
        }
    }

    /**
     * Render player tab
     */
    renderPlayerTab() {
        if (!this.currentTrack) {
            return `
                <div class="music-no-playback">
                    <div class="music-no-playback-icon">♫</div>
                    <div class="music-no-playback-text">NO_ACTIVE_PLAYBACK</div>
                    <div class="music-no-playback-hint">Start playing music on Spotify</div>
                </div>
            `;
        }

        const albumArt = this.currentTrack.album?.images?.[0]?.url || '';
        const trackName = this.currentTrack.name || 'Unknown Track';
        const artistName = this.currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
        const albumName = this.currentTrack.album?.name || 'Unknown Album';
        const duration = this.currentTrack.duration_ms || 0;
        const progress = this.currentTrack.progress_ms || 0;
        const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

        return `
            <div class="music-player-full">
                <div class="music-player-art-large">
                    ${albumArt ? `<img src="${albumArt}" alt="Album Art">` : '<div class="music-no-art-large">♫</div>'}
                </div>

                <div class="music-player-info">
                    <div class="music-track-name-large">${trackName}</div>
                    <div class="music-artist-name-large">${artistName}</div>
                    <div class="music-album-name-large">${albumName}</div>
                </div>

                <div class="music-player-progress">
                    <div class="music-progress-time">${this.formatTime(progress)}</div>
                    <div class="music-progress-bar">
                        <div class="music-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="music-progress-time">${this.formatTime(duration)}</div>
                </div>

                <div class="music-player-controls-large">
                    <button class="music-control-btn-large" data-action="previous">
                        <span class="control-icon">⏮</span>
                    </button>
                    <button class="music-control-btn-large music-control-play-pause-large" data-action="${this.isPlaying ? 'pause' : 'play'}">
                        <span class="control-icon">${this.isPlaying ? '⏸' : '▶'}</span>
                    </button>
                    <button class="music-control-btn-large" data-action="next">
                        <span class="control-icon">⏭</span>
                    </button>
                </div>

                ${this.devices.length > 0 ? this.renderDevices() : ''}
            </div>
        `;
    }

    /**
     * Render available devices
     */
    renderDevices() {
        return `
            <div class="music-devices">
                <div class="music-devices-title">&gt; AVAILABLE_DEVICES</div>
                <div class="music-devices-list">
                    ${this.devices.map(device => `
                        <div class="music-device-item ${device.is_active ? 'active' : ''}">
                            <span class="device-icon">${device.type === 'Computer' ? '💻' : device.type === 'Smartphone' ? '📱' : '🔊'}</span>
                            <span class="device-name">${device.name}</span>
                            ${device.is_active ? '<span class="device-badge">ACTIVE</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render playlists tab
     */
    renderPlaylistsTab() {
        if (this.playlists.length === 0) {
            return `
                <div class="music-loading">
                    <div class="loading-text">LOADING_PLAYLISTS...</div>
                </div>
            `;
        }

        return `
            <div class="music-playlists">
                <div class="music-playlists-grid">
                    ${this.playlists.map(playlist => `
                        <div class="music-playlist-item" data-playlist-id="${playlist.id}">
                            <div class="music-playlist-art">
                                ${playlist.images?.[0]?.url ?
                                    `<img src="${playlist.images[0].url}" alt="${playlist.name}">` :
                                    '<div class="music-no-art">♫</div>'}
                            </div>
                            <div class="music-playlist-name">${playlist.name}</div>
                            <div class="music-playlist-tracks">${playlist.tracks?.total || 0} tracks</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render recent tracks tab
     */
    renderRecentTab() {
        if (this.recentTracks.length === 0) {
            return `
                <div class="music-loading">
                    <div class="loading-text">LOADING_RECENT...</div>
                </div>
            `;
        }

        return `
            <div class="music-recent">
                <div class="music-recent-list">
                    ${this.recentTracks.map((item, index) => {
                        const track = item.track;
                        return `
                            <div class="music-recent-item">
                                <div class="music-recent-art">
                                    ${track.album?.images?.[0]?.url ?
                                        `<img src="${track.album.images[0].url}" alt="${track.name}">` :
                                        '<div class="music-no-art-small">♫</div>'}
                                </div>
                                <div class="music-recent-info">
                                    <div class="music-recent-name">${track.name}</div>
                                    <div class="music-recent-artist">${track.artists?.map(a => a.name).join(', ')}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Set up modal event handlers
     */
    setupModalEventHandlers() {
        const modalContent = document.getElementById('music-modal-tab-content');
        if (!modalContent) return;

        // Tab switching
        const tabBtns = document.querySelectorAll('.music-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const tab = btn.dataset.tab;

                if (tab === 'logout') {
                    await this.logout();
                    this.closeModal();
                    return;
                }

                this.currentModalTab = tab;

                // Load data for tab
                if (tab === 'playlists' && this.playlists.length === 0) {
                    await this.loadPlaylists();
                } else if (tab === 'recent' && this.recentTracks.length === 0) {
                    await this.loadRecentTracks();
                }

                // Re-render modal content
                const container = document.getElementById('music-modal-tab-content');
                if (container) {
                    container.innerHTML = this.renderModalTab();
                }

                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Player controls in modal
        modalContent.addEventListener('click', async (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;

            switch (action) {
                case 'play':
                    await this.play();
                    break;
                case 'pause':
                    await this.pause();
                    break;
                case 'next':
                    await this.next();
                    break;
                case 'previous':
                    await this.previous();
                    break;
            }
        });
    }

    /**
     * Update modal content
     */
    async updateModal() {
        if (!this.isModalOpen) return;

        await this.updateCurrentTrack();

        const container = document.getElementById('music-modal-tab-content');
        if (container && this.currentModalTab === 'player') {
            container.innerHTML = this.renderModalTab();
        }
    }

    /**
     * Update current track information
     */
    async updateCurrentTrack() {
        if (!this.isAuthenticated) return;

        try {
            const response = await fetch('/spotify/player');
            const data = await response.json();

            if (data.error) {
                if (data.error.includes('authentication') || data.error.includes('Not authenticated')) {
                    this.isAuthenticated = false;
                    this.setStatus('NOT_CONNECTED');
                    this.render();
                }
                return;
            }

            if (data.item) {
                this.currentTrack = data.item;
                this.currentTrack.progress_ms = data.progress_ms;
                this.isPlaying = data.is_playing;
                this.setStatus(this.isPlaying ? 'PLAYING' : 'PAUSED');
            } else {
                this.currentTrack = null;
                this.isPlaying = false;
                this.setStatus('IDLE');
            }

            // Update UI
            if (!this.isModalOpen) {
                this.render();
            }
        } catch (error) {
            this.log('Error updating track: ' + error.message, 'error');
        }
    }

    /**
     * Load user's playlists
     */
    async loadPlaylists() {
        try {
            const response = await fetch('/spotify/playlists');
            const data = await response.json();

            if (data.items) {
                this.playlists = data.items;
            }
        } catch (error) {
            this.log('Error loading playlists: ' + error.message, 'error');
        }
    }

    /**
     * Load recently played tracks
     */
    async loadRecentTracks() {
        try {
            const response = await fetch('/spotify/recent');
            const data = await response.json();

            if (data.items) {
                this.recentTracks = data.items;
            }
        } catch (error) {
            this.log('Error loading recent tracks: ' + error.message, 'error');
        }
    }

    /**
     * Load available devices
     */
    async loadDevices() {
        try {
            const response = await fetch('/spotify/devices');
            const data = await response.json();

            if (data.devices) {
                this.devices = data.devices;
            }
        } catch (error) {
            this.log('Error loading devices: ' + error.message, 'error');
        }
    }

    /**
     * Login to Spotify
     */
    async login() {
        try {
            const response = await fetch('/spotify/login');
            const data = await response.json();

            if (data.error) {
                this.log('Login failed: ' + data.error, 'error');
                this.setError('SPOTIFY_NOT_CONFIGURED: Add credentials to .env file');
                return;
            }

            if (data.auth_url) {
                // In kiosk mode, navigate the entire window to Spotify auth
                // The callback will redirect back to the kiosk
                window.location.href = data.auth_url;
            }
        } catch (error) {
            this.log('Error logging in: ' + error.message, 'error');
        }
    }

    /**
     * Logout from Spotify
     */
    async logout() {
        try {
            await fetch('/spotify/logout', { method: 'POST' });
            this.isAuthenticated = false;
            this.currentTrack = null;
            this.isPlaying = false;
            this.playlists = [];
            this.recentTracks = [];
            this.devices = [];
            this.setStatus('NOT_CONNECTED');
            this.render();
        } catch (error) {
            this.log('Error logging out: ' + error.message, 'error');
        }
    }

    /**
     * Play current track
     */
    async play() {
        try {
            await fetch('/spotify/play', { method: 'POST' });
            await this.updateCurrentTrack();
        } catch (error) {
            this.log('Error playing: ' + error.message, 'error');
        }
    }

    /**
     * Pause current track
     */
    async pause() {
        try {
            await fetch('/spotify/pause', { method: 'POST' });
            await this.updateCurrentTrack();
        } catch (error) {
            this.log('Error pausing: ' + error.message, 'error');
        }
    }

    /**
     * Skip to next track
     */
    async next() {
        try {
            await fetch('/spotify/next', { method: 'POST' });
            // Wait a bit for Spotify to update
            setTimeout(() => this.updateCurrentTrack(), 500);
        } catch (error) {
            this.log('Error skipping to next: ' + error.message, 'error');
        }
    }

    /**
     * Go to previous track
     */
    async previous() {
        try {
            await fetch('/spotify/previous', { method: 'POST' });
            // Wait a bit for Spotify to update
            setTimeout(() => this.updateCurrentTrack(), 500);
        } catch (error) {
            this.log('Error going to previous: ' + error.message, 'error');
        }
    }

    /**
     * Format time in ms to MM:SS
     */
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * Clean up resources
     */
    onDestroy() {
        this.clearInterval('update');
        this.clearInterval('modalUpdate');
        if (this.isModalOpen) {
            this.closeModal();
        }
    }
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPanel;
}
