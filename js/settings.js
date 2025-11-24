/**
 * Settings Page Logic
 * Handles theme switching, panel configuration, display settings, and about info
 */

class SettingsManager {
    constructor() {
        this.hasUnsavedChanges = false;
        this.currentSettings = null;
        this.defaultSettings = null;

        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log('[Settings] Initializing settings manager...');

        // Initialize profile manager first
        await window.profileManager.init();

        // Set up profile management UI
        this.setupProfileManagement();

        // Load current settings
        await this.loadSettings();

        // Set up tab navigation
        this.setupTabs();

        // Set up theme selector
        this.setupThemeSelector();

        // Set up panel toggles
        this.setupPanelToggles();

        // Set up display settings
        this.setupDisplaySettings();

        // Set up action buttons
        this.setupActionButtons();

        // Populate about tab
        this.populateAboutInfo();

        // Update current theme indicator
        this.updateCurrentThemeIndicator();

        // Warn user about unsaved changes
        this.setupUnsavedChangesWarning();

        // Initialize layout editor
        this.setupLayoutEditor();

        console.log('[Settings] Settings manager ready');
    }

    /**
     * Set up layout editor
     */
    setupLayoutEditor() {
        if (window.layoutEditor) {
            window.layoutEditor.init();

            // Load layout from current settings if available
            if (this.currentSettings && this.currentSettings.layout) {
                window.layoutEditor.loadLayout(this.currentSettings.layout);
            }

            // Listen for panel toggle changes to update palette
            document.querySelectorAll('[data-panel]').forEach(toggle => {
                toggle.addEventListener('change', () => {
                    window.layoutEditor.updatePanelPalette();
                });
            });
        }
    }

    /**
     * Set up profile management UI
     */
    setupProfileManagement() {
        console.log('[Settings] Setting up profile management...');

        // Update current profile display
        this.updateCurrentProfileDisplay();

        // Load and display all profiles
        this.loadProfilesList();

        // Set up create profile button
        const createBtn = document.getElementById('create-profile-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateProfileDialog());
        }

        // Listen for profile changes
        window.addEventListener('profileChanged', () => {
            this.updateCurrentProfileDisplay();
            this.loadProfilesList();
        });
    }

    /**
     * Update current profile display banner
     */
    updateCurrentProfileDisplay() {
        const profile = window.profileManager.getCurrentProfile();
        if (!profile) return;

        const emojiEl = document.getElementById('current-profile-emoji');
        const nameEl = document.getElementById('current-profile-name');

        if (emojiEl) emojiEl.textContent = profile.emoji || '👤';
        if (nameEl) nameEl.textContent = profile.name || 'Unknown';
    }

    /**
     * Load and display profiles list
     */
    async loadProfilesList() {
        const profilesList = document.getElementById('profiles-list');
        if (!profilesList) return;

        const profiles = await window.profileManager.loadProfiles();
        const currentProfile = window.profileManager.getCurrentProfile();

        profilesList.innerHTML = '';

        profiles.forEach(profile => {
            const isCurrent = currentProfile && profile.id === currentProfile.id;

            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card' + (isCurrent ? ' profile-card-active' : '');
            profileCard.innerHTML = `
                <div class="profile-card-header">
                    <span class="profile-emoji">${profile.emoji || '👤'}</span>
                    <div class="profile-info">
                        <div class="profile-name">${profile.name}</div>
                        <div class="profile-meta">
                            ${isCurrent ? '<span class="profile-badge">ACTIVE</span>' : ''}
                            <span class="profile-last-used">Last used: ${this.formatDate(profile.lastUsed)}</span>
                        </div>
                    </div>
                </div>
                <div class="profile-card-actions">
                    ${!isCurrent ? `<button class="btn btn-secondary profile-switch-btn" data-profile-id="${profile.id}">SWITCH</button>` : ''}
                    <button class="btn btn-secondary profile-edit-btn" data-profile-id="${profile.id}">EDIT</button>
                    ${profiles.length > 1 ? `<button class="btn btn-danger profile-delete-btn" data-profile-id="${profile.id}">DELETE</button>` : ''}
                </div>
            `;

            profilesList.appendChild(profileCard);
        });

        // Attach event listeners to profile action buttons
        profilesList.querySelectorAll('.profile-switch-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const profileId = e.target.dataset.profileId;
                await this.switchToProfile(profileId);
            });
        });

        profilesList.querySelectorAll('.profile-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const profileId = e.target.dataset.profileId;
                this.showEditProfileDialog(profileId);
            });
        });

        profilesList.querySelectorAll('.profile-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const profileId = e.target.dataset.profileId;
                await this.deleteProfile(profileId);
            });
        });
    }

    /**
     * Show create profile dialog
     */
    showCreateProfileDialog() {
        const name = prompt('Enter profile name:');
        if (!name || name.trim().length === 0) return;

        const emoji = prompt('Enter an emoji for this profile (or leave blank for 👤):', '👤');

        this.createProfile(name.trim(), emoji || '👤');
    }

    /**
     * Create a new profile
     */
    async createProfile(name, emoji) {
        try {
            await window.profileManager.createProfile(name, emoji);
            this.showModal('Success', `Profile "${name}" created successfully!`);
            this.loadProfilesList();
        } catch (error) {
            this.showModal('Error', `Failed to create profile: ${error.message}`);
        }
    }

    /**
     * Switch to a different profile
     */
    async switchToProfile(profileId) {
        try {
            await window.profileManager.switchProfile(profileId);
            this.showModal('Profile Switched', 'Reloading page to apply profile settings...');

            // Reload page after short delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            this.showModal('Error', `Failed to switch profile: ${error.message}`);
        }
    }

    /**
     * Show edit profile dialog
     */
    showEditProfileDialog(profileId) {
        const profiles = window.profileManager.getAllProfiles();
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return;

        const newName = prompt('Enter new name:', profile.name);
        if (!newName || newName.trim().length === 0) return;

        const newEmoji = prompt('Enter new emoji:', profile.emoji || '👤');

        this.updateProfileInfo(profileId, newName.trim(), newEmoji || '👤');
    }

    /**
     * Update profile name and emoji
     */
    async updateProfileInfo(profileId, name, emoji) {
        try {
            const profile = await window.profileManager.getProfile(profileId);
            profile.name = name;
            profile.emoji = emoji;

            await window.profileManager.updateProfile(profile);
            this.showModal('Success', 'Profile updated successfully!');
            this.loadProfilesList();
            this.updateCurrentProfileDisplay();
        } catch (error) {
            this.showModal('Error', `Failed to update profile: ${error.message}`);
        }
    }

    /**
     * Delete a profile
     */
    async deleteProfile(profileId) {
        const profiles = window.profileManager.getAllProfiles();
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return;

        if (!confirm(`Are you sure you want to delete profile "${profile.name}"?`)) return;

        try {
            await window.profileManager.deleteProfile(profileId);
            this.showModal('Success', 'Profile deleted successfully!');
            this.loadProfilesList();
        } catch (error) {
            this.showModal('Error', `Failed to delete profile: ${error.message}`);
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hr ago`;
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString();
    }

    /**
     * Load current settings from localStorage and config files
     */
    async loadSettings() {
        try {
            // Load from localStorage (client-side settings)
            const theme = localStorage.getItem('cyber-kiosk-theme') || 'cyberpunk';
            const crtEffects = localStorage.getItem('crtEffects') !== 'false';
            const animations = localStorage.getItem('animations') !== 'false';
            const fontSize = localStorage.getItem('fontSize') || 'medium';
            const refreshInterval = localStorage.getItem('refreshInterval') || '300000';

            // Try to load panel configuration from server
            let panelConfig = null;
            try {
                const response = await fetch('/config/panels.json');
                if (response.ok) {
                    panelConfig = await response.json();
                }
            } catch (error) {
                console.warn('[Settings] Could not load panel config from server:', error);
            }

            // Fallback to default panel config
            if (!panelConfig) {
                panelConfig = {
                    activePanels: [
                        { id: 'weather', visible: true },
                        { id: 'markets', visible: true },
                        { id: 'news', visible: true },
                        { id: 'timer', visible: true },
                        { id: 'music', visible: true },
                        { id: 'cyberspace', visible: true },
                        { id: 'video', visible: false },
                        { id: 'system', visible: false }
                    ]
                };
            }

            this.currentSettings = {
                theme,
                crtEffects,
                animations,
                fontSize,
                refreshInterval,
                panels: panelConfig.activePanels || [],
                layout: panelConfig.layout || null
            };

            console.log('[Settings] Loaded settings:', this.currentSettings);

            // Apply settings to UI
            this.applySettingsToUI();

        } catch (error) {
            console.error('[Settings] Error loading settings:', error);
        }
    }

    /**
     * Apply loaded settings to the settings UI
     */
    applySettingsToUI() {
        const { panels, crtEffects, animations, fontSize, refreshInterval } = this.currentSettings;

        // Apply panel toggles
        panels.forEach(panel => {
            const checkbox = document.getElementById(`panel-${panel.id}`);
            if (checkbox) {
                checkbox.checked = panel.visible;
            }
        });

        // Apply display settings
        const crtCheckbox = document.getElementById('crt-effects');
        if (crtCheckbox) crtCheckbox.checked = crtEffects;

        const animCheckbox = document.getElementById('animations');
        if (animCheckbox) animCheckbox.checked = animations;

        const fontSelect = document.getElementById('font-size');
        if (fontSelect) fontSelect.value = fontSize;

        const refreshSelect = document.getElementById('refresh-interval');
        if (refreshSelect) refreshSelect.value = refreshInterval;
    }

    /**
     * Set up tab navigation
     */
    setupTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const tabContents = document.querySelectorAll('.settings-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');

                // Remove active class from all tabs and content
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const targetContent = document.getElementById(`tab-${targetTab}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    /**
     * Set up theme selector cards
     */
    setupThemeSelector() {
        const themeButtons = document.querySelectorAll('.theme-select-btn');

        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const themeName = button.getAttribute('data-theme');
                this.selectTheme(themeName);
            });
        });

        // Add click handlers to entire theme cards as well
        const themeCards = document.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking the button directly (to avoid double-fire)
                if (e.target.classList.contains('theme-select-btn')) return;

                const themeName = card.getAttribute('data-theme');
                this.selectTheme(themeName);
            });
        });
    }

    /**
     * Select and apply a theme
     */
    selectTheme(themeName) {
        console.log('[Settings] Selecting theme:', themeName);

        // Update theme manager (this will apply the theme and reload)
        if (window.themeManager) {
            window.themeManager.applyTheme(themeName);
            this.currentSettings.theme = themeName;
            this.markUnsavedChanges();
            this.updateCurrentThemeIndicator();
        } else {
            console.error('[Settings] ThemeManager not available');
        }
    }

    /**
     * Update the current theme indicator
     */
    updateCurrentThemeIndicator() {
        const indicator = document.getElementById('current-theme-name');
        if (indicator) {
            const themeName = this.currentSettings.theme.charAt(0).toUpperCase() +
                             this.currentSettings.theme.slice(1);
            indicator.textContent = themeName;
        }

        // Highlight active theme card
        document.querySelectorAll('.theme-card').forEach(card => {
            if (card.getAttribute('data-theme') === this.currentSettings.theme) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    /**
     * Set up panel toggle switches
     */
    setupPanelToggles() {
        const toggles = document.querySelectorAll('[data-panel]');

        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.markUnsavedChanges();
            });
        });
    }

    /**
     * Set up display settings controls
     */
    setupDisplaySettings() {
        const controls = [
            document.getElementById('crt-effects'),
            document.getElementById('animations'),
            document.getElementById('font-size'),
            document.getElementById('refresh-interval')
        ];

        controls.forEach(control => {
            if (control) {
                control.addEventListener('change', () => {
                    this.markUnsavedChanges();
                });
            }
        });
    }

    /**
     * Set up Save, Reset, and Cancel buttons
     */
    setupActionButtons() {
        const saveBtn = document.getElementById('save-settings');
        const resetBtn = document.getElementById('reset-settings');
        const cancelBtn = document.getElementById('cancel-settings');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToDefaults());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                if (this.hasUnsavedChanges) {
                    const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');
                    if (!confirm) {
                        e.preventDefault();
                    }
                }
            });
        }
    }

    /**
     * Mark that there are unsaved changes
     */
    markUnsavedChanges() {
        this.hasUnsavedChanges = true;
        const indicator = document.getElementById('unsaved-changes-indicator');
        if (indicator) {
            indicator.textContent = 'YES';
            indicator.style.color = 'var(--accent, #ff006e)';
        }
    }

    /**
     * Clear unsaved changes flag
     */
    clearUnsavedChanges() {
        this.hasUnsavedChanges = false;
        const indicator = document.getElementById('unsaved-changes-indicator');
        if (indicator) {
            indicator.textContent = 'NO';
            indicator.style.color = '';
        }
    }

    /**
     * Warn user about unsaved changes when leaving page
     */
    setupUnsavedChangesWarning() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    /**
     * Save settings
     */
    async saveSettings() {
        console.log('[Settings] Saving settings...');

        try {
            // Gather panel settings
            const panelToggles = document.querySelectorAll('[data-panel]');
            const panels = [];

            panelToggles.forEach(toggle => {
                panels.push({
                    id: toggle.getAttribute('data-panel'),
                    visible: toggle.checked
                });
            });

            // Gather display settings
            const crtEffects = document.getElementById('crt-effects')?.checked ?? true;
            const animations = document.getElementById('animations')?.checked ?? true;
            const fontSize = document.getElementById('font-size')?.value || 'medium';
            const refreshInterval = document.getElementById('refresh-interval')?.value || '300000';

            // Save to localStorage (client-side settings)
            localStorage.setItem('crtEffects', crtEffects);
            localStorage.setItem('animations', animations);
            localStorage.setItem('fontSize', fontSize);
            localStorage.setItem('refreshInterval', refreshInterval);

            // Apply CRT effects immediately
            this.applyCRTEffects(crtEffects);

            // Apply animations setting
            document.body.style.setProperty('--animation-speed', animations ? '1' : '0');

            // Apply font size
            document.documentElement.setAttribute('data-font-size', fontSize);

            // Get layout configuration from layout editor
            const layout = window.layoutEditor ? window.layoutEditor.getLayout() : null;

            // Update current settings
            this.currentSettings.crtEffects = crtEffects;
            this.currentSettings.animations = animations;
            this.currentSettings.fontSize = fontSize;
            this.currentSettings.refreshInterval = refreshInterval;
            this.currentSettings.panels = panels;
            this.currentSettings.layout = layout;

            // Try to save panel config to server
            try {
                // Build a set of panels that are in the grid layout
                const panelsInLayout = new Set();
                if (layout && layout.panels) {
                    layout.panels.forEach(panel => {
                        panelsInLayout.add(panel.id);
                        // Also map container IDs to individual panels
                        // e.g., info_feed -> weather, markets
                        if (panel.id === 'info_feed') {
                            panelsInLayout.add('weather');
                            panelsInLayout.add('markets');
                        }
                    });
                }

                // Build complete config data matching panels.json structure
                const configData = {
                    version: "1.0.0",
                    description: "Configuration for Cyber Kiosk responsive system",
                    activePanels: panels,
                    lastUpdated: new Date().toISOString()
                };

                // Add layout if configured
                if (layout && layout.panels && layout.panels.length > 0) {
                    configData.layout = layout;
                }

                // Build panels config with enabled flags synced to layout
                // Panels in the grid layout should be marked as enabled
                configData.panelsEnabled = {};
                panels.forEach(panel => {
                    // Panel is enabled if it's in the layout OR explicitly visible
                    configData.panelsEnabled[panel.id] =
                        panelsInLayout.has(panel.id) || panel.visible;
                });

                const response = await fetch('/config/panels', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(configData)
                });

                if (!response.ok) {
                    console.warn('[Settings] Could not save panel config to server');
                    // Try alternative endpoint
                    const altResponse = await fetch('/api/save-panels', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(configData)
                    });

                    if (!altResponse.ok) {
                        console.warn('[Settings] Could not save to alternative endpoint either');
                    }
                }
            } catch (error) {
                console.warn('[Settings] Could not save panel config to server:', error);
                console.log('[Settings] Config would be saved as:', {
                    activePanels: panels,
                    layout: layout
                });
            }

            // Save theme to user profile
            if (window.profileManager && window.profileManager.getCurrentProfile()) {
                try {
                    await window.profileManager.saveCurrentState({
                        theme: this.currentSettings.theme,
                        settings: {
                            crtEffects,
                            animations,
                            fontSize,
                            refreshInterval
                        }
                    });
                    console.log('[Settings] Theme and settings saved to profile');
                } catch (error) {
                    console.warn('[Settings] Could not save to profile:', error);
                }
            }

            // Clear unsaved changes flag
            this.clearUnsavedChanges();

            // Show success message
            this.showModal('Settings Saved', 'Your settings have been saved successfully. Some changes may require a page reload to take effect.');

            console.log('[Settings] Settings saved successfully');

        } catch (error) {
            console.error('[Settings] Error saving settings:', error);
            this.showModal('Error', 'Failed to save settings. Please try again.');
        }
    }

    /**
     * Apply or remove CRT effects
     */
    applyCRTEffects(enabled) {
        const crtOverlay = document.querySelector('.crt');
        const scanlines = document.querySelector('.scanlines');

        if (crtOverlay) {
            crtOverlay.style.display = enabled ? 'block' : 'none';
        }
        if (scanlines) {
            scanlines.style.display = enabled ? 'block' : 'none';
        }
    }

    /**
     * Reset all settings to defaults
     */
    async resetToDefaults() {
        const confirm = window.confirm('Are you sure you want to reset all settings to their default values?');

        if (!confirm) return;

        console.log('[Settings] Resetting to defaults...');

        try {
            // Clear localStorage
            localStorage.removeItem('cyber-kiosk-theme');
            localStorage.removeItem('crtEffects');
            localStorage.removeItem('animations');
            localStorage.removeItem('fontSize');
            localStorage.removeItem('refreshInterval');

            // Try to reset server config
            try {
                await fetch('/config/panels/reset', {
                    method: 'POST'
                });
            } catch (error) {
                console.warn('[Settings] Could not reset server config:', error);
            }

            // Reload settings
            await this.loadSettings();

            // Clear unsaved changes
            this.clearUnsavedChanges();

            // Show success message
            this.showModal('Settings Reset', 'All settings have been reset to their default values. The page will reload.');

            // Reload page after a delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('[Settings] Error resetting settings:', error);
            this.showModal('Error', 'Failed to reset settings. Please try again.');
        }
    }

    /**
     * Populate About tab with system information
     */
    populateAboutInfo() {
        // Browser info
        const browserInfo = document.getElementById('browser-info');
        if (browserInfo) {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Chrome')) browser = 'Chrome/Chromium';
            else if (ua.includes('Safari')) browser = 'Safari';
            browserInfo.textContent = browser;
        }

        // Screen size
        const screenInfo = document.getElementById('screen-info');
        if (screenInfo) {
            screenInfo.textContent = `${window.screen.width}x${window.screen.height}`;
        }

        // Current layout (from LayoutManager if available)
        const layoutInfo = document.getElementById('layout-info');
        if (layoutInfo && window.layoutManager) {
            layoutInfo.textContent = window.layoutManager.currentBreakpoint || 'Unknown';
        } else if (layoutInfo) {
            layoutInfo.textContent = 'N/A';
        }

        // Active panels count
        const panelsInfo = document.getElementById('panels-info');
        if (panelsInfo) {
            const activePanels = this.currentSettings?.panels?.filter(p => p.visible).length || 0;
            panelsInfo.textContent = `${activePanels} enabled`;
        }
    }

    /**
     * Show modal dialog
     */
    showModal(title, message) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const modalClose = document.getElementById('modal-close');
        const modalContainer = document.querySelector('.modal-container');

        if (!modalOverlay || !modalTitle || !modalContent) return;

        // Add small class for simple messages
        if (modalContainer) {
            modalContainer.classList.add('modal-small');
        }

        modalTitle.textContent = title;
        modalContent.innerHTML = `<p>${message}</p>`;
        modalOverlay.style.display = 'flex';

        // Close modal handlers
        const closeModal = () => {
            modalOverlay.style.display = 'none';
            // Remove small class when closing
            if (modalContainer) {
                modalContainer.classList.remove('modal-small');
            }
        };

        if (modalClose) {
            modalClose.onclick = closeModal;
        }

        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        };
    }
}

// Initialize settings manager when script loads
const settingsManager = new SettingsManager();

// Make it globally accessible for debugging
window.settingsManager = settingsManager;
