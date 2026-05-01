function renderInline(line: string): React.ReactNode {
  // Handle backtick code spans and **bold** / *italic*.
  const parts: React.ReactNode[] = [];
  let buf = '';
  let i = 0;
  let key = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '`') {
      const end = line.indexOf('`', i + 1);
      if (end > i) {
        if (buf) {
          parts.push(buf);
          buf = '';
        }
        parts.push(
          <code
            key={key++}
            className="rounded-sm bg-bg-subtle px-1 font-mono text-[11px] text-ink-1"
          >
            {line.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }
    if (ch === '*' && line[i + 1] === '*') {
      const end = line.indexOf('**', i + 2);
      if (end > i) {
        if (buf) {
          parts.push(buf);
          buf = '';
        }
        parts.push(
          <strong key={key++} className="font-semibold text-ink-1">
            {line.slice(i + 2, end)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }
    buf += ch ?? '';
    i++;
  }
  if (buf) parts.push(buf);
  return <>{parts}</>;
}

export function MarkdownView({ source }: { source: string }) {
  // Tiny mock renderer: split lines, naive heading detection.
  const lines = source.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.startsWith('### ')) {
      nodes.push(
        <h4
          key={key++}
          className="mt-3 text-sm font-semibold text-ink-1"
        >
          {line.slice(4)}
        </h4>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h3
          key={key++}
          className="mt-4 text-md font-semibold text-ink-1"
        >
          {line.slice(3)}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h2
          key={key++}
          className="mt-2 text-lg font-semibold text-ink-1"
        >
          {line.slice(2)}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith('> ')) {
      nodes.push(
        <blockquote
          key={key++}
          className="my-1 border-l-2 border-line pl-2 text-ink-2 italic"
        >
          {line.slice(2)}
        </blockquote>,
      );
      i++;
      continue;
    }
    if (/^\d+\.\s/.test(line) || line.startsWith('- ')) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (/^\d+\.\s/.test(lines[i] ?? '') || (lines[i] ?? '').startsWith('- '))
      ) {
        items.push((lines[i] ?? '').replace(/^(\d+\.\s|- )/, ''));
        i++;
      }
      nodes.push(
        <ul
          key={key++}
          className="my-1 list-disc pl-5 text-sm text-ink-2"
        >
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (line.trim() === '') {
      i++;
      continue;
    }
    nodes.push(
      <p key={key++} className="text-sm leading-5 text-ink-1">
        {renderInline(line)}
      </p>,
    );
    i++;
  }
  return <div className="space-y-1">{nodes}</div>;
}
