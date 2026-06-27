/**
 * Dancing Links (DLX) implementation for Exact Cover problems.
 * Based on Donald Knuth's Algorithm X.
 */
export class DLX {
  constructor(numColumns) {
    this.header = new ColumnNode(0, 'header');
    this.columns = [];
    this.solution = [];
    this.solutions = [];
    this.maxSolutions = 1;
    
    // Create column headers
    let prev = this.header;
    for (let i = 0; i < numColumns; i++) {
      const col = new ColumnNode(i + 1, `col${i}`);
      col.left = prev;
      col.right = this.header;
      prev.right = col;
      this.header.left = col;
      this.columns.push(col);
      prev = col;
    }
  }

  /**
   * Add a row to the matrix. Each row is an array of column indices (0-based).
   */
  addRow(rowId, columns) {
    if (columns.length === 0) return;
    
    let first = null;
    for (const colIdx of columns) {
      const col = this.columns[colIdx];
      const node = new DataNode(rowId, col);
      
      // Link to column
      node.up = col.up;
      node.down = col;
      col.up.down = node;
      col.up = node;
      col.size++;
      
      // Link to row
      if (!first) {
        first = node;
        node.left = node;
        node.right = node;
      } else {
        node.left = first.left;
        node.right = first;
        first.left.right = node;
        first.left = node;
      }
    }
  }

  /**
   * Search for solutions using Algorithm X.
   */
  search(k = 0) {
    if (this.solutions.length >= this.maxSolutions) return;
    
    if (this.header.right === this.header) {
      // Found a solution
      this.solutions.push(this.solution.map(node => node.rowId));
      return;
    }
    
    // Choose column with minimum size (MRV heuristic)
    let col = this.chooseColumn();
    this.cover(col);
    
    for (let row = col.down; row !== col; row = row.down) {
      this.solution[k] = row;
      
      for (let j = row.right; j !== row; j = j.right) {
        this.cover(j.column);
      }
      
      this.search(k + 1);

      // Backtrack before honoring maxSolutions so the DLX links stay valid.
      row = this.solution[k];
      this.solution[k] = null;
      col = row.column;
      
      for (let j = row.left; j !== row; j = j.left) {
        this.uncover(j.column);
      }

      if (this.solutions.length >= this.maxSolutions) break;
    }
    
    this.uncover(col);
  }

  /**
   * Choose column with minimum number of 1s (MRV heuristic).
   */
  chooseColumn() {
    let minSize = Infinity;
    let chosen = null;
    
    for (let col = this.header.right; col !== this.header; col = col.right) {
      if (col.size < minSize) {
        minSize = col.size;
        chosen = col;
        if (minSize <= 1) break; // Can't do better
      }
    }
    
    return chosen;
  }

  /**
   * Cover a column: remove it and all rows that have a 1 in this column.
   */
  cover(col) {
    col.right.left = col.left;
    col.left.right = col.right;
    
    for (let row = col.down; row !== col; row = row.down) {
      for (let j = row.right; j !== row; j = j.right) {
        j.down.up = j.up;
        j.up.down = j.down;
        j.column.size--;
      }
    }
  }

  /**
   * Uncover a column: restore it and all rows.
   */
  uncover(col) {
    for (let row = col.up; row !== col; row = row.up) {
      for (let j = row.left; j !== row; j = j.left) {
        j.column.size++;
        j.down.up = j;
        j.up.down = j;
      }
    }
    
    col.right.left = col;
    col.left.right = col;
  }
}

class Node {
  constructor() {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.column = null;
    this.rowId = -1;
  }
}

class ColumnNode extends Node {
  constructor(id, name) {
    super();
    this.id = id;
    this.name = name;
    this.size = 0;
    this.column = this;
  }
}

class DataNode extends Node {
  constructor(rowId, column) {
    super();
    this.rowId = rowId;
    this.column = column;
  }
}
