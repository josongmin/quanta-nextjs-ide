import { Chip, CodeBlock } from '@shared/ui';
import { GDPRK_SNIPPET, IAB_SNIPPET, TCF_SNIPPET } from '../helpers';

interface CmpSidebarProps {
  json: string;
}

export function CmpSidebar({ json }: CmpSidebarProps): JSX.Element {
  return (
    <aside className="w-[300px] shrink-0 hairline-l bg-bg-subtle/40">
      <div className="p-3">
        <div className="text-caps text-ink-3">Generated config</div>
        <div className="mt-1">
          <CodeBlock
            code={json}
            language="json"
            showLineNumbers={false}
            maxHeight={200}
          />
        </div>

        <h4 className="text-caps mt-3 text-ink-3">CMP integrations</h4>
        <div className="mt-1 space-y-2">
          <div>
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              TCF v2
            </div>
            <CodeBlock
              code={TCF_SNIPPET}
              language="ts"
              showLineNumbers={false}
              maxHeight={80}
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              IAB
            </div>
            <CodeBlock
              code={IAB_SNIPPET}
              language="ts"
              showLineNumbers={false}
              maxHeight={70}
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              GDPR-K
            </div>
            <CodeBlock
              code={GDPRK_SNIPPET}
              language="ts"
              showLineNumbers={false}
              maxHeight={80}
            />
          </div>
        </div>

        <h4 className="text-caps mt-3 text-ink-3">Legal phrasing</h4>
        <div className="mt-1 flex flex-wrap gap-1">
          <Chip tone="info" size="xs">
            GDPR-aligned
          </Chip>
          <Chip tone="info" size="xs">
            CCPA opt-out
          </Chip>
          <Chip tone="warn" size="xs">
            review &lt;13 messaging
          </Chip>
          <Chip tone="muted" size="xs">
            LGPD-ready
          </Chip>
        </div>
      </div>
    </aside>
  );
}
