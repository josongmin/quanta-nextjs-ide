import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './button';
import { OverlayPanel, type OverlaySize } from './overlay-panel';

interface DemoArgs {
  size?: OverlaySize;
  width?: number;
  withSubtitle?: boolean;
  withFooter?: boolean;
}

const Demo = ({
  size,
  width,
  withSubtitle = true,
  withFooter = true,
}: DemoArgs) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg p-6">
      <Button tone="accent" onClick={() => setOpen(true)}>
        Open overlay
      </Button>
      <OverlayPanel
        open={open}
        onOpenChange={setOpen}
        title="Refactor preview"
        subtitle={
          withSubtitle ? 'Review the proposed changes before applying' : undefined
        }
        size={size}
        width={width}
        footer={
          withFooter ? (
            <>
              <Button tone="ghost" size="xs" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button tone="accent" size="xs" onClick={() => setOpen(false)}>
                Apply
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="space-y-3 px-4 py-4 text-sm text-ink-2">
          <p>
            This overlay demonstrates the OverlayPanel primitive used across
            command palette, notifications, learn-more, and other feature
            surfaces.
          </p>
          <p className="text-ink-3">
            Resize via <code>size</code> or <code>width</code> props in the
            controls panel.
          </p>
        </div>
      </OverlayPanel>
    </div>
  );
};

const meta: Meta<DemoArgs> = {
  title: 'Shared/Primitives/OverlayPanel',
  component: Demo,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    width: { control: { type: 'number', min: 320, max: 1400, step: 20 } },
    withSubtitle: { control: 'boolean' },
    withFooter: { control: 'boolean' },
  },
  args: {
    size: 'md',
    withSubtitle: true,
    withFooter: true,
  },
};

export default meta;
type Story = StoryObj<DemoArgs>;

export const Default: Story = { args: { size: 'md' } };
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const NoFooter: Story = { args: { size: 'md', withFooter: false } };
