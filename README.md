# Sudoku Solver

Generic Sudoku solver and generator with interactive web UI. Supports any grid size, irregular (jigsaw) regions, and custom symbols.

**Live Demo:** https://vkkkv.github.io/sudoku-solver/

## Features

- **Any grid size** — Type any number from 4 to 36
- **Irregular regions** — Draw custom jigsaw shapes or auto-generate
- **Custom symbols** — Auto-maps 1-9, A-Z, and @ for 36×36 grids
- **Puzzle generator** — Generates valid puzzles with unique solution guarantee
- **Fast solver** — DLX (Dancing Links) algorithm
- **High DPI canvas** — Crisp rendering on retina displays
- **Dark Swiss UI** — Clean, minimal, no shadows

## Usage

### Grid Size

Type a number (4-36) in the input field and press **Enter** or click **Apply**. Quick-select buttons: 4, 6, 9, 12, 13, 16, 25.

### Numbers Mode

Click a cell, then type a digit (`1-9` or `A-Z`). Use `Delete`/`Backspace` to clear. Arrow keys and Tab to navigate.

### Regions Mode

1. Click **Regions** to switch mode
2. Click cells to select them (highlighted in white)
3. Select exactly N cells (where N = grid size)
4. Click **Add Region** to confirm
5. Repeat until all N regions are created

Or click **Gen Regions** to auto-generate irregular regions.

### Generating Puzzles

Click **Random Fill** to generate a valid puzzle:

1. DLX generates a complete valid solution (randomized for variety)
2. Cells are removed one by one
3. After each removal, DLX verifies the puzzle still has exactly one solution
4. Stops when target clue count is reached

**Guarantee:** Every generated puzzle has exactly one valid solution.

### Solving

Click **Solve**. Solutions are highlighted in green. Use **Show/Hide Solution** to toggle.

## Algorithm

Uses Donald Knuth's **Dancing Links (DLX)** to solve the exact cover problem.

### Constraint Matrix

Sudoku is converted to a binary matrix with 4 constraint types:

| Constraint | Description |
|-----------|-------------|
| Cell | Each cell has exactly one value |
| Row | Each row contains each value once |
| Column | Each column contains each value once |
| Region | Each region contains each value once |

Each possible `(cell, value)` placement becomes a row with exactly 4 ones.

### Solver

DLX finds all valid solutions using:
- **Backtracking** with doubly-linked list manipulation
- **MRV heuristic** — chooses column with fewest remaining options first
- **Cover/uncover** — O(1) column removal and restoration

### Generator

1. **Randomized DLX** — shuffles row insertion order to produce random solutions
2. **Unique-removal loop** — removes cells one by one, checking uniqueness after each removal
3. **Target clue ratio** — defaults to 25% of cells filled

## Implementation

- **Static app** — Plain HTML + JavaScript modules, served directly by the browser
- **UI runtime** — Vue 3 global build from CDN, used for reactive state and event binding
- **Styling** — Tailwind CDN utility classes plus a small inline Dark Swiss theme config
- **Rendering** — Canvas API with devicePixelRatio scaling
- **Solver** — Custom DLX implementation in `js/dlx.js` and `js/solver.js`
- **Region Gen** — Random swap generation with BFS connectivity checks in `js/regions.js`

No package manager, build step, or bundled framework. Runtime CDN dependencies are loaded from `index.html`; edit files and refresh.

## Development

```bash
# Local server
python3 -m http.server 8080

# Open
http://localhost:8080
```

### Project Structure

```
sudoku-solver/
├── index.html          # Static HTML shell, CDN imports, Vue app setup, UI
├── js/
│   ├── dlx.js          # Dancing Links algorithm
│   ├── solver.js       # DLX matrix builder, puzzle generator
│   └── regions.js      # Irregular region generator
├── LICENSE             # AGPL-3.0
└── README.md
```

## License

[AGPL-3.0](LICENSE)
