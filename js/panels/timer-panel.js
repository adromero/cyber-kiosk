/**
 * TimerPanel - Countdown timer and alarm panel
 * Extends BasePanel to provide timer/alarm functionality
 */

class TimerPanel extends BasePanel {
    constructor(config) {
        super(config);

        // Timer state
        this.timers = [];
        this.alarms = [];
        this.nextTimerId = 1;
        this.nextAlarmId = 1;

        // Quick presets in seconds
        this.presets = [
            { label: '5MIN', seconds: 300 },
            { label: '15MIN', seconds: 900 },
            { label: '30MIN', seconds: 1800 },
            { label: '1HR', seconds: 3600 }
        ];

        // Audio context for alerts
        this.audioContext = null;
    }

    /**
     * Initialize the timer panel
     */
    async onInit() {
        this.log('Initializing timer panel');

        // Load saved state
        const savedState = this.loadState();
        if (savedState) {
            this.timers = savedState.timers || [];
            this.alarms = savedState.alarms || [];
            this.nextTimerId = savedState.nextTimerId || 1;
            this.nextAlarmId = savedState.nextAlarmId || 1;
        }

        // Initialize audio context (user gesture may be required)
        this.initAudio();

        // Render initial UI
        this.render();

        // Start update loop for running timers
        this.setInterval('update', () => this.updateTimers(), 100);

        this.log('Timer panel initialized');
    }

    /**
     * Initialize Web Audio API for alert sounds
     */
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.log('Web Audio API not available', 'warn');
        }
    }

    /**
     * Render the timer panel UI
     */
    render() {
        if (!this.elements.content) return;

        const html = `
            <div class="timer-panel-container">
                <!-- Timer Controls -->
                <div class="timer-controls">
                    <div class="timer-input-group">
                        <input type="number"
                               id="${this.id}-hours"
                               class="timer-input"
                               placeholder="HH"
                               min="0"
                               max="23"
                               value="0">
                        <span class="timer-separator">:</span>
                        <input type="number"
                               id="${this.id}-minutes"
                               class="timer-input"
                               placeholder="MM"
                               min="0"
                               max="59"
                               value="5">
                        <span class="timer-separator">:</span>
                        <input type="number"
                               id="${this.id}-seconds"
                               class="timer-input"
                               placeholder="SS"
                               min="0"
                               max="59"
                               value="0">
                    </div>
                    <button class="timer-button timer-button-primary"
                            onclick="window.timerPanel_${this.id}.startCustomTimer()">
                        START TIMER
                    </button>
                </div>

                <!-- Quick Presets -->
                <div class="timer-presets">
                    ${this.presets.map(preset => `
                        <button class="timer-preset-button"
                                onclick="window.timerPanel_${this.id}.startPresetTimer(${preset.seconds})">
                            ${preset.label}
                        </button>
                    `).join('')}
                </div>

                <!-- Active Timers List -->
                <div class="timer-list" id="${this.id}-timer-list">
                    ${this.renderTimersList()}
                </div>

                <!-- Alarms Section -->
                <div class="timer-section-divider"></div>
                <div class="timer-section-title">&gt; ALARMS</div>

                <!-- Alarm Controls -->
                <div class="timer-controls">
                    <input type="time"
                           id="${this.id}-alarm-time"
                           class="timer-alarm-input">
                    <input type="text"
                           id="${this.id}-alarm-label"
                           class="timer-alarm-label-input"
                           placeholder="ALARM LABEL...">
                    <button class="timer-button timer-button-primary"
                            onclick="window.timerPanel_${this.id}.addAlarm()">
                        ADD ALARM
                    </button>
                </div>

                <!-- Alarms List -->
                <div class="timer-alarm-list" id="${this.id}-alarm-list">
                    ${this.renderAlarmsList()}
                </div>
            </div>
        `;

        this.elements.content.innerHTML = html;

        // Store reference to this panel instance globally for onclick handlers
        window[`timerPanel_${this.id}`] = this;
    }

    /**
     * Render the list of active timers
     */
    renderTimersList() {
        if (this.timers.length === 0) {
            return '<div class="timer-empty">NO ACTIVE TIMERS</div>';
        }

        return this.timers.map(timer => {
            const remaining = timer.paused
                ? timer.remainingMs
                : Math.max(0, timer.endTime - Date.now());

            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            const milliseconds = Math.floor((remaining % 1000) / 10);

            const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;

            const progress = timer.totalMs > 0
                ? ((timer.totalMs - remaining) / timer.totalMs) * 100
                : 0;

            return `
                <div class="timer-item ${timer.paused ? 'paused' : ''} ${remaining <= 0 ? 'completed' : ''}">
                    <div class="timer-display">${timeStr}</div>
                    <div class="timer-progress-bar">
                        <div class="timer-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="timer-actions">
                        ${timer.paused
                            ? `<button class="timer-action-button" onclick="window.timerPanel_${this.id}.resumeTimer(${timer.id})">RESUME</button>`
                            : `<button class="timer-action-button" onclick="window.timerPanel_${this.id}.pauseTimer(${timer.id})">PAUSE</button>`
                        }
                        <button class="timer-action-button" onclick="window.timerPanel_${this.id}.stopTimer(${timer.id})">STOP</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render the list of alarms
     */
    renderAlarmsList() {
        if (this.alarms.length === 0) {
            return '<div class="timer-empty">NO ALARMS SET</div>';
        }

        return this.alarms.map(alarm => {
            return `
                <div class="timer-alarm-item ${alarm.enabled ? 'enabled' : 'disabled'}">
                    <div class="timer-alarm-info">
                        <div class="timer-alarm-time">${alarm.time}</div>
                        <div class="timer-alarm-label">${alarm.label || 'ALARM'}</div>
                    </div>
                    <div class="timer-alarm-actions">
                        <label class="timer-toggle">
                            <input type="checkbox"
                                   ${alarm.enabled ? 'checked' : ''}
                                   onchange="window.timerPanel_${this.id}.toggleAlarm(${alarm.id})">
                            <span class="timer-toggle-slider"></span>
                        </label>
                        <button class="timer-action-button"
                                onclick="window.timerPanel_${this.id}.deleteAlarm(${alarm.id})">
                            DELETE
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Start a custom timer from input fields
     */
    startCustomTimer() {
        const hours = parseInt(document.getElementById(`${this.id}-hours`).value) || 0;
        const minutes = parseInt(document.getElementById(`${this.id}-minutes`).value) || 0;
        const seconds = parseInt(document.getElementById(`${this.id}-seconds`).value) || 0;

        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

        if (totalSeconds <= 0) {
            this.log('Invalid timer duration', 'warn');
            return;
        }

        this.startTimer(totalSeconds);

        // Reset inputs
        document.getElementById(`${this.id}-hours`).value = '0';
        document.getElementById(`${this.id}-minutes`).value = '5';
        document.getElementById(`${this.id}-seconds`).value = '0';
    }

    /**
     * Start a preset timer
     * @param {number} seconds - Duration in seconds
     */
    startPresetTimer(seconds) {
        this.startTimer(seconds);
    }

    /**
     * Start a new timer
     * @param {number} seconds - Duration in seconds
     */
    startTimer(seconds) {
        const totalMs = seconds * 1000;
        const timer = {
            id: this.nextTimerId++,
            totalMs: totalMs,
            remainingMs: totalMs,
            startTime: Date.now(),
            endTime: Date.now() + totalMs,
            paused: false
        };

        this.timers.push(timer);
        this.saveStateData();
        this.updateTimersList();
        this.log(`Timer started: ${seconds}s`);
    }

    /**
     * Pause a running timer
     * @param {number} timerId - Timer ID to pause
     */
    pauseTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer || timer.paused) return;

        timer.remainingMs = timer.endTime - Date.now();
        timer.paused = true;
        this.saveStateData();
        this.updateTimersList();
        this.log(`Timer paused: ${timerId}`);
    }

    /**
     * Resume a paused timer
     * @param {number} timerId - Timer ID to resume
     */
    resumeTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer || !timer.paused) return;

        timer.startTime = Date.now();
        timer.endTime = Date.now() + timer.remainingMs;
        timer.paused = false;
        this.saveStateData();
        this.updateTimersList();
        this.log(`Timer resumed: ${timerId}`);
    }

    /**
     * Stop and remove a timer
     * @param {number} timerId - Timer ID to stop
     */
    stopTimer(timerId) {
        this.timers = this.timers.filter(t => t.id !== timerId);
        this.saveStateData();
        this.updateTimersList();
        this.log(`Timer stopped: ${timerId}`);
    }

    /**
     * Update all running timers
     */
    updateTimers() {
        let needsUpdate = false;
        const now = Date.now();

        for (const timer of this.timers) {
            if (timer.paused) continue;

            const remaining = timer.endTime - now;

            // Timer completed
            if (remaining <= 0 && timer.endTime > 0) {
                this.onTimerComplete(timer);
                timer.endTime = -1; // Mark as triggered
                needsUpdate = true;
            }
        }

        // Check alarms
        this.checkAlarms();

        // Update display if needed
        if (needsUpdate || this.timers.some(t => !t.paused)) {
            this.updateTimersList();
        }
    }

    /**
     * Handle timer completion
     * @param {Object} timer - Completed timer object
     */
    onTimerComplete(timer) {
        this.log('Timer completed!');
        this.playAlert();

        // Show notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: 'Your countdown timer has finished.',
                icon: '/favicon.ico'
            });
        }

        // Auto-remove completed timer after 3 seconds
        setTimeout(() => {
            this.stopTimer(timer.id);
        }, 3000);
    }

    /**
     * Add a new alarm
     */
    addAlarm() {
        const timeInput = document.getElementById(`${this.id}-alarm-time`);
        const labelInput = document.getElementById(`${this.id}-alarm-label`);

        const time = timeInput.value;
        const label = labelInput.value.trim();

        if (!time) {
            this.log('Please select a time for the alarm', 'warn');
            return;
        }

        const alarm = {
            id: this.nextAlarmId++,
            time: time,
            label: label || 'ALARM',
            enabled: true,
            triggered: false
        };

        this.alarms.push(alarm);
        this.saveStateData();
        this.updateAlarmsList();

        // Clear inputs
        timeInput.value = '';
        labelInput.value = '';

        this.log(`Alarm added: ${time} - ${label}`);
    }

    /**
     * Toggle alarm enabled state
     * @param {number} alarmId - Alarm ID to toggle
     */
    toggleAlarm(alarmId) {
        const alarm = this.alarms.find(a => a.id === alarmId);
        if (!alarm) return;

        alarm.enabled = !alarm.enabled;
        alarm.triggered = false; // Reset triggered state when toggling
        this.saveStateData();
        this.updateAlarmsList();
        this.log(`Alarm ${alarm.enabled ? 'enabled' : 'disabled'}: ${alarmId}`);
    }

    /**
     * Delete an alarm
     * @param {number} alarmId - Alarm ID to delete
     */
    deleteAlarm(alarmId) {
        this.alarms = this.alarms.filter(a => a.id !== alarmId);
        this.saveStateData();
        this.updateAlarmsList();
        this.log(`Alarm deleted: ${alarmId}`);
    }

    /**
     * Check if any alarms should trigger
     */
    checkAlarms() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const alarm of this.alarms) {
            if (!alarm.enabled || alarm.triggered) continue;

            if (alarm.time === currentTime) {
                this.onAlarmTrigger(alarm);
                alarm.triggered = true;
                this.saveStateData();
            }
        }

        // Reset triggered status at the next minute
        const seconds = now.getSeconds();
        if (seconds === 0) {
            for (const alarm of this.alarms) {
                alarm.triggered = false;
            }
            this.saveStateData();
        }
    }

    /**
     * Handle alarm trigger
     * @param {Object} alarm - Triggered alarm object
     */
    onAlarmTrigger(alarm) {
        this.log(`Alarm triggered: ${alarm.label}`);
        this.playAlert();

        // Show notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(alarm.label, {
                body: `Alarm: ${alarm.time}`,
                icon: '/favicon.ico',
                requireInteraction: true
            });
        }

        this.updateAlarmsList();
    }

    /**
     * Play an alert sound using Web Audio API
     */
    playAlert() {
        if (!this.audioContext) {
            this.log('Audio context not available', 'warn');
            return;
        }

        try {
            // Create a cyberpunk-style beep sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Cyberpunk beep: High-pitched short beeps
            oscillator.frequency.value = 880; // A5 note
            oscillator.type = 'square'; // More digital/synthetic sound

            // Envelope
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);

            // Play 3 beeps in succession
            setTimeout(() => this.playSingleBeep(), 400);
            setTimeout(() => this.playSingleBeep(), 800);
        } catch (error) {
            this.log('Error playing alert sound: ' + error.message, 'error');
        }
    }

    /**
     * Play a single beep
     */
    playSingleBeep() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 880;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Update only the timers list portion of the UI
     */
    updateTimersList() {
        const listElement = document.getElementById(`${this.id}-timer-list`);
        if (listElement) {
            listElement.innerHTML = this.renderTimersList();
        }
    }

    /**
     * Update only the alarms list portion of the UI
     */
    updateAlarmsList() {
        const listElement = document.getElementById(`${this.id}-alarm-list`);
        if (listElement) {
            listElement.innerHTML = this.renderAlarmsList();
        }
    }

    /**
     * Save current state to localStorage
     */
    saveStateData() {
        this.saveState({
            timers: this.timers,
            alarms: this.alarms,
            nextTimerId: this.nextTimerId,
            nextAlarmId: this.nextAlarmId
        });
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.log(`Notification permission: ${permission}`);
        }
    }

    /**
     * Cleanup on destroy
     */
    onDestroy() {
        // Clean up global reference
        if (window[`timerPanel_${this.id}`]) {
            delete window[`timerPanel_${this.id}`];
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }

        this.log('Timer panel destroyed');
    }
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerPanel;
}
