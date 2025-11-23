/**
 * SystemPanel - System monitoring panel with live metrics
 * Extends BasePanel to provide system stats display and modal with detailed information
 */

class SystemPanel extends BasePanel {
    constructor(config) {
        super(config);

        // System monitoring state
        this.systemStats = null;
        this.updateInterval = null;
        this.refreshRate = 15000; // 15 seconds between updates
        this.systemMonitorUrl = null;
        this.port = 3001; // Default port
    }

    /**
     * Initialize the system panel
     */
    async onInit() {
        this.log('Initializing system panel');

        // Get system monitor URL from global CONFIG if available
        if (typeof CONFIG !== 'undefined') {
            this.systemMonitorUrl = CONFIG.systemMonitorUrl || `http://localhost:${CONFIG.port}/stats`;
            this.port = CONFIG.port || 3001;
        } else {
            this.systemMonitorUrl = `http://localhost:${this.port}/stats`;
        }

        this.log(`System monitor URL: ${this.systemMonitorUrl}`);

        // Render initial UI
        this.render();

        // Set up event delegation
        this.setupEventDelegation();

        // Fetch initial stats
        await this.fetchSystemStats();

        // Start auto-update
        if (this.settings.autoUpdate !== false) {
            this.startAutoUpdate();
        }

        this.log('System panel initialized');
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
            console.error('> SYSTEM: No content element for event delegation!');
            return;
        }

        // Handle content click to open modal
        this.addEventListener(this.elements.content, 'click', (e) => {
            this.showModal();
        });
    }

    /**
     * Fetch system stats from backend
     */
    async fetchSystemStats() {
        try {
            const response = await fetch(this.systemMonitorUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch system stats');
            }

            this.systemStats = await response.json();
            this.render();
        } catch (error) {
            this.log(`Error fetching system stats: ${error.message}`, 'error');
            this.systemStats = null;
            this.render();
        }
    }

    /**
     * Render the system panel UI (compact widget view)
     */
    render() {
        if (!this.elements.content) return;

        const html = this.renderWidgetView();
        this.elements.content.innerHTML = html;

        // Update title if header exists
        if (this.elements.title) {
            this.elements.title.textContent = '> SYSTEM';
        }

        // Update status if status element exists
        if (this.elements.status) {
            this.elements.status.textContent = this.systemStats ? 'ONLINE' : 'OFFLINE';
        }
    }

    /**
     * Render the compact widget view (shown in panel)
     */
    renderWidgetView() {
        if (!this.systemStats) {
            return `
                <div class="system-empty">
                    <div class="system-empty-icon">💻</div>
                    <div class="system-empty-text">CONNECTING...</div>
                </div>
            `;
        }

        const cpuTemp = this.systemStats.temperature?.cpu || '--';
        const cpuUsage = this.systemStats.cpu?.usage || '--';
        const memUsed = this.systemStats.memory?.usedPercent || '--';
        const diskUsed = this.systemStats.disk ? parseInt(this.systemStats.disk.percent) : '--';

        // Color coding for temperature
        const tempColor = this.getTempColor(parseFloat(cpuTemp));
        const cpuColor = this.getUsageColor(parseFloat(cpuUsage));
        const memColor = this.getUsageColor(parseFloat(memUsed));
        const diskColor = this.getUsageColor(parseFloat(diskUsed));

        return `
            <div class="system-widget-compact">
                <div class="system-stat-main">
                    <div class="system-stat-label">CPU TEMP</div>
                    <div class="system-stat-value" style="color: ${tempColor};">${cpuTemp}°C</div>
                </div>
                <div class="system-stats-grid">
                    <div class="system-stat-item">
                        <div class="system-stat-label">CPU</div>
                        <div class="system-stat-value" style="color: ${cpuColor};">${cpuUsage}%</div>
                    </div>
                    <div class="system-stat-item">
                        <div class="system-stat-label">MEM</div>
                        <div class="system-stat-value" style="color: ${memColor};">${memUsed}%</div>
                    </div>
                    <div class="system-stat-item">
                        <div class="system-stat-label">DISK</div>
                        <div class="system-stat-value" style="color: ${diskColor};">${diskUsed}%</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get color based on temperature
     */
    getTempColor(temp) {
        if (temp === '--' || isNaN(temp)) return 'var(--neon-cyan)';
        if (temp > 70) return 'var(--error-red)';
        if (temp > 60) return 'var(--neon-amber)';
        return 'var(--neon-green)';
    }

    /**
     * Get color based on usage percentage
     */
    getUsageColor(usage) {
        if (usage === '--' || isNaN(usage)) return 'var(--neon-cyan)';
        if (usage > 80) return 'var(--error-red)';
        if (usage > 60) return 'var(--neon-amber)';
        return 'var(--neon-green)';
    }

    /**
     * Start automatic stat updates
     */
    startAutoUpdate() {
        this.updateInterval = this.setInterval('auto-update', async () => {
            await this.fetchSystemStats();
        }, this.refreshRate);

        this.log('Auto-update started');
    }

    /**
     * Stop automatic stat updates
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            this.clearInterval('auto-update');
            this.updateInterval = null;
            this.log('Auto-update stopped');
        }
    }

    /**
     * Create and attach the modal overlay to the document
     */
    createModal() {
        // Create modal overlay
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'system-modal-overlay';
        this.modalOverlay.id = `${this.id}-modal`;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'system-modal-container';

        // Modal structure
        modalContainer.innerHTML = `
            <div class="system-modal-header">
                <div class="system-modal-title">&gt; SYSTEM_STATUS</div>
                <button class="system-modal-close" data-action="close-modal">X</button>
            </div>
            <div class="system-modal-content" id="${this.id}-modal-content">
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
                case 'refresh-stats':
                    this.refreshModalStats();
                    break;
            }
        });
    }

    /**
     * Show the modal and populate with content
     */
    async showModal() {
        this.log('showModal() called');

        if (!this.modalOverlay) {
            this.log('Creating modal overlay');
            this.createModal();
        }

        // Fetch fresh stats before showing modal
        await this.fetchSystemStats();

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
        }
    }

    /**
     * Refresh stats in the modal
     */
    async refreshModalStats() {
        const modalContent = document.getElementById(`${this.id}-modal-content`);
        if (modalContent) {
            modalContent.innerHTML = '<div style="text-align: center; font-size: 1.5rem; color: var(--neon-cyan);">LOADING SYSTEM STATUS...</div>';
            await this.fetchSystemStats();
            modalContent.innerHTML = this.renderModalContent();
        }
    }

    /**
     * Render the modal content (detailed system stats)
     */
    renderModalContent() {
        if (!this.systemStats) {
            return '<div class="error-message">ERROR LOADING SYSTEM STATUS</div>';
        }

        const stats = this.systemStats;

        // Calculate percentages for color coding
        const memPercent = stats.memory ? stats.memory.usedPercent : 0;
        const cpuPercent = stats.cpu ? stats.cpu.usage : 0;
        const diskPercent = stats.disk ? parseInt(stats.disk.percent) : 0;
        const cpuTemp = parseFloat(stats.temperature?.cpu || 0);
        const gpuTemp = parseFloat(stats.temperature?.gpu || 0);

        return `
            <div class="system-modal-stats">
                <!-- Temperature Section -->
                <div class="system-modal-section-main">
                    <div class="system-modal-temp-main" style="color: ${this.getTempColor(cpuTemp)};">
                        ${stats.temperature?.cpu || '--'}°C
                    </div>
                    <div class="system-modal-label">
                        CPU TEMPERATURE
                    </div>
                </div>

                <!-- Main Stats Grid -->
                <div class="system-modal-grid">
                    <!-- CPU Usage -->
                    <div class="system-modal-stat">
                        <div class="system-modal-stat-label">CPU USAGE</div>
                        <div class="system-modal-stat-value" style="color: ${this.getUsageColor(cpuPercent)};">
                            ${cpuPercent}%
                        </div>
                    </div>

                    <!-- GPU Temperature -->
                    <div class="system-modal-stat">
                        <div class="system-modal-stat-label">GPU TEMPERATURE</div>
                        <div class="system-modal-stat-value" style="color: ${this.getTempColor(gpuTemp)};">
                            ${stats.temperature?.gpu || '--'}°C
                        </div>
                    </div>

                    <!-- Memory Usage -->
                    <div class="system-modal-stat">
                        <div class="system-modal-stat-label">MEMORY USAGE</div>
                        <div class="system-modal-stat-value" style="color: ${this.getUsageColor(memPercent)};">
                            ${memPercent}%
                        </div>
                        <div class="system-modal-stat-detail">
                            ${stats.memory?.used || '--'}MB / ${stats.memory?.total || '--'}MB
                        </div>
                    </div>

                    <!-- Disk Usage -->
                    <div class="system-modal-stat">
                        <div class="system-modal-stat-label">DISK USAGE</div>
                        <div class="system-modal-stat-value" style="color: ${this.getUsageColor(diskPercent)};">
                            ${diskPercent}%
                        </div>
                        <div class="system-modal-stat-detail">
                            ${stats.disk?.used || '--'} / ${stats.disk?.total || '--'}
                        </div>
                    </div>
                </div>

                <!-- System Info Section -->
                <div class="system-modal-info">
                    <div class="system-modal-info-row">
                        <span class="system-modal-info-label">UPTIME:</span>
                        <span class="system-modal-info-value">${stats.uptime || 'N/A'}</span>
                    </div>
                    <div class="system-modal-info-row">
                        <span class="system-modal-info-label">LOAD AVERAGE:</span>
                        <span class="system-modal-info-value">
                            ${stats.load?.load1 || '--'} / ${stats.load?.load5 || '--'} / ${stats.load?.load15 || '--'}
                        </span>
                    </div>
                    <div class="system-modal-info-row">
                        <span class="system-modal-info-label">SYSTEM STATUS:</span>
                        <span class="system-modal-info-value" style="color: var(--neon-green);">● OPERATIONAL</span>
                    </div>
                </div>

                <!-- Refresh Button -->
                <div class="system-modal-actions">
                    <button class="system-modal-refresh" data-action="refresh-stats">
                        REFRESH STATS
                    </button>
                </div>

                <!-- Footer -->
                <div class="system-modal-footer">
                    <div style="color: var(--neon-green); font-size: 1.1rem;">
                        SYSTEM MONITOR ACTIVE<br>
                        <span style="font-size: 0.9rem; opacity: 0.8;">Raspberry Pi | Real-time Metrics</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Cleanup on destroy
     */
    onDestroy() {
        // Stop auto-update
        this.stopAutoUpdate();

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

        this.log('System panel destroyed');
    }
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemPanel;
}
