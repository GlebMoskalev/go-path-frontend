import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Edit2, Check, X, BookOpen, Code2, FolderGit2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchUserStats, type UserStats } from '../api';

function ProgressRing({ percent, size = 72, stroke = 5, color }: { percent: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--go-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function StatCard({
  icon, title, done, total, color, items, itemLabel, delay,
}: {
  icon: React.ReactNode;
  title: string;
  done: number;
  total: number;
  color: string;
  items: { name: string; done: number; total: number }[];
  itemLabel: [string, string];
  delay: number;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      style={{
        background: 'var(--go-surface)',
        border: '1px solid var(--go-border)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color,
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--go-text)' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'var(--go-muted)' }}>
              {done} / {total} {done === total && total > 0 ? itemLabel[1] : itemLabel[0]}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', width: '72px', height: '72px' }}>
          <ProgressRing percent={pct} color={color} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 800, color,
          }}>
            {pct}%
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((it) => {
            const iPct = it.total > 0 ? (it.done / it.total) * 100 : 0;
            return (
              <div key={it.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--go-text-secondary)' }}>{it.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--go-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {it.done}/{it.total}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--go-border)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${iPct}%` }}
                    transition={{ duration: 0.7, delay: delay + 0.15, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: '3px', background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarHover, setAvatarHover] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const avatarPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);
    fetchUserStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!editingAvatar) return;
    function handleClick(e: MouseEvent) {
      if (avatarPopRef.current && !avatarPopRef.current.contains(e.target as Node)) {
        setEditingAvatar(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editingAvatar]);

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: 'var(--go-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: 'var(--go-text)', marginBottom: '8px' }}>Требуется авторизация</h2>
          <p style={{ color: 'var(--go-muted)', marginBottom: '20px' }}>Войдите через Google для просмотра профиля</p>
          <Link to="/" style={{ color: 'var(--go-cyan)', textDecoration: 'none' }}>← На главную</Link>
        </div>
      </div>
    );
  }

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateUser({ name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const handleSaveAvatar = async () => {
    if (!avatarUrl.trim()) return;
    setSavingAvatar(true);
    try {
      await updateUser({ name: user.name, picture: avatarUrl.trim() });
      setEditingAvatar(false);
      setAvatarUrl('');
    } catch {
      // keep open on error
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            background: 'var(--go-surface)',
            border: '1px solid var(--go-border)',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={user.picture}
              alt={user.name}
              style={{
                width: '68px', height: '68px', borderRadius: '50%',
                border: '2px solid var(--go-border-2)', background: 'var(--go-surface-2)',
              }}
            />
            {user.is_active && (
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'var(--go-green)', border: '2px solid var(--go-surface)',
              }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') { setEditingName(false); setNameInput(user.name); }
                  }}
                  autoFocus
                  style={{
                    background: 'var(--go-surface-2)', border: '1px solid var(--go-cyan)',
                    borderRadius: '8px', color: 'var(--go-text)', fontSize: '18px', fontWeight: 700,
                    padding: '5px 10px', outline: 'none', fontFamily: 'Manrope, sans-serif', width: '200px',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'var(--go-green-muted)', border: '1px solid var(--go-green-muted)',
                    color: 'var(--go-green)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                ><Check size={14} /></button>
                <button
                  onClick={() => { setEditingName(false); setNameInput(user.name); }}
                  style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: 'var(--go-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                ><X size={14} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.01em' }}>{user.name}</span>
                <button
                  onClick={() => { setEditingName(true); setNameInput(user.name); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--go-muted)', cursor: 'pointer',
                    padding: '3px', borderRadius: '6px', display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--go-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--go-muted)')}
                ><Edit2 size={13} /></button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats grid */}
        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: '32px', height: '32px',
              border: '3px solid var(--go-border-2)', borderTopColor: 'var(--go-cyan)',
              borderRadius: '50%', margin: '0 auto 12px',
            }} className="animate-spin" />
            <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>Загрузка статистики...</div>
          </div>
        ) : stats ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            <StatCard
              icon={<BookOpen size={18} />}
              title="Теория"
              done={stats.theory.completed_lessons}
              total={stats.theory.total_lessons}
              color="var(--go-cyan)"
              itemLabel={['пройдено', '— всё пройдено!']}
              delay={0.1}
              items={stats.theory.chapters.map((c) => ({
                name: c.title,
                done: c.completed ?? 0,
                total: c.total,
              }))}
            />
            <StatCard
              icon={<Code2 size={18} />}
              title="Задачи"
              done={stats.tasks.solved_tasks}
              total={stats.tasks.total_tasks}
              color="var(--go-green)"
              itemLabel={['решено', '— всё решено!']}
              delay={0.2}
              items={stats.tasks.chapters.map((c) => ({
                name: c.title,
                done: c.solved ?? 0,
                total: c.total,
              }))}
            />
            <StatCard
              icon={<FolderGit2 size={18} />}
              title="Проекты"
              done={stats.projects.solved_steps}
              total={stats.projects.total_steps}
              color="var(--go-amber)"
              itemLabel={['шагов пройдено', '— всё пройдено!']}
              delay={0.3}
              items={stats.projects.projects.map((p) => ({
                name: p.title,
                done: p.solved,
                total: p.total,
              }))}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>Не удалось загрузить статистику</div>
          </div>
        )}
      </div>
    </div>
  );
}
