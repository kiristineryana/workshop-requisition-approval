import { TEXT_PRIMARY, TEXT_MUTED } from '../../theme';

export type VerticalBarDatum = { label: string; value: number; color: string; caption?: string; valueLabel?: string };

/**
 * Simple vertical bar chart with a value label above each bar and an optional
 * caption below (used for "Spend by value tier" and "Requisitions by month").
 */
export function VerticalBarChart({ data, height = 160 }: { data: VerticalBarDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: height + 48, padding: '8px 4px 0' }}>
      {data.map((d) => {
        const barHeight = d.value > 0 ? Math.max(4, (d.value / max) * height) : 2;
        return (
          <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6, whiteSpace: 'nowrap' }}>
              {d.valueLabel ?? String(d.value)}
            </span>
            <div
              style={{
                width: '60%',
                minWidth: 24,
                height: barHeight,
                background: d.color,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease',
              }}
            />
            <span style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 8, textAlign: 'center' }}>{d.label}</span>
            {d.caption && (
              <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2, textAlign: 'center' }}>{d.caption}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
