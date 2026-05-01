import { useUiStore } from '@entities/ui-shell';
import { TopBar } from '@widgets/top-bar';
import { LeftPanel } from '@widgets/left-panel';
import { RightPanel } from '@widgets/right-panel';
import { BottomPanel } from '@widgets/bottom-panel';
import { StatusBar } from '@widgets/status-bar';
import { EditorArea } from '@widgets/editor';
import { OverlaysHost } from '@widgets/overlays';
import { ResizeHandle } from '@widgets/resize-handle';

export function StudioPage() {
  const {
    leftPanelOpen,
    rightPanelOpen,
    bottomPanelOpen,
    leftPanelWidth,
    rightPanelWidth,
    bottomPanelHeight,
    setLeftWidth,
    setRightWidth,
    setBottomHeight,
    toggleLeft,
    toggleRight,
    toggleBottom,
    focusMode,
  } = useUiStore();

  // In focus mode we collapse all chrome panels with a smooth transition. We
  // don't mutate the underlying open flags so exiting focus restores the
  // user's prior layout exactly.
  const showLeft = leftPanelOpen && !focusMode;
  const showRight = rightPanelOpen && !focusMode;
  const showBottom = bottomPanelOpen && !focusMode;

  return (
    <div
      className="grid h-screen w-screen grid-rows-[auto_1fr_auto] bg-bg text-ink-1"
      data-focus={focusMode || undefined}
    >
      <TopBar />

      <div className="grid min-h-0 grid-cols-[auto_auto_1fr_auto_auto]">
        <div
          className="min-h-0 overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: showLeft ? leftPanelWidth : 0 }}
        >
          {showLeft ? <LeftPanel /> : null}
        </div>
        {showLeft ? (
          <ResizeHandle
            orientation="vertical"
            onResize={(d) => setLeftWidth(leftPanelWidth + d)}
            onDoubleClick={toggleLeft}
            ariaLabel="Resize left panel"
          />
        ) : (
          <div />
        )}

        <div className="flex min-h-0 flex-col">
          <div className="flex-1 min-h-0">
            <EditorArea />
          </div>
          {showBottom ? (
            <ResizeHandle
              orientation="horizontal"
              onResize={(d) => setBottomHeight(bottomPanelHeight - d)}
              onDoubleClick={toggleBottom}
              ariaLabel="Resize bottom panel"
            />
          ) : null}
          <div
            className="min-h-0 overflow-hidden transition-[height] duration-200 ease-out"
            style={{ height: showBottom ? bottomPanelHeight : 0 }}
          >
            {showBottom ? <BottomPanel /> : null}
          </div>
        </div>

        {showRight ? (
          <ResizeHandle
            orientation="vertical"
            onResize={(d) => setRightWidth(rightPanelWidth - d)}
            onDoubleClick={toggleRight}
            ariaLabel="Resize right panel"
          />
        ) : (
          <div />
        )}
        <div
          className="min-h-0 overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: showRight ? rightPanelWidth : 0 }}
        >
          {showRight ? <RightPanel /> : null}
        </div>
      </div>

      <StatusBar />
      <OverlaysHost />
    </div>
  );
}
