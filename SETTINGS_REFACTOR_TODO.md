# Settings System Refactor - Future Work

## Issue
Currently, settings from the settings page are stored in multiple disparate locations:
- Panel visibility and layout → `config/panels.json`
- Theme preferences → `localStorage` (client-side only)
- Display settings (CRT effects, animations, font size) → `localStorage` (client-side only)
- Refresh intervals → `localStorage` (client-side only)

This creates several problems:
1. **Fragmented state management** - hard to track what settings exist and where they're stored
2. **Inconsistent persistence** - some settings survive server restart (panels.json), others don't (localStorage)
3. **No single source of truth** - settings logic is scattered across multiple files
4. **Difficult to sync** - can't easily sync settings between devices or backup/restore
5. **Poor separation of concerns** - settings logic mixed with application logic

## Proposed Solution

Create a unified **Settings Service** that manages all user preferences:

### 1. Single Configuration File
```
config/user-settings.json
{
  "version": "1.0.0",
  "theme": {
    "current": "cyberpunk",
    "crtEffects": true,
    "animations": true
  },
  "display": {
    "fontSize": "medium",
    "refreshInterval": 300000
  },
  "panels": {
    "enabled": ["weather", "news", "music", ...],
    "layout": {
      "rows": 4,
      "columns": 4,
      "positions": [...]
    }
  },
  "lastUpdated": "2025-11-22T..."
}
```

### 2. Settings Service (js/settings-service.js)
A dedicated service that:
- Loads all settings from single source
- Provides getters/setters for each setting category
- Handles persistence (both localStorage cache + server file)
- Emits events when settings change
- Validates settings before saving
- Provides migration for old settings format

### 3. Benefits
- **Single source of truth** - all settings in one place
- **Easier testing** - mock the service instead of multiple storage mechanisms
- **Better UX** - can add features like export/import, reset to defaults, settings history
- **Cleaner code** - separation of concerns, easier to maintain
- **Sync-ready** - foundation for multi-device sync in future

### 4. Migration Path
1. Create settings-service.js
2. Create config/user-settings.json
3. Migrate existing localStorage → user-settings.json
4. Migrate panels.json → user-settings.json (or keep separate, service manages both)
5. Update settings.js to use settings-service
6. Update app.js to use settings-service
7. Remove direct localStorage calls from codebase

## Priority
Medium - Current system works but is not scalable. Refactor before adding more settings.

## Related Files
- `js/settings.js` - Current settings page logic
- `js/app.js` - Uses settings throughout
- `js/theme-manager.js` - Theme switching
- `config/panels.json` - Panel configuration
- All files using `localStorage.getItem/setItem`

