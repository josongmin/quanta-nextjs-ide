import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import {
  INTENTS,
  intentById,
  type CacheMode,
  type IntentId,
  type Locale,
  type Runtime,
} from './helpers';
import { useScaffoldStream } from './model/useScaffoldStream';
import { FileTabs } from './parts/FileTabs';
import { FileTree } from './parts/FileTree';
import { OptionsRail } from './parts/OptionsRail';
import { PromptBar } from './parts/PromptBar';

export function AiRouteScaffoldOverlay() {
  const open = useUiStore((s) => s.overlays.aiRouteScaffold.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [intentId, setIntentId] = useState<IntentId>(INTENTS[0]!.id);
  const [prompt, setPrompt] = useState<string>(INTENTS[0]!.prompt);
  const [runtime, setRuntime] = useState<Runtime>('node');
  const [cache, setCache] = useState<CacheMode>('revalidate-60');
  const [auth, setAuth] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const [activeTab, setActiveTab] = useState<string>('');

  const intent = useMemo(() => intentById(intentId), [intentId]);

  const { stream, streaming, startStream } = useScaffoldStream({
    intent,
    open,
    onActiveTabChange: setActiveTab,
  });

  useEffect(() => {
    setPrompt(intent.prompt);
  }, [intent]);

  const generate = (): void => {
    startStream();
    toast(`Generating ${intent.files.length} files for ${intent.label}`);
  };

  const fileTotal = intent.files.length;
  const fileDone = Object.values(stream.status).filter((s) => s === 'done').length;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('aiRouteScaffold')}
      title="Scaffold a Next.js route"
      subtitle={`${intent.basePath} · ${fileDone}/${fileTotal} files`}
      size="xl"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Opened route flow editor (mock)')}
          >
            Open route flow editor
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Saved as template')}>
            Save as template
          </Button>
          <Button
            size="xs"
            disabled={fileDone < fileTotal}
            onClick={() => {
              toast('Inserted into project (mock)');
              close('aiRouteScaffold');
            }}
          >
            Insert into project
          </Button>
        </>
      }
    >
      <PromptBar
        prompt={prompt}
        onPromptChange={setPrompt}
        intentId={intentId}
        onIntentChange={setIntentId}
        streaming={streaming}
        onGenerate={generate}
      />

      <div className="grid grid-cols-[260px_1fr_300px] gap-0">
        <FileTree
          intent={intent}
          status={stream.status}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
        />
        <div className="p-3">
          <FileTabs
            intent={intent}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            byFile={stream.byFile}
            status={stream.status}
          />
        </div>
        <OptionsRail
          runtime={runtime}
          onRuntimeChange={setRuntime}
          cache={cache}
          onCacheChange={setCache}
          auth={auth}
          onAuthToggle={() => setAuth((v) => !v)}
          locale={locale}
          onLocaleChange={setLocale}
        />
      </div>
    </OverlayPanel>
  );
}
