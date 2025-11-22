/**
 * Layout Editor for Settings Page
 * Touchscreen-friendly version with tap-based interface
 * Grid represents the actual panel area (excluding header/footer)
 */

class LayoutEditor {
    constructor() {
        this.gridRows = 4;
        this.gridColumns = 4;
        this.gridLayout = [];
        this.selectedPanel = null;
        this.selectedPanelInPalette = null; // Panel ready to be placed
        this.draggedPanel = null; // Panel being dragged
        this.isDragging = false;
        this.panelIcons = {
            info_feed: '📊',
            news: '📰',
            timer: '⏰',
            music: '🎵',
            cyberspace: '🌐',
            video: '📺',
            system: '💻'
        };
        this.panelNames = {
            info_feed: 'InfoFeed',
            news: 'News',
            timer: 'Timer',
            music: 'Music',
            cyberspace: 'Cyberspace',
            video: 'Video',
            system: 'System'
        };
        // Map individual panels to their container panels
        this.panelMapping = {
            weather: 'info_feed',
            markets: 'info_feed',
            news: 'news',
            timer: 'timer',
            music: 'music',
            cyberspace: 'cyberspace',
            video: 'video',
            system: 'system'
        };
    }

    init() {
        console.log('[LayoutEditor] Initializing touchscreen-friendly editor...');

        // Set up grid dimension selectors
        this.setupDimensionSelectors();

        // Set initial grid attributes
        this.updateGridAttributes();

        // Initialize grid
        this.renderGrid();

        // Set up panel palette
        this.updatePanelPalette();

        // Set up panel size controls
        this.setupSizeControls();

        // Set up reset button
        document.getElementById('reset-layout-btn')?.addEventListener('click', () => {
            this.resetLayout();
        });
    }

    setupDimensionSelectors() {
        // Column selector
        const columnBtns = document.querySelectorAll('.column-btn');
        columnBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const columns = parseInt(btn.getAttribute('data-columns'));
                this.setColumns(columns);

                // Update active state
                columnBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Row selector
        const rowBtns = document.querySelectorAll('.row-btn');
        rowBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const rows = parseInt(btn.getAttribute('data-rows'));
                this.setRows(rows);

                // Update active state
                rowBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    setColumns(columns) {
        this.gridColumns = columns;
        this.updateGridAttributes();
        this.renderGrid();

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    setRows(rows) {
        this.gridRows = rows;
        this.updateGridAttributes();
        this.renderGrid();

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    updateGridAttributes() {
        const gridPreview = document.getElementById('grid-preview');
        if (gridPreview) {
            gridPreview.setAttribute('data-rows', this.gridRows);
            gridPreview.setAttribute('data-columns', this.gridColumns);
        }
    }

    renderGrid() {
        const gridPreview = document.getElementById('grid-preview');
        if (!gridPreview) return;

        // Clear existing grid
        gridPreview.innerHTML = '';

        // Create rows x columns of cells
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-col', col);

                // Explicitly position each cell in the grid
                cell.style.gridColumn = `${col + 1} / span 1`;
                cell.style.gridRow = `${row + 1} / span 1`;

                // Set up tap/click handler for placement
                this.setupCellTap(cell);

                gridPreview.appendChild(cell);
            }
        }

        // Re-render panels in their positions
        this.renderPanelsInGrid();
    }

    setupCellTap(cell) {
        const row = parseInt(cell.getAttribute('data-row'));
        const col = parseInt(cell.getAttribute('data-col'));

        // Click handler for placement
        cell.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Prevent triggering if clicking on a panel inside the cell
            if (e.target !== cell) return;

            // If we have a panel selected in the palette, place it
            if (this.selectedPanelInPalette) {
                this.placePanelAtCell(row, col);
            }
        });

        // Drag and drop handlers
        cell.addEventListener('dragover', (e) => {
            if (!this.draggedPanel) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            // Visual feedback
            if (!cell.classList.contains('occupied')) {
                cell.classList.add('drop-target');
            }
        });

        cell.addEventListener('dragleave', (e) => {
            cell.classList.remove('drop-target');
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.classList.remove('drop-target');

            if (!this.draggedPanel) return;

            // Check if the target position is valid
            const canDrop = this.canPanelFitAt(this.draggedPanel, row, col);

            if (canDrop) {
                // Move the panel to the new position
                this.movePanelTo(this.draggedPanel.id, row, col);
                this.showMessage(`${this.panelNames[this.draggedPanel.id]} moved to new position`, 'success');
            } else {
                this.showMessage('Cannot place panel here - position is occupied or out of bounds', 'error');
            }
        });
    }

    placePanelAtCell(row, col) {
        if (!this.selectedPanelInPalette) return;

        console.log(`[LayoutEditor] Attempting to place ${this.selectedPanelInPalette} at (${row}, ${col})`);
        console.log(`[LayoutEditor] Current gridLayout:`, this.gridLayout);

        // Check if this position is available
        if (this.isCellOccupied(row, col)) {
            console.warn(`[LayoutEditor] Cell (${row}, ${col}) is occupied`);
            this.showMessage('This position is already occupied!', 'error');
            return;
        }

        console.log(`[LayoutEditor] Cell is free, adding panel`);

        // Add panel to layout with default 1x1 size
        this.addPanelToGrid(this.selectedPanelInPalette, row, col, 1, 1);

        // Clear selection and update palette
        this.selectedPanelInPalette = null;
        this.updatePanelPalette();

        this.showMessage('Panel placed! Tap it to resize or remove.', 'success');
    }

    renderPanelsInGrid() {
        const gridPreview = document.getElementById('grid-preview');
        if (!gridPreview) return;

        // Clear any existing panel items
        gridPreview.querySelectorAll('.grid-panel-item').forEach(el => el.remove());

        // Remove all occupied classes first
        gridPreview.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('occupied');
        });

        // Render each panel in the layout
        this.gridLayout.forEach(panelData => {
            const { id, row, col, width, height } = panelData;

            // Validate panel is within grid bounds
            if (row >= this.gridRows || col >= this.gridColumns) {
                console.warn(`Panel ${id} is outside grid bounds, skipping`);
                return;
            }

            // Find the cell at this position
            const cell = gridPreview.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (!cell) return;

            // Create panel element
            const panelEl = document.createElement('div');
            panelEl.className = 'grid-panel-item';
            panelEl.setAttribute('data-panel-id', id);
            // Check if this panel is selected to show enhanced info
            const isSelected = this.selectedPanel && this.selectedPanel.id === id;
            panelEl.innerHTML = `
                <div class="panel-drag-handle" title="Drag to move">⋮⋮</div>
                <div class="panel-icon-small">${this.panelIcons[id] || '📦'}</div>
                <div class="panel-name-display">${this.panelNames[id] || id}</div>
                <div class="panel-size-display">${width}×${height}${isSelected ? ' • Click controls below to resize' : ''}</div>
            `;

            // Make it draggable
            panelEl.draggable = true;

            // Drag start
            panelEl.addEventListener('dragstart', (e) => {
                this.isDragging = true;
                this.draggedPanel = panelData;
                panelEl.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', id);
            });

            // Drag end
            panelEl.addEventListener('dragend', (e) => {
                this.isDragging = false;
                this.draggedPanel = null;
                panelEl.classList.remove('dragging');
                this.renderGrid(); // Re-render to clean up any drag indicators
            });

            // Make it tappable to select and show resize controls
            panelEl.addEventListener('click', (e) => {
                // Don't select if we just finished dragging
                if (this.isDragging) return;

                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.selectPanelInGrid(panelData);
                // Show a helpful message about resizing
                this.showMessage(`Use the controls below to resize ${this.panelNames[id] || id}, or tap "Remove" to delete it.`, 'info');
            });

            // Position and size the panel - use full grid positioning
            const gridColumn = col + 1;
            const gridRow = row + 1;
            panelEl.style.gridColumn = `${gridColumn} / span ${width}`;
            panelEl.style.gridRow = `${gridRow} / span ${height}`;
            panelEl.style.zIndex = '10'; // Ensure panels are above grid cells

            gridPreview.appendChild(panelEl);

            // Mark cells as occupied
            for (let r = row; r < Math.min(row + height, this.gridRows); r++) {
                for (let c = col; c < Math.min(col + width, this.gridColumns); c++) {
                    const occupiedCell = gridPreview.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (occupiedCell) {
                        occupiedCell.classList.add('occupied');
                    }
                }
            }
        });
    }

    isCellOccupied(row, col, ignorePanel = null) {
        return this.gridLayout.some(panel => {
            if (ignorePanel && panel.id === ignorePanel) return false;

            return (
                row >= panel.row &&
                row < panel.row + panel.height &&
                col >= panel.col &&
                col < panel.col + panel.width
            );
        });
    }

    canPanelFitAt(panel, row, col) {
        // Check bounds
        if (row + panel.height > this.gridRows || col + panel.width > this.gridColumns) {
            return false;
        }

        // Check for overlaps with other panels
        for (let r = row; r < row + panel.height; r++) {
            for (let c = col; c < col + panel.width; c++) {
                if (this.isCellOccupied(r, c, panel.id)) {
                    return false;
                }
            }
        }

        return true;
    }

    movePanelTo(panelId, newRow, newCol) {
        const panel = this.gridLayout.find(p => p.id === panelId);
        if (!panel) return;

        panel.row = newRow;
        panel.col = newCol;

        // Re-render
        this.renderGrid();

        // Re-select if it was selected
        if (this.selectedPanel && this.selectedPanel.id === panelId) {
            this.selectPanelInGrid(panel);
        }

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    addPanelToGrid(panelId, row, col, width, height) {
        // Remove panel if it already exists
        this.gridLayout = this.gridLayout.filter(p => p.id !== panelId);

        // Add new panel
        this.gridLayout.push({
            id: panelId,
            row,
            col,
            width,
            height
        });

        // Re-render
        this.renderGrid();
        this.updatePanelPalette();

        // Auto-select the newly placed panel
        const newPanel = this.gridLayout.find(p => p.id === panelId);
        if (newPanel) {
            this.selectPanelInGrid(newPanel);
        }

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    updatePanelPalette() {
        const palette = document.getElementById('panel-palette');
        if (!palette) return;

        palette.innerHTML = '';

        // Get enabled panels from the panel toggles
        const enabledRawPanels = [];
        document.querySelectorAll('[data-panel]').forEach(toggle => {
            if (toggle.checked) {
                enabledRawPanels.push(toggle.getAttribute('data-panel'));
            }
        });

        // Map to container panels and deduplicate
        const enabledPanels = [...new Set(enabledRawPanels.map(p => this.panelMapping[p] || p))];

        console.log('[LayoutEditor] Raw enabled panels:', enabledRawPanels);
        console.log('[LayoutEditor] Mapped enabled panels:', enabledPanels);
        console.log('[LayoutEditor] Current gridLayout:', this.gridLayout);

        // Show panels that are not yet in the grid
        enabledPanels.forEach(panelId => {
            const inGrid = this.gridLayout.some(p => p.id === panelId);
            if (inGrid) return;

            const panelEl = document.createElement('div');
            panelEl.className = 'palette-panel';
            panelEl.setAttribute('data-panel-id', panelId);

            // Add selected class if this is the panel ready to be placed
            if (this.selectedPanelInPalette === panelId) {
                panelEl.classList.add('selected');
            }

            panelEl.innerHTML = `
                <span class="palette-icon">${this.panelIcons[panelId] || '📦'}</span>
                <span class="palette-name">${this.panelNames[panelId] || panelId}</span>
            `;

            // Set up tap to select for placement
            panelEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.selectPanelInPalette(panelId);
            });

            palette.appendChild(panelEl);
        });

        // Show message if all panels are placed
        if (palette.children.length === 0) {
            palette.innerHTML = '<div class="palette-empty-message">✓ All enabled panels have been placed in the grid!</div>';
        }
    }

    selectPanelInPalette(panelId) {
        this.selectedPanelInPalette = panelId;

        // Clear any selected panel in grid
        this.deselectPanelInGrid();

        // Update palette visual state
        document.querySelectorAll('.palette-panel').forEach(el => {
            if (el.getAttribute('data-panel-id') === panelId) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });

        // Update instruction message
        this.showMessage(`Tap an empty grid cell to place ${this.panelNames[panelId]}`, 'info');
    }

    selectPanelInGrid(panelData) {
        this.selectedPanel = panelData;

        // Clear palette selection
        this.selectedPanelInPalette = null;
        document.querySelectorAll('.palette-panel').forEach(el => {
            el.classList.remove('selected');
        });

        // Update UI
        document.querySelectorAll('.grid-panel-item').forEach(el => {
            el.classList.remove('selected');
        });

        const panelEl = document.querySelector(`.grid-panel-item[data-panel-id="${panelData.id}"]`);
        if (panelEl) {
            panelEl.classList.add('selected');
        }

        // Show size controls
        const controls = document.getElementById('panel-size-controls');
        if (controls) {
            controls.style.display = 'block';
        }

        document.getElementById('selected-panel-id').textContent = this.panelNames[panelData.id] || panelData.id;
        document.getElementById('panel-width-value').textContent = panelData.width;
        document.getElementById('panel-height-value').textContent = panelData.height;

        // Update max values for increment buttons
        this.updateSizeControlLimits();
    }

    deselectPanelInGrid() {
        this.selectedPanel = null;

        // Clear visual selection
        document.querySelectorAll('.grid-panel-item').forEach(el => {
            el.classList.remove('selected');
        });

        // Hide size controls
        const controls = document.getElementById('panel-size-controls');
        if (controls) {
            controls.style.display = 'none';
        }
    }

    setupSizeControls() {
        const widthDecBtn = document.getElementById('panel-width-dec');
        const widthIncBtn = document.getElementById('panel-width-inc');
        const heightDecBtn = document.getElementById('panel-height-dec');
        const heightIncBtn = document.getElementById('panel-height-inc');
        const removeBtn = document.getElementById('remove-panel-btn');

        widthDecBtn?.addEventListener('click', () => {
            if (!this.selectedPanel) return;
            const newWidth = Math.max(1, this.selectedPanel.width - 1);
            this.updatePanelSize(this.selectedPanel.id, newWidth, this.selectedPanel.height);
        });

        widthIncBtn?.addEventListener('click', () => {
            if (!this.selectedPanel) return;
            const maxWidth = this.gridColumns - this.selectedPanel.col;
            const newWidth = Math.min(maxWidth, this.selectedPanel.width + 1);
            this.updatePanelSize(this.selectedPanel.id, newWidth, this.selectedPanel.height);
        });

        heightDecBtn?.addEventListener('click', () => {
            if (!this.selectedPanel) return;
            const newHeight = Math.max(1, this.selectedPanel.height - 1);
            this.updatePanelSize(this.selectedPanel.id, this.selectedPanel.width, newHeight);
        });

        heightIncBtn?.addEventListener('click', () => {
            if (!this.selectedPanel) return;
            const maxHeight = this.gridRows - this.selectedPanel.row;
            const newHeight = Math.min(maxHeight, this.selectedPanel.height + 1);
            this.updatePanelSize(this.selectedPanel.id, this.selectedPanel.width, newHeight);
        });

        removeBtn?.addEventListener('click', () => {
            if (!this.selectedPanel) return;
            this.removePanelFromGrid(this.selectedPanel.id);
        });
    }

    updateSizeControlLimits() {
        if (!this.selectedPanel) return;

        const maxWidth = this.gridColumns - this.selectedPanel.col;
        const maxHeight = this.gridRows - this.selectedPanel.row;

        // Enable/disable increment buttons
        const widthIncBtn = document.getElementById('panel-width-inc');
        const heightIncBtn = document.getElementById('panel-height-inc');
        const widthDecBtn = document.getElementById('panel-width-dec');
        const heightDecBtn = document.getElementById('panel-height-dec');

        if (widthIncBtn) widthIncBtn.disabled = this.selectedPanel.width >= maxWidth;
        if (heightIncBtn) heightIncBtn.disabled = this.selectedPanel.height >= maxHeight;
        if (widthDecBtn) widthDecBtn.disabled = this.selectedPanel.width <= 1;
        if (heightDecBtn) heightDecBtn.disabled = this.selectedPanel.height <= 1;
    }

    updatePanelSize(panelId, width, height) {
        const panel = this.gridLayout.find(p => p.id === panelId);
        if (!panel) return;

        // Validate size doesn't exceed grid bounds
        if (panel.col + width > this.gridColumns) {
            this.showMessage(`Width too large! Maximum width is ${this.gridColumns - panel.col}`, 'error');
            return;
        }

        if (panel.row + height > this.gridRows) {
            this.showMessage(`Height too large! Maximum height is ${this.gridRows - panel.row}`, 'error');
            return;
        }

        // Check for collisions with other panels
        for (let r = panel.row; r < panel.row + height; r++) {
            for (let c = panel.col; c < panel.col + width; c++) {
                if (this.isCellOccupied(r, c, panelId)) {
                    this.showMessage('Cannot resize: would overlap with another panel!', 'error');
                    return;
                }
            }
        }

        // Update size
        panel.width = width;
        panel.height = height;

        // Re-render
        this.renderGrid();

        // Update selection (re-select to update controls)
        this.selectPanelInGrid(panel);

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    removePanelFromGrid(panelId) {
        const panelName = this.panelNames[panelId] || panelId;

        this.gridLayout = this.gridLayout.filter(p => p.id !== panelId);
        this.selectedPanel = null;

        // Hide size controls
        this.deselectPanelInGrid();

        // Re-render
        this.renderGrid();
        this.updatePanelPalette();

        this.showMessage(`${panelName} removed from grid`, 'success');

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    resetLayout() {
        if (!confirm('Reset layout to default? This will remove all panels from the grid.')) {
            return;
        }

        this.gridLayout = [];
        this.selectedPanel = null;
        this.selectedPanelInPalette = null;
        this.gridRows = 4;
        this.gridColumns = 4;

        // Reset selectors
        document.querySelectorAll('.column-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-columns') === '4') {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.row-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-rows') === '4') {
                btn.classList.add('active');
            }
        });

        // Re-render
        this.renderGrid();
        this.updatePanelPalette();

        // Hide size controls
        this.deselectPanelInGrid();

        this.showMessage('Layout reset to default', 'success');

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('layout-message');
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.className = 'layout-message ' + type;
        messageEl.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }

    getLayout() {
        return {
            rows: this.gridRows,
            columns: this.gridColumns,
            panels: this.gridLayout
        };
    }

    loadLayout(layoutData) {
        if (!layoutData) return;

        // Load rows (new)
        if (layoutData.rows) {
            this.gridRows = layoutData.rows;

            document.querySelectorAll('.row-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-rows') === String(this.gridRows)) {
                    btn.classList.add('active');
                }
            });
        }

        // Load columns
        if (layoutData.columns) {
            this.gridColumns = layoutData.columns;

            document.querySelectorAll('.column-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-columns') === String(this.gridColumns)) {
                    btn.classList.add('active');
                }
            });
        }

        // Update grid attributes with both rows and columns
        this.updateGridAttributes();

        // Load panels
        if (layoutData.panels) {
            this.gridLayout = layoutData.panels;
        }

        this.renderGrid();
        this.updatePanelPalette();
    }
}

// Create global instance
window.layoutEditor = new LayoutEditor();
