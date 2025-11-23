/**
 * Grid Layout Manager for Cyber Kiosk
 * Applies custom grid layouts configured in settings to the main dashboard
 * Works alongside the responsive LayoutManager
 */

class GridLayoutManager {
    constructor() {
        this.layoutConfig = null;
        this.panelMapping = {
            // Individual panels map to their container elements
            weather: 'info_feed',
            markets: 'info_feed',
            news: 'news',
            timer: 'timer',
            music: 'music',
            cyberspace: 'cyberspace',
            video: 'video',
            system: 'system'
        };
        this.containerToPanels = {
            // Reverse mapping - container to individual panels
            info_feed: ['weather', 'markets'],
            news: ['news'],
            timer: ['timer'],
            music: ['music'],
            cyberspace: ['cyberspace'],
            video: ['video'],
            system: ['system']
        };
    }

    /**
     * Initialize the layout manager and apply layout
     */
    async init() {
        console.log('[GridLayoutManager] Initializing...');

        try {
            // Load layout configuration
            await this.loadLayoutConfig();

            // Apply the layout to the dashboard
            this.applyLayout();

            console.log('[GridLayoutManager] Layout applied successfully');
        } catch (error) {
            console.error('[GridLayoutManager] Error initializing:', error);
            console.warn('[GridLayoutManager] Using default layout');
        }
    }

    /**
     * Load layout configuration from server
     */
    async loadLayoutConfig() {
        try {
            const response = await fetch('/config/panels.json');
            if (response.ok) {
                const config = await response.json();
                this.layoutConfig = config;
                console.log('[GridLayoutManager] Layout config loaded:', config);
                return config;
            } else {
                throw new Error('Failed to load panels.json');
            }
        } catch (error) {
            console.error('[GridLayoutManager] Error loading layout config:', error);
            return null;
        }
    }

    /**
     * Apply the layout configuration to the dashboard
     */
    applyLayout() {
        if (!this.layoutConfig || !this.layoutConfig.layout) {
            console.warn('[GridLayoutManager] No layout configuration available');
            return;
        }

        const { rows, columns, panels } = this.layoutConfig.layout;
        const mainGrid = document.querySelector('.main-grid');

        if (!mainGrid) {
            console.error('[GridLayoutManager] Main grid element not found');
            return;
        }

        console.log(`[GridLayoutManager] Applying ${rows}×${columns} grid with ${panels.length} panels`);

        // Step 1: Set up the CSS grid
        this.setupGrid(mainGrid, rows, columns);

        // Step 2: Hide all panels initially
        this.hideAllPanels();

        // Step 3: Position and show configured panels
        this.positionPanels(panels);

        // Step 4: Apply panel visibility from activePanels config
        this.applyPanelVisibility();
    }

    /**
     * Configure the main grid CSS properties
     */
    setupGrid(gridElement, rows, columns) {
        // Set grid template
        gridElement.style.display = 'grid';
        gridElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        gridElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        gridElement.style.gap = '20px';
        gridElement.style.width = '100%';
        // Use flex: 1 to fill available space responsively (matches base.css)
        // This allows the grid to adapt to any screen size naturally
        gridElement.style.flex = '1';
        gridElement.style.minHeight = '0'; // Important for flexbox children

        console.log(`[GridLayoutManager] Grid configured: ${columns} columns × ${rows} rows`);
    }

    /**
     * Hide all panels by default
     */
    hideAllPanels() {
        const allPanels = document.querySelectorAll('[data-panel-id]');
        allPanels.forEach(panel => {
            panel.style.display = 'none';
        });
    }

    /**
     * Position panels according to layout configuration
     */
    positionPanels(panelsConfig) {
        panelsConfig.forEach(panelConfig => {
            const { id, row, col, width, height } = panelConfig;

            // Find the DOM element for this panel container
            // Note: The layout uses container IDs (info_feed, news, etc.)
            // but the DOM uses data-panel-id which might be different
            const panelElement = this.findPanelElement(id);

            if (!panelElement) {
                console.warn(`[GridLayoutManager] Panel element not found for: ${id}`);
                return;
            }

            // Apply grid positioning (1-indexed for CSS grid)
            panelElement.style.gridColumn = `${col + 1} / span ${width}`;
            panelElement.style.gridRow = `${row + 1} / span ${height}`;
            // Use flex instead of block to maintain proper flexbox layout for content
            panelElement.style.display = 'flex';

            console.log(`[GridLayoutManager] Positioned panel "${id}" at (${row},${col}) with size ${width}×${height}`);
        });
    }

    /**
     * Find the DOM element for a panel container
     * Handles mapping between container IDs and actual panel elements
     */
    findPanelElement(containerId) {
        // First, try direct match with data-panel-id
        let element = document.querySelector(`[data-panel-id="${containerId}"]`);
        if (element) return element;

        // If container is info_feed, it might be labeled as 'weather' in the DOM
        // Try to find any of the individual panels that map to this container
        const individualPanels = this.containerToPanels[containerId];
        if (individualPanels) {
            for (const panelId of individualPanels) {
                element = document.querySelector(`[data-panel-id="${panelId}"]`);
                if (element) {
                    console.log(`[GridLayoutManager] Found container "${containerId}" via panel "${panelId}"`);
                    return element;
                }
            }
        }

        return null;
    }

    /**
     * Apply panel visibility based on layout configuration
     * Panels are visible if they are in the layout grid, regardless of other settings
     */
    applyPanelVisibility() {
        if (!this.layoutConfig || !this.layoutConfig.layout || !this.layoutConfig.layout.panels) {
            console.log('[GridLayoutManager] No layout configuration found');
            return;
        }

        // Build a set of panel IDs that are in the grid layout
        const panelsInLayout = new Set(
            this.layoutConfig.layout.panels.map(panel => panel.id)
        );

        console.log('[GridLayoutManager] Panels in layout:', Array.from(panelsInLayout));

        // Additionally check activePanels for visibility overrides
        const visibilityOverrides = {};
        if (this.layoutConfig.activePanels) {
            this.layoutConfig.activePanels.forEach(panel => {
                // Only hide panels that are explicitly set to visible=false
                // This allows users to disable panels from the panel toggles
                if (panel.visible === false) {
                    visibilityOverrides[panel.id] = false;
                }
            });
        }

        console.log('[GridLayoutManager] Visibility overrides:', visibilityOverrides);

        // Hide panels that are explicitly disabled via toggles
        Object.keys(visibilityOverrides).forEach(panelId => {
            if (visibilityOverrides[panelId] === false) {
                const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`);
                if (panelElement) {
                    panelElement.style.display = 'none';
                    console.log(`[GridLayoutManager] Panel "${panelId}" hidden (disabled via toggle)`);
                }
            }
        });

        // Note: Panels in the layout are shown by positionPanels()
        // This function only handles hiding panels that are explicitly disabled
    }

    /**
     * Refresh the layout (useful after settings changes)
     */
    async refresh() {
        console.log('[GridLayoutManager] Refreshing layout...');
        await this.loadLayoutConfig();
        this.applyLayout();
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GridLayoutManager;
}
