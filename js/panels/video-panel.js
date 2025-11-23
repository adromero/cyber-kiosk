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
    }

    /**
     * Initialize the video panel
     */
    async onInit() {
        this.log('Initializing video panel');

        // Load videos from app.js or default set
        this.loadVideos();

        // Render initial UI
        this.render();

        // Set up event delegation
        this.setupEventDelegation();

        // Start video rotation if enabled
        if (this.settings.autoplay !== false) {
            this.startRotation();
        }

        this.log('Video panel initialized');
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

        // Handle content click to open modal
        this.addEventListener(this.elements.content, 'click', (e) => {
            this.showModal();
        });
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
        if (this.videos.length === 0) {
            return `
                <div class="video-empty">
                    <div class="video-empty-icon">📺</div>
                    <div class="video-empty-text">NO VIDEOS</div>
                </div>
            `;
        }

        const currentVideo = this.videos[this.currentVideoIndex];
        const thumbnailUrl = `https://img.youtube.com/vi/${currentVideo.id}/hqdefault.jpg`;

        return `
            <div class="video-thumbnail-container">
                <img src="${thumbnailUrl}"
                     alt="${currentVideo.title}"
                     class="video-thumbnail"
                     loading="lazy">
                <div class="video-overlay">
                    <div class="video-play-icon">▶</div>
                    <div class="video-title">${currentVideo.title}</div>
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
            }
        });
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

            // Stop any playing videos
            const iframe = this.modalOverlay.querySelector('iframe');
            if (iframe) {
                iframe.src = iframe.src; // Reload iframe to stop video
            }

            // Resume rotation if enabled
            if (this.settings.autoplay !== false) {
                this.startRotation();
            }
        }
    }

    /**
     * Render the modal content (video player + selector)
     */
    renderModalContent() {
        const currentVideo = this.videos[this.currentVideoIndex];

        return `
            <div class="video-player-container">
                <!-- YouTube Embed -->
                <div class="video-embed">
                    <iframe
                        src="https://www.youtube.com/embed/${currentVideo.id}?autoplay=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>

                <!-- Video Selector -->
                <div class="video-selector">
                    <div class="video-selector-title">&gt; SELECT_VIDEO</div>
                    <div class="video-list">
                        ${this.videos.map((video, index) => `
                            <div class="video-list-item ${index === this.currentVideoIndex ? 'active' : ''}"
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
     * Select a video from the list
     */
    selectVideo(index) {
        if (index >= 0 && index < this.videos.length) {
            this.currentVideoIndex = index;
            this.render();

            // Update modal content to show new video
            const modalContent = document.getElementById(`${this.id}-modal-content`);
            if (modalContent) {
                modalContent.innerHTML = this.renderModalContent();
            }

            this.log(`Selected video: ${this.videos[index].title}`);
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
