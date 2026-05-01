import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { NotificationsBell, NotificationsOverlay } from './index';

const meta = {
  title: 'Features/Notifications',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The bell badge shown in the top-right of the app shell. Clicking it opens
 * the notifications overlay (mounted globally elsewhere in the app — included
 * here so the click still works inside Storybook).
 */
export const Bell: Story = {
  render: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-bg">
      <div className="rounded-md border border-line bg-bg-subtle p-6">
        <NotificationsBell />
      </div>
      <NotificationsOverlay />
    </div>
  ),
};

/**
 * The full notifications overlay rendered from the seeded store. It opens
 * automatically on mount so the panel is visible in the canvas.
 */
export const OverlayOpen: Story = {
  render: () => {
    const Opener = () => {
      const openOverlay = useUiStore((s) => s.openOverlay);
      useEffect(() => {
        openOverlay('notifications');
      }, [openOverlay]);
      return null;
    };
    return (
      <div className="h-screen w-screen bg-bg">
        <Opener />
        <NotificationsOverlay />
      </div>
    );
  },
};
