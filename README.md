# Sudoku Solver

Generic Sudoku solver with interactive web UI. Supports any grid size, irregular (jigsaw) regions, and custom symbols.

**Live Demo:** https://vkkkv.github.io/sudoku-solver/

## Features

- **Any grid size** — Type any number from 4 to 36
- **Irregular regions** — Draw custom jigsaw shapes or auto-generate
- **Custom symbols** — Auto-maps 1-9, A-Z for larger grids
- **Fast solver** — DLX (Dancing Links) algorithm, solves most puzzles in <10ms
- **High DPI canvas** — Crisp rendering on retina displays
- **Dark Swiss UI** — Clean, minimal, no shadows

## Usage

### Grid Size

Type a number (4-36) in the input field and press **Enter** or click **Apply**. Quick-select buttons: 4, 6, 9, 12, 13, 16, 25.

### Numbers Mode

Click a cell, then type a digit (`1-9` or `A-Z`). Use `Delete`/`Backspace` to clear. Arrow keys to navigate.

### Regions Mode

1. Click **Regions** to switch mode
2. Click cells to select them (highlighted in white)
3. Select exactly N cells (where N = grid size)
4. Click **Add Region** to confirm
5. Repeat until all N regions are created

Or click **Gen Regions** to auto-generate irregular regions.

### Solving

Click **Solve**. Solutions are highlighted in green. Use **Show/Hide Solution** to toggle.

## Algorithm

Uses Donald Knuth's **Dancing Links (DLX)** to solve the exact cover problem. Sudoku constraints are converted to a binary matrix with 4 constraint types:

1. **Cell** — each cell has exactly one value
2. **Row** — each row contains each value once
3. **Column** — each column contains each value once
4. **Region** — each region contains each value once

DLX finds all valid solutions efficiently using backtracking with doubly-linked list optimization and MRV (Minimum Remaining Values) heuristic.

## Tech Stack

- **Vue 3** — reactive UI (CDN, no build step)
- **Tailwind CSS** — styling (CDN)
- **Canvas API** — grid rendering with devicePixelRatio support
- **Pure JavaScript** — DLX solver, region generator

## Development

```bash
# Local server
python3 -m http.server 8080

# Open
http://localhost:8080
```

No build step, no dependencies. Edit files and refresh.

## License

[AGPL-3.0](LICENSE) — see LICENSE file for details.
