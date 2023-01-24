/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *   This software or document includes material copied from or derived from [https://www.w3.org/WAI/ARIA/apg/example-index/grid/dataGrids]. Copyright © [YEAR] W3C® (MIT, ERCIM, Keio, Beihang).
 */

'use strict';
/**
 * @namespace aria
 */

var aria = aria || {};

/**
 * @description
 *  Key code constants
 */
aria.KeyCode = {
  BACKSPACE: 8,
  TAB: 9,
  RETURN: 13,
  SHIFT: 16,
  ESC: 27,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  DELETE: 46,
};

aria.Utils = aria.Utils || {};

// Polyfill src https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
aria.Utils.matches = function (element, selector) {
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function (s) {
        var matches = element.parentNode.querySelectorAll(s);
        var i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {
          // empty
        }
        return i > -1;
      };
  }

  return element.matches(selector);
};

aria.Utils.remove = function (item) {
  if (item.remove && typeof item.remove === 'function') {
    return item.remove();
  }
  if (
    item.parentNode &&
    item.parentNode.removeChild &&
    typeof item.parentNode.removeChild === 'function'
  ) {
    return item.parentNode.removeChild(item);
  }
  return false;
};

aria.Utils.isFocusable = function (element) {
  if (element.tabIndex < 0) {
    return false;
  }

  if (element.disabled) {
    return false;
  }

  switch (element.nodeName) {
    case 'A':
      return !!element.href && element.rel != 'ignore';
    case 'INPUT':
      return element.type != 'hidden';
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      return true;
    default:
      return false;
  }
};

aria.Utils.getAncestorBySelector = function (element, selector) {
  if (!aria.Utils.matches(element, selector + ' ' + element.tagName)) {
    // Element is not inside an element that matches selector
    return null;
  }

  // Move up the DOM tree until a parent matching the selector is found
  var currentNode = element;
  var ancestor = null;
  while (ancestor === null) {
    if (aria.Utils.matches(currentNode.parentNode, selector)) {
      ancestor = currentNode.parentNode;
    } else {
      currentNode = currentNode.parentNode;
    }
  }

  return ancestor;
};

aria.Utils.hasClass = function (element, className) {
  return new RegExp('(\\s|^)' + className + '(\\s|$)').test(element.className);
};

aria.Utils.addClass = function (element, className) {
  if (!aria.Utils.hasClass(element, className)) {
    element.className += ' ' + className;
  }
};

aria.Utils.removeClass = function (element, className) {
  var classRegex = new RegExp('(\\s|^)' + className + '(\\s|$)');
  element.className = element.className.replace(classRegex, ' ').trim();
};

aria.Utils.bindMethods = function (object /* , ...methodNames */) {
  var methodNames = Array.prototype.slice.call(arguments, 1);
  methodNames.forEach(function (method) {
    object[method] = object[method].bind(object);
  });
};


/**
 * @namespace aria
 */
var aria = aria || {};


/**
 * @description
 *  DOM Selectors to find the grid components
 */
aria.GridSelector = {
  ROW: 'tr, [role="row"]',
  CELL: 'th, td, [role="gridcell"], [role="columnheader"]',
};

/**
 * @description
 *  CSS Class names
 */
aria.CSSClass = {
  HIDDEN: 'hidden',
};

/**
 * @class
 * @description
 *  Grid object representing the state and interactions for a grid widget
 *
 *  Assumptions:
 *  All focusable cells initially have tabindex="-1"
 *  Produces a fully filled in mxn grid (with no holes)
 * @param gridNode
 *  The DOM node pointing to the grid
 */
aria.Grid = function (gridNode) {
  this.gridNode = gridNode;
  this.topIndex = 0;
  aria.Utils.bindMethods(
    this,
    'checkFocusChange',
    'focusClickedCell',
  );
  this.setupFocusGrid();
  this.setFocusPointer(0, 0);
  this.registerEvents();
};

/**
 * @description
 *  Creates a 2D array of the focusable cells in the grid.
 */
aria.Grid.prototype.setupFocusGrid = function () {
  this.grid = [];

  Array.prototype.forEach.call(
    this.gridNode.querySelectorAll(aria.GridSelector.ROW),
    function (row) {

      var rowCells = [];

      Array.prototype.forEach.call(
        row.querySelectorAll(aria.GridSelector.CELL),
        function (cell) {

          var focusableSelector = '[tabindex]';

          if (aria.Utils.matches(cell, focusableSelector)) {
            rowCells.push(cell);
          } else {
            var focusableCell = cell.querySelector(focusableSelector);
            if (focusableCell) {
              rowCells.push(focusableCell);
            }
          }
        }.bind(this)
      );

      if (rowCells.length) {
        this.grid.push(rowCells);
      }
    }.bind(this)
  );

};

/**
 * @description
 *  If possible, set focus pointer to the cell with the specified coordinates
 * @param row
 *  The index of the cell's row
 * @param col
 *  The index of the cell's column
 * @returns {boolean}
 *  Returns whether or not the focus could be set on the cell.
 */
aria.Grid.prototype.setFocusPointer = function (row, col) {
  debugger
  if (!this.isValidCell(row, col)) {
    return false;
  }

  if (this.isHidden(row, col)) {
    return false;
  }

  if (!isNaN(this.focusedRow) && !isNaN(this.focusedCol)) {
    this.grid[this.focusedRow][this.focusedCol].setAttribute('tabindex', -1);
  }

  this.grid[row][col].removeEventListener('focus', this.showKeysIndicator);
  this.grid[row][col].removeEventListener('blur', this.hideKeysIndicator);


  this.grid[row][col].setAttribute('tabindex', 0);
  this.focusedRow = row;
  this.focusedCol = col;

  this.grid[row][col].addEventListener('focus', this.showKeysIndicator);
  this.grid[row][col].addEventListener('blur', this.hideKeysIndicator);

  return true;
};

/**
 * @param row
 *  The index of the cell's row
 * @param col
 *  The index of the cell's column
 * @returns {boolean}
 *  Returns whether or not the coordinates are within the grid's boundaries.
 */
aria.Grid.prototype.isValidCell = function (row, col) {
  return (
    !isNaN(row) &&
    !isNaN(col) &&
    row >= 0 &&
    col >= 0 &&
    this.grid &&
    this.grid.length &&
    row < this.grid.length &&
    col < this.grid[row].length
  );
};

/**
 * @param row
 *  The index of the cell's row
 * @param col
 *  The index of the cell's column
 * @returns {boolean}
 *  Returns whether or not the cell has been hidden.
 */
aria.Grid.prototype.isHidden = function (row, col) {
  var cell = this.gridNode
    .querySelectorAll(aria.GridSelector.ROW)
    [row].querySelectorAll(aria.GridSelector.CELL)[col];
  return aria.Utils.hasClass(cell, aria.CSSClass.HIDDEN);
};

/**
 * @description
 *  Clean up grid events
 */
aria.Grid.prototype.clearEvents = function () {
  this.gridNode.removeEventListener('keydown', this.checkFocusChange);

  this.gridNode.removeEventListener('click', this.focusClickedCell);

  this.grid[this.focusedRow][this.focusedCol].removeEventListener(
    'focus',
    this.showKeysIndicator
  );
  this.grid[this.focusedRow][this.focusedCol].removeEventListener(
    'blur',
    this.hideKeysIndicator
  );
};

/**
 * @description
 *  Register grid events
 */
aria.Grid.prototype.registerEvents = function () {
  this.clearEvents();
  this.gridNode.addEventListener('keydown', this.checkFocusChange);
  this.gridNode.addEventListener('click', this.focusClickedCell);
};

/**
 * @description
 *  Focus on the cell in the specified row and column
 * @param row
 *  The index of the cell's row
 * @param col
 *  The index of the cell's column
 */
aria.Grid.prototype.focusCell = function (row, col) {
  if (this.setFocusPointer(row, col)) {
    this.grid[row][col].focus();
  }
};

aria.Grid.prototype.showKeysIndicator = function () {
  if (this.keysIndicator) {
    aria.Utils.removeClass(this.keysIndicator, 'hidden');
  }
};

aria.Grid.prototype.hideKeysIndicator = function () {
  if (
    this.keysIndicator &&
    this.grid[this.focusedRow][this.focusedCol].tabIndex === 0
  ) {
    aria.Utils.addClass(this.keysIndicator, 'hidden');
  }
};

/**
 * @description
 *  Triggered on keydown. Checks if an arrow key was pressed, and (if possible)
 *  moves focus to the next valid cell in the direction of the arrow key.
 * @param event
 *  Keydown event
 */
aria.Grid.prototype.checkFocusChange = function (event) {
  if (!event) {
    return;
  }

  this.findFocusedItem(event.target);

  var key = event.which || event.keyCode;
  var rowCaret = this.focusedRow;
  var colCaret = this.focusedCol;
  var nextCell;

  switch (key) {
    case aria.KeyCode.UP:
      nextCell = this.getNextVisibleCell(0, -1);
      rowCaret = nextCell.row;
      colCaret = nextCell.col;
      break;
    case aria.KeyCode.DOWN:
      nextCell = this.getNextVisibleCell(0, 1);
      rowCaret = nextCell.row;
      colCaret = nextCell.col;
      break;
    case aria.KeyCode.LEFT:
      nextCell = this.getNextVisibleCell(-1, 0);
      rowCaret = nextCell.row;
      colCaret = nextCell.col;
      break;
    case aria.KeyCode.RIGHT:
      nextCell = this.getNextVisibleCell(1, 0);
      rowCaret = nextCell.row;
      colCaret = nextCell.col;
      break;
    case aria.KeyCode.HOME:
      if (event.ctrlKey) {
        rowCaret = 0;
      }
      colCaret = 0;
      break;
    case aria.KeyCode.END:
      if (event.ctrlKey) {
        rowCaret = this.grid.length - 1;
      }
      colCaret = this.grid[this.focusedRow].length - 1;
      break;
    default:
      return;
  }

  this.focusCell(rowCaret, colCaret);
  event.preventDefault();
};

/**
 * @description
 *  Reset focused row and col if it doesn't match focusedRow and focusedCol
 * @param focusedTarget
 *  Element that is currently focused by browser
 */
aria.Grid.prototype.findFocusedItem = function (focusedTarget) {
  var focusedCell = this.grid[this.focusedRow][this.focusedCol];

  if (focusedCell === focusedTarget || focusedCell.contains(focusedTarget)) {
    return;
  }

  for (var i = 0; i < this.grid.length; i++) {
    for (var j = 0; j < this.grid[i].length; j++) {
      if (
        this.grid[i][j] === focusedTarget ||
        this.grid[i][j].contains(focusedTarget)
      ) {
        this.setFocusPointer(i, j);
        return;
      }
    }
  }
};

/**
 * @description
 *  Triggered on click. Finds the cell that was clicked on and focuses on it.
 * @param event
 *  Keydown event
 */
aria.Grid.prototype.focusClickedCell = function (event) {
  var clickedGridCell = this.findClosest(event.target, '[tabindex]');

  for (var row = 0; row < this.grid.length; row++) {
    for (var col = 0; col < this.grid[row].length; col++) {
      if (this.grid[row][col] === clickedGridCell) {
        this.setFocusPointer(row, col);

        if (!aria.Utils.matches(clickedGridCell, 'button[aria-haspopup]')) {
          // Don't focus if it's a menu button (focus should be set to menu)
          this.focusCell(row, col);
        }

        return;
      }
    }
  }
};


/**
 * @description
 * Get next cell to the right or left (direction) of the focused
 * cell.
 * @param currRow
 * Row index to start searching from
 * @param currCol
 * Column index to start searching from
 * @param directionX
 * X direction for where to check for cells. +1 to check to the right, -1 to
 * check to the left
 * @param directionY
 * @returns {false | object}
 * Indices of the next cell in the specified direction. Returns the focused
 * cell if none are found.
 */
aria.Grid.prototype.getNextCell = function (
  currRow,
  currCol,
  directionX,
  directionY
) {
  var row = currRow + directionY;
  var col = currCol + directionX;
  var rowCount = this.grid.length;
  var isLeftRight = directionX !== 0;

  if (!rowCount) {
    return false;
  }

  var colCount = this.grid[0].length;

  if (this.shouldWrapCols && isLeftRight) {
    if (col < 0) {
      col = colCount - 1;
      row--;
    }

    if (col >= colCount) {
      col = 0;
      row++;
    }
  }

  if (this.shouldWrapRows && !isLeftRight) {
    if (row < 0) {
      col--;
      row = rowCount - 1;
      if (this.grid[row] && col >= 0 && !this.grid[row][col]) {
        // Sometimes the bottom row is not completely filled in. In this case,
        // jump to the next filled in cell.
        row--;
      }
    } else if (row >= rowCount || !this.grid[row][col]) {
      row = 0;
      col++;
    }
  }

  if (this.isValidCell(row, col)) {
    return {
      row: row,
      col: col,
    };
  } else if (this.isValidCell(currRow, currCol)) {
    return {
      row: currRow,
      col: currCol,
    };
  } else {
    return false;
  }
};

/**
 * @param directionX
 * @param directionY
 * @description
Get next visible column to the right or left (direction) of the focused
 * cell.
 * @returns {false | object}
 * Indices of the next visible cell in the specified direction. If no visible
 * cells are found, returns false if the current cell is hidden and returns
 * the current cell if it is not hidden.
 */
aria.Grid.prototype.getNextVisibleCell = function (directionX, directionY) {
  var nextCell = this.getNextCell(
    this.focusedRow,
    this.focusedCol,
    directionX,
    directionY
  );

  if (!nextCell) {
    return false;
  }

  while (this.isHidden(nextCell.row, nextCell.col)) {
    var currRow = nextCell.row;
    var currCol = nextCell.col;

    nextCell = this.getNextCell(currRow, currCol, directionX, directionY);

    if (currRow === nextCell.row && currCol === nextCell.col) {
      // There are no more cells to try if getNextCell returns the current cell
      return false;
    }
  }

  return nextCell;
};


/**
 * @description
 *  Find the closest element matching the selector. Only checks parent and
 *  direct children.
 * @param element
 *  Element to start searching from
 * @param selector
 *  Index of the column to toggle
 * @returns {object} matching element
 */
aria.Grid.prototype.findClosest = function (element, selector) {
  if (aria.Utils.matches(element, selector)) {
    return element;
  }

  if (aria.Utils.matches(element.parentNode, selector)) {
    return element.parentNode;
  }

  return element.querySelector(selector);
};

window.addEventListener('load', function () {
  // Initialize Example 1 Grid (if it is present in the DOM)
  var ex1GridElement = document.getElementById('accessible-seatmap');
  if (ex1GridElement) {
    new aria.Grid(ex1GridElement);
  }
});