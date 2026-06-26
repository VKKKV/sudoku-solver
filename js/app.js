import { GridEditor } from './editor.js';
import { solveSudoku, validateGrid, getSymbols } from './solver.js';
import { generateRegions, generateSymmetricRegions } from './regions.js';

let editor;
let currentSize = 13;

// Preset region layouts
const PRESETS = {
  '13x13-abc': createPreset13,
};

function createPreset13() {
  // Create a 13x13 grid with 13 irregular regions
  // This uses a modified rectangular base with swaps
  const size = 13;
  const regions = Array.from({ length: size }, () => []);
  
  // Start with rectangular blocks (roughly 4x3 or 3x4)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Create irregular pattern
      let regionIdx;
      if (r < 4) {
        regionIdx = Math.floor(c / 4);
      } else if (r < 8) {
        regionIdx = 3 + Math.floor(c / 4);
      } else if (r < 12) {
        regionIdx = 6 + Math.floor(c / 4);
      } else {
        regionIdx = 10 + Math.floor(c / 3);
      }
      regionIdx = Math.min(regionIdx, size - 1);
      regions[regionIdx].push([r, c]);
    }
  }
  
  // Swap some cells to make it irregular
  const swaps = [
    [[0, 3], [1, 4]], [[2, 7], [3, 8]], [[5, 3], [6, 4]],
    [[7, 7], [8, 8]], [[10, 2], [11, 3]], [[0, 10], [1, 11]],
    [[4, 0], [5, 1]], [[8, 0], [9, 1]], [[12, 10], [11, 11]],
  ];
  
  for (const [[r1, c1], [r2, c2]] of swaps) {
    const idx1 = regions.findIndex(r => r.some(([r, c]) => r === r1 && c === c1));
    const idx2 = regions.findIndex(r => r.some(([r, c]) => r === r2 && c === c2));
    if (idx1 !== idx2 && idx1 >= 0 && idx2 >= 0) {
      regions[idx1] = regions[idx1].filter(([r, c]) => !(r === r1 && c === c1)).concat([[r2, c2]]);
      regions[idx2] = regions[idx2].filter(([r, c]) => !(r === r2 && c === c2)).concat([[r1, c1]]);
    }
  }
  
  return regions;
}

export function init() {
  const canvas = document.getElementById('grid-canvas');
  
  editor = new GridEditor(canvas, currentSize);
  editor.onGridChange = updateStatus;
  editor.onRegionChange = updateStatus;
  
  // Set initial regions
  const regions = generateRegions(currentSize, 500, 42);
  editor.setRegions(regions);
  
  setupUI();
  updateStatus();
  updateSymbols();
}

function setupUI() {
  // Grid size selector
  const sizeSelect = document.getElementById('grid-size');
  sizeSelect.addEventListener('change', () => {
    currentSize = parseInt(sizeSelect.value);
    resetGrid();
  });
  
  // Mode buttons
  document.getElementById('mode-numbers').addEventListener('click', () => {
    editor.mode = 'numbers';
    document.getElementById('mode-numbers').classList.add('active');
    document.getElementById('mode-regions').classList.remove('active');
    document.getElementById('region-controls').style.display = 'none';
    editor.draw();
  });
  
  document.getElementById('mode-regions').addEventListener('click', () => {
    editor.mode = 'regions';
    document.getElementById('mode-regions').classList.add('active');
    document.getElementById('mode-numbers').classList.remove('active');
    document.getElementById('region-controls').style.display = 'flex';
    editor.draw();
  });
  
  // Region controls
  document.getElementById('confirm-region').addEventListener('click', () => {
    const cells = editor.confirmRegion();
    if (cells) {
      editor.regions.push(cells);
      editor.generateRegionColors();
      editor.draw();
      if (editor.onRegionChange) editor.onRegionChange();
    }
  });
  
  document.getElementById('clear-regions').addEventListener('click', () => {
    editor.clearRegions();
  });
  
  // Action buttons
  document.getElementById('generate-regions').addEventListener('click', () => {
    const symmetric = document.getElementById('symmetric').checked;
    const seed = Date.now();
    const regions = symmetric 
      ? generateSymmetricRegions(currentSize, currentSize * currentSize * 3, seed)
      : generateRegions(currentSize, currentSize * currentSize * 3, seed);
    editor.setRegions(regions);
    updateStatus();
  });
  
  document.getElementById('solve-btn').addEventListener('click', () => solve());
  
  document.getElementById('clear-grid').addEventListener('click', () => {
    editor.clearGrid();
    editor.showSolution = false;
    updateStatus();
  });
  
  document.getElementById('reset-all').addEventListener('click', resetGrid);
  
  document.getElementById('toggle-solution').addEventListener('click', () => {
    if (editor.solution) {
      editor.showSolution = !editor.showSolution;
      document.getElementById('toggle-solution').textContent = 
        editor.showSolution ? 'Hide Solution' : 'Show Solution';
      editor.draw();
    }
  });
  
  // Preset buttons
  document.getElementById('preset-13x13').addEventListener('click', () => {
    currentSize = 13;
    document.getElementById('grid-size').value = '13';
    resetGrid();
    const regions = createPreset13();
    editor.setRegions(regions);
    updateStatus();
  });
  
  // Random fill test
  document.getElementById('random-fill').addEventListener('click', () => {
    // Fill a few random cells for testing
    editor.clearGrid();
    const symbols = getSymbols(currentSize);
    const numClues = Math.floor(currentSize * currentSize * 0.15);
    
    for (let i = 0; i < numClues; i++) {
      const r = Math.floor(Math.random() * currentSize);
      const c = Math.floor(Math.random() * currentSize);
      const v = Math.floor(Math.random() * currentSize) + 1;
      editor.grid[r][c] = v;
    }
    
    editor.draw();
    updateStatus();
  });
}

function resetGrid() {
  const canvas = document.getElementById('grid-canvas');
  editor = new GridEditor(canvas, currentSize);
  editor.onGridChange = updateStatus;
  editor.onRegionChange = updateStatus;
  
  const regions = generateRegions(currentSize, 500, 42);
  editor.setRegions(regions);
  
  updateStatus();
  updateSymbols();
}

function solve() {
  const errors = validateGrid(editor.grid, editor.regions, currentSize);
  if (errors.length > 0) {
    showError(errors.join('\n'));
    return;
  }
  
  document.getElementById('solve-btn').disabled = true;
  document.getElementById('solve-btn').textContent = 'Solving...';
  
  // Use setTimeout to allow UI to update
  setTimeout(() => {
    try {
      const startTime = performance.now();
      const solutions = solveSudoku(editor.grid, editor.regions, currentSize, 2);
      const elapsed = (performance.now() - startTime).toFixed(1);
      
      if (solutions.length === 0) {
        showError('No solution exists for this configuration.');
      } else if (solutions.length > 1) {
        showError(`Multiple solutions found (${solutions.length}). Puzzle is not unique.`);
        editor.solution = solutions[0];
        editor.showSolution = true;
        document.getElementById('toggle-solution').textContent = 'Hide Solution';
      } else {
        editor.solution = solutions[0];
        editor.showSolution = true;
        document.getElementById('toggle-solution').textContent = 'Hide Solution';
        showSuccess(`Solved in ${elapsed}ms`);
      }
      
      editor.draw();
      updateStatus();
    } catch (e) {
      showError('Error: ' + e.message);
    } finally {
      document.getElementById('solve-btn').disabled = false;
      document.getElementById('solve-btn').textContent = 'Solve';
    }
  }, 10);
}

function updateStatus() {
  const filled = editor.grid.flat().filter(v => v > 0).length;
  const total = currentSize * currentSize;
  const regionCount = editor.regions.length;
  
  document.getElementById('status').innerHTML = 
    `Grid: ${currentSize}x${currentSize} | ` +
    `Cells: ${filled}/${total} | ` +
    `Regions: ${regionCount}/${currentSize}` +
    (editor.solution ? ' | <span style="color:#6f6">Solved</span>' : '');
}

function updateSymbols() {
  const symbols = getSymbols(currentSize);
  document.getElementById('symbols').textContent = 
    `Symbols: ${symbols.join(' ')}`;
}

function showError(msg) {
  const el = document.getElementById('message');
  el.textContent = msg;
  el.className = 'error';
  setTimeout(() => { el.textContent = ''; el.className = ''; }, 5000);
}

function showSuccess(msg) {
  const el = document.getElementById('message');
  el.textContent = msg;
  el.className = 'success';
  setTimeout(() => { el.textContent = ''; el.className = ''; }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
