import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Button } from './button';

type ButtonTone = 'default' | 'ghost' | 'accent' | 'soft' | 'warn' | 'err';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface DemoArgs {
  children: ReactNode;
  tone?: ButtonTone;
  size?: ButtonSize;
  disabled?: boolean;
}

const Demo = ({ children, tone, size, disabled }: DemoArgs) => (
  <Button tone={tone} size={size} disabled={disabled}>
    {children}
  </Button>
);

const meta: Meta<DemoArgs> = {
  title: 'Shared/Primitives/Button',
  component: Demo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['default', 'ghost', 'accent', 'soft', 'warn', 'err'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    tone: 'default',
    size: 'sm',
  },
};

export default meta;
type Story = StoryObj<DemoArgs>;

export const Default: Story = {};

export const Accent: Story = {
  args: { tone: 'accent', children: 'Apply suggestion' },
};

export const Ghost: Story = {
  args: { tone: 'ghost', children: 'Dismiss' },
};

export const Warn: Story = {
  args: { tone: 'warn', children: 'Review warning' },
};

export const Err: Story = {
  args: { tone: 'err', children: 'Delete branch' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button tone="default">default</Button>
      <Button tone="ghost">ghost</Button>
      <Button tone="accent">accent</Button>
      <Button tone="soft">soft</Button>
      <Button tone="warn">warn</Button>
      <Button tone="err">err</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="md">md</Button>
      <Button size="lg">lg</Button>
    </div>
  ),
};
