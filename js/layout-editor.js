/**
 * Layout Editor for Settings Page
 * Manages custom grid layouts with drag-and-drop panel positioning
 */

class LayoutEditor {
    constructor() {
        this.gridColumns = 3;
        this.gridLayout = [];
        this.selectedPanel = null;
        this.panelIcons = {
            weather: '☀️',
            markets: '📈',
            news: '📰',
            timer: '⏰',
            music: '🎵',
            cyberspace: '🌐',
            video: '📺',
            system: '💻'
        };
        this.panelNames = {
            weather: 'Weather',
            markets: 'Markets',
            news: 'News',
            timer: 'Timer',
            music: 'Music',
            cyberspace: 'Cyberspace',
            video: 'Video',
            system: 'System'
        };
    }

    init() {
        console.log('[LayoutEditor] Initializing...');

        // Set up column selector
        this.setupColumnSelector();

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

    setupColumnSelector() {
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
    }

    setColumns(columns) {
        this.gridColumns = columns;
        const gridPreview = document.getElementById('grid-preview');
        if (gridPreview) {
            gridPreview.setAttribute('data-columns', columns);
        }
        this.renderGrid();

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    renderGrid() {
        const gridPreview = document.getElementById('grid-preview');
        if (!gridPreview) return;

        // Clear existing grid
        gridPreview.innerHTML = '';

        // Create 4 rows x N columns of cells
        const rows = 4;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-col', col);

                // Set up drop zone
                this.setupDropZone(cell);

                gridPreview.appendChild(cell);
            }
        }

        // Re-render panels in their positions
        this.renderPanelsInGrid();
    }

    renderPanelsInGrid() {
        const gridPreview = document.getElementById('grid-preview');
        if (!gridPreview) return;

        // Clear any existing panel items
        gridPreview.querySelectorAll('.grid-panel-item').forEach(el => el.remove());

        // Render each panel in the layout
        this.gridLayout.forEach(panelData => {
            const { id, row, col, width, height } = panelData;

            // Find the cell at this position
            const cell = gridPreview.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (!cell) return;

            // Create panel element
            const panelEl = document.createElement('div');
            panelEl.className = 'grid-panel-item';
            panelEl.setAttribute('data-panel-id', id);
            panelEl.innerHTML = `
                <div class="panel-icon-small">${this.panelIcons[id] || '📦'}</div>
                <div>${this.panelNames[id] || id}</div>
                <div style="font-size: 0.9rem; opacity: 0.7;">${width}x${height}</div>
            `;

            // Position and size the panel
            panelEl.style.gridColumn = `span ${width}`;
            panelEl.style.gridRow = `span ${height}`;

            // Make it clickable to select
            panelEl.addEventListener('click', () => {
                this.selectPanel(panelData);
            });

            // Add to the cell's parent grid, positioned correctly
            // We need to calculate the correct grid position
            const gridColumn = col + 1;
            const gridRow = row + 1;
            panelEl.style.gridColumnStart = gridColumn;
            panelEl.style.gridRowStart = gridRow;
            panelEl.style.position = 'relative';

            gridPreview.appendChild(panelEl);

            // Mark cells as occupied
            for (let r = row; r < row + height; r++) {
                for (let c = col; c < col + width; c++) {
                    const occupiedCell = gridPreview.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (occupiedCell) {
                        occupiedCell.classList.add('occupied');
                    }
                }
            }
        });
    }

    setupDropZone(cell) {
        // Allow dropping
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            cell.classList.add('drop-target');
        });

        cell.addEventListener('dragleave', () => {
            cell.classList.remove('drop-target');
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.classList.remove('drop-target');

            const panelId = e.dataTransfer.getData('panel-id');
            if (!panelId) return;

            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));

            // Check if this position is available
            if (this.isCellOccupied(row, col)) {
                alert('This position is already occupied!');
                return;
            }

            // Add panel to layout
            this.addPanelToGrid(panelId, row, col, 1, 1);
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
        const enabledPanels = [];
        document.querySelectorAll('[data-panel]').forEach(toggle => {
            if (toggle.checked) {
                enabledPanels.push(toggle.getAttribute('data-panel'));
            }
        });

        // Show panels that are not yet in the grid
        enabledPanels.forEach(panelId => {
            const inGrid = this.gridLayout.some(p => p.id === panelId);
            if (inGrid) return;

            const panelEl = document.createElement('div');
            panelEl.className = 'palette-panel';
            panelEl.setAttribute('draggable', 'true');
            panelEl.setAttribute('data-panel-id', panelId);
            panelEl.innerHTML = `
                <span>${this.panelIcons[panelId] || '📦'}</span>
                <span>${this.panelNames[panelId] || panelId}</span>
            `;

            // Set up drag
            panelEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('panel-id', panelId);
                panelEl.classList.add('dragging');
            });

            panelEl.addEventListener('dragend', () => {
                panelEl.classList.remove('dragging');
            });

            palette.appendChild(panelEl);
        });

        // Show message if all panels are placed
        if (palette.children.length === 0) {
            palette.innerHTML = '<div style="color: var(--neon-green); padding: 10px;">All enabled panels have been placed in the grid!</div>';
        }
    }

    selectPanel(panelData) {
        this.selectedPanel = panelData;

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
        document.getElementById('panel-width').value = panelData.width;
        document.getElementById('panel-height').value = panelData.height;
    }

    setupSizeControls() {
        const widthInput = document.getElementById('panel-width');
        const heightInput = document.getElementById('panel-height');
        const removeBtn = document.getElementById('remove-panel-btn');

        widthInput?.addEventListener('change', () => {
            if (!this.selectedPanel) return;
            this.updatePanelSize(this.selectedPanel.id, parseInt(widthInput.value), this.selectedPanel.height);
        });

        heightInput?.addEventListener('change', () => {
            if (!this.selectedPanel) return;
            this.updatePanelSize(this.selectedPanel.id, this.selectedPanel.width, parseInt(heightInput.value));
        });

        removeBtn?.addEventListener('click', () => {
            if (!this.selectedPanel) return;
            this.removePanelFromGrid(this.selectedPanel.id);
        });
    }

    updatePanelSize(panelId, width, height) {
        const panel = this.gridLayout.find(p => p.id === panelId);
        if (!panel) return;

        // Validate size doesn't exceed grid bounds
        if (panel.col + width > this.gridColumns) {
            alert(`Width too large! Maximum width from column ${panel.col} is ${this.gridColumns - panel.col}`);
            return;
        }

        if (panel.row + height > 4) {
            alert(`Height too large! Maximum height from row ${panel.row} is ${4 - panel.row}`);
            return;
        }

        // Check for collisions with other panels
        for (let r = panel.row; r < panel.row + height; r++) {
            for (let c = panel.col; c < panel.col + width; c++) {
                if (this.isCellOccupied(r, c, panelId)) {
                    alert('Cannot resize: would overlap with another panel!');
                    return;
                }
            }
        }

        // Update size
        panel.width = width;
        panel.height = height;

        // Re-render
        this.renderGrid();

        // Update selection
        this.selectPanel(panel);

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    removePanelFromGrid(panelId) {
        this.gridLayout = this.gridLayout.filter(p => p.id !== panelId);
        this.selectedPanel = null;

        // Hide size controls
        const controls = document.getElementById('panel-size-controls');
        if (controls) {
            controls.style.display = 'none';
        }

        // Re-render
        this.renderGrid();
        this.updatePanelPalette();

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
        this.gridColumns = 3;

        // Reset column selector
        document.querySelectorAll('.column-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-columns') === '3') {
                btn.classList.add('active');
            }
        });

        // Re-render
        this.renderGrid();
        this.updatePanelPalette();

        // Hide size controls
        const controls = document.getElementById('panel-size-controls');
        if (controls) {
            controls.style.display = 'none';
        }

        // Mark as unsaved
        if (window.settingsManager) {
            window.settingsManager.markUnsavedChanges();
        }
    }

    getLayout() {
        return {
            columns: this.gridColumns,
            panels: this.gridLayout
        };
    }

    loadLayout(layoutData) {
        if (!layoutData) return;

        if (layoutData.columns) {
            this.gridColumns = layoutData.columns;

            // Update UI
            const gridPreview = document.getElementById('grid-preview');
            if (gridPreview) {
                gridPreview.setAttribute('data-columns', this.gridColumns);
            }

            document.querySelectorAll('.column-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-columns') === String(this.gridColumns)) {
                    btn.classList.add('active');
                }
            });
        }

        if (layoutData.panels) {
            this.gridLayout = layoutData.panels;
        }

        this.renderGrid();
        this.updatePanelPalette();
    }
}

// Create global instance
window.layoutEditor = new LayoutEditor();
