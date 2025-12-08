#!/usr/bin/env node

/**
 * migrate.js
 * Migration tool to convert old or incomplete configurations
 * to the current panel system format while preserving user preferences.
 */

const fs = require('fs');
const path = require('path');

// Paths
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const BACKUP_DIR = path.join(CONFIG_DIR, 'backup');
const PANELS_FILE = path.join(CONFIG_DIR, 'panels.json');
const DEFAULTS_FILE = path.join(CONFIG_DIR, 'defaults.json');

// Canonical panel definitions with defaults
const CANONICAL_PANELS = {
  weather: { enabled: true, defaultSize: 'medium', priority: 1 },
  news: { enabled: true, defaultSize: 'large', priority: 2 },
  cyberspace: { enabled: true, defaultSize: 'medium', priority: 3 },
  video: { enabled: true, defaultSize: 'medium', priority: 4 },
  markets: { enabled: false, defaultSize: 'medium', priority: 5 },
  timer: { enabled: false, defaultSize: 'small', priority: 6 },
  music: { enabled: false, defaultSize: 'medium', priority: 7 },
  system: { enabled: true, defaultSize: 'medium', priority: 8 },
  calendar: { enabled: false, defaultSize: 'medium', priority: 9 }
};

const CURRENT_VERSION = '1.0.0';

// Track migrations applied
const migrationsApplied = [];

/**
 * Print styled output
 */
function printHeader() {
  console.log('');
  console.log('Cyber Kiosk Config Migration');
  console.log('============================');
  console.log('Checking configuration...');
}

function printSuccess(msg) {
  console.log(`- ${msg}`);
}

function printMigration(msg) {
  migrationsApplied.push(msg);
}

function printReport() {
  console.log('');
  if (migrationsApplied.length === 0) {
    console.log('No migrations needed. Configuration is up to date.');
  } else {
    console.log('Migrations applied:');
    for (const msg of migrationsApplied) {
      console.log(`- ${msg}`);
    }
  }
  console.log('');
  console.log('Migration complete!');
}

/**
 * Create backup directory if needed
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a timestamped backup of the config
 */
function createBackup(config) {
  ensureBackupDir();
  const timestamp = Date.now();
  const backupFile = path.join(BACKUP_DIR, `panels.json.backup-${timestamp}`);
  fs.writeFileSync(backupFile, JSON.stringify(config, null, 2) + '\n');
  printSuccess(`Creating backup: config/backup/panels.json.backup-${timestamp}`);
  return backupFile;
}

/**
 * Load defaults.json
 */
function loadDefaults() {
  if (!fs.existsSync(DEFAULTS_FILE)) {
    console.error('Error: defaults.json not found');
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
  } catch (err) {
    console.error(`Error parsing defaults.json: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Load or create panels.json
 */
function loadConfig() {
  if (!fs.existsSync(PANELS_FILE)) {
    printSuccess('panels.json: Not found, creating from defaults');
    printMigration('Created panels.json from defaults.json');
    const defaults = loadDefaults();
    return { ...defaults, isNew: true };
  }

  try {
    const config = JSON.parse(fs.readFileSync(PANELS_FILE, 'utf8'));
    const version = config.version || 'unknown';
    printSuccess(`panels.json: Found (v${version})`);
    return config;
  } catch (err) {
    console.error(`Error parsing panels.json: ${err.message}`);
    console.error('Creating new config from defaults');
    printMigration('Replaced corrupted panels.json with defaults');
    return { ...loadDefaults(), isNew: true };
  }
}

/**
 * Add version field if missing
 */
function migrateVersion(config) {
  if (!config.version) {
    config.version = CURRENT_VERSION;
    printMigration(`Added version field (${CURRENT_VERSION})`);
  }
  return config;
}

/**
 * Ensure all canonical panels exist
 */
function migratePanels(config) {
  if (!config.panels) {
    config.panels = {};
    printMigration('Created panels object');
  }

  const defaults = loadDefaults();

  for (const [panelId, defaultConfig] of Object.entries(CANONICAL_PANELS)) {
    if (!config.panels[panelId]) {
      // Try to get full config from defaults, otherwise use canonical
      config.panels[panelId] = defaults.panels?.[panelId] || {
        enabled: defaultConfig.enabled,
        defaultSize: defaultConfig.defaultSize,
        priority: defaultConfig.priority
      };
      printMigration(`Added missing '${panelId}' panel definition`);
    }
  }

  return config;
}

/**
 * Generate or update activePanels array from panel enabled flags
 */
function migrateActivePanels(config) {
  const needsRebuild = !config.activePanels || !Array.isArray(config.activePanels);

  if (needsRebuild) {
    printMigration('Generated activePanels array from panel enabled flags');
  }

  // Build activePanels from current panel states
  const activePanels = [];
  const existingMap = new Map();

  // Map existing activePanels by id if they exist
  if (Array.isArray(config.activePanels)) {
    for (const panel of config.activePanels) {
      if (panel.id) {
        existingMap.set(panel.id, panel);
      }
    }
  }

  // Process all canonical panels
  for (const panelId of Object.keys(CANONICAL_PANELS)) {
    const panelConfig = config.panels?.[panelId];
    const existing = existingMap.get(panelId);

    if (existing) {
      // Update visibility based on enabled flag
      activePanels.push({
        id: panelId,
        visible: panelConfig?.enabled === true
      });
      existingMap.delete(panelId);
    } else {
      // Add missing panel to activePanels
      activePanels.push({
        id: panelId,
        visible: panelConfig?.enabled === true
      });
      if (!needsRebuild) {
        printMigration(`Added '${panelId}' to activePanels array`);
      }
    }
  }

  // Sort by priority
  activePanels.sort((a, b) => {
    const priorityA = config.panels?.[a.id]?.priority || 99;
    const priorityB = config.panels?.[b.id]?.priority || 99;
    return priorityA - priorityB;
  });

  config.activePanels = activePanels;
  return config;
}

/**
 * Add lastUpdated timestamp
 */
function migrateTimestamp(config) {
  config.lastUpdated = new Date().toISOString();
  return config;
}

/**
 * Validate the resulting config structure
 */
function validateConfig(config) {
  const errors = [];

  if (!config.version) {
    errors.push('Missing version field');
  }

  if (!config.panels || typeof config.panels !== 'object') {
    errors.push('Missing or invalid panels object');
  }

  if (!Array.isArray(config.activePanels)) {
    errors.push('Missing or invalid activePanels array');
  }

  // Check all canonical panels exist
  for (const panelId of Object.keys(CANONICAL_PANELS)) {
    if (!config.panels?.[panelId]) {
      errors.push(`Missing panel definition: ${panelId}`);
    }
  }

  if (errors.length > 0) {
    console.error('Validation errors:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    return false;
  }

  return true;
}

/**
 * Main function
 */
function main() {
  printHeader();

  // Load config
  let config = loadConfig();
  const isNew = config.isNew;
  delete config.isNew;

  // Create backup if not a new file
  if (!isNew) {
    createBackup(config);
  }

  // Apply migrations
  config = migrateVersion(config);
  config = migratePanels(config);
  config = migrateActivePanels(config);
  config = migrateTimestamp(config);

  // Validate
  if (!validateConfig(config)) {
    console.error('Migration failed validation');
    process.exit(1);
  }

  // Write config
  try {
    fs.writeFileSync(PANELS_FILE, JSON.stringify(config, null, 2) + '\n');
  } catch (err) {
    console.error(`Error writing config: ${err.message}`);
    process.exit(1);
  }

  printReport();
}

main();
