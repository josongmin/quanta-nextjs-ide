import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  MODELS,
  TEMPLATES,
  estimateCostUsd,
  estimateTokens,
  modelById,
  renderPrompt,
  templateById,
  type ModelId,
  type VarType,
} from './helpers';

const TYPE_TONE: Record<VarType, 'accent' | 'info' | 'warn' | 'muted'> = {
  string: 'accent',
  number: 'info',
  enum: 'warn',
  json: 'muted',
  text: 'muted',
};

export function PromptTemplateLabOverlay() {
  const open = useUiStore((s) => s.overlays.promptTemplateLab.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [templateId, setTemplateId] = useState<string>('summarize');
  const template = templateById(templateId);

  const [exampleId, setExampleId] = useState<string>(
    template.examples[0]?.id ?? 'ex1',
  );
  const [system, setSystem] = useState<string>(template.system);
  const [user, setUser] = useState<string>(template.user);
  const [modelId, setModelId] = useState<ModelId>('sonnet');

  // when template changes, reset edited state
  const switchTemplate = (id: string) => {
    const t = templateById(id);
    setTemplateId(id);
    setSystem(t.system);
    setUser(t.user);
    setExampleId(t.examples[0]?.id ?? 'ex1');
  };

  const example =
    template.examples.find((e) => e.id === exampleId) ?? template.examples[0];

  const rendered = useMemo(() => {
    if (!example) return { sys: system, usr: user };
    return {
      sys: renderPrompt(system, example.values),
      usr: renderPrompt(user, example.values),
    };
  }, [system, user, example]);

  const tokens = useMemo(
    () => estimateTokens(rendered.sys) + estimateTokens(rendered.usr),
    [rendered],
  );

  const model = modelById(modelId);
  const cost = estimateCostUsd(model, tokens);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('promptTemplateLab')}
      title="Prompt Template Lab"
      subtitle={`${template.name} · ${template.variables.length} vars · ${template.examples.length} examples`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-end gap-1.5 text-xs">
          <Button size="xs" tone="default" onClick={() => toast('Template saved (mock)')}>
            Save
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Test ran (mock)')}>
            Run test
          </Button>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <span className="text-ink-3">template:</span>
            {TEMPLATES.map((t) => (
              <ToggleChip
                key={t.id}
                active={templateId === t.id}
                onClick={() => switchTemplate(t.id)}
              >
                {t.name}
              </ToggleChip>
            ))}
          </PanelHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="text-caps text-ink-3">Editor</div>
                  <label className="mt-2 block text-[10px] uppercase tracking-caps text-ink-3">
                    system
                  </label>
                  <textarea
                    value={system}
                    onChange={(e) => setSystem(e.target.value)}
                    rows={3}
                    spellCheck={false}
                    className="mt-1 w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 focus:outline-none focus:border-accent"
                  />
                  <label className="mt-2 block text-[10px] uppercase tracking-caps text-ink-3">
                    user
                  </label>
                  <textarea
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    rows={5}
                    spellCheck={false}
                    className="mt-1 w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 focus:outline-none focus:border-accent"
                  />

                  <h4 className="text-caps mt-3 text-ink-3">Variables</h4>
                  <ul className="mt-1 space-y-1">
                    {template.variables.map((v) => (
                      <li
                        key={v.name}
                        className="flex items-center gap-2 rounded-sm border border-line bg-bg-subtle/40 px-2 py-1 text-[11px]"
                      >
                        <span className="font-mono text-ink-1">
                          {`{{${v.name}}}`}
                        </span>
                        <Chip tone={TYPE_TONE[v.type]} size="xs">
                          {v.type}
                        </Chip>
                        <span className="ml-auto truncate font-mono text-[10px] text-ink-3">
                          default: {v.defaultValue}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-caps text-ink-3">Live preview</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-ink-3">example:</span>
                      {template.examples.map((e) => (
                        <ToggleChip
                          key={e.id}
                          active={exampleId === e.id}
                          onClick={() => setExampleId(e.id)}
                        >
                          {e.label}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] uppercase tracking-caps text-ink-3">
                    rendered system
                  </div>
                  <div className="mt-1">
                    <CodeBlock
                      code={rendered.sys}
                      language="text"
                      showLineNumbers={false}
                      maxHeight={80}
                    />
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-caps text-ink-3">
                    rendered user
                  </div>
                  <div className="mt-1">
                    <CodeBlock
                      code={rendered.usr}
                      language="text"
                      showLineNumbers={false}
                      maxHeight={140}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-sm border border-line bg-bg p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caps text-ink-3">Model</span>
                  {MODELS.map((m) => (
                    <ToggleChip
                      key={m.id}
                      active={modelId === m.id}
                      onClick={() => setModelId(m.id)}
                    >
                      {m.label}
                    </ToggleChip>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-2 text-[11px]">
                    <Chip tone="info" size="xs">
                      ~{tokens} tok
                    </Chip>
                    <Chip tone="accent" size="xs">
                      ${cost.toFixed(4)}
                    </Chip>
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <aside className="w-[300px] shrink-0 hairline-l bg-bg-subtle/40">
          <div className="p-3">
            <div className="text-caps text-ink-3">Version history</div>
            <ul className="mt-2 space-y-1">
              {template.versions.map((v) => (
                <li
                  key={v.id}
                  className="rounded-sm border border-line bg-bg px-2 py-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-ink-1">{v.label}</span>
                    <button
                      type="button"
                      className="text-[10px] text-ink-3 hover:text-ink-1"
                      onClick={() => toast(`Diff against ${v.label} (mock)`)}
                    >
                      diff
                    </button>
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-ink-3">
                    {v.when}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-2">{v.note}</div>
                </li>
              ))}
            </ul>

            <h4 className="text-caps mt-3 text-ink-3">Description</h4>
            <p className="mt-1 text-[11px] text-ink-2">{template.description}</p>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
