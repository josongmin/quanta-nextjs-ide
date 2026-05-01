export interface CQBreakpoints {
  sm: number;
  md: number;
  lg: number;
  xl?: number;
}

export interface CQComponent {
  id: string;
  name: string;
  containerName: string;
  breakpoints: CQBreakpoints;
  initialWidth: number;
  rules: ReadonlyArray<{ at: string; min: number; css: string }>;
}

export const components: ReadonlyArray<CQComponent> = [
  {
    id: 'card',
    name: 'ProductCard',
    containerName: 'card',
    breakpoints: { sm: 320, md: 480, lg: 720 },
    initialWidth: 360,
    rules: [
      { at: 'base', min: 0, css: '.card { display: block; padding: 8px; }' },
      {
        at: 'sm',
        min: 320,
        css: '@container card (min-width: 320px) {\n  .card { display: flex; gap: 8px; }\n}',
      },
      {
        at: 'md',
        min: 480,
        css: '@container card (min-width: 480px) {\n  .card { padding: 16px; gap: 12px; }\n  .card .meta { display: block; }\n}',
      },
      {
        at: 'lg',
        min: 720,
        css: '@container card (min-width: 720px) {\n  .card { grid-template-columns: 240px 1fr; }\n  .card .desc { font-size: 16px; }\n}',
      },
    ],
  },
  {
    id: 'media',
    name: 'MediaTile',
    containerName: 'media',
    breakpoints: { sm: 280, md: 420, lg: 640 },
    initialWidth: 200,
    rules: [
      { at: 'base', min: 0, css: '.media { aspect-ratio: 1 / 1; }' },
      {
        at: 'sm',
        min: 280,
        css: '@container media (min-width: 280px) {\n  .media { aspect-ratio: 4 / 3; }\n}',
      },
      {
        at: 'md',
        min: 420,
        css: '@container media (min-width: 420px) {\n  .media { aspect-ratio: 16 / 9; }\n  .media .caption { font-size: 14px; }\n}',
      },
      {
        at: 'lg',
        min: 640,
        css: '@container media (min-width: 640px) {\n  .media .caption { font-size: 18px; line-height: 1.3; }\n}',
      },
    ],
  },
  {
    id: 'sidebar',
    name: 'SidebarSection',
    containerName: 'sidebar',
    breakpoints: { sm: 240, md: 360, lg: 520 },
    initialWidth: 280,
    rules: [
      { at: 'base', min: 0, css: '.sb-item { padding: 4px 6px; font-size: 12px; }' },
      {
        at: 'sm',
        min: 240,
        css: '@container sidebar (min-width: 240px) {\n  .sb-item { padding: 6px 8px; }\n}',
      },
      {
        at: 'md',
        min: 360,
        css: '@container sidebar (min-width: 360px) {\n  .sb-item { display: flex; gap: 6px; }\n  .sb-item .badge { display: inline; }\n}',
      },
      {
        at: 'lg',
        min: 520,
        css: '@container sidebar (min-width: 520px) {\n  .sb-item .meta { display: block; }\n}',
      },
    ],
  },
  {
    id: 'review',
    name: 'ReviewCard',
    containerName: 'review',
    breakpoints: { sm: 320, md: 560, lg: 800 },
    initialWidth: 600,
    rules: [
      { at: 'base', min: 0, css: '.review { padding: 8px; }' },
      {
        at: 'sm',
        min: 320,
        css: '@container review (min-width: 320px) {\n  .review { display: grid; gap: 8px; }\n}',
      },
      {
        at: 'md',
        min: 560,
        css: '@container review (min-width: 560px) {\n  .review { grid-template-columns: 1fr 2fr; }\n}',
      },
      {
        at: 'lg',
        min: 800,
        css: '@container review (min-width: 800px) {\n  .review { padding: 24px; }\n  .review .author-bio { display: block; }\n}',
      },
    ],
  },
];

export function activeBreakpoint(c: CQComponent, width: number): string {
  if (c.breakpoints.lg !== undefined && width >= c.breakpoints.lg) return 'lg';
  if (c.breakpoints.md !== undefined && width >= c.breakpoints.md) return 'md';
  if (c.breakpoints.sm !== undefined && width >= c.breakpoints.sm) return 'sm';
  return 'base';
}
