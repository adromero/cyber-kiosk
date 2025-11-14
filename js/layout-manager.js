/**
 * Layout Manager - Responsive layout orchestration for Cyber Kiosk
 *
 * Detects screen size, orientation, and device capabilities to apply
 * the optimal layout configuration for panels.
 */

class LayoutManager {
    constructor() {
        this.currentBreakpoint = null;
        this.currentOrientation = null;
        this.listeners = [];

        // Breakpoint definitions matching responsive.css
        this.breakpoints = {
            xs: { min: 0, max: 480, name: 'extra-small', columns: 1 },
            sm: { min: 481, max: 768, name: 'small', columns: 1 },
            md: { min: 769, max: 1024, name: 'medium', columns: 2 },
            lg: { min: 1025, max: 1440, name: 'large', columns: 3 },
            xl: { min: 1441, max: Infinity, name: 'extra-large', columns: 3 }
        };

        // Default layout templates for different screen sizes
        this.layoutTemplates = {
            'extra-small': {
                columns: 1,
                gridAreas: [
                    "panel1",
                    "panel2",
                    "panel3",
                    "panel4"
                ],
                maxPanels: 4
            },
            'small': {
                columns: 1,
                gridAreas: [
                    "panel1",
                    "panel2",
                    "panel3",
                    "panel4"
                ],
                maxPanels: 4
            },
            'medium': {
                columns: 2,
                gridAreas: [
                    "panel1 panel2",
                    "panel3 panel4"
                ],
                maxPanels: 4
            },
            'large': {
                columns: 3,
                gridAreas: [
                    "panel1 panel2 panel3",
                    "panel4 panel4 panel4"
                ],
                maxPanels: 6
            },
            'extra-large': {
                columns: 3,
                gridAreas: [
                    "panel1 panel2 panel3",
                    "panel4 panel5 panel6"
                ],
                maxPanels: 6
            }
        };

        this.init();
    }

    /**
     * Initialize the layout manager
     */
    init() {
        this.detectBreakpoint();
        this.detectOrientation();
        this.setupEventListeners();
        this.applyLayout();
    }

    /**
     * Detect current breakpoint based on window width
     */
    detectBreakpoint() {
        const width = window.innerWidth;
        let newBreakpoint = null;

        for (const [key, bp] of Object.entries(this.breakpoints)) {
            if (width >= bp.min && width <= bp.max) {
                newBreakpoint = key;
                break;
            }
        }

        // Only trigger change if breakpoint actually changed
        if (newBreakpoint !== this.currentBreakpoint) {
            const oldBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = newBreakpoint;
            this.onBreakpointChange(newBreakpoint, oldBreakpoint);
        }

        return newBreakpoint;
    }

    /**
     * Detect device orientation
     */
    detectOrientation() {
        const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

        if (newOrientation !== this.currentOrientation) {
            const oldOrientation = this.currentOrientation;
            this.currentOrientation = newOrientation;
            this.onOrientationChange(newOrientation, oldOrientation);
        }

        return newOrientation;
    }

    /**
     * Get current screen size information
     * @returns {Object} Screen size details
     */
    getScreenInfo() {
        const bp = this.breakpoints[this.currentBreakpoint];
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            breakpoint: this.currentBreakpoint,
            breakpointName: bp ? bp.name : 'unknown',
            orientation: this.currentOrientation,
            columns: bp ? bp.columns : 1,
            isMobile: this.currentBreakpoint === 'xs' || this.currentBreakpoint === 'sm',
            isTablet: this.currentBreakpoint === 'md',
            isDesktop: this.currentBreakpoint === 'lg' || this.currentBreakpoint === 'xl',
            isTouchDevice: this.isTouchDevice(),
            pixelRatio: window.devicePixelRatio || 1
        };
    }

    /**
     * Check if device is touch-enabled
     * @returns {boolean} True if touch device
     */
    isTouchDevice() {
        return 'ontouchstart' in window ||
               navigator.maxTouchPoints > 0 ||
               navigator.msMaxTouchPoints > 0;
    }

    /**
     * Get layout template for current breakpoint
     * @returns {Object} Layout template
     */
    getCurrentLayoutTemplate() {
        const bp = this.breakpoints[this.currentBreakpoint];
        return this.layoutTemplates[bp ? bp.name : 'medium'];
    }

    /**
     * Apply layout to the main grid
     */
    applyLayout() {
        const mainGrid = document.querySelector('.main-grid');
        if (!mainGrid) {
            console.warn('Main grid element not found');
            return;
        }

        const template = this.getCurrentLayoutTemplate();
        const screenInfo = this.getScreenInfo();

        // Set data attribute for CSS to use
        mainGrid.setAttribute('data-breakpoint', screenInfo.breakpointName);
        mainGrid.setAttribute('data-orientation', screenInfo.orientation);

        // Log layout change for debugging
        console.log(`[LayoutManager] Applied layout: ${screenInfo.breakpointName} (${screenInfo.width}x${screenInfo.height})`);
        console.log(`[LayoutManager] Columns: ${template.columns}, Max panels: ${template.maxPanels}`);

        // Trigger custom event for other components
        this.emitLayoutChange(screenInfo, template);
    }

    /**
     * Setup event listeners for window resize and orientation change
     */
    setupEventListeners() {
        let resizeTimeout;

        // Debounced resize handler
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.detectBreakpoint();
                this.detectOrientation();
                this.applyLayout();
            }, 150);
        });

        // Orientation change handler
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.detectOrientation();
                this.applyLayout();
            }, 100);
        });

        // Fullscreen change handler
        document.addEventListener('fullscreenchange', () => {
            setTimeout(() => {
                this.detectBreakpoint();
                this.applyLayout();
            }, 100);
        });
    }

    /**
     * Callback for breakpoint changes
     * @param {string} newBreakpoint - New breakpoint key
     * @param {string} oldBreakpoint - Previous breakpoint key
     */
    onBreakpointChange(newBreakpoint, oldBreakpoint) {
        console.log(`[LayoutManager] Breakpoint changed: ${oldBreakpoint} -> ${newBreakpoint}`);

        // Emit custom event
        const event = new CustomEvent('breakpointchange', {
            detail: {
                newBreakpoint,
                oldBreakpoint,
                screenInfo: this.getScreenInfo()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Callback for orientation changes
     * @param {string} newOrientation - New orientation
     * @param {string} oldOrientation - Previous orientation
     */
    onOrientationChange(newOrientation, oldOrientation) {
        console.log(`[LayoutManager] Orientation changed: ${oldOrientation} -> ${newOrientation}`);

        // Emit custom event
        const event = new CustomEvent('orientationchange', {
            detail: {
                newOrientation,
                oldOrientation,
                screenInfo: this.getScreenInfo()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Emit layout change event
     * @param {Object} screenInfo - Current screen information
     * @param {Object} template - Applied layout template
     */
    emitLayoutChange(screenInfo, template) {
        const event = new CustomEvent('layoutchange', {
            detail: {
                screenInfo,
                template
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get optimal panel count for current screen size
     * @returns {number} Recommended number of panels
     */
    getOptimalPanelCount() {
        const template = this.getCurrentLayoutTemplate();
        return template.maxPanels;
    }

    /**
     * Check if panel should be visible at current screen size
     * @param {Object} panel - Panel configuration
     * @param {number} position - Panel position
     * @returns {boolean} True if panel should be visible
     */
    shouldShowPanel(panel, position) {
        const optimalCount = this.getOptimalPanelCount();
        const screenInfo = this.getScreenInfo();

        // On mobile, limit number of visible panels
        if (screenInfo.isMobile && position > 3) {
            return false;
        }

        // Check if position exceeds optimal count
        if (position > optimalCount) {
            return false;
        }

        return true;
    }

    /**
     * Calculate grid area for a panel
     * @param {number} position - Panel position (1-indexed)
     * @returns {string} CSS grid-area value
     */
    calculateGridArea(position) {
        return `panel${position}`;
    }

    /**
     * Get recommended font size multiplier for current screen
     * @returns {number} Multiplier (e.g., 1.2 for 20% larger)
     */
    getFontSizeMultiplier() {
        const bp = this.currentBreakpoint;
        const multipliers = {
            xs: 0.8,
            sm: 0.9,
            md: 1.0,
            lg: 1.1,
            xl: 1.2
        };
        return multipliers[bp] || 1.0;
    }

    /**
     * Register a listener for layout changes
     * @param {Function} callback - Function to call on layout change
     */
    onLayoutChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    /**
     * Remove a layout change listener
     * @param {Function} callback - Function to remove
     */
    offLayoutChange(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Force layout recalculation
     */
    refresh() {
        this.detectBreakpoint();
        this.detectOrientation();
        this.applyLayout();
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            currentBreakpoint: this.currentBreakpoint,
            currentOrientation: this.currentOrientation,
            screenInfo: this.getScreenInfo(),
            currentTemplate: this.getCurrentLayoutTemplate(),
            listeners: this.listeners.length
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.LayoutManager = LayoutManager;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutManager;
}
