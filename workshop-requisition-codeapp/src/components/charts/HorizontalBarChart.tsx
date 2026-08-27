import { SURFACE_MUTED, TEXT_PRIMARY, TEXT_MUTED } from '../../theme';

export type HorizontalBarDatum = { label: string; value: number; color: string };

/**
 * Simple labeled horizontal bar list — used for "Requisitions by status".
 * Plain divs, no charting library, so every pixel matches the wireframe.
 */
export function HorizontalBarChart({ data }: { data: HorizontalBarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 32px', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: TEXT_PRIMARY, textAlign: 'right' }}>{d.label}</span>
          <div style={{ position: 'relative', height: 22, borderRadius: 5, background: SURFACE_MUTED, overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${(d.value / max) * 100}%`,
                background: d.color,
                borderRadius: 5,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: TEXT_MUTED, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}
