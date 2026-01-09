/**
 * Panel Registry - Defines all available panels for the Cyber Kiosk
 *
 * This registry contains metadata for all panels that can be displayed
 * in the kiosk interface. Panels can be enabled/disabled and positioned
 * through the configuration system.
 */

const AVAILABLE_PANELS = {
    weather: {
        id: 'weather',
        name: 'Weather',
        icon: '☀️',
        component: 'WeatherPanel',
        minSize: 'small',
        defaultSize: 'medium',
        category: 'info',
        description: 'Current weather and forecast information',
        enabled: true,
        priority: 1
    },

    markets: {
        id: 'markets',
        name: 'Markets',
        icon: '📈',
        component: 'MarketsPanel',
        minSize: 'small',
        defaultSize: 'medium',
        category: 'info',
        description: 'Financial market data and cryptocurrency prices',
        enabled: false, // Not implemented yet in current version
        priority: 2
    },

    news: {
        id: 'news',
        name: 'News Feed',
        icon: '📰',
        component: 'NewsPanel',
        minSize: 'medium',
        defaultSize: 'large',
        category: 'info',
        description: 'Latest news from various sources',
        enabled: true,
        priority: 3
    },

    video: {
        id: 'video',
        name: 'Video Player',
        icon: '📺',
        component: 'VideoPanel',
        minSize: 'medium',
        defaultSize: 'medium',
        category: 'media',
        description: 'YouTube video display and selection',
        enabled: true,
        priority: 4
    },

    cyberspace: {
        id: 'cyberspace',
        name: 'Cyberspace',
        icon: '🌐',
        component: 'CyberspacePanel',
        minSize: 'small',
        defaultSize: 'medium',
        category: 'web',
        description: 'Cyberspace web preview',
        enabled: true,
        priority: 5
    },

    timer: {
        id: 'timer',
        name: 'Timer & Alarm',
        icon: '⏰',
        component: 'TimerPanel',
        minSize: 'small',
        defaultSize: 'small',
        category: 'tools',
        description: 'Countdown timers and alarm functionality',
        enabled: false, // To be implemented in Phase 2
        priority: 6
    },

    music: {
        id: 'music',
        name: 'Music Player',
        icon: '🎵',
        component: 'MusicPanel',
        minSize: 'small',
        defaultSize: 'medium',
        category: 'media',
        description: 'Spotify music player integration',
        enabled: true,
        priority: 7
    },

    calendar: {
        id: 'calendar',
        name: 'Calendar',
        icon: '📅',
        component: 'CalendarPanel',
        minSize: 'small',
        defaultSize: 'medium',
        category: 'tools',
        description: 'Calendar with events and reminders. Click header to expand.',
        enabled: true,
        priority: 8
    },

    system: {
        id: 'system',
        name: 'System Monitor',
        icon: '💻',
        component: 'SystemPanel',
        minSize: 'small',
        defaultSize: 'medium',
        category: 'system',
        description: 'System temperature, memory, and status information',
        enabled: true,
        priority: 9
    },

    meshtastic: {
        id: 'meshtastic',
        name: 'Meshtastic',
        icon: '📡',
        component: 'MeshtasticPanel',
        minSize: 'small',
        defaultSize: 'small',
        category: 'system',
        description: 'Meshtastic mesh network status and activity',
        enabled: true,
        priority: 10
    }
};

/**
 * Panel Categories - Organize panels by type
 */
const PANEL_CATEGORIES = {
    info: {
        id: 'info',
        name: 'Information',
        icon: 'ℹ️',
        description: 'Weather, news, and market data'
    },
    media: {
        id: 'media',
        name: 'Media',
        icon: '🎬',
        description: 'Video and music players'
    },
    web: {
        id: 'web',
        name: 'Web',
        icon: '🌐',
        description: 'Web browsing and preview'
    },
    tools: {
        id: 'tools',
        name: 'Tools',
        icon: '🔧',
        description: 'Timers, alarms, and utilities'
    },
    system: {
        id: 'system',
        name: 'System',
        icon: '⚙️',
        description: 'System monitoring and status'
    }
};

/**
 * Panel Size Definitions
 */
const PANEL_SIZES = {
    small: {
        id: 'small',
        name: 'Small',
        gridSpan: 1,
        minHeight: '200px'
    },
    medium: {
        id: 'medium',
        name: 'Medium',
        gridSpan: 1,
        minHeight: '300px'
    },
    large: {
        id: 'large',
        name: 'Large',
        gridSpan: 2,
        minHeight: '300px'
    },
    xlarge: {
        id: 'xlarge',
        name: 'Extra Large',
        gridSpan: 3,
        minHeight: '400px'
    }
};

/**
 * Get all available panels
 * @returns {Object} All panels in the registry
 */
function getAllPanels() {
    return AVAILABLE_PANELS;
}

/**
 * Get enabled panels only
 * @returns {Object} Only panels marked as enabled
 */
function getEnabledPanels() {
    return Object.fromEntries(
        Object.entries(AVAILABLE_PANELS).filter(([_, panel]) => panel.enabled)
    );
}

/**
 * Get panels by category
 * @param {string} category - Category ID to filter by
 * @returns {Object} Panels in the specified category
 */
function getPanelsByCategory(category) {
    return Object.fromEntries(
        Object.entries(AVAILABLE_PANELS).filter(([_, panel]) => panel.category === category)
    );
}

/**
 * Get panel by ID
 * @param {string} panelId - ID of the panel to retrieve
 * @returns {Object|null} Panel object or null if not found
 */
function getPanelById(panelId) {
    return AVAILABLE_PANELS[panelId] || null;
}

/**
 * Check if a panel is enabled
 * @param {string} panelId - ID of the panel to check
 * @returns {boolean} True if panel is enabled
 */
function isPanelEnabled(panelId) {
    const panel = getPanelById(panelId);
    return panel ? panel.enabled : false;
}

/**
 * Get panels sorted by priority
 * @returns {Array} Array of panels sorted by priority (lowest first)
 */
function getPanelsByPriority() {
    return Object.values(AVAILABLE_PANELS).sort((a, b) => a.priority - b.priority);
}

/**
 * Get all panel categories
 * @returns {Object} All panel categories
 */
function getAllCategories() {
    return PANEL_CATEGORIES;
}

/**
 * Get panel size definition
 * @param {string} sizeId - Size ID to retrieve
 * @returns {Object|null} Size definition or null if not found
 */
function getPanelSize(sizeId) {
    return PANEL_SIZES[sizeId] || null;
}

/**
 * Get default layout configuration based on enabled panels
 * @returns {Array} Array of panel configurations for layout
 */
function getDefaultLayout() {
    const enabledPanels = getEnabledPanels();
    const layout = [];

    let position = 1;
    for (const [panelId, panel] of Object.entries(enabledPanels)) {
        layout.push({
            id: panelId,
            position: position++,
            size: panel.defaultSize,
            visible: true
        });
    }

    return layout;
}

/**
 * Validate panel configuration
 * @param {Object} config - Panel configuration to validate
 * @returns {Object} Validation result with success flag and errors array
 */
function validatePanelConfig(config) {
    const errors = [];

    if (!config.id) {
        errors.push('Panel configuration must have an id');
    } else if (!AVAILABLE_PANELS[config.id]) {
        errors.push(`Invalid panel id: ${config.id}`);
    }

    if (config.size && !PANEL_SIZES[config.size]) {
        errors.push(`Invalid panel size: ${config.size}`);
    }

    if (typeof config.position !== 'number' || config.position < 1) {
        errors.push('Panel position must be a number >= 1');
    }

    if (typeof config.visible !== 'boolean') {
        errors.push('Panel visible property must be a boolean');
    }

    return {
        success: errors.length === 0,
        errors
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AVAILABLE_PANELS,
        PANEL_CATEGORIES,
        PANEL_SIZES,
        getAllPanels,
        getEnabledPanels,
        getPanelsByCategory,
        getPanelById,
        isPanelEnabled,
        getPanelsByPriority,
        getAllCategories,
        getPanelSize,
        getDefaultLayout,
        validatePanelConfig
    };
}
