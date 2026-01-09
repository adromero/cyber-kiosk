/**
 * MeshtasticPanel - Mesh network monitoring panel
 * Extends BasePanel to display Meshtastic stats from meshing-around bot
 */

class MeshtasticPanel extends BasePanel {
    constructor(config) {
        super(config);

        // Panel state
        this.meshtasticStats = null;
        this.updateInterval = null;
        this.refreshRate = 30000; // 30 seconds between updates
        this.activeTab = 'status'; // status | leaderboard | activity
    }

    /**
     * Initialize the meshtastic panel
     */
    async onInit() {
        this.log('Initializing Meshtastic panel');

        // Render initial UI
        this.render();

        // Set up event delegation
        this.setupEventDelegation();

        // Fetch initial stats
        await this.fetchMeshtasticStats();

        // Start auto-update
        if (this.settings.autoUpdate !== false) {
            this.startAutoUpdate();
        }

        this.log('Meshtastic panel initialized');
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
            console.error('> MESHTASTIC: No content element for event delegation!');
            return;
        }

        // Handle content click to open modal
        this.addEventListener(this.elements.content, 'click', (e) => {
            this.showModal();
        });
    }

    /**
     * Fetch meshtastic stats from backend
     */
    async fetchMeshtasticStats() {
        try {
            const response = await fetch('/meshtastic');
            if (!response.ok) {
                throw new Error('Failed to fetch Meshtastic stats');
            }

            this.meshtasticStats = await response.json();
            this.render();
        } catch (error) {
            this.log(`Error fetching Meshtastic stats: ${error.message}`, 'error');
            this.meshtasticStats = null;
            this.render();
        }
    }

    /**
     * Render the meshtastic panel UI (compact widget view)
     */
    render() {
        if (!this.elements.content) return;

        const html = this.renderWidgetView();
        this.elements.content.innerHTML = html;

        // Update title if header exists
        if (this.elements.title) {
            this.elements.title.textContent = '> MESH';
        }

        // Update status if status element exists
        if (this.elements.status) {
            const status = this.meshtasticStats?.status || 'OFFLINE';
            this.elements.status.textContent = status.toUpperCase();
        }
    }

    /**
     * Render the compact widget view (shown in panel)
     */
    renderWidgetView() {
        // Handle not configured state
        if (this.meshtasticStats?.status === 'not_configured') {
            return `
                <div class="meshtastic-widget">
                    <div class="mesh-empty">
                        <div class="mesh-empty-icon">📡</div>
                        <div class="mesh-empty-text">NOT CONFIGURED</div>
                        <div class="mesh-empty-sub">Configure in Settings > SERVICES</div>
                    </div>
                </div>
            `;
        }

        if (!this.meshtasticStats || this.meshtasticStats.status === 'error') {
            return `
                <div class="meshtastic-widget">
                    <div class="mesh-empty">
                        <div class="mesh-empty-icon">📡</div>
                        <div class="mesh-empty-text">${this.meshtasticStats?.error || 'CONNECTING...'}</div>
                    </div>
                </div>
            `;
        }

        const stats = this.meshtasticStats;
        const isOnline = stats.status === 'online';
        const statusClass = isOnline ? 'online' : (stats.status === 'reconnecting' ? 'reconnecting' : 'offline');

        const totalNodes = stats.telemetry?.totalNodes || '--';
        const onlineNodes = stats.telemetry?.onlineNodes || '--';
        const channelUtil = stats.telemetry?.channelUtilization?.toFixed(1) || '--';
        const uptime = stats.telemetry?.uptime || '--';

        return `
            <div class="meshtastic-widget">
                <div class="mesh-widget-compact">
                    <div class="mesh-stat-main">
                        <div class="mesh-node-indicator ${statusClass}"></div>
                        <div class="mesh-node-name">${stats.node?.shortName || 'MESH'}</div>
                    </div>
                    <div class="mesh-stats-grid">
                        <div class="mesh-stat-item">
                            <div class="mesh-stat-label">NODES</div>
                            <div class="mesh-stat-value">${totalNodes}</div>
                            <div class="mesh-stat-sub">${onlineNodes} online</div>
                        </div>
                        <div class="mesh-stat-item">
                            <div class="mesh-stat-label">CH UTIL</div>
                            <div class="mesh-stat-value">${channelUtil}%</div>
                        </div>
                        <div class="mesh-stat-item">
                            <div class="mesh-stat-label">UPTIME</div>
                            <div class="mesh-stat-value">${uptime}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Start automatic stat updates
     */
    startAutoUpdate() {
        this.updateInterval = this.setInterval('auto-update', async () => {
            await this.fetchMeshtasticStats();
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
        this.modalOverlay.className = 'mesh-modal-overlay';
        this.modalOverlay.id = `${this.id}-modal`;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'mesh-modal-container';

        // Modal structure with tabs
        modalContainer.innerHTML = `
            <div class="mesh-modal-header">
                <div class="mesh-modal-title">&gt; MESHTASTIC_NETWORK</div>
                <button class="mesh-modal-close" data-action="close-modal">X</button>
            </div>
            <div class="mesh-modal-tabs">
                <button class="mesh-tab active" data-tab="status">STATUS</button>
                <button class="mesh-tab" data-tab="leaderboard">RECORDS</button>
                <button class="mesh-tab" data-tab="longfast">LONGFAST</button>
                <button class="mesh-tab" data-tab="activity">ACTIVITY</button>
            </div>
            <div class="mesh-modal-content" id="${this.id}-modal-content">
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
            // Handle tab switching
            const tab = e.target.closest('[data-tab]');
            if (tab) {
                this.switchTab(tab.dataset.tab);
                return;
            }

            // Handle button actions
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
     * Switch between modal tabs
     */
    switchTab(tabName) {
        this.activeTab = tabName;

        // Update tab active state
        const tabs = this.modalOverlay.querySelectorAll('.mesh-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Re-render modal content
        const modalContent = document.getElementById(`${this.id}-modal-content`);
        if (modalContent) {
            modalContent.innerHTML = this.renderModalContent();
        }
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
        await this.fetchMeshtasticStats();

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
            modalContent.innerHTML = '<div class="mesh-loading">LOADING MESH DATA...</div>';
            await this.fetchMeshtasticStats();
            modalContent.innerHTML = this.renderModalContent();
        }
    }

    /**
     * Render the modal content based on active tab
     */
    renderModalContent() {
        if (this.meshtasticStats?.status === 'not_configured') {
            return `
                <div class="mesh-not-configured">
                    <div class="mesh-empty-icon">📡</div>
                    <div class="mesh-empty-text">Meshtastic Not Configured</div>
                    <div class="mesh-empty-sub">
                        To use the Meshtastic panel, configure your meshing-around log path in Settings > SERVICES.
                    </div>
                    <a href="settings.html" class="mesh-settings-link">Go to Settings</a>
                </div>
            `;
        }

        if (!this.meshtasticStats || this.meshtasticStats.status === 'error') {
            return '<div class="mesh-error">ERROR LOADING MESH DATA</div>';
        }

        switch (this.activeTab) {
            case 'status':
                return this.renderStatusTab();
            case 'leaderboard':
                return this.renderLeaderboardTab();
            case 'longfast':
                return this.renderLongfastTab();
            case 'activity':
                return this.renderActivityTab();
            default:
                return this.renderStatusTab();
        }
    }

    /**
     * Render the Status tab content
     */
    renderStatusTab() {
        const stats = this.meshtasticStats;
        const tel = stats.telemetry || {};
        const node = stats.node || {};

        const isOnline = stats.status === 'online';
        const statusColor = isOnline ? 'var(--neon-green)' : 'var(--error-red)';

        return `
            <div class="mesh-status-tab">
                <!-- Node Info -->
                <div class="mesh-node-info">
                    <div class="mesh-node-name-large">${node.name || 'Unknown'} (${node.shortName || '??'})</div>
                    <div class="mesh-node-id">NodeID: ${node.nodeId || '--'} | ${node.nodeHex || '--'}</div>
                    <div class="mesh-node-status" style="color: ${statusColor};">
                        <span class="mesh-status-dot" style="background: ${statusColor};"></span>
                        ${stats.status?.toUpperCase() || 'UNKNOWN'}
                    </div>
                </div>

                <!-- Telemetry Grid -->
                <div class="mesh-telemetry-grid">
                    <div class="mesh-telemetry-item">
                        <span class="label">PACKETS RX</span>
                        <span class="value">${tel.packetsRx?.toLocaleString() || '--'}</span>
                        ${tel.packetsRxErr > 0 ? `<span class="error">(${tel.packetsRxErr} errors)</span>` : ''}
                    </div>
                    <div class="mesh-telemetry-item">
                        <span class="label">PACKETS TX</span>
                        <span class="value">${tel.packetsTx?.toLocaleString() || '--'}</span>
                        ${tel.packetsTxErr > 0 ? `<span class="error">(${tel.packetsTxErr} errors)</span>` : ''}
                    </div>
                    <div class="mesh-telemetry-item">
                        <span class="label">CHANNEL UTIL</span>
                        <span class="value">${tel.channelUtilization?.toFixed(1) || '--'}%</span>
                    </div>
                    <div class="mesh-telemetry-item">
                        <span class="label">AIR TX TIME</span>
                        <span class="value">${tel.airTxTime?.toFixed(1) || '--'}%</span>
                    </div>
                    <div class="mesh-telemetry-item">
                        <span class="label">TOTAL NODES</span>
                        <span class="value">${tel.totalNodes || '--'}</span>
                    </div>
                    <div class="mesh-telemetry-item">
                        <span class="label">ONLINE</span>
                        <span class="value green">${tel.onlineNodes || '--'}</span>
                    </div>
                    <div class="mesh-telemetry-item">
                        <span class="label">UPTIME</span>
                        <span class="value">${tel.uptime || '--'}</span>
                    </div>
                    <div class="mesh-telemetry-item">
                        <span class="label">VOLTAGE</span>
                        <span class="value">${tel.voltage?.toFixed(1) || '--'}V</span>
                    </div>
                </div>

                <!-- Firmware Info -->
                <div class="mesh-firmware">
                    FIRMWARE: ${tel.firmware || 'Unknown'}
                </div>

                <!-- Refresh Button -->
                <div class="mesh-modal-actions">
                    <button class="mesh-modal-refresh" data-action="refresh-stats">
                        REFRESH STATS
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render the Leaderboard tab content
     */
    renderLeaderboardTab() {
        const lb = this.meshtasticStats.leaderboard || {};

        const records = [
            { key: 'speed', icon: '🚓', label: 'SPEED', data: lb.speed },
            { key: 'coldest', icon: '🥶', label: 'COLDEST', data: lb.coldest },
            { key: 'hottest', icon: '🥵', label: 'HOTTEST', data: lb.hottest },
            { key: 'altitude', icon: '🪜', label: 'ALTITUDE', data: lb.altitude },
            { key: 'lowBattery', icon: '🪫', label: 'LOW BATTERY', data: lb.lowBattery },
            { key: 'airQuality', icon: '💨', label: 'AIR QUALITY', data: lb.airQuality }
        ];

        const recordCards = records.map(rec => {
            if (!rec.data) {
                return `
                    <div class="mesh-record-card empty">
                        <div class="mesh-record-icon">${rec.icon}</div>
                        <div class="mesh-record-category">${rec.label}</div>
                        <div class="mesh-record-value">--</div>
                        <div class="mesh-record-node">No record</div>
                    </div>
                `;
            }

            const time = rec.data.timestamp ? rec.data.timestamp.split(' ')[1]?.substring(0, 5) : '';

            return `
                <div class="mesh-record-card">
                    <div class="mesh-record-icon">${rec.icon}</div>
                    <div class="mesh-record-category">${rec.label}</div>
                    <div class="mesh-record-value">${rec.data.value}${rec.data.unit}</div>
                    <div class="mesh-record-node">${rec.data.shortName}</div>
                    ${time ? `<div class="mesh-record-time">${time}</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="mesh-leaderboard-tab">
                <div class="mesh-leaderboard-header">MESH LEADERBOARD</div>
                <div class="mesh-leaderboard-grid">
                    ${recordCards}
                </div>
                <div class="mesh-leaderboard-footer">
                    Records from today's mesh activity
                </div>
            </div>
        `;
    }

    /**
     * Render the LongFast tab content (Channel 0 messages)
     */
    renderLongfastTab() {
        const messages = this.meshtasticStats.messages?.longfast || [];

        if (messages.length === 0) {
            return `
                <div class="mesh-messages-tab">
                    <div class="mesh-activity-empty">
                        <div class="mesh-empty-icon">📻</div>
                        <div class="mesh-empty-text">No LongFast messages</div>
                        <div class="mesh-empty-sub">Channel 0 messages will appear here</div>
                    </div>
                </div>
            `;
        }

        const messageItems = messages.map(msg => {
            const time = msg.timestamp ? msg.timestamp.split(' ')[1]?.substring(0, 5) : '--:--';

            return `
                <div class="mesh-message-item">
                    <div class="mesh-message-header">
                        <span class="mesh-message-from">${this.escapeHtml(msg.nodeShortName)}</span>
                        <span class="mesh-message-time">${time}</span>
                    </div>
                    <div class="mesh-message-text">${this.escapeHtml(msg.message)}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="mesh-messages-tab">
                <div class="mesh-messages-header">
                    <span class="mesh-messages-title">LONGFAST (CH0)</span>
                    <span class="mesh-messages-count">${messages.length} messages</span>
                </div>
                <div class="mesh-messages-list">
                    ${messageItems}
                </div>
            </div>
        `;
    }

    /**
     * Render the Activity tab content
     */
    renderActivityTab() {
        const activity = this.meshtasticStats.recentActivity || [];

        if (activity.length === 0) {
            return `
                <div class="mesh-activity-tab">
                    <div class="mesh-activity-empty">
                        <div class="mesh-empty-icon">📭</div>
                        <div class="mesh-empty-text">No recent activity</div>
                    </div>
                </div>
            `;
        }

        const activityItems = activity.map(item => {
            const time = item.timestamp ? item.timestamp.split(' ')[1]?.substring(0, 5) : '--:--';

            return `
                <div class="mesh-activity-item ${item.type}">
                    <div class="mesh-activity-time">${time}</div>
                    <div class="mesh-activity-icon">${item.icon}</div>
                    <div class="mesh-activity-content">
                        <div class="mesh-activity-message">${this.escapeHtml(item.message)}</div>
                        <div class="mesh-activity-node">${this.escapeHtml(item.nodeShortName)}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="mesh-activity-tab">
                <div class="mesh-activity-header">RECENT ACTIVITY</div>
                <div class="mesh-activity-list">
                    ${activityItems}
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

        this.log('Meshtastic panel destroyed');
    }
}
