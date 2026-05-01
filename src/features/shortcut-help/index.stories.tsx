import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { ShortcutHelpOverlay } from './index';

const meta = {
  title: 'Features/ShortcutHelp',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Renders the keyboard shortcuts overlay (used by the global "?" hotkey in
 * the running app). The story opens it on mount so the panel is visible in
 * the canvas.
 */
export const OverlayOpen: Story = {
  render: () => {
    const Opener = () => {
      const openOverlay = useUiStore((s) => s.openOverlay);
      useEffect(() => {
        openOverlay('shortcutHelp');
      }, [openOverlay]);
      return null;
    };
    return (
      <div className="h-screen w-screen bg-bg">
        <Opener />
        <ShortcutHelpOverlay />
      </div>
    );
  },
};
