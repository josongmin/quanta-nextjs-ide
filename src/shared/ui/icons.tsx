import { cn } from '@shared/lib/cn';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Box,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  Cog,
  Database,
  FileCode,
  FileText,
  Filter,
  Folder,
  GitBranch,
  Globe,
  Hash,
  Hexagon,
  Info,
  Layers,
  Lightbulb,
  Link2,
  Lock,
  Network,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Tag,
  Terminal,
  TriangleAlert,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const Icon = {
  Alert: AlertTriangle,
  TriAlert: TriangleAlert,
  Down: ArrowDown,
  Up: ArrowUp,
  Right: ArrowRight,
  UpRight: ArrowUpRight,
  Box,
  ChevDown: ChevronDown,
  ChevRight: ChevronRight,
  Circle,
  Code: Code2,
  Cog,
  Database,
  File: FileCode,
  Doc: FileText,
  Filter,
  Folder,
  Branch: GitBranch,
  Globe,
  Hash,
  Hex: Hexagon,
  Info,
  Layers,
  Bulb: Lightbulb,
  Link: Link2,
  Lock,
  Net: Network,
  Pin,
  Plus,
  Refresh: RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Tag,
  Terminal,
  X,
  XCircle,
  Zap,
} satisfies Record<string, LucideIcon>;

interface IconBoxProps {
  letter: string;
  className?: string;
  tone?:
    | 'neutral'
    | 'static'
    | 'isr'
    | 'dynamic'
    | 'edge'
    | 'client'
    | 'server';
}

const toneCls = {
  neutral: 'border-line text-ink-2',
  static: 'border-sem-static/40 text-sem-static',
  isr: 'border-sem-isr/40 text-sem-isr',
  dynamic: 'border-sem-dynamic/40 text-sem-dynamic',
  edge: 'border-sem-edge/40 text-sem-edge',
  client: 'border-sem-client/40 text-sem-client',
  server: 'border-sem-server/40 text-sem-server',
};

export function IconBox({ letter, tone = 'neutral', className }: IconBoxProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded-sm border bg-white text-[10px] font-bold leading-none',
        toneCls[tone],
        className,
      )}
    >
      {letter}
    </span>
  );
}
