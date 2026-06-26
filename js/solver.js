import { DLX } from './dlx.js';

/**
 * Symbol mapping: 1-9, then A-Z for larger grids.
 */
export function getSymbols(size) {
  const symbols = [];
  for (let i = 1; i <= Math.min(size, 9); i++) {
    symbols.push(String(i));
  }
  for (let i = 0; i < size - 9 && i < 26; i++) {
    symbols.push(String.fromCharCode(65 + i)); // A-Z
  }
  return symbols;
}

/**
 * Build the exact cover matrix for a Sudoku puzzle.
 * 
 * Constraints (4 types):
 * 1. Cell constraint: each cell has exactly one value
 * 2. Row constraint: each row has each value once
 * 3. Column constraint: each column has each value once
 * 4. Region constraint: each region has each value once
 */
export function buildCoverMatrix(grid, regions, size) {
  const numCols = size * size * 4; // 4 constraint types
  const dlx = new DLX(numCols);
  
  // Column offset for each constraint type
  const cellOffset = 0;
  const rowOffset = size * size;
  const colOffset = size * size * 2;
  const regionOffset = size * size * 3;
  
  const regionMap = buildRegionMap(regions, size);
  
  // For each possible placement (cell, value)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const region = regionMap[r][c];
      
      // If cell is filled, only add that value's row
      const value = grid[r][c];
      const values = value !== 0 ? [value - 1] : Array.from({ length: size }, (_, i) => i);
      
      for (const v of values) {
        const cols = [
          cellOffset + r * size + c,           // Cell constraint
          rowOffset + r * size + v,             // Row constraint
          colOffset + c * size + v,             // Column constraint
          regionOffset + region * size + v      // Region constraint
        ];
        dlx.addRow({ r, c, v: v + 1 }, cols);
      }
    }
  }
  
  return dlx;
}

/**
 * Build a map from (row, col) to region index.
 */
function buildRegionMap(regions, size) {
  const map = Array.from({ length: size }, () => new Array(size).fill(-1));
  
  for (let regionIdx = 0; regionIdx < regions.length; regionIdx++) {
    for (const [r, c] of regions[regionIdx]) {
      map[r][c] = regionIdx;
    }
  }
  
  return map;
}

/**
 * Solve a Sudoku puzzle.
 * @param {number[][]} grid - 2D array, 0 = empty
 * @param {number[][][]} regions - Array of regions, each region is array of [row, col]
 * @param {number} size - Grid size
 * @param {number} maxSolutions - Maximum solutions to find
 * @returns {number[][][]} Array of solution grids
 */
export function solveSudoku(grid, regions, size, maxSolutions = 1) {
  const dlx = buildCoverMatrix(grid, regions, size);
  dlx.maxSolutions = maxSolutions;
  dlx.search();
  
  return dlx.solutions.map(solution => {
    const result = grid.map(row => [...row]);
    for (const { r, c, v } of solution) {
      result[r][c] = v;
    }
    return result;
  });
}

/**
 * Validate a grid configuration.
 */
export function validateGrid(grid, regions, size) {
  const errors = [];
  
  // Check grid dimensions
  if (grid.length !== size) {
    errors.push(`Grid has ${grid.length} rows, expected ${size}`);
  }
  for (let r = 0; r < grid.length; r++) {
    if (grid[r]?.length !== size) {
      errors.push(`Row ${r} has ${grid[r]?.length} cells, expected ${size}`);
    }
  }
  
  // Check region count
  if (regions.length !== size) {
    errors.push(`Has ${regions.length} regions, expected ${size}`);
  }
  
  // Check each region size
  for (let i = 0; i < regions.length; i++) {
    if (regions[i].length !== size) {
      errors.push(`Region ${i} has ${regions[i].length} cells, expected ${size}`);
    }
  }
  
  // Check all cells covered by regions
  const covered = new Set();
  for (const region of regions) {
    for (const [r, c] of region) {
      const key = `${r},${c}`;
      if (covered.has(key)) {
        errors.push(`Cell (${r},${c}) is in multiple regions`);
      }
      covered.add(key);
    }
  }
  
  if (covered.size !== size * size) {
    errors.push(`Only ${covered.size} of ${size * size} cells are in regions`);
  }
  
  // Check for value conflicts
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      if (v < 1 || v > size) {
        errors.push(`Cell (${r},${c}) has invalid value ${v}`);
      }
    }
  }
  
  return errors;
}
