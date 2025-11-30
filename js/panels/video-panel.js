/**
 * VideoPanel - YouTube video display panel
 * Extends BasePanel to provide video thumbnail rotation and modal playback
 */

class VideoPanel extends BasePanel {
    constructor(config) {
        super(config);

        // Video state
        this.videos = [];
        this.currentVideoIndex = 0;
        this.rotationInterval = null;
        this.rotationSpeed = 30000; // 30 seconds between videos

        // Active video state (what's currently loaded/playing)
        this.activeVideo = null; // { id, title }
        this.isPlaying = false;
        this.player = null; // YouTube iframe API player
    }

    /**
     * Initialize the video panel
     */
    async onInit() {
        this.log('Initializing video panel');

        // Load YouTube IFrame API
        this.loadYouTubeAPI();

        // Load videos from app.js or default set
        this.loadVideos();

        // Set initial active video
        if (this.videos.length > 0) {
            this.activeVideo = {
                id: this.videos[0].id,
                title: this.videos[0].title
            };
        }

        // Render initial UI
        this.render();

        // Set up event delegation
        this.setupEventDelegation();

        // Start video rotation if enabled (only when no video is active/playing)
        if (this.settings.autoplay !== false && !this.isPlaying) {
            this.startRotation();
        }

        this.log('Video panel initialized');
    }

    /**
     * Load YouTube IFrame API
     */
    loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            this.log('YouTube API already loaded');
            return;
        }

        if (!document.getElementById('youtube-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api';
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            this.log('YouTube IFrame API loading...');
        }
    }

    /**
     * Load videos from global YOUTUBE_VIDEOS or use defaults
     */
    loadVideos() {
        // Check if global YOUTUBE_VIDEOS exists
        if (typeof YOUTUBE_VIDEOS !== 'undefined' && YOUTUBE_VIDEOS.length > 0) {
            this.videos = YOUTUBE_VIDEOS;
            this.log(`Loaded ${this.videos.length} videos`);
        } else {
            // Fallback to default videos
            this.videos = [
                { id: '4xDzrJKXOOY', title: 'Synthwave Goose' },
                { id: 'MV_3Dpw-BRY', title: 'Cyberpunk Music Mix' },
                { id: 'jvipPYFebWc', title: 'Blade Runner Blues' },
                { id: 'MVPTGNGiI-4', title: 'The Midnight Synthwave' },
                { id: 'WLSNPkf8RCQ', title: 'Neon Tokyo Night Drive' }
            ];
            this.log('Using default video list');
        }
    }

    /**
     * Set up event delegation for all interactive elements
     */
    setupEventDelegation() {
        // Handle header click to open modal
        if (this.elements.header) {
            this.elements.header.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showModal();
            });
        }

        if (!this.elements.content) {
            console.error('> VIDEO: No content element for event delegation!');
            return;
        }

        // Handle content clicks with action delegation
        this.addEventListener(this.elements.content, 'click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (actionEl) {
                e.stopPropagation();
                const action = actionEl.dataset.action;
                switch (action) {
                    case 'toggle-play':
                        this.togglePlayPause();
                        break;
                    case 'open-modal':
                        this.showModal();
                        break;
                }
            } else {
                // Click anywhere else opens modal
                this.showModal();
            }
        });
    }

    /**
     * Toggle play/pause state
     */
    togglePlayPause() {
        if (!this.activeVideo) return;

        if (this.isPlaying) {
            this.pauseVideo();
        } else {
            this.playVideo();
        }
    }

    /**
     * Play the current video
     */
    playVideo() {
        if (!this.activeVideo) return;

        // Stop rotation when playing
        this.stopRotation();

        if (this.player && typeof this.player.playVideo === 'function') {
            this.player.playVideo();
        } else {
            // No player yet, open modal to start playing
            this.showModal();
            return;
        }

        this.isPlaying = true;
        this.render();
        this.log('Playing: ' + this.activeVideo.title);
    }

    /**
     * Pause the current video
     */
    pauseVideo() {
        if (this.player && typeof this.player.pauseVideo === 'function') {
            this.player.pauseVideo();
        }

        this.isPlaying = false;
        this.render();
        this.log('Paused');
    }

    /**
     * Render the video panel UI (thumbnail view)
     */
    render() {
        if (!this.elements.content) return;

        const html = this.renderThumbnailView();
        this.elements.content.innerHTML = html;

        // Update title if header exists
        if (this.elements.title) {
            this.elements.title.textContent = '> VIDEO';
        }

        // Update status if status element exists
        if (this.elements.status) {
            this.elements.status.textContent = this.videos.length > 0 ? 'ACTIVE' : 'NO VIDEOS';
        }
    }

    /**
     * Render the thumbnail view (shown in panel)
     */
    renderThumbnailView() {
        if (this.videos.length === 0 && !this.activeVideo) {
            return `
                <div class="video-empty">
                    <div class="video-empty-icon">📺</div>
                    <div class="video-empty-text">NO VIDEOS</div>
                </div>
            `;
        }

        // Use active video if set, otherwise use current from rotation
        const displayVideo = this.activeVideo || this.videos[this.currentVideoIndex];
        const thumbnailUrl = `https://img.youtube.com/vi/${displayVideo.id}/hqdefault.jpg`;
        const playPauseIcon = this.isPlaying ? '⏸' : '▶';
        const statusText = this.isPlaying ? 'PLAYING' : '';

        return `
            <div class="video-thumbnail-container" data-action="open-modal">
                <img src="${thumbnailUrl}"
                     alt="${displayVideo.title}"
                     class="video-thumbnail"
                     loading="lazy">
                <div class="video-overlay">
                    <button class="video-play-btn" data-action="toggle-play" title="${this.isPlaying ? 'Pause' : 'Play'}">
                        ${playPauseIcon}
                    </button>
                    <div class="video-info">
                        <div class="video-title">${displayVideo.title}</div>
                        ${statusText ? `<div class="video-status">${statusText}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Start automatic video rotation
     */
    startRotation() {
        if (this.videos.length <= 1) return;

        this.rotationInterval = this.setInterval('rotation', () => {
            this.nextVideo();
        }, this.rotationSpeed);

        this.log('Video rotation started');
    }

    /**
     * Stop automatic video rotation
     */
    stopRotation() {
        if (this.rotationInterval) {
            this.clearInterval('rotation');
            this.rotationInterval = null;
            this.log('Video rotation stopped');
        }
    }

    /**
     * Display next video
     */
    nextVideo() {
        this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videos.length;
        this.render();
    }

    /**
     * Display previous video
     */
    prevVideo() {
        this.currentVideoIndex = (this.currentVideoIndex - 1 + this.videos.length) % this.videos.length;
        this.render();
    }

    /**
     * Create and attach the modal overlay to the document
     */
    createModal() {
        // Create modal overlay
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'video-modal-overlay';
        this.modalOverlay.id = `${this.id}-modal`;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'video-modal-container';

        // Modal structure
        modalContainer.innerHTML = `
            <div class="video-modal-header">
                <div class="video-modal-title">&gt; VIDEO_PLAYER</div>
                <button class="video-modal-close" data-action="close-modal">X</button>
            </div>
            <div class="video-modal-content" id="${this.id}-modal-content">
                <!-- Content will be populated when modal opens -->
            </div>
        `;

        this.modalOverlay.appendChild(modalContainer);
        document.body.appendChild(this.modalOverlay);

        // Set up event delegation
        this.setupModalEventDelegation(modalContainer);

        // Close modal when clicking overlay (outside modal)
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.hideModal();
            }
        });

        // Close modal with ESC key
        this.escKeyHandler = (e) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
                this.hideModal();
            }
        };
        document.addEventListener('keydown', this.escKeyHandler);
    }

    /**
     * Set up event delegation for modal content
     */
    setupModalEventDelegation(modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;

            switch (action) {
                case 'close-modal':
                    this.hideModal();
                    break;
                case 'select-video':
                    this.selectVideo(parseInt(button.dataset.videoIndex));
                    break;
                case 'play-search-result':
                    this.playSearchResult(button.dataset.videoId, button.dataset.videoTitle);
                    break;
                case 'search-youtube':
                    this.performSearch();
                    break;
            }
        });

        // Handle Enter key in search input
        modalContainer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('video-search-input')) {
                this.performSearch();
            }
        });
    }

    /**
     * Perform YouTube search
     */
    async performSearch() {
        const searchInput = this.modalOverlay.querySelector('.video-search-input');
        const resultsContainer = this.modalOverlay.querySelector('.video-search-results');

        if (!searchInput || !resultsContainer) return;

        const query = searchInput.value.trim();
        if (!query) return;

        // Show loading state
        resultsContainer.innerHTML = '<div class="video-search-loading">SEARCHING...</div>';

        try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.error) {
                resultsContainer.innerHTML = `<div class="video-search-error">ERROR: ${data.error}</div>`;
                return;
            }

            if (!data.items || data.items.length === 0) {
                resultsContainer.innerHTML = '<div class="video-search-empty">NO RESULTS FOUND</div>';
                return;
            }

            // Render search results
            resultsContainer.innerHTML = data.items.map(item => `
                <div class="video-search-item"
                     data-action="play-search-result"
                     data-video-id="${item.id.videoId}"
                     data-video-title="${this.escapeHtml(item.snippet.title)}">
                    <img src="${item.snippet.thumbnails.default.url}"
                         alt="${this.escapeHtml(item.snippet.title)}"
                         class="video-search-thumb">
                    <div class="video-search-info">
                        <div class="video-search-title">${this.escapeHtml(item.snippet.title)}</div>
                        <div class="video-search-channel">${this.escapeHtml(item.snippet.channelTitle)}</div>
                    </div>
                </div>
            `).join('');

            this.log(`Search returned ${data.items.length} results for: ${query}`);
        } catch (error) {
            resultsContainer.innerHTML = '<div class="video-search-error">FAILED TO SEARCH</div>';
            this.log('Search error: ' + error.message, 'error');
        }
    }

    /**
     * Play a video from search results
     */
    playSearchResult(videoId, title) {
        // Update active video
        this.activeVideo = {
            id: videoId,
            title: title
        };

        // Load in player
        if (this.player && typeof this.player.loadVideoById === 'function') {
            this.player.loadVideoById(videoId);
            this.isPlaying = true;
        } else {
            // Fallback: update iframe
            const iframe = this.modalOverlay.querySelector('iframe');
            if (iframe) {
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            }
            this.isPlaying = true;
        }

        // Update current video display
        const modalTitle = this.modalOverlay.querySelector('.video-modal-now-playing');
        if (modalTitle) {
            modalTitle.textContent = title;
        }

        // Update panel thumbnail
        this.render();

        this.log(`Playing search result: ${title}`);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show the modal and populate with content
     */
    showModal() {
        this.log('showModal() called');

        if (!this.modalOverlay) {
            this.log('Creating modal overlay');
            this.createModal();
        }

        // Stop rotation while modal is open
        this.stopRotation();

        // Populate modal content
        const modalContent = document.getElementById(`${this.id}-modal-content`);
        if (modalContent) {
            modalContent.innerHTML = this.renderModalContent();
            this.log('Modal content populated');

            // Initialize YouTube player after DOM is ready
            setTimeout(() => this.initYouTubePlayer(), 100);
        } else {
            this.log('ERROR: Modal content element not found', 'error');
        }

        // Show modal
        this.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        this.log('Modal should now be visible');
    }

    /**
     * Hide the modal
     */
    hideModal() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling

            // Don't stop the video - let it continue playing in background
            // The panel will show play/pause state

            // Only resume rotation if not playing
            if (!this.isPlaying && this.settings.autoplay !== false) {
                this.startRotation();
            }
        }
    }

    /**
     * Stop and clear the video completely
     */
    stopVideo() {
        if (this.player && typeof this.player.stopVideo === 'function') {
            this.player.stopVideo();
        }

        // Also clear iframe if using fallback
        if (this.modalOverlay) {
            const iframe = this.modalOverlay.querySelector('iframe');
            if (iframe) {
                iframe.src = 'about:blank';
            }
        }

        this.isPlaying = false;
        this.render();

        // Resume rotation
        if (this.settings.autoplay !== false) {
            this.startRotation();
        }
    }

    /**
     * Render the modal content (video player + selector)
     */
    renderModalContent() {
        // Use active video or fall back to current index
        const displayVideo = this.activeVideo || this.videos[this.currentVideoIndex];

        return `
            <div class="video-player-container">
                <!-- YouTube Embed (will be replaced by YT Player API) -->
                <div class="video-embed">
                    <div id="video-player-container"></div>
                </div>
                <div class="video-modal-now-playing">${displayVideo.title}</div>

                <!-- Search Box -->
                <div class="video-search-container">
                    <div class="video-search-header">&gt; SEARCH_YOUTUBE</div>
                    <div class="video-search-box">
                        <input type="text"
                               class="video-search-input"
                               placeholder="Search videos..."
                               autocomplete="off">
                        <button class="video-search-btn" data-action="search-youtube">SEARCH</button>
                    </div>
                    <div class="video-search-results"></div>
                </div>

                <!-- Video Selector (Preset List) -->
                <div class="video-selector">
                    <div class="video-selector-title">&gt; PRESET_VIDEOS</div>
                    <div class="video-list">
                        ${this.videos.map((video, index) => `
                            <div class="video-list-item ${video.id === displayVideo.id ? 'active' : ''}"
                                 data-action="select-video"
                                 data-video-index="${index}">
                                <img src="https://img.youtube.com/vi/${video.id}/default.jpg"
                                     alt="${video.title}"
                                     class="video-list-thumbnail">
                                <div class="video-list-title">${video.title}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize YouTube player after modal content is rendered
     */
    initYouTubePlayer() {
        const displayVideo = this.activeVideo || this.videos[this.currentVideoIndex];

        if (!window.YT || !window.YT.Player) {
            // API not ready yet, fall back to iframe
            this.log('YouTube API not ready, using iframe fallback');
            const container = document.getElementById('video-player-container');
            if (container) {
                container.innerHTML = `
                    <iframe
                        src="https://www.youtube.com/embed/${displayVideo.id}?autoplay=1&enablejsapi=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                `;
            }
            this.isPlaying = true;
            this.render();
            return;
        }

        // Destroy existing player if any
        if (this.player) {
            this.player.destroy();
        }

        // Create new player
        this.player = new YT.Player('video-player-container', {
            videoId: displayVideo.id,
            playerVars: {
                autoplay: 1,
                enablejsapi: 1,
                modestbranding: 1,
                rel: 0
            },
            events: {
                onReady: (e) => {
                    this.log('YouTube player ready');
                    this.isPlaying = true;
                    this.render();
                },
                onStateChange: (e) => {
                    this.onPlayerStateChange(e);
                }
            }
        });
    }

    /**
     * Handle YouTube player state changes
     */
    onPlayerStateChange(event) {
        // YT.PlayerState: UNSTARTED=-1, ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
        switch (event.data) {
            case 1: // PLAYING
                this.isPlaying = true;
                this.stopRotation();
                break;
            case 2: // PAUSED
                this.isPlaying = false;
                break;
            case 0: // ENDED
                this.isPlaying = false;
                break;
        }
        this.render();
        this.log(`Player state: ${event.data}, isPlaying: ${this.isPlaying}`);
    }

    /**
     * Select a video from the list
     */
    selectVideo(index) {
        if (index >= 0 && index < this.videos.length) {
            const video = this.videos[index];

            // Update active video
            this.activeVideo = {
                id: video.id,
                title: video.title
            };

            this.currentVideoIndex = index;

            // Load in player
            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.player.loadVideoById(video.id);
                this.isPlaying = true;
            } else {
                // Re-render modal with new video
                const modalContent = document.getElementById(`${this.id}-modal-content`);
                if (modalContent) {
                    modalContent.innerHTML = this.renderModalContent();
                    setTimeout(() => this.initYouTubePlayer(), 100);
                }
            }

            // Update panel thumbnail
            this.render();

            // Update now playing text
            const nowPlaying = this.modalOverlay?.querySelector('.video-modal-now-playing');
            if (nowPlaying) {
                nowPlaying.textContent = video.title;
            }

            this.log(`Selected video: ${video.title}`);
        }
    }

    /**
     * Cleanup on destroy
     */
    onDestroy() {
        // Stop rotation
        this.stopRotation();

        // Remove ESC key handler
        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
        }

        // Remove modal from DOM
        if (this.modalOverlay && this.modalOverlay.parentNode) {
            this.modalOverlay.parentNode.removeChild(this.modalOverlay);
        }

        // Restore body scroll
        document.body.style.overflow = '';

        this.log('Video panel destroyed');
    }
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPanel;
}
