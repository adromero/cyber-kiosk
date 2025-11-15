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

        // Set up event delegation for all buttons
        this.setupEventDelegation();

        // Start update loop for running timers
        this.setInterval('update', () => this.updateTimers(), 100);

        this.log('Timer panel initialized');
    }

    /**
     * Set up event delegation for all interactive elements
     */
    setupEventDelegation() {
        if (!this.elements.content) {
            console.error('> TIMER: No content element for event delegation!');
            return;
        }

        // Handle all button clicks via delegation
        this.addEventListener(this.elements.content, 'click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;

            switch (action) {
                case 'start-custom':
                    this.startCustomTimer();
                    break;
                case 'start-preset':
                    this.startPresetTimer(parseInt(button.dataset.seconds));
                    break;
                case 'pause':
                    this.pauseTimer(parseInt(button.dataset.timerId));
                    break;
                case 'resume':
                    this.resumeTimer(parseInt(button.dataset.timerId));
                    break;
                case 'stop':
                    this.stopTimer(parseInt(button.dataset.timerId));
                    break;
                case 'add-alarm':
                    this.addAlarm();
                    break;
                case 'delete-alarm':
                    this.deleteAlarm(parseInt(button.dataset.alarmId));
                    break;
            }
        });

        // Handle alarm toggle checkboxes
        this.addEventListener(this.elements.content, 'change', (e) => {
            if (e.target.classList.contains('alarm-toggle-checkbox')) {
                this.toggleAlarm(parseInt(e.target.dataset.alarmId));
            }
        });
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
     * Render the timer panel UI (summary view)
     */
    render() {
        if (!this.elements.content) return;

        const html = this.renderSummaryView();
        this.elements.content.innerHTML = html;

        // Add click handlers for summary items
        this.setupSummaryClickHandlers();
    }

    /**
     * Render the summary view (shown in panel)
     */
    renderSummaryView() {
        // Get current timer (first running or paused timer)
        const currentTimer = this.timers[0];

        // Get first enabled alarm
        const firstAlarm = this.alarms.find(a => a.enabled);

        // Format timer display
        let timerValue = 'NO TIMER SET';
        let timerSublabel = '';
        if (currentTimer) {
            const remaining = currentTimer.paused
                ? currentTimer.remainingMs
                : Math.max(0, currentTimer.endTime - Date.now());

            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            timerValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            timerSublabel = currentTimer.paused ? 'PAUSED' : 'RUNNING';
        }

        // Format alarm display
        let alarmValue = 'NO ALARM SET';
        let alarmSublabel = '';
        if (firstAlarm) {
            alarmValue = firstAlarm.time;
            alarmSublabel = firstAlarm.label || 'ALARM';
        }

        return `
            <div class="timer-summary">
                <div class="timer-summary-item" data-modal-section="timer">
                    <div class="timer-summary-label">&gt; TIMER</div>
                    <div class="timer-summary-value ${!currentTimer ? 'empty' : ''}">${timerValue}</div>
                    ${timerSublabel ? `<div class="timer-summary-sublabel">${timerSublabel}</div>` : ''}
                </div>
                <div class="timer-summary-item has-alarm" data-modal-section="alarm">
                    <div class="timer-summary-label">&gt; ALARM</div>
                    <div class="timer-summary-value ${!firstAlarm ? 'empty' : ''}">${alarmValue}</div>
                    ${alarmSublabel ? `<div class="timer-summary-sublabel">${alarmSublabel}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Set up click handlers for summary view
     */
    setupSummaryClickHandlers() {
        const summaryItems = this.elements.content.querySelectorAll('.timer-summary-item');
        summaryItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.modalSection;
                this.showModal(section);
            });
        });
    }

    /**
     * Render the modal content (full timer/alarm interface)
     */
    renderModalContent() {
        return `
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
                            data-action="start-custom">
                        START TIMER
                    </button>
                </div>

                <!-- Quick Presets -->
                <div class="timer-presets">
                    ${this.presets.map(preset => `
                        <button class="timer-preset-button"
                                data-action="start-preset"
                                data-seconds="${preset.seconds}">
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
                            data-action="add-alarm">
                        ADD ALARM
                    </button>
                </div>

                <!-- Alarms List -->
                <div class="timer-alarm-list" id="${this.id}-alarm-list">
                    ${this.renderAlarmsList()}
                </div>
            </div>
        `;
    }

    /**
     * Create and attach the modal overlay to the document
     */
    createModal() {
        // Create modal overlay
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'timer-modal-overlay';
        this.modalOverlay.id = `${this.id}-modal`;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'timer-modal-container';

        // Modal structure
        modalContainer.innerHTML = `
            <div class="timer-modal-header">
                <div class="timer-modal-title">&gt; TIMER_ALARM</div>
                <button class="timer-modal-close" data-action="close-modal">X</button>
            </div>
            <div class="timer-modal-content" id="${this.id}-modal-content">
                <!-- Content will be populated when modal opens -->
            </div>
        `;

        this.modalOverlay.appendChild(modalContainer);
        document.body.appendChild(this.modalOverlay);

        // Set up event delegation for entire modal container (one time only)
        this.setupModalEventDelegation(modalContainer);

        // Close modal when clicking overlay (outside modal)
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.hideModal();
            }
        });

        // Close modal with ESC key
        this.escKeyHandler = (e) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
                this.hideModal();
            }
        };
        document.addEventListener('keydown', this.escKeyHandler);
    }

    /**
     * Show the modal and populate with content
     * @param {string} section - 'timer' or 'alarm' to scroll to that section
     */
    showModal(section = 'timer') {
        if (!this.modalOverlay) {
            this.createModal();
        }

        // Populate modal content
        const modalContent = document.getElementById(`${this.id}-modal-content`);

        if (modalContent) {
            modalContent.innerHTML = this.renderModalContent();

            // Scroll to section after a brief delay to allow rendering
            setTimeout(() => {
                const targetElement = section === 'alarm'
                    ? modalContent.querySelector('.timer-section-divider')
                    : modalContent.querySelector('.timer-controls');

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }

        // Show modal
        this.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    /**
     * Hide the modal
     */
    hideModal() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling

            // Re-render summary view to reflect any changes made in modal
            this.render();
        }
    }

    /**
     * Set up event delegation for modal content
     * @param {HTMLElement} modalContent - Modal content element
     */
    setupModalEventDelegation(modalContent) {
        // Handle all button clicks via delegation
        modalContent.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;

            switch (action) {
                case 'close-modal':
                    this.hideModal();
                    break;
                case 'start-custom':
                    this.startCustomTimer();
                    break;
                case 'start-preset':
                    this.startPresetTimer(parseInt(button.dataset.seconds));
                    break;
                case 'pause':
                    this.pauseTimer(parseInt(button.dataset.timerId));
                    break;
                case 'resume':
                    this.resumeTimer(parseInt(button.dataset.timerId));
                    break;
                case 'stop':
                    this.stopTimer(parseInt(button.dataset.timerId));
                    break;
                case 'add-alarm':
                    this.addAlarm();
                    break;
                case 'delete-alarm':
                    this.deleteAlarm(parseInt(button.dataset.alarmId));
                    break;
            }
        });

        // Handle alarm toggle checkboxes
        modalContent.addEventListener('change', (e) => {
            if (e.target.classList.contains('alarm-toggle-checkbox')) {
                this.toggleAlarm(parseInt(e.target.dataset.alarmId));
            }
        });
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
                            ? `<button class="timer-action-button" data-action="resume" data-timer-id="${timer.id}">RESUME</button>`
                            : `<button class="timer-action-button" data-action="pause" data-timer-id="${timer.id}">PAUSE</button>`
                        }
                        <button class="timer-action-button" data-action="stop" data-timer-id="${timer.id}">STOP</button>
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
                                   class="alarm-toggle-checkbox"
                                   data-alarm-id="${alarm.id}"
                                   ${alarm.enabled ? 'checked' : ''}>
                            <span class="timer-toggle-slider"></span>
                        </label>
                        <button class="timer-action-button"
                                data-action="delete-alarm"
                                data-alarm-id="${alarm.id}">
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
        let needsFullRender = false;
        const now = Date.now();

        for (const timer of this.timers) {
            if (timer.paused) continue;

            const remaining = timer.endTime - now;

            // Timer completed
            if (remaining <= 0 && timer.endTime > 0) {
                this.onTimerComplete(timer);
                timer.endTime = -1; // Mark as triggered
                needsFullRender = true;
            }
        }

        // Check alarms
        this.checkAlarms();

        // Update display
        if (needsFullRender) {
            // Full re-render needed (timer completed, added, removed, etc.)
            this.updateTimersList();
        } else if (this.timers.some(t => !t.paused)) {
            // Just update the timer displays without destroying DOM
            this.updateTimerDisplays();
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
     * Update only the timer displays (time and progress) without re-rendering buttons
     * This prevents destroying DOM elements during rapid updates
     */
    updateTimerDisplays() {
        const now = Date.now();

        // Check if modal is open
        const isModalOpen = this.modalOverlay && this.modalOverlay.classList.contains('active');

        if (isModalOpen) {
            // Update modal timer displays
            for (const timer of this.timers) {
                const remaining = timer.paused
                    ? timer.remainingMs
                    : Math.max(0, timer.endTime - now);

                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor((remaining % 3600000) / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                const milliseconds = Math.floor((remaining % 1000) / 10);

                const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;

                const progress = timer.totalMs > 0
                    ? ((timer.totalMs - remaining) / timer.totalMs) * 100
                    : 0;

                // Update only the display and progress elements in modal
                const timerElements = document.querySelectorAll(`[data-timer-id="${timer.id}"]`);
                if (timerElements.length > 0) {
                    // Find the timer-item parent
                    const timerItem = timerElements[0].closest('.timer-item');
                    if (timerItem) {
                        const displayElement = timerItem.querySelector('.timer-display');
                        const progressFill = timerItem.querySelector('.timer-progress-fill');

                        if (displayElement) {
                            displayElement.textContent = timeStr;
                        }

                        if (progressFill) {
                            progressFill.style.width = `${progress}%`;
                        }
                    }
                }
            }
        } else {
            // Update summary view timer display
            this.updateSummaryTimerDisplay();
        }
    }

    /**
     * Update just the timer display in the summary view
     */
    updateSummaryTimerDisplay() {
        const currentTimer = this.timers[0];
        const timerValueElement = this.elements.content.querySelector('[data-modal-section="timer"] .timer-summary-value');
        const timerSublabelElement = this.elements.content.querySelector('[data-modal-section="timer"] .timer-summary-sublabel');

        if (timerValueElement) {
            if (currentTimer) {
                const remaining = currentTimer.paused
                    ? currentTimer.remainingMs
                    : Math.max(0, currentTimer.endTime - Date.now());

                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor((remaining % 3600000) / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);

                const timerValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                timerValueElement.textContent = timerValue;
                timerValueElement.classList.remove('empty');

                // Update or create sublabel
                const sublabel = currentTimer.paused ? 'PAUSED' : 'RUNNING';
                if (timerSublabelElement) {
                    timerSublabelElement.textContent = sublabel;
                } else {
                    const sublabelDiv = document.createElement('div');
                    sublabelDiv.className = 'timer-summary-sublabel';
                    sublabelDiv.textContent = sublabel;
                    timerValueElement.parentElement.appendChild(sublabelDiv);
                }
            } else {
                timerValueElement.textContent = 'NO TIMER SET';
                timerValueElement.classList.add('empty');
                if (timerSublabelElement) {
                    timerSublabelElement.remove();
                }
            }
        }
    }

    /**
     * Update only the timers list portion of the UI
     * FULL re-render - use sparingly as it destroys and recreates DOM elements
     */
    updateTimersList() {
        const isModalOpen = this.modalOverlay && this.modalOverlay.classList.contains('active');

        if (isModalOpen) {
            // Update modal timers list
            const listElement = document.getElementById(`${this.id}-timer-list`);
            if (listElement) {
                listElement.innerHTML = this.renderTimersList();
            }
        } else {
            // Re-render summary view
            this.render();
        }
    }

    /**
     * Update only the alarms list portion of the UI
     */
    updateAlarmsList() {
        const isModalOpen = this.modalOverlay && this.modalOverlay.classList.contains('active');

        if (isModalOpen) {
            // Update modal alarms list
            const listElement = document.getElementById(`${this.id}-alarm-list`);
            if (listElement) {
                listElement.innerHTML = this.renderAlarmsList();
            }
        } else {
            // Re-render summary view
            this.render();
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
        // Remove ESC key handler
        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
        }

        // Remove modal from DOM
        if (this.modalOverlay && this.modalOverlay.parentNode) {
            this.modalOverlay.parentNode.removeChild(this.modalOverlay);
        }

        // Restore body scroll
        document.body.style.overflow = '';

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
