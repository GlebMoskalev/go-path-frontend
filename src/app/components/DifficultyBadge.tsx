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

const styles: Record<Difficulty, { color: string; border: string; bg: string }> = {
  easy: { color: '#10B981', border: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  medium: { color: '#F59E0B', border: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  hard: { color: '#EF4444', border: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
};

export function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const s = styles[difficulty];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 7px' : '3px 10px',
        borderRadius: '20px',
        border: `1px solid ${s.border}`,
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
