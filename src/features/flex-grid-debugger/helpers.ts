export type ContainerKind = 'flex' | 'grid';

export interface CellGeom {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // grid only
  rowStart?: number;
  rowEnd?: number;
  colStart?: number;
  colEnd?: number;
}

export interface ContainerSpec {
  id: ContainerKind;
  name: string;
  width: number;
  height: number;
  cols: number;
  rows: number;
  gap: number;
  cells: CellGeom[];
  cssCause: string;
  properties: ReadonlyArray<{ key: string; value: string }>;
}

const FLEX_W = 760;
const FLEX_H = 220;
const FLEX_GAP = 12;
const FLEX_CHILDREN = 6;
const FLEX_CELL_W = (FLEX_W - FLEX_GAP * (FLEX_CHILDREN - 1)) / FLEX_CHILDREN;

const flexCells: CellGeom[] = Array.from({ length: FLEX_CHILDREN }, (_, i) => ({
  id: `f-${i + 1}`,
  label: `flex item ${i + 1}`,
  x: i * (FLEX_CELL_W + FLEX_GAP),
  y: 0,
  w: FLEX_CELL_W,
  h: FLEX_H,
}));

const GRID_W = 760;
const GRID_H = 360;
const GRID_COLS = 4;
const GRID_ROWS = 3;
const GRID_GAP = 16;
const GRID_CELL_W = (GRID_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const GRID_CELL_H = (GRID_H - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS;

const gridCells: CellGeom[] = Array.from(
  { length: GRID_COLS * GRID_ROWS },
  (_, idx) => {
    const r = Math.floor(idx / GRID_COLS);
    const c = idx % GRID_COLS;
    return {
      id: `g-${r + 1}-${c + 1}`,
      label: `grid item ${idx + 1}`,
      x: c * (GRID_CELL_W + GRID_GAP),
      y: r * (GRID_CELL_H + GRID_GAP),
      w: GRID_CELL_W,
      h: GRID_CELL_H,
      rowStart: r + 1,
      rowEnd: r + 2,
      colStart: c + 1,
      colEnd: c + 2,
    };
  },
);

export const containers: ReadonlyArray<ContainerSpec> = [
  {
    id: 'flex',
    name: 'Flex container',
    width: FLEX_W,
    height: FLEX_H,
    cols: FLEX_CHILDREN,
    rows: 1,
    gap: FLEX_GAP,
    cells: flexCells,
    cssCause: `.row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: stretch;
}
.row > * {
  flex: 1 1 0;
}`,
    properties: [
      { key: 'display', value: 'flex' },
      { key: 'gap', value: '12px' },
      { key: 'justify-content', value: 'space-between' },
      { key: 'align-items', value: 'stretch' },
      { key: 'flex-direction', value: 'row' },
      { key: 'children', value: '6' },
    ],
  },
  {
    id: 'grid',
    name: 'Grid container',
    width: GRID_W,
    height: GRID_H,
    cols: GRID_COLS,
    rows: GRID_ROWS,
    gap: GRID_GAP,
    cells: gridCells,
    cssCause: `.deck {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-flow: dense;
  gap: 16px;
}`,
    properties: [
      { key: 'display', value: 'grid' },
      { key: 'grid-template-columns', value: 'repeat(4, 1fr)' },
      { key: 'grid-auto-flow', value: 'dense' },
      { key: 'gap', value: '16px' },
      { key: 'rows', value: String(GRID_ROWS) },
      { key: 'cols', value: String(GRID_COLS) },
    ],
  },
];

export function getContainer(id: ContainerKind): ContainerSpec {
  return containers.find((c) => c.id === id) ?? (containers[0] as ContainerSpec);
}

export function describePlacement(cell: CellGeom): string {
  if (
    cell.rowStart !== undefined &&
    cell.rowEnd !== undefined &&
    cell.colStart !== undefined &&
    cell.colEnd !== undefined
  ) {
    return `row ${cell.rowStart} / col ${cell.colStart} → row ${cell.rowEnd} / col ${cell.colEnd}`;
  }
  return `flex order ${cell.id.split('-')[1] ?? ''}`;
}
