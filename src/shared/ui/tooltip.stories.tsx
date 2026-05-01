import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Button } from './button';
import { Tooltip } from './tooltip';

interface DemoArgs {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  triggerLabel?: string;
}

const Demo = ({ content, side, align, delay, triggerLabel }: DemoArgs) => (
  <Tooltip content={content} side={side} align={align} delay={delay}>
    <Button tone="default">{triggerLabel ?? 'Hover me'}</Button>
  </Tooltip>
);

const meta: Meta<DemoArgs> = {
  title: 'Shared/Primitives/Tooltip',
  component: Demo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    delay: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
  },
  args: {
    content: 'Hello from a tooltip',
    side: 'top',
    align: 'center',
    delay: 100,
    triggerLabel: 'Hover me',
  },
};

export default meta;
type Story = StoryObj<DemoArgs>;

export const Default: Story = {};

export const Right: Story = {
  args: { side: 'right', triggerLabel: 'Tooltip on right' },
};

export const RichContent: Story = {
  args: {
    content: (
      <div className="space-y-1">
        <div className="font-semibold text-ink-1">Cmd-K</div>
        <div className="text-ink-3">Open the command palette</div>
      </div>
    ),
    triggerLabel: 'Show shortcut',
  },
};

export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 p-12">
      <Tooltip content="Top" side="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content="Right" side="right">
        <Button>Right</Button>
      </Tooltip>
      <Tooltip content="Bottom" side="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip content="Left" side="left">
        <Button>Left</Button>
      </Tooltip>
    </div>
  ),
};
