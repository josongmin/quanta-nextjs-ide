import { useEffect, useRef, useState } from 'react';
import {
  chunkContent,
  type FileStatus,
  type RouteIntent,
  type StreamState,
} from '../helpers';

interface UseScaffoldStreamArgs {
  intent: RouteIntent;
  open: boolean;
  onActiveTabChange(name: string): void;
}

export function useScaffoldStream({
  intent,
  open,
  onActiveTabChange,
}: UseScaffoldStreamArgs) {
  const [stream, setStream] = useState<StreamState>({
    byFile: {},
    status: {},
    activeFile: null,
  });
  const [streaming, setStreaming] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const stopStream = (): void => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreaming(false);
  };

  const startStream = (): void => {
    stopStream();
    const initialStatus: Record<string, FileStatus> = {};
    const initialContent: Record<string, string> = {};
    for (const f of intent.files) {
      initialStatus[f.name] = 'pending';
      initialContent[f.name] = '';
    }
    setStream({
      byFile: initialContent,
      status: initialStatus,
      activeFile: intent.files[0]?.name ?? null,
    });
    onActiveTabChange(intent.files[0]?.name ?? '');
    setStreaming(true);

    let fileIdx = 0;
    let chunks: string[] = chunkContent(intent.files[0]?.content ?? '');
    let chunkIdx = 0;
    const file0 = intent.files[0]?.name;
    if (file0) {
      setStream((prev) => ({
        ...prev,
        status: { ...prev.status, [file0]: 'streaming' },
        activeFile: file0,
      }));
    }

    intervalRef.current = window.setInterval(() => {
      const file = intent.files[fileIdx];
      if (!file) {
        stopStream();
        return;
      }
      const chunk = chunks[chunkIdx];
      if (chunk === undefined) {
        setStream((prev) => ({
          ...prev,
          status: { ...prev.status, [file.name]: 'done' },
        }));
        fileIdx += 1;
        const next = intent.files[fileIdx];
        if (!next) {
          stopStream();
          return;
        }
        chunks = chunkContent(next.content);
        chunkIdx = 0;
        setStream((prev) => ({
          ...prev,
          status: { ...prev.status, [next.name]: 'streaming' },
          activeFile: next.name,
        }));
        onActiveTabChange(next.name);
        return;
      }
      setStream((prev) => ({
        ...prev,
        byFile: {
          ...prev.byFile,
          [file.name]: (prev.byFile[file.name] ?? '') + chunk,
        },
      }));
      chunkIdx += 1;
    }, 35);
  };

  useEffect(() => {
    if (!open) {
      stopStream();
      setStream({ byFile: {}, status: {}, activeFile: null });
    }
  }, [open]);

  useEffect(() => stopStream, []);

  return { stream, streaming, startStream };
}
