#!/usr/bin/env node

/**
 * generate-config.js
 * Takes command-line arguments and updates config/panels.json
 * Used by setup.sh for interactive panel selection
 */

const fs = require('fs');
const path = require('path');

// Paths
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const PANELS_FILE = path.join(CONFIG_DIR, 'panels.json');
const DEFAULTS_FILE = path.join(CONFIG_DIR, 'defaults.json');

// Canonical panel list with defaults
const CANONICAL_PANELS = {
  weather: true,
  news: true,
  cyberspace: true,
  video: true,
  markets: false,
  timer: false,
  music: false,
  system: true,
  calendar: false
};

/**
 * Parse command-line arguments
 * Accepts: --panel=Y, --panel=y, --panel=N, --panel=n, --panel (same as Y)
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)(?:=(.*))?$/);
    if (match) {
      const [, key, value] = match;
      if (key in CANONICAL_PANELS) {
        // Y/y or no value = true, N/n or empty = false
        if (value === undefined || value === '') {
          result[key] = true;
        } else {
          result[key] = value.toLowerCase() === 'y';
        }
      }
    }
  }

  return result;
}

/**
 * Load existing config or create from defaults
 */
function loadConfig() {
  // Try to load existing panels.json
  if (fs.existsSync(PANELS_FILE)) {
    try {
      const content = fs.readFileSync(PANELS_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Warning: Could not parse ${PANELS_FILE}, using defaults`);
    }
  }

  // Fall back to defaults.json
  if (fs.existsSync(DEFAULTS_FILE)) {
    try {
      const content = fs.readFileSync(DEFAULTS_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Error: Could not parse ${DEFAULTS_FILE}`);
      process.exit(1);
    }
  }

  console.error('Error: No configuration files found');
  process.exit(1);
}

/**
 * Update panel enabled flags based on arguments
 */
function updatePanelFlags(config, panelChoices) {
  // Ensure panels object exists
  if (!config.panels) {
    config.panels = {};
  }

  // Update each panel's enabled flag
  for (const [panelId, enabled] of Object.entries(panelChoices)) {
    if (config.panels[panelId]) {
      config.panels[panelId].enabled = enabled;
    } else {
      // Panel doesn't exist in config, create minimal entry
      config.panels[panelId] = {
        enabled: enabled,
        defaultSize: 'medium',
        priority: Object.keys(config.panels).length + 1
      };
    }
  }

  return config;
}

/**
 * Generate activePanels array from panel enabled flags
 */
function generateActivePanels(config) {
  const activePanels = [];

  // Get all panels from config
  for (const [panelId, panelConfig] of Object.entries(config.panels || {})) {
    activePanels.push({
      id: panelId,
      visible: panelConfig.enabled === true
    });
  }

  // Sort by priority if available
  activePanels.sort((a, b) => {
    const priorityA = config.panels[a.id]?.priority || 99;
    const priorityB = config.panels[b.id]?.priority || 99;
    return priorityA - priorityB;
  });

  return activePanels;
}

/**
 * Main function
 */
function main() {
  const panelChoices = parseArgs();

  // If no arguments provided, show usage
  if (Object.keys(panelChoices).length === 0) {
    console.log('Usage: node generate-config.js --panel=Y|N ...');
    console.log('');
    console.log('Available panels:');
    for (const [panel, defaultEnabled] of Object.entries(CANONICAL_PANELS)) {
      console.log(`  --${panel}=Y|N  (default: ${defaultEnabled ? 'Y' : 'N'})`);
    }
    console.log('');
    console.log('Example:');
    console.log('  node generate-config.js --weather=Y --news=Y --markets=N --music=Y');
    process.exit(0);
  }

  // Load existing config
  const config = loadConfig();

  // Update panel flags
  updatePanelFlags(config, panelChoices);

  // Regenerate activePanels array
  config.activePanels = generateActivePanels(config);

  // Add timestamp
  config.lastUpdated = new Date().toISOString();

  // Write config
  try {
    fs.writeFileSync(PANELS_FILE, JSON.stringify(config, null, 2) + '\n');
    console.log(`Configuration saved to ${PANELS_FILE}`);
  } catch (err) {
    console.error(`Error writing config: ${err.message}`);
    process.exit(1);
  }
}

main();
