# accessible-seatmap

This script is designed to create an accessible seat map with standard navigation keys and directional arrows.

Use `ARIA (Accessible Rich Internet Applications)` conventions to make the seat map easily navigable and understandable for users with disabilities. The script provides several useful functions for working with DOM elements, such as checking if an element is focusable, getting ancestors of an element, adding or removing element classes, etc. It also provides keycode constants to facilitate keyboard navigation. Can be used on any platform that needs a seat map within a given physical space such as: cinemas, trains, airlines, buses, etc.

It is recommended that you read the ARIA documentation before using this script in a project to ensure correct implementation.

## How to use.

1. The element that will serve as the grid widget container must be identified using **id="accessible-seatmap"** and **role="grid"**.

2. Define rows with **role="row"** or **tr** tag.

3. Define cells with **role="gridcell"** or **td** tag.

4. Define column headers with **role="columnheader"** or **td** tag. (All columnheaders should be nested within a role row)

## Example

```html
<div id="accessible-seatmap" role="grid" aria-label="Seat map">
  <div role="row">
    <div role="columnheader">A</div>
    <div role="columnheader">B</div>
  </div>

  <div role="row">
    <div role="gridcell">
      <button tabindex="-1" aria-disabled="false" aria-label="seat">1A</button>
    </div>

    <div role="gridcell">
      <button tabindex="-1" aria-disabled="false" aria-label="seat">1B</button>
    </div>
  </div>

  <div role="row">
    <div role="gridcell">
      <button tabindex="-1" aria-disabled="false" aria-label="seat">2A</button>
    </div>

    <div role="gridcell">
      <button tabindex="-1" aria-disabled="false" aria-label="seat">2B</button>
    </div>
  </div>
</div>
```

## Screenshot

![screenshot of screen reader](https://github.com/manucg7/accessible-seatmap/blob/main/screenshot/screen-reader-1.png?raw=true)

![screenshot of screen reader](https://github.com/manucg7/accessible-seatmap/blob/main/screenshot/screen-reader-2.png?raw=true)

![screenshot of screen reader](https://github.com/manucg7/accessible-seatmap/blob/main/screenshot/screen-reader-3.png?raw=true)

## Inspired by

[W3C datagrid](https://www.w3.org/WAI/ARIA/apg/example-index/grid/dataGrids)

## License

**[MIT](LICENSE)** Licensed
