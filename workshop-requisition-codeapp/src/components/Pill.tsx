export function Pill({
  label,
  bg,
  fg,
  outline,
  icon,
}: {
  label: string;
  bg: string;
  fg: string;
  outline?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: icon ? 5 : 0,
        padding: '2px 10px',
        borderRadius: 999,
        background: bg,
        color: fg,
        border: outline ? `1px solid ${fg}` : 'none',
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        lineHeight: '18px',
      }}
    >
      {icon}
      {label}
    </span>
  );
}
