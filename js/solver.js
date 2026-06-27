import { DLX } from './dlx.js';

/**
 * Symbol mapping: 1-9, then A-Z, then @ for 36x36 grids.
 */
export function getSymbols(size) {
  const symbols = [];
  for (let i = 1; i <= Math.min(size, 9); i++) {
    symbols.push(String(i));
  }
  for (let i = 0; i < size - 9 && i < 26; i++) {
    symbols.push(String.fromCharCode(65 + i)); // A-Z
  }
  if (size > symbols.length) symbols.push('@');
  return symbols.slice(0, size);
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
      if (r >= 0 && r < size && c >= 0 && c < size) {
        map[r][c] = regionIdx;
      }
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
 * Generate a complete valid Sudoku solution.
 * Uses DLX to find a random solution for the given regions.
 */
export function generateSolution(regions, size) {
  const empty = Array.from({ length: size }, () => new Array(size).fill(0));
  const dlx = buildCoverMatrixRandom(empty, regions, size);
  dlx.maxSolutions = 1;
  dlx.search();

  if (dlx.solutions.length === 0) return null;

  const grid = Array.from({ length: size }, () => new Array(size).fill(0));
  for (const { r, c, v } of dlx.solutions[0]) {
    grid[r][c] = v;
  }
  return grid;
}

/**
 * Build cover matrix with randomized row order for random solutions.
 */
function buildCoverMatrixRandom(grid, regions, size) {
  const numCols = size * size * 4;
  const dlx = new DLX(numCols);

  const cellOffset = 0;
  const rowOffset = size * size;
  const colOffset = size * size * 2;
  const regionOffset = size * size * 3;

  const regionMap = buildRegionMap(regions, size);

  // Collect all possible placements
  const placements = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const region = regionMap[r][c];
      const value = grid[r][c];
      const values = value !== 0 ? [value - 1] : Array.from({ length: size }, (_, i) => i);
      for (const v of values) {
        placements.push({ r, c, v, cols: [
          cellOffset + r * size + c,
          rowOffset + r * size + v,
          colOffset + c * size + v,
          regionOffset + region * size + v
        ]});
      }
    }
  }

  // Shuffle placements
  for (let i = placements.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [placements[i], placements[j]] = [placements[j], placements[i]];
  }

  // Add rows in shuffled order
  for (const { r, c, v, cols } of placements) {
    dlx.addRow({ r, c, v: v + 1 }, cols);
  }

  return dlx;
}

/**
 * Generate a valid Sudoku puzzle.
 * 1. Generate a complete solution
 * 2. Remove cells while maintaining unique solution
 */
export function generatePuzzle(regions, size, clueRatio = 0.25) {
  const solution = generateSolution(regions, size);
  if (!solution) return null;

  const puzzle = solution.map(row => [...row]);
  const targetClues = Math.max(size, Math.floor(size * size * clueRatio));

  // Create list of all cells and shuffle
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cells.push([r, c]);
    }
  }
  shuffle(cells);

  // Remove cells one by one, checking uniqueness
  let removed = 0;
  const maxRemove = size * size - targetClues;

  for (const [r, c] of cells) {
    if (removed >= maxRemove) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // Check if puzzle still has unique solution
    const solutions = solveSudoku(puzzle, regions, size, 2);
    if (solutions.length !== 1) {
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }

  return { puzzle, solution };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
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
      if (r < 0 || r >= size || c < 0 || c >= size) {
        errors.push(`Cell (${r},${c}) is outside the ${size}×${size} grid`);
        continue;
      }
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

  const regionMap = buildRegionMap(regions, size);
  checkDuplicates(grid, size, errors, (r) => `row ${r + 1}`, (r, c) => r);
  checkDuplicates(grid, size, errors, (c) => `column ${c + 1}`, (r, c) => c);
  checkDuplicates(grid, size, errors, (i) => `region ${i + 1}`, (r, c) => regionMap[r]?.[c]);

  return errors;
}

function checkDuplicates(grid, size, errors, labelFor, bucketFor) {
  const seen = Array.from({ length: size }, () => new Map());

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r]?.[c];
      if (!v || v < 1 || v > size) continue;

      const bucket = bucketFor(r, c);
      if (bucket < 0 || bucket >= size) continue;

      const previous = seen[bucket].get(v);
      if (previous) {
        errors.push(`Duplicate ${v} in ${labelFor(bucket)} at (${previous[0]},${previous[1]}) and (${r},${c})`);
      } else {
        seen[bucket].set(v, [r, c]);
      }
    }
  }
}
