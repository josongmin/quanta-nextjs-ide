import { toast } from 'sonner';
import { Button } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { KERNELS, type CodeLang } from '../helpers';

type KernelOpt = (typeof KERNELS)[number]['id'];

interface NotebookToolbarProps {
  kernel: KernelOpt;
  onKernelChange: (v: KernelOpt) => void;
  onAddCell: (kind: 'markdown' | 'code', lang?: CodeLang) => void;
}

export function NotebookToolbar({
  kernel,
  onKernelChange,
  onAddCell,
}: NotebookToolbarProps): JSX.Element {
  return (
    <PanelHeader>
      <span className="text-[11px] font-medium text-ink-1">
        funnel-q3.ipynb
      </span>
      <span className="h-4 w-px bg-line" aria-hidden />
      <SelectControl
        label="kernel"
        value={kernel}
        onChange={(v) => onKernelChange(v)}
        options={KERNELS.map((k) => ({ value: k.id, label: k.label }))}
      />
      <span className="h-4 w-px bg-line" aria-hidden />
      <Button
        size="xs"
        tone="default"
        onClick={() => toast('Run all cells (mock)')}
      >
        ▶▶ Run all
      </Button>
      <Button
        size="xs"
        tone="warn"
        onClick={() => toast('Restart kernel (mock)')}
      >
        ↻ Restart
      </Button>
      <span className="h-4 w-px bg-line" aria-hidden />
      <Button size="xs" tone="ghost" onClick={() => onAddCell('markdown')}>
        + Markdown
      </Button>
      <Button
        size="xs"
        tone="ghost"
        onClick={() => onAddCell('code', 'typescript')}
      >
        + Code (ts)
      </Button>
      <Button
        size="xs"
        tone="ghost"
        onClick={() => onAddCell('code', 'python')}
      >
        + Code (py)
      </Button>
      <Button size="xs" tone="ghost" onClick={() => onAddCell('code', 'sql')}>
        + Code (sql)
      </Button>
    </PanelHeader>
  );
}
