/**
 * Canvas-based interactive Sudoku grid editor.
 */
export class GridEditor {
  constructor(canvas, size) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.grid = Array.from({ length: size }, () => new Array(size).fill(0));
    this.regions = [];
    this.selectedCell = null;
    this.hoveredCell = null;
    this.mode = 'numbers'; // 'numbers' or 'regions'
    this.regionColors = [];
    this.regionDrawing = [];
    this.onGridChange = null;
    this.onRegionChange = null;
    this.solution = null;
    this.showSolution = false;
    
    this.cellSize = 0;
    this.padding = 40;
    
    this.setupEventListeners();
    this.resize();
  }

  resize() {
    const container = this.canvas.parentElement;
    const maxSize = Math.min(container.clientWidth - 20, 700);
    this.cellSize = Math.floor((maxSize - this.padding * 2) / this.size);
    const canvasSize = this.cellSize * this.size + this.padding * 2;
    
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;
    this.canvas.style.width = canvasSize + 'px';
    this.canvas.style.height = canvasSize + 'px';
    
    this.draw();
  }

  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredCell = null;
      this.draw();
    });
    
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    window.addEventListener('resize', () => this.resize());
  }

  getCellFromPos(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const px = x - rect.left;
    const py = y - rect.top;
    
    const col = Math.floor((px - this.padding) / this.cellSize);
    const row = Math.floor((py - this.padding) / this.cellSize);
    
    if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
      return [row, col];
    }
    return null;
  }

  handleClick(e) {
    const cell = this.getCellFromPos(e.clientX, e.clientY);
    if (!cell) return;
    
    const [r, c] = cell;
    
    if (this.mode === 'regions') {
      this.handleRegionClick(r, c);
    } else {
      this.selectedCell = cell;
      this.draw();
    }
  }

  handleRegionClick(r, c) {
    const key = `${r},${c}`;
    const idx = this.regionDrawing.indexOf(key);
    
    if (idx >= 0) {
      this.regionDrawing.splice(idx, 1);
    } else {
      this.regionDrawing.push(key);
    }
    
    this.draw();
  }

  handleMouseMove(e) {
    const cell = this.getCellFromPos(e.clientX, e.cell);
    if (cell) {
      this.hoveredCell = cell;
    } else {
      this.hoveredCell = null;
    }
    this.draw();
  }

  handleKeydown(e) {
    if (!this.selectedCell || this.mode !== 'numbers') return;
    
    const [r, c] = this.selectedCell;
    const symbols = getSymbols(this.size);
    
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      this.grid[r][c] = 0;
      this.draw();
      if (this.onGridChange) this.onGridChange();
      return;
    }
    
    const idx = symbols.indexOf(e.key.toUpperCase());
    if (idx >= 0) {
      this.grid[r][c] = idx + 1;
      this.draw();
      if (this.onGridChange) this.onGridChange();
    }
    
    // Arrow keys
    if (e.key === 'ArrowUp' && r > 0) this.selectedCell = [r - 1, c];
    if (e.key === 'ArrowDown' && r < this.size - 1) this.selectedCell = [r + 1, c];
    if (e.key === 'ArrowLeft' && c > 0) this.selectedCell = [r, c - 1];
    if (e.key === 'ArrowRight' && c < this.size - 1) this.selectedCell = [r, c + 1];
    
    this.draw();
  }

  setGrid(grid) {
    this.grid = grid.map(row => [...row]);
    this.draw();
    if (this.onGridChange) this.onGridChange();
  }

  setRegions(regions) {
    this.regions = regions;
    this.generateRegionColors();
    this.draw();
    if (this.onRegionChange) this.onRegionChange();
  }

  generateRegionColors() {
    const hueStep = 360 / this.size;
    this.regionColors = this.regions.map((_, i) => {
      const hue = (i * hueStep + 20) % 360;
      return `hsla(${hue}, 60%, 70%, 0.3)`;
    });
  }

  confirmRegion() {
    if (this.regionDrawing.length === 0) return null;
    
    const cells = this.regionDrawing.map(key => {
      const [r, c] = key.split(',').map(Number);
      return [r, c];
    });
    
    this.regionDrawing = [];
    return cells;
  }

  clearRegions() {
    this.regions = [];
    this.regionDrawing = [];
    this.draw();
    if (this.onRegionChange) this.onRegionChange();
  }

  clearGrid() {
    this.grid = Array.from({ length: this.size }, () => new Array(this.size).fill(0));
    this.solution = null;
    this.showSolution = false;
    this.draw();
    if (this.onGridChange) this.onGridChange();
  }

  draw() {
    const ctx = this.ctx;
    const { cellSize, padding, size } = this;
    
    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw regions
    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      ctx.fillStyle = this.regionColors[i] || 'rgba(100, 100, 200, 0.2)';
      
      for (const [r, c] of region) {
        ctx.fillRect(
          padding + c * cellSize,
          padding + r * cellSize,
          cellSize,
          cellSize
        );
      }
      
      // Draw region borders
      ctx.strokeStyle = `hsla(${(i * 360 / this.size + 20) % 360}, 70%, 50%, 0.8)`;
      ctx.lineWidth = 2;
      
      for (const [r, c] of region) {
        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        
        // Check each edge
        if (!isInRegion(this.regions, r - 1, c, i)) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
          ctx.stroke();
        }
        if (!isInRegion(this.regions, r + 1, c, i)) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (!isInRegion(this.regions, r, c - 1, i)) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
        if (!isInRegion(this.regions, r, c + 1, i)) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
      }
    }
    
    // Draw region being drawn
    if (this.regionDrawing.length > 0) {
      ctx.fillStyle = 'rgba(100, 255, 100, 0.3)';
      for (const key of this.regionDrawing) {
        const [r, c] = key.split(',').map(Number);
        ctx.fillRect(
          padding + c * cellSize,
          padding + r * cellSize,
          cellSize,
          cellSize
        );
      }
    }
    
    // Draw grid lines
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(padding + i * cellSize, padding);
      ctx.lineTo(padding + i * cellSize, padding + size * cellSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellSize);
      ctx.lineTo(padding + size * cellSize, padding + i * cellSize);
      ctx.stroke();
    }
    
    // Draw thick grid lines for 3x3-like blocks (if applicable)
    if (this.size >= 9) {
      const blockRows = findBlockSize(this.size);
      if (blockRows > 1) {
        ctx.strokeStyle = '#8a8aaa';
        ctx.lineWidth = 2;
        
        for (let i = 0; i <= size; i += blockRows) {
          ctx.beginPath();
          ctx.moveTo(padding + i * cellSize, padding);
          ctx.lineTo(padding + i * cellSize, padding + size * cellSize);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(padding, padding + i * cellSize);
          ctx.lineTo(padding + size * cellSize, padding + i * cellSize);
          ctx.stroke();
        }
      }
    }
    
    // Draw outer border
    ctx.strokeStyle = '#aaaacc';
    ctx.lineWidth = 3;
    ctx.strokeRect(padding, padding, size * cellSize, size * cellSize);
    
    // Draw cells
    const symbols = getSymbols(this.size);
    const displayGrid = this.showSolution && this.solution ? this.solution : this.grid;
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        
        // Highlight selected cell
        if (this.selectedCell && this.selectedCell[0] === r && this.selectedCell[1] === c) {
          ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
        
        // Highlight hovered cell
        if (this.hoveredCell && this.hoveredCell[0] === r && this.hoveredCell[1] === c) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
        
        // Draw value
        const v = displayGrid[r][c];
        if (v > 0) {
          const isOriginal = this.grid[r][c] > 0;
          const isSolved = this.showSolution && !isOriginal;
          
          ctx.fillStyle = isSolved ? '#66ff66' : (isOriginal ? '#ffffff' : '#aaaaff');
          ctx.font = `bold ${cellSize * 0.5}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(symbols[v - 1], x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
    
    // Draw region size indicator
    if (this.mode === 'regions') {
      ctx.fillStyle = '#aaaacc';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Region: ${this.regionDrawing.length}/${this.size} cells`, 10, 20);
    }
  }
}

function isInRegion(regions, r, c, regionIdx) {
  if (r < 0 || c < 0) return false;
  return regions[regionIdx]?.some(([cr, cc]) => cr === r && cc === c);
}

function getSymbols(size) {
  const symbols = [];
  for (let i = 1; i <= Math.min(size, 9); i++) symbols.push(String(i));
  for (let i = 0; i < size - 9 && i < 26; i++) symbols.push(String.fromCharCode(65 + i));
  return symbols;
}

function findBlockSize(size) {
  for (let i = Math.floor(Math.sqrt(size)); i >= 2; i--) {
    if (size % i === 0) return i;
  }
  return 1;
}
