import type { ReactNode } from 'react';
import { BRAND_NAVY, BRAND_RED, SURFACE_MUTED, TEXT_MUTED, WHITE, BORDER } from '../theme';

export function KpiCard({
  icon,
  label,
  value,
  accentBg,
  danger,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accentBg: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        borderRadius: 10,
        background: danger ? '#FFF4F5' : SURFACE_MUTED,
        border: `1px solid ${danger ? BRAND_RED : BORDER}`,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: accentBg,
          color: WHITE,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: danger ? BRAND_RED : BRAND_NAVY,
            overflowWrap: 'break-word',
            lineHeight: 1.2,
          }}
          title={value}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: danger ? BRAND_RED : TEXT_MUTED,
            marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
