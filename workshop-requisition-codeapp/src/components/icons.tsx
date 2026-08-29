type IconProps = { size?: number; color?: string; strokeWidth?: number };

const base = (size: number, strokeWidth: number, color: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function RequisitionIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function SupplierIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M4 20V8l8-4 8 4v12" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function ApprovalHistoryIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function DashboardIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </svg>
  );
}

export function RefreshIcon({ size = 16, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3" />
      <path d="M18 4v5h-5M6 20v-5h5" />
    </svg>
  );
}

export function ShieldWarningIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M12 8v5M12 16.5h.01" />
    </svg>
  );
}

export function WalletIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M15 14h3" />
    </svg>
  );
}

export function ClockPendingIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

export function DismissCircleIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

export function MoneyIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v.01M18 15v.01" />
    </svg>
  );
}

export function ClipboardIcon({ size = 20, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function PlusIcon({ size = 16, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon({ size = 16, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M18 7l-.8 12a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 18, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M12 4 2.5 20.5h19z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

export function SearchIcon({ size = 16, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

// ---- Stage-tracker icons — exact glyphs from wireframe 1a's process-flow diagram ----

export function StageDraftIcon({ size = 12, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M9 3h6v3H9z" />
      <path d="M15 4.5h2a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5h2" />
      <path d="M12 11v5M9.5 13.5h5" />
    </svg>
  );
}

export function StageSubmittedIcon({ size = 12, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M20.5 3.5 11 13" />
      <path d="M20.5 3.5 14.5 20.5 11 13 3.5 9.5z" />
    </svg>
  );
}

export function StageInApprovalIcon({ size = 12, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M12 3.5 3.5 12 12 20.5 20.5 12z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function StageApprovedIcon({ size = 12, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </svg>
  );
}

export function StageOrderedIcon({ size = 12, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M3 4h2.5l2.2 10.5h9.6L19 7H7" />
      <circle cx="9.5" cy="19" r="1.6" />
      <circle cx="16.5" cy="19" r="1.6" />
    </svg>
  );
}

export function StageReceivedIcon({ size = 12, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M20.5 8.5v7L12 20.5 3.5 15.5v-7L12 3.5z" />
      <path d="m3.8 8.3 8.2 4.4 8.2-4.4M12 12.7v7.8" />
      <path d="m9 15.5 1.8 1.8 3.4-3.6" />
    </svg>
  );
}

export function StageRejectedIcon({ size = 12, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

// ---- Line-item category icons — Part / Tool / Sublet / Consumable / Other ----

export function CategoryPartIcon({ size = 12, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M14.7 6.3a3 3 0 0 0-4.2 3.6L4 16.4V20h3.6l6.5-6.5a3 3 0 0 0 3.6-4.2l-2.1 2.1-2-2z" />
    </svg>
  );
}

export function CategoryToolIcon({ size = 12, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M20.5 5.5a4 4 0 0 1-5.4 5.4L6.5 19.5a1.7 1.7 0 0 1-2.4-2.4l8.6-8.6A4 4 0 0 1 18.1 3l-2.6 2.6 1.9 1.9z" />
    </svg>
  );
}

export function CategorySubletIcon({ size = 12, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M3 12h4l2.5-3 4 6L16 12h5" />
      <path d="M17.5 8.5 21 12l-3.5 3.5" />
    </svg>
  );
}

export function CategoryConsumableIcon({ size = 12, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M12 3.5c2.8 3.6 5 6.9 5 9.5a5 5 0 0 1-10 0c0-2.6 2.2-5.9 5-9.5z" />
    </svg>
  );
}

export function CategoryOtherIcon({ size = 12, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, color)}>
      <path d="M11.3 3.5h5.2a2 2 0 0 1 2 2v5.2a2 2 0 0 1-.6 1.4l-7.6 7.6a2 2 0 0 1-2.8 0l-4.6-4.6a2 2 0 0 1 0-2.8l7.6-7.6a2 2 0 0 1 1.4-.6z" />
      <circle cx="15" cy="8" r="1.3" />
    </svg>
  );
}
