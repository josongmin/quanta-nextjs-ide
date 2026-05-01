import { SEVERITY_FILL, SEVERITY_STROKE } from '../helpers';

export function MatrixLegend() {
  return (
    <div className="mt-3 flex items-center gap-3 text-[10px] text-ink-3">
      <span className="flex items-center gap-1">
        <span
          className="inline-block h-2 w-3 rounded-sm border"
          style={{
            backgroundColor: SEVERITY_FILL.soft,
            borderColor: SEVERITY_STROKE.soft,
          }}
        />
        soft
      </span>
      <span className="flex items-center gap-1">
        <span
          className="inline-block h-2 w-3 rounded-sm border"
          style={{
            backgroundColor: SEVERITY_FILL.medium,
            borderColor: SEVERITY_STROKE.medium,
          }}
        />
        medium
      </span>
      <span className="flex items-center gap-1">
        <span
          className="inline-block h-2 w-3 rounded-sm border"
          style={{
            backgroundColor: SEVERITY_FILL.hard,
            borderColor: SEVERITY_STROKE.hard,
          }}
        />
        hard
      </span>
    </div>
  );
}
