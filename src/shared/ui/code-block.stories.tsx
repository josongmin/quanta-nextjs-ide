import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from './code-block';

const SAMPLE_TS = `import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const res = await fetch(\`/api/users/\${id}\`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to load user');
  return res.json();
});`;

const SAMPLE_BEFORE = `'use client';

export function Greeting({ name }: { name: string }) {
  return <h1>Hello {name}</h1>;
}`;

const SAMPLE_AFTER = `export function Greeting({ name }: { name: string }) {
  return <h1>Hello {name}</h1>;
}`;

const meta = {
  title: 'Shared/Primitives/CodeBlock',
  component: CodeBlock,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    language: { control: 'text' },
    showLineNumbers: { control: 'boolean' },
    diff: { control: 'select', options: [undefined, 'before', 'after'] },
    maxHeight: { control: { type: 'number', min: 80, max: 720, step: 20 } },
  },
  args: {
    code: SAMPLE_TS,
    language: 'tsx',
    showLineNumbers: true,
    maxHeight: 240,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoLineNumbers: Story = {
  args: { showLineNumbers: false },
};

export const NoLanguageBadge: Story = {
  args: { language: undefined },
};

export const DiffPair: Story = {
  render: () => (
    <div className="flex flex-col gap-3" style={{ width: 560 }}>
      <CodeBlock
        code={SAMPLE_BEFORE}
        language="tsx"
        diff="before"
        maxHeight={160}
      />
      <CodeBlock
        code={SAMPLE_AFTER}
        language="tsx"
        diff="after"
        maxHeight={160}
      />
    </div>
  ),
};
