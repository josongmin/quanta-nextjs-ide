import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Chip } from './chip';

type ChipTone =
  | 'neutral'
  | 'muted'
  | 'accent'
  | 'err'
  | 'warn'
  | 'info'
  | 'hint'
  | 'static'
  | 'isr'
  | 'dynamic'
  | 'edge'
  | 'client'
  | 'server';
type ChipSize = 'xs' | 'sm' | 'md';
type ChipShape = 'default' | 'pill';

interface DemoArgs {
  children: ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  shape?: ChipShape;
}

const Demo = ({ children, tone, size, shape }: DemoArgs) => (
  <Chip tone={tone} size={size} shape={shape}>
    {children}
  </Chip>
);

const meta: Meta<DemoArgs> = {
  title: 'Shared/Primitives/Chip',
  component: Demo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: [
        'neutral',
        'muted',
        'accent',
        'err',
        'warn',
        'info',
        'hint',
        'static',
        'isr',
        'dynamic',
        'edge',
        'client',
        'server',
      ],
    },
    size: { control: 'select', options: ['xs', 'sm', 'md'] },
    shape: { control: 'select', options: ['default', 'pill'] },
  },
  args: {
    children: 'chip',
    tone: 'neutral',
    size: 'sm',
  },
};

export default meta;
type Story = StoryObj<DemoArgs>;

export const Default: Story = {};

export const Accent: Story = { args: { tone: 'accent', children: 'accent' } };
export const Err: Story = { args: { tone: 'err', children: '3 errors' } };
export const Warn: Story = { args: { tone: 'warn', children: '7 warnings' } };
export const Info: Story = { args: { tone: 'info', children: 'info' } };

export const RenderingTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip tone="static">static</Chip>
      <Chip tone="isr">isr</Chip>
      <Chip tone="dynamic">dynamic</Chip>
      <Chip tone="edge">edge</Chip>
      <Chip tone="client">client</Chip>
      <Chip tone="server">server</Chip>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Chip size="xs">xs</Chip>
      <Chip size="sm">sm</Chip>
      <Chip size="md">md</Chip>
    </div>
  ),
};
