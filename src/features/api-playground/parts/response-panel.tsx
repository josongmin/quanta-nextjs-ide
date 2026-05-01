import {
  Chip,
  CodeBlock,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import {
  buildCurl,
  zodSchema,
  type ApiEndpointDef,
  type ApiResponseSnapshot,
} from '../helpers';
import { statusTone } from './helpers';

interface ResponsePanelProps {
  endpoint: ApiEndpointDef;
  response: ApiResponseSnapshot;
  headers: ReadonlyArray<{ k: string; v: string }>;
  authOn: boolean;
  paramValues: Record<string, string>;
}

export function ResponsePanel({
  endpoint,
  response,
  headers,
  authOn,
  paramValues,
}: ResponsePanelProps) {
  const tone = statusTone(response.status);
  const curl = buildCurl(endpoint, paramValues, headers, authOn ? 'mock-token-xyz' : null);
  const schema = `import { z } from 'zod';\n\n${zodSchema(endpoint)}`;

  return (
    <div className="rounded-sm border border-line bg-bg">
      <div className="flex items-center gap-2 border-b border-line px-3 py-1.5">
        <Chip tone={tone === 'static' ? 'static' : tone} size="xs">
          {response.status}
        </Chip>
        <Chip tone="muted" size="xs">
          {response.ms}ms
        </Chip>
        <span className="ml-auto font-mono text-[10px] text-ink-3">{response.at}</span>
      </div>
      <Tabs defaultValue="body">
        <TabsList className="h-8 px-1">
          <TabsTrigger value="body" className="h-8 px-2 text-xs">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="h-8 px-2 text-xs">
            Headers
          </TabsTrigger>
          <TabsTrigger value="schema" className="h-8 px-2 text-xs">
            Schema (zod)
          </TabsTrigger>
          <TabsTrigger value="curl" className="h-8 px-2 text-xs">
            cURL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="body" className="p-2">
          <CodeBlock code={response.body || '(empty)'} language="json" maxHeight={220} />
        </TabsContent>
        <TabsContent value="headers" className="p-2">
          <CodeBlock
            code={[
              ...headers.filter((h) => h.k).map((h) => `${h.k}: ${h.v}`),
              authOn ? 'Authorization: Bearer mock-token-xyz' : '',
            ]
              .filter(Boolean)
              .join('\n')}
            language="http"
            maxHeight={220}
          />
        </TabsContent>
        <TabsContent value="schema" className="p-2">
          <CodeBlock code={schema} language="ts" maxHeight={220} />
        </TabsContent>
        <TabsContent value="curl" className="p-2">
          <CodeBlock code={curl} language="bash" maxHeight={220} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
