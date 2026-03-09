import { motion } from 'motion/react';

interface ProgressBarProps {
  value: number;
  total?: number;
  completed?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ value, total, completed, color = 'var(--go-cyan)', height = 4, showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {showLabel && total !== undefined && completed !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--go-muted)' }}>{completed} / {total}</span>
          <span style={{ fontSize: '12px', color: color, fontWeight: 600 }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          background: 'var(--go-surface-2)',
          borderRadius: `${height}px`,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          style={{
            height: '100%',
            background: color,
            borderRadius: `${height}px`,
          }}
        />
      </div>
    </div>
  );
}
