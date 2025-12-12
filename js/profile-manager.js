/**
 * User Profile Manager
 * Handles multi-user profile support with individual settings
 */

class ProfileManager {
    constructor() {
        this.currentProfile = null;
        this.profiles = [];
        this.initialized = false;
    }

    /**
     * Initialize the profile manager
     */
    async init() {
        if (this.initialized) return;

        console.log('[ProfileManager] Initializing...');

        // Get current profile from SettingsService or fallback
        let savedProfileId = null;
        if (window.settingsService && window.settingsService.initialized) {
            const settings = window.settingsService.getAll();
            savedProfileId = settings.currentProfile || null;
        }

        // Load all profiles
        await this.loadProfiles();

        // Set current profile
        if (savedProfileId && this.profiles.find(p => p.id === savedProfileId)) {
            await this.switchProfile(savedProfileId);
        } else if (this.profiles.length > 0) {
            // Use first available profile
            await this.switchProfile(this.profiles[0].id);
        } else {
            // Create default profile if none exist
            console.log('[ProfileManager] No profiles found, creating default profile');
            await this.createProfile('Default User', '👤');
        }

        this.initialized = true;
        console.log('[ProfileManager] Initialized with profile:', this.currentProfile?.name);
    }

    /**
     * Load all available profiles
     */
    async loadProfiles() {
        try {
            const response = await fetch('/profiles');
            if (!response.ok) throw new Error('Failed to load profiles');

            const data = await response.json();
            this.profiles = data.profiles || [];

            console.log(`[ProfileManager] Loaded ${this.profiles.length} profiles`);
            return this.profiles;
        } catch (error) {
            console.error('[ProfileManager] Error loading profiles:', error);
            this.profiles = [];
            return [];
        }
    }

    /**
     * Get full profile data for a specific profile
     */
    async getProfile(profileId) {
        try {
            const response = await fetch(`/profiles/${profileId}`);
            if (!response.ok) throw new Error('Profile not found');

            const profile = await response.json();
            return profile;
        } catch (error) {
            console.error(`[ProfileManager] Error loading profile ${profileId}:`, error);
            return null;
        }
    }

    /**
     * Create a new user profile
     */
    async createProfile(name, emoji = '👤') {
        try {
            const response = await fetch('/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, emoji })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create profile');
            }

            const data = await response.json();
            const newProfile = data.profile;

            console.log(`[ProfileManager] Created profile: ${newProfile.name}`);

            // Reload profiles list
            await this.loadProfiles();

            // Switch to new profile
            await this.switchProfile(newProfile.id);

            return newProfile;
        } catch (error) {
            console.error('[ProfileManager] Error creating profile:', error);
            throw error;
        }
    }

    /**
     * Update current profile settings
     */
    async updateProfile(updates) {
        if (!this.currentProfile) {
            throw new Error('No profile currently active');
        }

        try {
            const response = await fetch(`/profiles/${this.currentProfile.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const data = await response.json();
            this.currentProfile = data.profile;

            console.log(`[ProfileManager] Updated profile: ${this.currentProfile.name}`);

            // Reload profiles list
            await this.loadProfiles();

            return this.currentProfile;
        } catch (error) {
            console.error('[ProfileManager] Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Delete a profile
     */
    async deleteProfile(profileId) {
        try {
            const response = await fetch(`/profiles/${profileId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete profile');

            console.log(`[ProfileManager] Deleted profile: ${profileId}`);

            // If we deleted the current profile, switch to another
            const wasCurrentProfile = this.currentProfile && this.currentProfile.id === profileId;

            // Reload profiles first
            await this.loadProfiles();

            if (wasCurrentProfile) {
                // Switch to first available profile or create new one
                if (this.profiles.length > 0) {
                    await this.switchProfile(this.profiles[0].id);
                } else {
                    await this.createProfile('Default User', '👤');
                }
            }

            return true;
        } catch (error) {
            console.error('[ProfileManager] Error deleting profile:', error);
            throw error;
        }
    }

    /**
     * Switch to a different profile
     */
    async switchProfile(profileId) {
        try {
            console.log(`[ProfileManager] Switching to profile: ${profileId}`);

            // Load full profile data
            const profile = await this.getProfile(profileId);
            if (!profile) throw new Error('Profile not found');

            // Update current profile
            this.currentProfile = profile;

            // Notify backend of active profile change (for per-profile Spotify tokens)
            try {
                const activeResponse = await fetch('/profiles/active', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileId })
                });
                if (activeResponse.ok) {
                    const activeData = await activeResponse.json();
                    console.log(`[ProfileManager] Backend notified, Spotify connected: ${activeData.spotifyConnected}`);
                }
            } catch (err) {
                console.warn('[ProfileManager] Failed to notify backend of profile switch:', err);
            }

            // Save current profile to SettingsService and persist to server
            if (window.settingsService && window.settingsService.initialized) {
                window.settingsService.settings.currentProfile = profileId;
                window.settingsService.onSettingsChanged();
                // Persist to server so the change survives page reload
                await window.settingsService.save();
                console.log('[ProfileManager] Profile change persisted to server');
            }

            // Apply profile settings
            this.applyProfileSettings(profile);

            // Dispatch event for other components to react (including music panel)
            window.dispatchEvent(new CustomEvent('profileChanged', {
                detail: { profile }
            }));

            console.log(`[ProfileManager] Switched to profile: ${profile.name}`);

            return profile;
        } catch (error) {
            console.error('[ProfileManager] Error switching profile:', error);
            throw error;
        }
    }

    /**
     * Apply profile settings to the application
     */
    applyProfileSettings(profile) {
        // Apply theme via ThemeManager (which uses SettingsService)
        if (profile.theme && window.themeManager) {
            // Handle both string and object theme formats
            const themeName = typeof profile.theme === 'string'
                ? profile.theme
                : profile.theme.current || 'cyberpunk';
            window.themeManager.applyTheme(themeName);
        }

        // Apply display settings via SettingsService
        if (profile.settings && window.settingsService && window.settingsService.initialized) {
            if (profile.settings.crtEffects !== undefined) {
                window.settingsService.setCrtEffects(profile.settings.crtEffects);
            }
            if (profile.settings.animations !== undefined) {
                window.settingsService.setAnimations(profile.settings.animations);
            }
            if (profile.settings.fontSize) {
                window.settingsService.setFontSize(profile.settings.fontSize);
            }
            if (profile.settings.refreshInterval) {
                window.settingsService.setRefreshInterval(profile.settings.refreshInterval);
            }
        }

        console.log('[ProfileManager] Applied profile settings');
    }

    /**
     * Save current UI state to profile
     */
    async saveCurrentState(updates) {
        if (!this.currentProfile) {
            console.warn('[ProfileManager] No profile active, cannot save state');
            return;
        }

        // Merge current state with updates
        const updatedProfile = {
            ...this.currentProfile,
            ...updates,
            lastUsed: new Date().toISOString()
        };

        await this.updateProfile(updatedProfile);
    }

    /**
     * Get current profile
     */
    getCurrentProfile() {
        return this.currentProfile;
    }

    /**
     * Get all profiles (summary only)
     */
    getAllProfiles() {
        return this.profiles;
    }
}

// Create global instance
window.profileManager = new ProfileManager();
