import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  aspectFit,
  deviceCss,
  devices,
  viewportChecks,
  type DeviceFrame,
  type DeviceId,
} from './helpers';

type Orientation = 'portrait' | 'landscape';

export function DeviceFramePreviewOverlay() {
  const open = useUiStore((s) => s.overlays.deviceFramePreview.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [deviceId, setDeviceId] = useState<DeviceId>('iphone-15-pro');
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  const device = useMemo(
    () => devices.find((d) => d.id === deviceId) ?? devices[0]!,
    [deviceId],
  );

  const oriented: DeviceFrame =
    orientation === 'landscape'
      ? {
          ...device,
          width: device.height,
          height: device.width,
          safeTop: device.safeLeft,
          safeBottom: device.safeRight,
          safeLeft: device.safeTop,
          safeRight: device.safeBottom,
        }
      : device;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('deviceFramePreview'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Box className="h-4 w-4 text-ink-3" />
          <span>Device Frame Preview</span>
        </span>
      }
      subtitle="safe areas · viewport meta auditor"
      size="xl"
      footer={
        <Button
          size="sm"
          tone="ghost"
          onClick={() => close('deviceFramePreview')}
        >
          Close
        </Button>
      }
    >
      <div className="grid grid-cols-[1fr_260px] divide-x divide-line">
        <div className="min-w-0 px-3 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SelectControl<DeviceId>
              label="device"
              value={deviceId}
              onChange={(v) => setDeviceId(v)}
              options={devices.map((d) => ({ value: d.id, label: d.label }))}
            />
            <div className="flex items-center gap-1">
              <ToggleChip
                active={orientation === 'portrait'}
                onClick={() => setOrientation('portrait')}
              >
                Portrait
              </ToggleChip>
              <ToggleChip
                active={orientation === 'landscape'}
                onClick={() => setOrientation('landscape')}
              >
                Landscape
              </ToggleChip>
            </div>
            <span className="ml-auto text-[11px] text-ink-3">
              {oriented.width}×{oriented.height} · {device.dpr}x · safe{' '}
              {oriented.safeTop}/{oriented.safeRight}/{oriented.safeBottom}/
              {oriented.safeLeft}
            </span>
          </div>

          <div className="flex items-center justify-center rounded-sm border border-line bg-bg-subtle/40 p-4">
            <DeviceSvg device={oriented} />
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-caps text-ink-3">
              Viewport meta auditor
            </h3>
            <ul className="space-y-1.5">
              {viewportChecks.map((c) => (
                <li
                  key={c.id}
                  className="rounded-sm border border-line bg-bg px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink-1">
                          {c.label}
                        </span>
                        <Chip
                          tone={
                            c.status === 'pass'
                              ? 'static'
                              : c.status === 'warn'
                                ? 'warn'
                                : 'err'
                          }
                          size="xs"
                        >
                          {c.status}
                        </Chip>
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-3">
                        {c.description}
                      </div>
                    </div>
                    <Button
                      size="xs"
                      tone="ghost"
                      onClick={() =>
                        toast('Snippet copied', { description: c.recommended })
                      }
                    >
                      Copy fix
                    </Button>
                  </div>
                  {c.status !== 'pass' ? (
                    <div className="mt-2">
                      <CodeBlock
                        code={c.recommended}
                        language="html"
                        showLineNumbers={false}
                        maxHeight={80}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="min-w-0 px-3 py-3">
          <h3 className="mb-1 text-caps text-ink-3">Device facts</h3>
          <dl className="space-y-1 text-[11px]">
            <Fact k="category" v={device.category} />
            <Fact k="logical" v={`${oriented.width}×${oriented.height}`} />
            <Fact
              k="physical"
              v={`${Math.round(oriented.width * device.dpr)}×${Math.round(oriented.height * device.dpr)}`}
            />
            <Fact k="dpr" v={`${device.dpr}x`} />
            <Fact k="notch" v={device.notch ? 'yes' : 'no'} />
          </dl>
          <div className="mt-3 hairline-t pt-2">
            <h3 className="mb-1 text-caps text-ink-3">CSS env()</h3>
            <CodeBlock
              code={deviceCss(oriented)}
              language="css"
              showLineNumbers={false}
              maxHeight={200}
            />
          </div>
          <div className="mt-3 hairline-t pt-2">
            <h3 className="mb-1 text-caps text-ink-3">Breakpoints</h3>
            <ul className="space-y-1 text-[11px]">
              <li className="text-ink-2">
                <span className="font-mono">sm</span>{' '}
                <span className="text-ink-3">≥ 640</span>
              </li>
              <li className="text-ink-2">
                <span className="font-mono">md</span>{' '}
                <span className="text-ink-3">≥ 768</span>
              </li>
              <li className="text-ink-2">
                <span className="font-mono">lg</span>{' '}
                <span className="text-ink-3">≥ 1024</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-ink-3">{k}</dt>
      <dd className="font-mono text-ink-1">{v}</dd>
    </div>
  );
}

function DeviceSvg({ device }: { device: DeviceFrame }) {
  const fit = aspectFit(device, 460);
  const sx = fit.w / device.width;
  const sy = fit.h / device.height;
  const innerX = device.safeLeft * sx;
  const innerY = device.safeTop * sy;
  const innerW = (device.width - device.safeLeft - device.safeRight) * sx;
  const innerH = (device.height - device.safeTop - device.safeBottom) * sy;

  const bezel = 12;
  const totalW = fit.w + bezel * 2;
  const totalH = fit.h + bezel * 2;

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      role="img"
      aria-label={`${device.label} frame`}
    >
      <rect
        x={0}
        y={0}
        width={totalW}
        height={totalH}
        rx={28}
        className="fill-ink-1"
      />
      <rect
        x={bezel}
        y={bezel}
        width={fit.w}
        height={fit.h}
        rx={16}
        className="fill-white"
      />
      {device.notch && device.safeTop > 0 ? (
        <rect
          x={bezel + fit.w / 2 - 40}
          y={bezel}
          width={80}
          height={Math.max(8, device.safeTop * sy * 0.5)}
          rx={6}
          className="fill-ink-1"
        />
      ) : null}
      <g transform={`translate(${bezel + innerX}, ${bezel + innerY})`}>
        <rect
          x={4}
          y={4}
          width={Math.max(0, innerW - 8)}
          height={26}
          rx={4}
          className="fill-bg-subtle"
        />
        <rect
          x={4}
          y={36}
          width={Math.max(0, innerW * 0.6)}
          height={10}
          rx={2}
          className="fill-line"
        />
        <rect
          x={4}
          y={52}
          width={Math.max(0, innerW * 0.4)}
          height={10}
          rx={2}
          className="fill-line"
        />
        <rect
          x={4}
          y={72}
          width={Math.max(0, innerW - 8)}
          height={Math.max(20, innerH * 0.4)}
          rx={4}
          className="fill-accent-soft"
        />
      </g>
      <rect
        x={bezel + innerX}
        y={bezel + innerY}
        width={innerW}
        height={innerH}
        fill="none"
        stroke="#dc2626"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <text
        x={bezel + innerX + 4}
        y={bezel + innerY + 11}
        fontSize={9}
        fontFamily="ui-monospace"
        fill="#dc2626"
      >
        safe-area
      </text>
    </svg>
  );
}
