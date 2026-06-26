/**
 * Generate irregular (jigsaw) regions for a Sudoku grid.
 * Uses a random swap algorithm starting from rectangular regions.
 */

/**
 * Generate regions by swapping cells between adjacent regions.
 * @param {number} size - Grid size (e.g., 13 for 13x13)
 * @param {number} numSwaps - Number of swap attempts (more = more irregular)
 * @param {number} seed - Random seed for reproducibility
 * @returns {number[][][]} Array of regions, each region is array of [row, col]
 */
export function generateRegions(size, numSwaps = null, seed = null) {
  const rng = createRNG(seed || Date.now());
  
  // Start with rectangular regions
  let regions = createRectangularRegions(size);
  
  // Perform random swaps to make regions irregular
  const swaps = numSwaps || size * size * 2;
  
  for (let i = 0; i < swaps; i++) {
    // Pick a random region
    const regionIdx = Math.floor(rng() * size);
    const region = regions[regionIdx];
    
    if (!region || region.length === 0) continue;
    
    // Pick a random cell in this region
    const cellIdx = Math.floor(rng() * region.length);
    const cell = region[cellIdx];
    if (!cell) continue;
    const [r, c] = cell;
    
    // Find adjacent cells in other regions
    const neighbors = getNeighbors(r, c, size);
    const validNeighbors = neighbors.filter(([nr, nc]) => {
      const neighborRegion = findRegion(regions, nr, nc);
      return neighborRegion >= 0 && neighborRegion !== regionIdx;
    });
    
    if (validNeighbors.length === 0) continue;
    
    // Pick a random neighbor
    const [nr, nc] = validNeighbors[Math.floor(rng() * validNeighbors.length)];
    const neighborRegionIdx = findRegion(regions, nr, nc);
    
    if (neighborRegionIdx < 0) continue;
    
    // Try swapping
    if (canSwap(regions, regionIdx, neighborRegionIdx, r, c, nr, nc, size)) {
      // Perform swap
      regions[regionIdx] = region.filter((_, idx) => idx !== cellIdx);
      regions[regionIdx].push([nr, nc]);
      
      regions[neighborRegionIdx] = regions[neighborRegionIdx].filter(
        ([cr, cc]) => !(cr === nr && cc === nc)
      );
      regions[neighborRegionIdx].push([r, c]);
    }
  }
  
  return regions;
}

/**
 * Create initial rectangular regions.
 */
function createRectangularRegions(size) {
  // Find best factorization for rectangular regions
  const { rows: blockRows, cols: blockCols } = findBestBlockSize(size);
  
  const regions = Array.from({ length: size }, () => []);
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const blockR = Math.floor(r / blockRows);
      const blockC = Math.floor(c / blockCols);
      const regionIdx = (blockR * blockCols + blockC) % size;
      regions[regionIdx].push([r, c]);
    }
  }
  
  return regions;
}

/**
 * Find the best block size for rectangular regions.
 */
function findBestBlockSize(size) {
  let bestRows = 1, bestCols = size;
  let bestDiff = size;
  
  for (let rows = 1; rows <= Math.sqrt(size); rows++) {
    if (size % rows === 0) {
      const cols = size / rows;
      const diff = Math.abs(rows - cols);
      if (diff < bestDiff || (diff === bestDiff && rows > bestRows)) {
        bestRows = rows;
        bestCols = cols;
        bestDiff = diff;
      }
    }
  }
  
  return { rows: bestRows, cols: bestCols };
}

/**
 * Get neighboring cells (up, down, left, right).
 */
function getNeighbors(r, c, size) {
  const neighbors = [];
  if (r > 0) neighbors.push([r - 1, c]);
  if (r < size - 1) neighbors.push([r + 1, c]);
  if (c > 0) neighbors.push([r, c - 1]);
  if (c < size - 1) neighbors.push([r, c + 1]);
  return neighbors;
}

/**
 * Find which region a cell belongs to.
 */
function findRegion(regions, r, c) {
  for (let i = 0; i < regions.length; i++) {
    if (regions[i].some(([cr, cc]) => cr === r && cc === c)) {
      return i;
    }
  }
  return -1;
}

/**
 * Check if swapping two cells between regions keeps both regions connected.
 */
function canSwap(regions, idx1, idx2, r1, c1, r2, c2, size) {
  // Create test regions with the swap
  const test1 = regions[idx1]
    .filter(([r, c]) => !(r === r1 && c === c1))
    .concat([[r2, c2]]);
  
  const test2 = regions[idx2]
    .filter(([r, c]) => !(r === r2 && c === c2))
    .concat([[r1, c1]]);
  
  // Check connectivity
  return isConnected(test1, size) && isConnected(test2, size);
}

/**
 * Check if all cells in a region are connected using BFS.
 */
function isConnected(region, size) {
  if (region.length === 0) return true;
  
  const visited = new Set();
  const queue = [region[0]];
  visited.add(`${region[0][0]},${region[0][1]}`);
  
  const regionSet = new Set(region.map(([r, c]) => `${r},${c}`));
  
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    
    for (const [nr, nc] of getNeighbors(r, c, size)) {
      const key = `${nr},${nc}`;
      if (!visited.has(key) && regionSet.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  
  return visited.size === region.length;
}

/**
 * Simple seeded RNG (Mulberry32).
 */
function createRNG(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a symmetric region layout (180-degree rotation).
 */
export function generateSymmetricRegions(size, numSwaps = null, seed = null) {
  const rng = createRNG(seed || Date.now());
  let regions = createRectangularRegions(size);
  const swaps = numSwaps || size * size;
  
  for (let i = 0; i < swaps; i++) {
    const regionIdx = Math.floor(rng() * size);
    const region = regions[regionIdx];
    const cellIdx = Math.floor(rng() * region.length);
    const [r, c] = region[cellIdx];
    
    // Symmetric cell
    const sr = size - 1 - r;
    const sc = size - 1 - c;
    
    const sRegionIdx = findRegion(regions, sr, sc);
    if (sRegionIdx === regionIdx) continue;
    
    const neighbors = getNeighbors(r, c, size);
    const validNeighbors = neighbors.filter(([nr, nc]) => {
      return findRegion(regions, nr, nc) !== regionIdx;
    });
    
    if (validNeighbors.length === 0) continue;
    
    const [nr, nc] = validNeighbors[Math.floor(rng() * validNeighbors.length)];
    const nRegionIdx = findRegion(regions, nr, nc);
    
    // Symmetric neighbor
    const snr = size - 1 - nr;
    const snc = size - 1 - nc;
    const snRegionIdx = findRegion(regions, snr, snc);
    
    // Ensure symmetry
    if (nRegionIdx !== snRegionIdx) continue;
    
    if (canSwap(regions, regionIdx, nRegionIdx, r, c, nr, nc, size) &&
        canSwap(regions, sRegionIdx, snRegionIdx, sr, sc, snr, snc, size)) {
      // Swap both pairs
      regions[regionIdx] = region.filter((_, idx) => idx !== cellIdx).concat([[nr, nc]]);
      regions[nRegionIdx] = regions[nRegionIdx].filter(([cr, cc]) => !(cr === nr && cc === nc)).concat([[r, c]]);
      
      regions[sRegionIdx] = regions[sRegionIdx].filter(([cr, cc]) => !(cr === sr && cc === sc)).concat([[snr, snc]]);
      regions[snRegionIdx] = regions[snRegionIdx].filter(([cr, cc]) => !(cr === snr && cc === snc)).concat([[sr, sc]]);
    }
  }
  
  return regions;
}
