# Sudoku Solver

Generic Sudoku solver with interactive web UI. Supports any grid size, irregular (jigsaw) regions, and custom symbols.

## Features

- **Any grid size**: 4x4 to 25x25+
- **Irregular regions**: Draw custom jigsaw shapes
- **Custom symbols**: Auto-maps 1-9, A-Z for larger grids
- **Fast solver**: DLX (Dancing Links) algorithm
- **Region generator**: Auto-generate valid jigsaw regions
- **Pure frontend**: No server needed, runs in browser

## Algorithm

Uses Donald Knuth's **Dancing Links (DLX)** algorithm to solve the exact cover problem. The Sudoku constraints are converted to an exact cover matrix:

1. Each cell must have exactly one value
2. Each row must contain each value once
3. Each column must contain each value once
4. Each region must contain each value once

DLX finds all valid solutions efficiently using backtracking with doubly-linked list optimization.

## Usage

Open `index.html` in a browser or deploy to GitHub Pages.

## License

MIT
