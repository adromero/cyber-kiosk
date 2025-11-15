/**
 * BasePanel - Parent class for all panel types
 * Provides common functionality for panel lifecycle, rendering, and state management
 */

class BasePanel {
    /**
     * Create a new panel instance
     * @param {Object} config - Panel configuration
     * @param {string} config.id - Unique panel ID
     * @param {string} config.title - Panel title (displayed in header)
     * @param {HTMLElement} config.container - DOM element to render panel into
     * @param {Object} config.settings - Panel-specific settings
     */
    constructor(config) {
        this.id = config.id;
        this.title = config.title || 'PANEL';
        this.container = config.container;
        this.settings = config.settings || {};

        // Panel state
        this.state = {
            status: 'INITIALIZING',
            error: null,
            lastUpdate: null
        };

        // DOM references
        this.elements = {
            widget: null,
            header: null,
            title: null,
            status: null,
            content: null
        };

        // Timers and intervals
        this.intervals = new Map();
        this.timeouts = new Map();

        // Event listeners registry for cleanup
        this.listeners = [];
    }

    /**
     * Initialize the panel - sets up DOM structure and starts updates
     * Call this after creating a panel instance
     */
    async init() {
        try {
            this.setStatus('INITIALIZING');
            this.createPanelStructure();
            await this.onInit();
            this.setStatus('ONLINE');
        } catch (error) {
            console.error(`> ERROR INITIALIZING ${this.id.toUpperCase()} PANEL:`, error);
            this.setStatus('ERROR');
            this.setError(error.message);
        }
    }

    /**
     * Override this method in child classes to perform custom initialization
     */
    async onInit() {
        // Override in child classes
    }

    /**
     * Create the basic panel DOM structure
     * Follows the cyber-kiosk widget pattern
     */
    createPanelStructure() {
        // Create widget container
        const widget = document.createElement('div');
        widget.className = `widget ${this.id}-widget`;
        widget.id = `${this.id}-panel`;

        // Create header
        const header = document.createElement('div');
        header.className = 'widget-header';

        const title = document.createElement('span');
        title.className = 'widget-title';
        title.textContent = `> ${this.title}`;

        const status = document.createElement('span');
        status.className = 'widget-status';
        status.id = `${this.id}-status`;
        status.textContent = this.state.status;

        header.appendChild(title);
        header.appendChild(status);

        // Create content area
        const content = document.createElement('div');
        content.className = `widget-content ${this.id}-content`;
        content.id = `${this.id}-content`;

        // Assemble widget
        widget.appendChild(header);
        widget.appendChild(content);

        // Store references
        this.elements.widget = widget;
        this.elements.header = header;
        this.elements.title = title;
        this.elements.status = status;
        this.elements.content = content;

        // Add to container
        if (this.container) {
            this.container.appendChild(widget);
        }
    }

    /**
     * Update panel status display
     * @param {string} status - Status text to display
     */
    setStatus(status) {
        this.state.status = status;
        if (this.elements.status) {
            this.elements.status.textContent = status;
        }
    }

    /**
     * Set error state and optionally display error message
     * @param {string} errorMessage - Error message to display
     */
    setError(errorMessage) {
        this.state.error = errorMessage;
        this.setStatus('ERROR');
        if (this.elements.content && errorMessage) {
            this.elements.content.innerHTML = `
                <div class="error-message">
                    ${errorMessage.toUpperCase()}
                </div>
            `;
        }
    }

    /**
     * Render panel content
     * Override this method in child classes to provide custom rendering
     */
    render() {
        // Override in child classes
        console.warn(`${this.id}: render() not implemented`);
    }

    /**
     * Update panel data
     * Override this method in child classes to fetch/update data
     */
    async update() {
        // Override in child classes
    }

    /**
     * Start an interval that will be automatically cleaned up on destroy
     * @param {string} name - Unique name for this interval
     * @param {Function} callback - Function to call
     * @param {number} intervalMs - Interval in milliseconds
     */
    setInterval(name, callback, intervalMs) {
        // Clear existing interval with this name
        this.clearInterval(name);

        // Create new interval
        const intervalId = setInterval(callback, intervalMs);
        this.intervals.set(name, intervalId);

        return intervalId;
    }

    /**
     * Clear a named interval
     * @param {string} name - Name of interval to clear
     */
    clearInterval(name) {
        if (this.intervals.has(name)) {
            clearInterval(this.intervals.get(name));
            this.intervals.delete(name);
        }
    }

    /**
     * Start a timeout that will be automatically cleaned up on destroy
     * @param {string} name - Unique name for this timeout
     * @param {Function} callback - Function to call
     * @param {number} timeoutMs - Timeout in milliseconds
     */
    setTimeout(name, callback, timeoutMs) {
        // Clear existing timeout with this name
        this.clearTimeout(name);

        // Create new timeout
        const timeoutId = setTimeout(callback, timeoutMs);
        this.timeouts.set(name, timeoutId);

        return timeoutId;
    }

    /**
     * Clear a named timeout
     * @param {string} name - Name of timeout to clear
     */
    clearTimeout(name) {
        if (this.timeouts.has(name)) {
            clearTimeout(this.timeouts.get(name));
            this.timeouts.delete(name);
        }
    }

    /**
     * Add an event listener that will be automatically cleaned up on destroy
     * @param {EventTarget} element - Element to attach listener to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) {
            console.error(`> ${this.id?.toUpperCase() || 'PANEL'}: Cannot addEventListener - element is null/undefined`);
            return;
        }
        console.log(`> ${this.id?.toUpperCase() || 'PANEL'}: Adding ${event} listener to:`, element);
        element.addEventListener(event, handler, options);
        this.listeners.push({ element, event, handler, options });
    }

    /**
     * Save panel state to localStorage
     * @param {Object} data - Data to save
     */
    saveState(data) {
        try {
            const key = `panel_${this.id}_state`;
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`> ERROR SAVING ${this.id} STATE:`, error);
        }
    }

    /**
     * Load panel state from localStorage
     * @returns {Object|null} Saved state or null if none exists
     */
    loadState() {
        try {
            const key = `panel_${this.id}_state`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`> ERROR LOADING ${this.id} STATE:`, error);
            return null;
        }
    }

    /**
     * Clean up panel resources
     * Call this before removing a panel from the DOM
     */
    destroy() {
        // Clear all intervals
        this.intervals.forEach((id) => clearInterval(id));
        this.intervals.clear();

        // Clear all timeouts
        this.timeouts.forEach((id) => clearTimeout(id));
        this.timeouts.clear();

        // Remove all event listeners
        this.listeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.listeners = [];

        // Call child class cleanup
        this.onDestroy();

        // Remove from DOM
        if (this.elements.widget && this.elements.widget.parentNode) {
            this.elements.widget.parentNode.removeChild(this.elements.widget);
        }

        console.log(`> ${this.id.toUpperCase()} PANEL: DESTROYED`);
    }

    /**
     * Override this method in child classes to perform custom cleanup
     */
    onDestroy() {
        // Override in child classes
    }

    /**
     * Show/hide panel
     * @param {boolean} visible - Whether panel should be visible
     */
    setVisible(visible) {
        if (this.elements.widget) {
            this.elements.widget.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Get current timestamp in ISO format
     * @returns {string} Current timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Log panel message
     * @param {string} message - Message to log
     * @param {string} level - Log level (log, warn, error)
     */
    log(message, level = 'log') {
        const prefix = `> ${this.id.toUpperCase()} PANEL:`;
        console[level](`${prefix} ${message}`);
    }
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BasePanel;
}
