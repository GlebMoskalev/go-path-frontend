import type { Difficulty } from '../api';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
}

const labels: Record<Difficulty, string> = {
  easy: 'Лёгкая',
  medium: 'Средняя',
  hard: 'Сложная',
};

const badgeStyles: Record<Difficulty, { color: string; bg: string }> = {
  easy: { color: 'var(--go-green)', bg: 'var(--go-green-muted)' },
  medium: { color: 'var(--go-amber)', bg: 'rgba(217, 119, 6, 0.08)' },
  hard: { color: 'var(--go-red)', bg: 'rgba(220, 38, 38, 0.08)' },
};

export function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const s = badgeStyles[difficulty];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        borderRadius: '20px',
        background: s.bg,
        color: s.color,
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {labels[difficulty]}
    </span>
  );
}
