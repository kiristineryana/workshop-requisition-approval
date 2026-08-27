export function Pill({
  label,
  bg,
  fg,
  outline,
}: {
  label: string;
  bg: string;
  fg: string;
  outline?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
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
      {label}
    </span>
  );
}
