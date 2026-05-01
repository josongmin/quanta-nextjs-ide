import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  OverlayPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { RuleManagerSection } from '@features/rule-manager';
import { AppearanceSection } from './sections/appearance';
import { DensitySection } from './sections/density';
import { ProfileSection } from './sections/profile';
import { AutofixSection } from './sections/autofix';

type SettingsTab = 'appearance' | 'density' | 'profile' | 'autofix' | 'rules';

const STORAGE_KEY = 'nss-ui';

function resetDefaults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // private browsing / quota — fall through to reload anyway.
  }
  toast('Settings reset · reloading', {
    description: 'All preferences restored to factory defaults.',
  });
  // Defer so the toast paints before reload.
  setTimeout(() => {
    window.location.reload();
  }, 320);
}

export function SettingsPanelOverlay() {
  const open = useUiStore((s) => s.overlays.settings.open);
  const requestedTab = useUiStore((s) => s.overlays.settings.tab);
  const close = useUiStore((s) => s.closeOverlay);

  const initialTab: SettingsTab = requestedTab ?? 'appearance';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('settings'))}
      title="Settings"
      subtitle="theme · density · profile · autofix · rules"
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button tone="ghost" size="sm" onClick={resetDefaults}>
            Reset to defaults
          </Button>
          <Button tone="default" size="sm" onClick={() => close('settings')}>
            Done
          </Button>
        </div>
      }
    >
      <Tabs key={initialTab} defaultValue={initialTab} className="flex flex-col">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="density">Density</TabsTrigger>
          <TabsTrigger value="profile">Inspection Profile</TabsTrigger>
          <TabsTrigger value="autofix">Autofix</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="appearance">
          <AppearanceSection />
        </TabsContent>
        <TabsContent value="density">
          <DensitySection />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>
        <TabsContent value="autofix">
          <AutofixSection />
        </TabsContent>
        <TabsContent value="rules">
          <RuleManagerSection />
        </TabsContent>
      </Tabs>
    </OverlayPanel>
  );
}
