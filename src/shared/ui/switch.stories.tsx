import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './switch';

const noop = () => {};

const meta = {
  title: 'Shared/Primitives/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    checked: false,
    onCheckedChange: noop,
    size: 'md',
    label: 'Toggle setting',
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

interface ControlledProps {
  initial: boolean;
  size?: 'sm' | 'md';
  disabled?: boolean;
  label?: string;
}

const Controlled = ({ initial, size, disabled, label }: ControlledProps) => {
  const [on, setOn] = useState(initial);
  return (
    <Switch
      checked={on}
      onCheckedChange={setOn}
      size={size}
      disabled={disabled}
      label={label}
    />
  );
};

export const Off: Story = {
  args: { checked: false, onCheckedChange: noop },
  render: (args) => (
    <Controlled initial={false} size={args.size} label={args.label} />
  ),
};

export const On: Story = {
  args: { checked: true, onCheckedChange: noop },
  render: (args) => (
    <Controlled initial={true} size={args.size} label={args.label} />
  ),
};

export const Small: Story = {
  args: { checked: true, onCheckedChange: noop, size: 'sm' },
  render: () => <Controlled initial={true} size="sm" label="Small switch" />,
};

export const Disabled: Story = {
  args: { checked: true, onCheckedChange: noop, disabled: true },
  render: (args) => (
    <Controlled
      initial={true}
      size={args.size}
      disabled
      label={args.label}
    />
  ),
};

export const WithLabel: Story = {
  args: { checked: true, onCheckedChange: noop },
  render: () => {
    const Row = () => {
      const [on, setOn] = useState(true);
      return (
        <label className="flex items-center gap-2 text-sm text-ink-1">
          <Switch checked={on} onCheckedChange={setOn} label="Enable analysis" />
          <span>Enable analysis</span>
        </label>
      );
    };
    return <Row />;
  },
};
