/**
 * Settings Service - Unified settings management for Cyber Kiosk
 *
 * Provides a single source of truth for all user preferences:
 * - Theme settings (current theme, CRT effects, animations)
 * - Display settings (font size, refresh interval)
 * - Panel configuration (enabled panels, layout positions)
 *
 * Handles both localStorage (cache) and server persistence
 */

class SettingsService {
    constructor() {
        this.settings = null;
        this.defaultSettings = null;
        this.initialized = false;
        this.listeners = new Map();

        // Local storage key for caching
        this.CACHE_KEY = 'cyber-kiosk-settings-cache';
        this.VERSION = '1.0.0';
    }

    /**
     * Initialize the settings service
     * Loads settings from server with localStorage fallback
     */
    async init() {
        if (this.initialized) {
            return this.settings;
        }

        console.log('[SettingsService] Initializing...');

        // Load defaults first
        await this.loadDefaults();

        // Try to load from server, fallback to cache
        try {
            this.settings = await this.loadFromServer();
            console.log('[SettingsService] Loaded settings from server');
        } catch (error) {
            console.warn('[SettingsService] Could not load from server, using cache:', error.message);
            this.settings = this.loadFromCache();
        }

        // If no settings found, use defaults
        if (!this.settings) {
            console.log('[SettingsService] No settings found, using defaults');
            this.settings = this.createDefaultSettings();
        }

        // Migrate old localStorage settings if needed
        this.migrateOldSettings();

        // Cache settings locally
        this.saveToCache();

        this.initialized = true;
        console.log('[SettingsService] Initialized with settings:', this.settings);

        // Emit initial settings so components can sync
        this.emit('themeChange', this.settings.theme.current);
        this.emit('settingsLoaded', this.settings);

        return this.settings;
    }

    /**
     * Load default settings from server config
     */
    async loadDefaults() {
        try {
            const response = await fetch('/config/defaults.json');
            if (response.ok) {
                this.defaultSettings = await response.json();
            }
        } catch (error) {
            console.warn('[SettingsService] Could not load defaults:', error);
        }

        // Fallback defaults if server unavailable
        if (!this.defaultSettings) {
            this.defaultSettings = {
                theme: { default: 'cyberpunk' },
                panels: {},
                display: {}
            };
        }
    }

    /**
     * Create default settings structure
     */
    createDefaultSettings() {
        return {
            version: this.VERSION,
            lastUpdated: new Date().toISOString(),
            currentProfile: null,
            theme: {
                current: this.defaultSettings?.theme?.default || 'cyberpunk',
                crtEffects: true,
                animations: true
            },
            display: {
                fontSize: 'medium',
                refreshInterval: 300000
            },
            panels: {
                enabled: {
                    weather: true,
                    markets: true,
                    news: true,
                    timer: false,
                    music: false,
                    cyberspace: true,
                    video: true,
                    system: true,
                    calendar: false
                },
                layout: null
            }
        };
    }

    /**
     * Load settings from server
     */
    async loadFromServer() {
        const response = await fetch('/config/user-settings');
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        return data.settings || data;
    }

    /**
     * Save settings to server
     */
    async saveToServer() {
        try {
            const response = await fetch('/config/user-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: this.settings,
                    lastUpdated: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            console.log('[SettingsService] Settings saved to server');
            return true;
        } catch (error) {
            console.error('[SettingsService] Failed to save to server:', error);
            return false;
        }
    }

    /**
     * Load settings from localStorage cache
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.warn('[SettingsService] Could not load from cache:', error);
        }
        return null;
    }

    /**
     * Save settings to localStorage cache
     */
    saveToCache() {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.warn('[SettingsService] Could not save to cache:', error);
        }
    }

    /**
     * Migrate old localStorage settings to new unified format
     */
    migrateOldSettings() {
        const oldKeys = {
            theme: 'cyber-kiosk-theme',
            crtEffects: 'crtEffects',
            animations: 'animations',
            fontSize: 'fontSize',
            refreshInterval: 'refreshInterval',
            currentProfile: 'currentProfile'
        };

        let migrated = false;

        // Check for old theme setting
        const oldTheme = localStorage.getItem(oldKeys.theme);
        if (oldTheme && !this.settings.theme.current) {
            this.settings.theme.current = oldTheme;
            migrated = true;
        }

        // Check for old display settings
        const oldCrt = localStorage.getItem(oldKeys.crtEffects);
        if (oldCrt !== null) {
            this.settings.theme.crtEffects = oldCrt !== 'false';
            migrated = true;
        }

        const oldAnimations = localStorage.getItem(oldKeys.animations);
        if (oldAnimations !== null) {
            this.settings.theme.animations = oldAnimations !== 'false';
            migrated = true;
        }

        const oldFontSize = localStorage.getItem(oldKeys.fontSize);
        if (oldFontSize) {
            this.settings.display.fontSize = oldFontSize;
            migrated = true;
        }

        const oldRefresh = localStorage.getItem(oldKeys.refreshInterval);
        if (oldRefresh) {
            this.settings.display.refreshInterval = parseInt(oldRefresh, 10);
            migrated = true;
        }

        // Check for old currentProfile setting
        const oldProfile = localStorage.getItem(oldKeys.currentProfile);
        if (oldProfile && !this.settings.currentProfile) {
            this.settings.currentProfile = oldProfile;
            migrated = true;
        }

        if (migrated) {
            console.log('[SettingsService] Migrated old localStorage settings');
            // Clean up old keys after successful migration
            // Object.values(oldKeys).forEach(key => localStorage.removeItem(key));
        }
    }

    // ==================== Getters ====================

    /**
     * Get all settings
     */
    getAll() {
        return { ...this.settings };
    }

    /**
     * Get theme settings
     */
    getTheme() {
        return { ...this.settings.theme };
    }

    /**
     * Get current theme name
     */
    getCurrentTheme() {
        return this.settings.theme.current;
    }

    /**
     * Get CRT effects enabled state
     */
    getCrtEffects() {
        return this.settings.theme.crtEffects;
    }

    /**
     * Get animations enabled state
     */
    getAnimations() {
        return this.settings.theme.animations;
    }

    /**
     * Get display settings
     */
    getDisplay() {
        return { ...this.settings.display };
    }

    /**
     * Get font size setting
     */
    getFontSize() {
        return this.settings.display.fontSize;
    }

    /**
     * Get refresh interval setting
     */
    getRefreshInterval() {
        return this.settings.display.refreshInterval;
    }

    /**
     * Get panel settings
     */
    getPanels() {
        return { ...this.settings.panels };
    }

    /**
     * Get enabled state for a specific panel
     */
    isPanelEnabled(panelId) {
        return this.settings.panels.enabled[panelId] ?? false;
    }

    /**
     * Get all enabled panel IDs
     */
    getEnabledPanels() {
        return Object.entries(this.settings.panels.enabled)
            .filter(([_, enabled]) => enabled)
            .map(([id]) => id);
    }

    /**
     * Get panel layout configuration
     */
    getLayout() {
        return this.settings.panels.layout;
    }

    // ==================== Setters ====================

    /**
     * Set theme
     */
    setTheme(themeName) {
        if (this.settings.theme.current !== themeName) {
            this.settings.theme.current = themeName;
            this.emit('themeChange', themeName);
            this.onSettingsChanged();
        }
    }

    /**
     * Set CRT effects
     */
    setCrtEffects(enabled) {
        if (this.settings.theme.crtEffects !== enabled) {
            this.settings.theme.crtEffects = enabled;
            this.emit('crtEffectsChange', enabled);
            this.onSettingsChanged();
        }
    }

    /**
     * Set animations
     */
    setAnimations(enabled) {
        if (this.settings.theme.animations !== enabled) {
            this.settings.theme.animations = enabled;
            this.emit('animationsChange', enabled);
            this.onSettingsChanged();
        }
    }

    /**
     * Set font size
     */
    setFontSize(size) {
        if (this.settings.display.fontSize !== size) {
            this.settings.display.fontSize = size;
            this.emit('fontSizeChange', size);
            this.onSettingsChanged();
        }
    }

    /**
     * Set refresh interval
     */
    setRefreshInterval(interval) {
        const intVal = parseInt(interval, 10);
        if (this.settings.display.refreshInterval !== intVal) {
            this.settings.display.refreshInterval = intVal;
            this.emit('refreshIntervalChange', intVal);
            this.onSettingsChanged();
        }
    }

    /**
     * Set panel enabled state
     */
    setPanelEnabled(panelId, enabled) {
        if (this.settings.panels.enabled[panelId] !== enabled) {
            this.settings.panels.enabled[panelId] = enabled;
            this.emit('panelChange', { panelId, enabled });
            this.onSettingsChanged();
        }
    }

    /**
     * Set multiple panel states at once
     */
    setPanelsEnabled(panelStates) {
        let changed = false;
        Object.entries(panelStates).forEach(([panelId, enabled]) => {
            if (this.settings.panels.enabled[panelId] !== enabled) {
                this.settings.panels.enabled[panelId] = enabled;
                changed = true;
            }
        });
        if (changed) {
            this.emit('panelsChange', panelStates);
            this.onSettingsChanged();
        }
    }

    /**
     * Set panel layout
     */
    setLayout(layout) {
        this.settings.panels.layout = layout;
        this.emit('layoutChange', layout);
        this.onSettingsChanged();
    }

    /**
     * Bulk update settings
     */
    update(updates) {
        let changed = false;

        if (updates.theme !== undefined) {
            this.settings.theme.current = updates.theme;
            changed = true;
        }
        if (updates.crtEffects !== undefined) {
            this.settings.theme.crtEffects = updates.crtEffects;
            changed = true;
        }
        if (updates.animations !== undefined) {
            this.settings.theme.animations = updates.animations;
            changed = true;
        }
        if (updates.fontSize !== undefined) {
            this.settings.display.fontSize = updates.fontSize;
            changed = true;
        }
        if (updates.refreshInterval !== undefined) {
            this.settings.display.refreshInterval = parseInt(updates.refreshInterval, 10);
            changed = true;
        }
        if (updates.panels !== undefined) {
            Object.assign(this.settings.panels.enabled, updates.panels);
            changed = true;
        }
        if (updates.layout !== undefined) {
            this.settings.panels.layout = updates.layout;
            changed = true;
        }

        if (changed) {
            this.emit('settingsChange', this.settings);
            this.onSettingsChanged();
        }
    }

    // ==================== Persistence ====================

    /**
     * Called when settings change - saves to cache immediately
     */
    onSettingsChanged() {
        this.settings.lastUpdated = new Date().toISOString();
        this.saveToCache();
    }

    /**
     * Save all settings to server and cache
     */
    async save() {
        this.saveToCache();
        const serverSaved = await this.saveToServer();

        // Also save to panels.json for backwards compatibility
        await this.savePanelsConfig();

        this.emit('settingsSaved', { serverSaved });
        return serverSaved;
    }

    /**
     * Save panel configuration to panels.json (backwards compatibility)
     */
    async savePanelsConfig() {
        try {
            const panelConfig = {
                version: this.VERSION,
                activePanels: Object.entries(this.settings.panels.enabled).map(([id, visible]) => ({
                    id,
                    visible
                })),
                layout: this.settings.panels.layout,
                panelsEnabled: this.settings.panels.enabled,
                lastUpdated: new Date().toISOString()
            };

            const response = await fetch('/config/panels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(panelConfig)
            });

            if (!response.ok) {
                console.warn('[SettingsService] Could not save panels config');
            }
        } catch (error) {
            console.warn('[SettingsService] Error saving panels config:', error);
        }
    }

    /**
     * Reset all settings to defaults
     */
    async reset() {
        this.settings = this.createDefaultSettings();
        this.saveToCache();

        // Clear old localStorage keys
        const oldKeys = ['cyber-kiosk-theme', 'crtEffects', 'animations', 'fontSize', 'refreshInterval', 'currentProfile'];
        oldKeys.forEach(key => localStorage.removeItem(key));

        // Try to reset on server
        try {
            await fetch('/config/user-settings/reset', { method: 'POST' });
            await fetch('/config/panels/reset', { method: 'POST' });
        } catch (error) {
            console.warn('[SettingsService] Could not reset server config:', error);
        }

        this.emit('settingsReset', this.settings);
        return this.settings;
    }

    // ==================== Event System ====================

    /**
     * Subscribe to settings changes
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Emit event to all listeners
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[SettingsService] Error in ${event} listener:`, error);
                }
            });
        }

        // Also dispatch DOM event for cross-component communication
        window.dispatchEvent(new CustomEvent(`settings:${event}`, { detail: data }));
    }

    // ==================== Compatibility Layer ====================

    /**
     * Get settings in legacy format (for backwards compatibility with settings.js)
     */
    toLegacyFormat() {
        return {
            theme: this.settings.theme.current,
            crtEffects: this.settings.theme.crtEffects,
            animations: this.settings.theme.animations,
            fontSize: this.settings.display.fontSize,
            refreshInterval: this.settings.display.refreshInterval.toString(),
            panels: Object.entries(this.settings.panels.enabled).map(([id, visible]) => ({
                id,
                visible
            })),
            layout: this.settings.panels.layout
        };
    }

    /**
     * Import settings from legacy format
     */
    fromLegacyFormat(legacy) {
        this.settings.theme.current = legacy.theme || this.settings.theme.current;
        this.settings.theme.crtEffects = legacy.crtEffects ?? this.settings.theme.crtEffects;
        this.settings.theme.animations = legacy.animations ?? this.settings.theme.animations;
        this.settings.display.fontSize = legacy.fontSize || this.settings.display.fontSize;
        this.settings.display.refreshInterval = parseInt(legacy.refreshInterval, 10) || this.settings.display.refreshInterval;

        if (legacy.panels && Array.isArray(legacy.panels)) {
            legacy.panels.forEach(panel => {
                this.settings.panels.enabled[panel.id] = panel.visible;
            });
        }

        if (legacy.layout) {
            this.settings.panels.layout = legacy.layout;
        }

        this.onSettingsChanged();
    }
}

// Create and export singleton instance
window.settingsService = new SettingsService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsService;
}
