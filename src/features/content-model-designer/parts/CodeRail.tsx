import {
  CodeBlock,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';

interface CodeRailProps {
  zodCode: string;
  gqlCode: string;
}

export function CodeRail({ zodCode, gqlCode }: CodeRailProps) {
  return (
    <ScrollArea className="h-[560px]">
      <div className="p-3">
        <Tabs defaultValue="zod">
          <TabsList className="!h-7 !bg-transparent">
            <TabsTrigger value="zod" className="!h-7">
              zod
            </TabsTrigger>
            <TabsTrigger value="gql" className="!h-7">
              graphql
            </TabsTrigger>
          </TabsList>
          <TabsContent value="zod" className="mt-2">
            <CodeBlock code={zodCode} language="ts" maxHeight={460} />
          </TabsContent>
          <TabsContent value="gql" className="mt-2">
            <CodeBlock code={gqlCode} language="graphql" maxHeight={460} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
