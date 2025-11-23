/**
 * CalendarPanel - Calendar with events and reminders
 * Extends BasePanel to provide calendar functionality
 */

class CalendarPanel extends BasePanel {
    constructor(config) {
        super(config);

        // Calendar state
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = []; // { id, date, title, description, type, time }
        this.nextEventId = 1;

        // Event types
        this.eventTypes = {
            reminder: { label: 'REMINDER', color: '#00ffff', icon: '🔔' },
            meeting: { label: 'MEETING', color: '#ff00ff', icon: '👥' },
            task: { label: 'TASK', color: '#ffff00', icon: '📋' },
            birthday: { label: 'BIRTHDAY', color: '#ff0080', icon: '🎂' },
            other: { label: 'OTHER', color: '#00ff00', icon: '📌' }
        };
    }

    /**
     * Initialize the calendar panel
     */
    async onInit() {
        this.log('Initializing calendar panel');

        // Load saved state
        const savedState = this.loadState();
        if (savedState) {
            this.events = savedState.events || [];
            this.nextEventId = savedState.nextEventId || 1;

            // Convert date strings back to Date objects
            this.events.forEach(event => {
                if (typeof event.date === 'string') {
                    event.date = new Date(event.date);
                }
            });
        }

        // If container exists, render compact view
        if (this.container) {
            this.renderContainer();
        }
    }

    /**
     * Render compact calendar view in container
     */
    renderContainer() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="calendar-widget">
                <div class="widget-header" style="cursor: pointer;" title="Click to open full calendar">
                    <span class="widget-title">&gt; CALENDAR</span>
                    <span class="widget-status">READY</span>
                </div>
                <div class="calendar-day-view">
                    ${this.renderDayView()}
                </div>
            </div>
        `;

        // Click handler to open full modal
        const header = this.container.querySelector('.widget-header');
        if (header) {
            header.addEventListener('click', () => this.showModal());
        }

        // Navigation buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'prev-day') {
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                this.refreshContainer();
            } else if (e.target.dataset.action === 'next-day') {
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                this.refreshContainer();
            } else if (e.target.dataset.action === 'today') {
                this.currentDate = new Date();
                this.refreshContainer();
            }
        });
    }

    /**
     * Refresh the container view
     */
    refreshContainer() {
        const dayView = this.container?.querySelector('.calendar-day-view');

        if (dayView) {
            dayView.innerHTML = this.renderDayView();
        }
    }

    /**
     * Render day view for container (shows current day's events)
     */
    renderDayView() {
        const displayDate = new Date(this.currentDate);
        const isToday = this.isToday(displayDate);

        // Format date strings
        const dayOfWeek = displayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = displayDate.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = displayDate.getDate();
        const year = displayDate.getFullYear();

        // Get events for this day
        const dayEvents = this.getEventsForDate(displayDate);

        // Render events list
        let eventsHTML = '';
        if (dayEvents.length === 0) {
            eventsHTML = '<div class="calendar-day-no-events">No events today</div>';
        } else {
            eventsHTML = dayEvents
                .sort((a, b) => {
                    // Sort by time if available
                    if (a.time && b.time) {
                        return a.time.localeCompare(b.time);
                    }
                    return 0;
                })
                .map(event => {
                    const eventType = this.eventTypes[event.type] || this.eventTypes.other;
                    const timeStr = event.time || '';

                    return `
                        <div class="calendar-day-event">
                            <div class="calendar-day-event-time">${timeStr}</div>
                            <div class="calendar-day-event-content">
                                <span class="calendar-day-event-icon" style="color: ${eventType.color}">${eventType.icon}</span>
                                <div class="calendar-day-event-info">
                                    <div class="calendar-day-event-title">${this.escapeHtml(event.title)}</div>
                                    ${event.description ? `<div class="calendar-day-event-desc">${this.escapeHtml(event.description)}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
        }

        return `
            <div class="calendar-day-header">
                <button class="calendar-day-nav" data-action="prev-day" title="Previous day">◀</button>
                <div class="calendar-day-date">
                    <div class="calendar-day-weekday">${dayOfWeek}</div>
                    <div class="calendar-day-number">${dayNum}</div>
                    <div class="calendar-day-month">${monthName} ${year}</div>
                    ${isToday ? '<div class="calendar-day-today-badge">TODAY</div>' : ''}
                </div>
                <button class="calendar-day-nav" data-action="next-day" title="Next day">▶</button>
            </div>
            <div class="calendar-day-events">
                ${eventsHTML}
            </div>
            ${!isToday ? '<button class="calendar-day-today-btn" data-action="today">JUMP TO TODAY</button>' : ''}
        `;
    }

    /**
     * Show the calendar modal
     */
    showModal() {
        this.log('Opening calendar modal');

        // Render calendar UI
        const calendarHTML = this.renderCalendar();

        // Use global openModal function
        if (typeof openModal === 'function') {
            openModal('&gt; CALENDAR_SYSTEM', calendarHTML);

            // Set up event listeners after modal is displayed
            setTimeout(() => this.setupEventListeners(), 100);
        } else {
            console.error('openModal function not found');
        }
    }

    /**
     * Render the full calendar UI
     */
    renderCalendar() {
        const monthView = this.renderMonthView();
        const eventList = this.renderEventList();
        const addEventForm = this.renderAddEventForm();

        return `
            <div class="calendar-container">
                <div class="calendar-month-view">
                    ${monthView}
                </div>
                <div class="calendar-sidebar">
                    <div class="calendar-events-section">
                        <h3 class="calendar-section-title">UPCOMING EVENTS</h3>
                        ${eventList}
                    </div>
                    <div class="calendar-add-section">
                        <button class="calendar-toggle-form-btn" data-action="toggle-form">
                            + ADD EVENT
                        </button>
                        <div class="calendar-add-form" style="display: none;">
                            ${addEventForm}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the month view (calendar grid)
     */
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthName = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

        // Get days from previous month to fill in grid
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = startingDayOfWeek;

        // Calendar grid
        let calendarGrid = '';
        let dayCounter = 1;
        let nextMonthCounter = 1;

        // Generate 6 rows (max possible weeks in a month)
        for (let row = 0; row < 6; row++) {
            calendarGrid += '<div class="calendar-week">';

            for (let col = 0; col < 7; col++) {
                const cellIndex = row * 7 + col;

                if (cellIndex < prevMonthDays) {
                    // Previous month days
                    const day = prevMonthLastDay - prevMonthDays + cellIndex + 1;
                    calendarGrid += `<div class="calendar-day other-month">${day}</div>`;
                } else if (dayCounter <= daysInMonth) {
                    // Current month days
                    const currentDay = dayCounter;
                    const cellDate = new Date(year, month, currentDay);
                    const isToday = this.isToday(cellDate);
                    const hasEvents = this.getEventsForDate(cellDate).length > 0;
                    const todayClass = isToday ? 'today' : '';
                    const eventsClass = hasEvents ? 'has-events' : '';
                    const dateStr = this.formatDateKey(cellDate);

                    calendarGrid += `
                        <div class="calendar-day ${todayClass} ${eventsClass}" data-date="${dateStr}">
                            <div class="calendar-day-number">${currentDay}</div>
                            ${hasEvents ? '<div class="calendar-day-indicator"></div>' : ''}
                        </div>
                    `;
                    dayCounter++;
                } else {
                    // Next month days
                    calendarGrid += `<div class="calendar-day other-month">${nextMonthCounter}</div>`;
                    nextMonthCounter++;
                }
            }

            calendarGrid += '</div>';
        }

        return `
            <div class="calendar-header">
                <button class="calendar-nav-btn" data-action="prev-month">◀</button>
                <h2 class="calendar-month-title">${monthName}</h2>
                <button class="calendar-nav-btn" data-action="next-month">▶</button>
            </div>
            <div class="calendar-weekdays">
                <div class="calendar-weekday">SUN</div>
                <div class="calendar-weekday">MON</div>
                <div class="calendar-weekday">TUE</div>
                <div class="calendar-weekday">WED</div>
                <div class="calendar-weekday">THU</div>
                <div class="calendar-weekday">FRI</div>
                <div class="calendar-weekday">SAT</div>
            </div>
            <div class="calendar-grid">
                ${calendarGrid}
            </div>
        `;
    }

    /**
     * Render the event list
     */
    renderEventList() {
        if (this.events.length === 0) {
            return `
                <div class="calendar-no-events">
                    NO EVENTS SCHEDULED
                </div>
            `;
        }

        // Sort events by date
        const sortedEvents = [...this.events].sort((a, b) => a.date - b.date);

        // Get upcoming events (today and future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = sortedEvents.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        });

        if (upcomingEvents.length === 0) {
            return `
                <div class="calendar-no-events">
                    NO UPCOMING EVENTS
                </div>
            `;
        }

        return upcomingEvents.slice(0, 5).map(event => {
            const eventType = this.eventTypes[event.type] || this.eventTypes.other;
            const dateStr = new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: new Date(event.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });

            return `
                <div class="calendar-event-item" data-event-id="${event.id}">
                    <div class="calendar-event-icon" style="color: ${eventType.color}">
                        ${eventType.icon}
                    </div>
                    <div class="calendar-event-details">
                        <div class="calendar-event-title">${this.escapeHtml(event.title)}</div>
                        <div class="calendar-event-date">
                            ${dateStr}${event.time ? ' · ' + event.time : ''}
                        </div>
                    </div>
                    <button class="calendar-event-delete" data-action="delete-event" data-event-id="${event.id}">
                        ✕
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * Render the add event form
     */
    renderAddEventForm() {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="calendar-form-group">
                <label>EVENT TITLE</label>
                <input type="text" class="calendar-input" id="event-title" placeholder="Enter event title..." maxlength="50">
            </div>
            <div class="calendar-form-group">
                <label>DATE</label>
                <input type="date" class="calendar-input" id="event-date" value="${today}">
            </div>
            <div class="calendar-form-group">
                <label>TIME (OPTIONAL)</label>
                <input type="time" class="calendar-input" id="event-time">
            </div>
            <div class="calendar-form-group">
                <label>TYPE</label>
                <select class="calendar-input" id="event-type">
                    ${Object.keys(this.eventTypes).map(key => {
                        const type = this.eventTypes[key];
                        return `<option value="${key}">${type.icon} ${type.label}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="calendar-form-group">
                <label>DESCRIPTION (OPTIONAL)</label>
                <textarea class="calendar-input" id="event-description" placeholder="Event details..." rows="3" maxlength="200"></textarea>
            </div>
            <div class="calendar-form-actions">
                <button class="calendar-btn calendar-btn-primary" data-action="add-event">
                    CREATE EVENT
                </button>
                <button class="calendar-btn calendar-btn-secondary" data-action="cancel-form">
                    CANCEL
                </button>
            </div>
        `;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const modal = document.querySelector('.modal-content');
        if (!modal) return;

        // Event delegation for all calendar buttons
        modal.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            this.log('Calendar action:', action);

            switch (action) {
                case 'prev-month':
                    this.previousMonth();
                    break;
                case 'next-month':
                    this.nextMonth();
                    break;
                case 'toggle-form':
                    this.toggleAddForm();
                    break;
                case 'add-event':
                    this.addEvent();
                    break;
                case 'cancel-form':
                    this.hideAddForm();
                    break;
                case 'delete-event':
                    this.deleteEvent(target.dataset.eventId);
                    break;
            }
        });

        // Click on calendar day
        modal.addEventListener('click', (e) => {
            const dayEl = e.target.closest('.calendar-day:not(.other-month)');
            if (dayEl && dayEl.dataset.date) {
                this.selectDate(dayEl.dataset.date);
            }
        });
    }

    /**
     * Navigate to previous month
     */
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.updateCalendarDisplay();
    }

    /**
     * Navigate to next month
     */
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.updateCalendarDisplay();
    }

    /**
     * Update the calendar display
     */
    updateCalendarDisplay() {
        const modal = document.querySelector('.modal-content');
        if (!modal) return;

        const container = modal.querySelector('.calendar-month-view');
        if (container) {
            container.innerHTML = this.renderMonthView();
        }
    }

    /**
     * Toggle add event form
     */
    toggleAddForm() {
        const form = document.querySelector('.calendar-add-form');
        if (form) {
            const isHidden = form.style.display === 'none';
            form.style.display = isHidden ? 'block' : 'none';

            // Focus title input when showing
            if (isHidden) {
                setTimeout(() => {
                    const titleInput = document.getElementById('event-title');
                    if (titleInput) titleInput.focus();
                }, 100);
            }
        }
    }

    /**
     * Hide add event form
     */
    hideAddForm() {
        const form = document.querySelector('.calendar-add-form');
        if (form) {
            form.style.display = 'none';
            this.clearFormInputs();
        }
    }

    /**
     * Clear form inputs
     */
    clearFormInputs() {
        const inputs = ['event-title', 'event-time', 'event-description'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const dateInput = document.getElementById('event-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        const typeInput = document.getElementById('event-type');
        if (typeInput) {
            typeInput.value = 'reminder';
        }
    }

    /**
     * Add a new event
     */
    addEvent() {
        const title = document.getElementById('event-title')?.value.trim();
        const dateStr = document.getElementById('event-date')?.value;
        const time = document.getElementById('event-time')?.value;
        const type = document.getElementById('event-type')?.value || 'reminder';
        const description = document.getElementById('event-description')?.value.trim();

        // Validation
        if (!title) {
            alert('Please enter an event title');
            return;
        }

        if (!dateStr) {
            alert('Please select a date');
            return;
        }

        // Create event object
        const event = {
            id: this.nextEventId++,
            title,
            date: new Date(dateStr),
            time: time || null,
            type,
            description: description || null
        };

        // Add to events array
        this.events.push(event);

        // Save state
        this.saveState({
            events: this.events,
            nextEventId: this.nextEventId
        });

        this.log('Event added:', event);

        // Update UI
        this.hideAddForm();
        this.refreshEventList();
        this.updateCalendarDisplay();
    }

    /**
     * Delete an event
     */
    deleteEvent(eventId) {
        const id = parseInt(eventId);
        const eventIndex = this.events.findIndex(e => e.id === id);

        if (eventIndex !== -1) {
            const event = this.events[eventIndex];

            if (confirm(`Delete event "${event.title}"?`)) {
                this.events.splice(eventIndex, 1);

                // Save state
                this.saveState({
                    events: this.events,
                    nextEventId: this.nextEventId
                });

                this.log('Event deleted:', event);

                // Update UI
                this.refreshEventList();
                this.updateCalendarDisplay();
            }
        }
    }

    /**
     * Select a date (for future feature expansion)
     */
    selectDate(dateStr) {
        this.selectedDate = new Date(dateStr);
        this.log('Date selected:', this.selectedDate);

        // Auto-fill date input if form is open
        const dateInput = document.getElementById('event-date');
        if (dateInput) {
            dateInput.value = dateStr;
        }

        // Show form if hidden
        const form = document.querySelector('.calendar-add-form');
        if (form && form.style.display === 'none') {
            this.toggleAddForm();
        }
    }

    /**
     * Refresh the event list
     */
    refreshEventList() {
        const eventListContainer = document.querySelector('.calendar-events-section');
        if (eventListContainer) {
            const newList = this.renderEventList();
            const listElement = eventListContainer.querySelector('.calendar-no-events, .calendar-event-item')?.parentElement;

            if (listElement) {
                listElement.innerHTML = newList;
            } else {
                // Create new list container
                eventListContainer.innerHTML = `
                    <h3 class="calendar-section-title">UPCOMING EVENTS</h3>
                    ${newList}
                `;
            }
        }
    }

    /**
     * Get events for a specific date
     */
    getEventsForDate(date) {
        const dateKey = this.formatDateKey(date);
        return this.events.filter(event => {
            const eventKey = this.formatDateKey(event.date);
            return eventKey === dateKey;
        });
    }

    /**
     * Check if date is today
     */
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    /**
     * Format date as YYYY-MM-DD key
     */
    formatDateKey(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clean up when panel is destroyed
     */
    onDestroy() {
        this.log('Calendar panel destroyed');
        // Event listeners will be removed when modal closes
    }
}

// Export if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarPanel;
}
