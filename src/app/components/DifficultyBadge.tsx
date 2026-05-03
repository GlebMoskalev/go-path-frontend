import type { Difficulty } from '../api';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
  /** When true, render as a row of tick marks (||| / |||) instead of a chip */
  variant?: 'chip' | 'glyph';
}

const labels: Record<Difficulty, string> = {
  easy: 'Лёгкая',
  medium: 'Средняя',
  hard: 'Сложная',
};

const tone: Record<Difficulty, string> = {
  easy: 'var(--gp-success)',
  medium: 'var(--gp-warning)',
  hard: 'var(--gp-danger)',
};

const ticks: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

export function DifficultyBadge({ difficulty, size = 'md', variant = 'chip' }: DifficultyBadgeProps) {
  if (variant === 'glyph') {
    return (
      <span
        className="inline-flex items-center gap-2"
        title={labels[difficulty]}
        aria-label={`Сложность: ${labels[difficulty]}`}
      >
        <span className="inline-flex items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block"
              style={{
                width: 3,
                height: 4 + i * 3,
                background: i < ticks[difficulty] ? tone[difficulty] : 'var(--gp-surface-strong)',
                borderRadius: 1,
              }}
            />
          ))}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--gp-ink-3)' }}>{labels[difficulty]}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        padding: size === 'sm' ? '2px 9px' : '3px 11px',
        fontSize: size === 'sm' ? '11px' : '12px',
        background: 'var(--gp-surface-muted)',
        color: 'var(--gp-ink-2)',
        border: '1px solid var(--gp-border)',
        flexShrink: 0,
        letterSpacing: '0.005em',
      }}
    >
      <span className="block w-1.5 h-1.5 rounded-full" style={{ background: tone[difficulty] }} />
      {labels[difficulty]}
    </span>
  );
}
