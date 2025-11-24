/**
 * Theme Manager - Handles theme switching and persistence
 * Supports: cyberpunk, hiphop, california themes
 */

class ThemeManager {
    constructor() {
        this.themes = {
            cyberpunk: {
                name: 'Cyberpunk',
                description: 'Neon lights, CRT effects, Neuromancer aesthetic',
                preview: '#00ffff'
            },
            hiphop: {
                name: 'Hip-Hop',
                description: 'Gold, black, bold urban style',
                preview: '#FFD700'
            },
            california: {
                name: 'California',
                description: 'Sunset colors, beach vibes, relaxed feel',
                preview: '#FF6B35'
            }
        };

        this.defaultTheme = 'cyberpunk';
        this.currentTheme = this.loadTheme();

        // Apply theme on initialization
        this.applyTheme(this.currentTheme);

        // Listen for settings service theme changes
        window.addEventListener('settings:themeChange', (e) => {
            this.applyTheme(e.detail || this.defaultTheme);
        });
    }

    /**
     * Load saved theme from SettingsService (with fallback)
     */
    loadTheme() {
        // Try to get theme from settings service
        if (window.settingsService && window.settingsService.initialized) {
            const theme = window.settingsService.getCurrentTheme();
            if (theme && this.themes[theme]) {
                return theme;
            }
        }
        return this.defaultTheme;
    }

    /**
     * Save theme via SettingsService
     */
    saveTheme(themeName) {
        if (window.settingsService && window.settingsService.initialized) {
            window.settingsService.setTheme(themeName);
        }
    }

    /**
     * Apply a theme by loading its CSS
     */
    applyTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found, using default`);
            themeName = this.defaultTheme;
        }

        // Update data attribute on root element
        document.documentElement.setAttribute('data-theme', themeName);

        // Load theme CSS
        this.loadThemeCSS(themeName);

        // Save and update current
        this.saveTheme(themeName);
        this.currentTheme = themeName;

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: themeName, themeData: this.themes[themeName] }
        }));

        console.log(`Theme applied: ${themeName}`);
    }

    /**
     * Load theme CSS file dynamically
     */
    loadThemeCSS(themeName) {
        // Remove existing theme CSS if present
        const existingTheme = document.getElementById('theme-css');
        if (existingTheme) {
            existingTheme.remove();
        }

        // Create and append new theme CSS link
        const themeLink = document.createElement('link');
        themeLink.id = 'theme-css';
        themeLink.rel = 'stylesheet';
        themeLink.href = `css/themes/${themeName}.css`;

        // Insert after base.css
        const baseCSS = document.querySelector('link[href*="base.css"]');
        if (baseCSS) {
            baseCSS.after(themeLink);
        } else {
            // Fallback: append to head
            document.head.appendChild(themeLink);
        }
    }

    /**
     * Switch to a different theme
     */
    switchTheme(themeName) {
        if (themeName === this.currentTheme) {
            return;
        }
        this.applyTheme(themeName);
    }

    /**
     * Cycle to next theme
     */
    nextTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        this.switchTheme(themeNames[nextIndex]);
    }

    /**
     * Get current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get current theme data
     */
    getCurrentThemeData() {
        return this.themes[this.currentTheme];
    }

    /**
     * Get all available themes
     */
    getAvailableThemes() {
        return Object.entries(this.themes).map(([id, data]) => ({
            id,
            ...data,
            active: id === this.currentTheme
        }));
    }

    /**
     * Check if a theme exists
     */
    hasTheme(themeName) {
        return !!this.themes[themeName];
    }
}

// Create global instance
window.themeManager = new ThemeManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
