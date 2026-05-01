import {
  Chip,
  CodeBlock,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { statusTone, type HistoryEntry } from '../helpers';

type ResponseTab = 'body' | 'headers' | 'raw';

interface ResponsePanelProps {
  lastResponse: HistoryEntry | undefined;
  responseTab: ResponseTab;
  onChangeTab: (v: ResponseTab) => void;
}

export function ResponsePanel({
  lastResponse,
  responseTab,
  onChangeTab,
}: ResponsePanelProps): JSX.Element {
  return (
    <div className="p-3">
      <div className="mb-2 flex items-center gap-2 text-xs">
        {lastResponse ? (
          <>
            <Chip tone={statusTone(lastResponse.status)} size="sm">
              {lastResponse.status}
            </Chip>
            <span className="font-mono text-ink-1">{lastResponse.ms}ms</span>
            <span className="text-ink-3">·</span>
            <span className="font-mono text-ink-3">{lastResponse.size}</span>
          </>
        ) : (
          <span className="text-ink-3">No response yet</span>
        )}
      </div>
      <Tabs
        value={responseTab}
        onValueChange={(v) => onChangeTab(v as ResponseTab)}
      >
        <TabsList className="!h-7">
          <TabsTrigger value="body" className="!h-7">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="!h-7">
            Headers
          </TabsTrigger>
          <TabsTrigger value="raw" className="!h-7">
            Raw
          </TabsTrigger>
        </TabsList>
        <TabsContent value="body" className="pt-2">
          <CodeBlock
            code={lastResponse?.body || '(empty)'}
            language="json"
            maxHeight={140}
          />
        </TabsContent>
        <TabsContent value="headers" className="pt-2">
          <CodeBlock
            code={[
              'content-type: application/json',
              'x-request-id: r_' + (lastResponse?.id ?? '000'),
              `x-response-time: ${lastResponse?.ms ?? 0}ms`,
            ].join('\n')}
            language="http"
            maxHeight={140}
          />
        </TabsContent>
        <TabsContent value="raw" className="pt-2">
          <CodeBlock
            code={[
              `HTTP/1.1 ${lastResponse?.status ?? 0} OK`,
              'content-type: application/json',
              '',
              lastResponse?.body ?? '',
            ].join('\n')}
            language="http"
            maxHeight={140}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
