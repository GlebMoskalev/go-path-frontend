import { motion } from 'motion/react';
import { ease, dur } from './motion';

interface ProgressTrackProps {
  value: number;          // 0..1
  className?: string;
  height?: number;
  tone?: 'ink' | 'accent' | 'success';
  label?: string;
}

const toneFill: Record<NonNullable<ProgressTrackProps['tone']>, string> = {
  ink: 'var(--gp-ink)',
  accent: 'var(--gp-accent)',
  success: 'var(--gp-success)',
};

/** Hairline progress track. Uses motion to animate width changes. */
export function ProgressTrack({ value, className, height = 4, tone = 'ink', label }: ProgressTrackProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--gp-ink-3)' }}>{label}</span>
          <span className="text-xs gp-mono" style={{ color: 'var(--gp-ink-3)' }}>
            {Math.round(clamped * 100)}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative w-full overflow-hidden rounded-full"
        style={{ height, background: 'var(--gp-surface-strong)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ duration: dur.slow, ease: ease.emphasized }}
          className="h-full rounded-full"
          style={{ background: toneFill[tone] }}
        />
      </div>
    </div>
  );
}

interface ProgressRingProps {
  value: number;          // 0..1
  size?: number;
  stroke?: number;
  tone?: 'ink' | 'accent' | 'success';
  children?: React.ReactNode;
}

/** Minimal SVG progress ring — used in dashboard tiles. */
export function ProgressRing({ value, size = 64, stroke = 4, tone = 'ink', children }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const fill = toneFill[tone];
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--gp-surface-strong)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={fill}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: dur.slow, ease: ease.emphasized }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
