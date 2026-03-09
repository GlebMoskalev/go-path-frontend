interface ProgressBarProps {
  value: number; // 0-100
  total?: number;
  completed?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ value, total, completed, color = '#00ADD8', height = 4, showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {showLabel && total !== undefined && completed !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>{completed} / {total}</span>
          <span style={{ fontSize: '12px', color: color, fontWeight: 600 }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          background: '#1A2035',
          borderRadius: `${height}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: `${height}px`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}
