import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Pencil, Check, X, BookOpen, Code2, FolderGit2, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchUserStats, type UserStats } from '../api';
import { Button, Container, Eyebrow, ProgressRing, ProgressTrack, fadeUp, staggerParent, staggerChild } from '../design';
import { GopherAvatar } from '../components/GopherAvatar';

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return '';
  }
}

export function ProfilePage() {
  const { user, updateUser, deleteUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);
    fetchUserStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [user]);

  const totals = useMemo(() => {
    if (!stats) return { ratio: 0, items: [] as { id: string; label: string; ratio: number; done: number; total: number; color: string }[] };
    const t = safeRatio(stats.theory.completed_lessons, stats.theory.total_lessons);
    const k = safeRatio(stats.tasks.solved_tasks, stats.tasks.total_tasks);
    const p = safeRatio(stats.projects.solved_steps, stats.projects.total_steps);
    return {
      ratio: (t + k + p) / 3,
      items: [
        { id: 'theory',   label: 'Теория',   ratio: t, done: stats.theory.completed_lessons, total: stats.theory.total_lessons, color: 'var(--gp-ink)' },
        { id: 'tasks',    label: 'Задачи',   ratio: k, done: stats.tasks.solved_tasks,       total: stats.tasks.total_tasks,    color: 'var(--gp-ink)' },
        { id: 'projects', label: 'Проекты',  ratio: p, done: stats.projects.solved_steps,    total: stats.projects.total_steps, color: 'var(--gp-ink)' },
      ],
    };
  }, [stats]);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-60px)] grid place-items-center" style={{ background: 'var(--gp-bg)' }}>
        <div className="text-center">
          <Eyebrow marker={false}>Профиль · доступ</Eyebrow>
          <h2 className="gp-display mt-3" style={{ fontSize: '32px' }}>
            Нужна <em>авторизация</em>.
          </h2>
          <p className="mt-3 text-[14px] max-w-[380px] mx-auto" style={{ color: 'var(--gp-ink-3)' }}>
            Войди через Google, чтобы видеть профиль и статистику.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-[13px] underline underline-offset-4" style={{ color: 'var(--gp-ink)' }}>
            <ArrowLeft size={13} /> На главную
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError('Имя не может быть пустым'); return; }
    if (trimmed === user.name) { setEditingName(false); return; }
    setSavingName(true);
    setNameError(null);
    try {
      await updateUser({ name: trimmed });
      setEditingName(false);
    } catch {
      setNameError('Не удалось сохранить. Попробуй ещё раз.');
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'удалить') { setDeleteError('Введи слово «удалить» для подтверждения'); return; }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser();
      navigate('/');
    } catch {
      setDeleteError('Не удалось удалить аккаунт. Попробуй позже.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
      {/* Header */}
      <header className="pt-14 pb-12" style={{ borderBottom: '1px solid var(--gp-border)' }}>
        <Container>
          <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)}>
            <motion.div variants={staggerChild}>
              <Eyebrow>Профиль</Eyebrow>
            </motion.div>

            <motion.div variants={staggerChild} className="mt-6 flex items-start gap-7 flex-wrap">
              {/* Gopher mascot — interactive on hover, not clickable */}
              <div
                className="flex items-center justify-center w-[96px] h-[96px] rounded-full flex-shrink-0"
                style={{ background: 'var(--gp-surface-muted)', border: '1px solid var(--gp-border-strong)' }}
              >
                <GopherAvatar size={72} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') { setEditingName(false); setNameInput(user.name); setNameError(null); }
                      }}
                      autoFocus
                      maxLength={80}
                      className="px-3 py-1.5 rounded-md text-[28px] font-medium outline-none"
                      style={{
                        background: 'var(--gp-surface)',
                        border: '1px solid var(--gp-border-strong)',
                        color: 'var(--gp-ink)',
                        letterSpacing: '-0.02em',
                        minWidth: '240px',
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      aria-label="Сохранить"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md"
                      style={{ background: 'var(--gp-ink)', color: 'var(--gp-bg)' }}
                    >
                      {savingName ? <span className="w-3 h-3 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setNameInput(user.name); setNameError(null); }}
                      aria-label="Отмена"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md"
                      style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-border)', color: 'var(--gp-ink-2)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="gp-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1 }}>
                      {user.name}
                    </h1>
                    <button
                      onClick={() => { setEditingName(true); setNameInput(user.name); }}
                      aria-label="Изменить имя"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 inline-flex items-center justify-center rounded-md"
                      style={{ color: 'var(--gp-ink-3)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gp-surface-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                {nameError && <div className="mt-2 text-[12.5px]" style={{ color: 'var(--gp-danger)' }}>{nameError}</div>}

                <div className="mt-3 flex items-center gap-3 flex-wrap text-[13px]" style={{ color: 'var(--gp-ink-3)' }}>
                  <span>{user.email}</span>
                  <span aria-hidden style={{ color: 'var(--gp-ink-5)' }}>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: user.is_active ? 'var(--gp-success)' : 'var(--gp-ink-4)' }} />
                    {user.is_active ? 'Активный' : 'Неактивный'}
                  </span>
                  {user.created_at && (
                    <>
                      <span aria-hidden style={{ color: 'var(--gp-ink-5)' }}>·</span>
                      <span>С {formatDate(user.created_at)}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </header>

      {/* Stats */}
      <Container className="py-12">
        <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)} className="grid md:grid-cols-12 gap-8">
          {/* Overall ring */}
          <motion.div variants={staggerChild} className="md:col-span-4">
            <div className="gp-card p-6 h-full">
              <Eyebrow marker={false}>Общий прогресс</Eyebrow>
              <div className="mt-5 flex items-center gap-5">
                {statsLoading ? (
                  <div className="w-[100px] h-[100px] rounded-full gp-skel" />
                ) : (
                  <ProgressRing value={totals.ratio} size={100} stroke={6} tone={totals.ratio === 1 ? 'success' : 'ink'}>
                    <span className="gp-display" style={{ fontSize: 24, color: 'var(--gp-ink)' }}>
                      {Math.round(totals.ratio * 100)}%
                    </span>
                  </ProgressRing>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium" style={{ color: 'var(--gp-ink)' }}>
                    {statsLoading ? <span className="inline-block w-32 h-4 gp-skel" /> : describe(totals.ratio)}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--gp-ink-4)' }}>
                    Усреднено по теории, задачам и проектам
                  </div>
                </div>
              </div>
              {!statsLoading && (
                <div className="mt-6 grid gap-3">
                  {totals.items.map((it) => (
                    <ProgressTrack
                      key={it.id}
                      value={it.ratio}
                      tone={it.ratio === 1 ? 'success' : 'ink'}
                      label={`${it.label} · ${it.done}/${it.total}`}
                      height={3}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Per-track cards */}
          <div className="md:col-span-8 grid gap-5">
            <motion.div variants={staggerChild}>
              <TrackCard
                icon={<BookOpen size={14} />}
                title="Теория"
                done={stats?.theory.completed_lessons ?? 0}
                total={stats?.theory.total_lessons ?? 0}
                items={stats?.theory.chapters.map((c) => ({ name: c.title, done: c.completed ?? 0, total: c.total })) ?? []}
                loading={statsLoading}
              />
            </motion.div>
            <motion.div variants={staggerChild}>
              <TrackCard
                icon={<Code2 size={14} />}
                title="Задачи"
                done={stats?.tasks.solved_tasks ?? 0}
                total={stats?.tasks.total_tasks ?? 0}
                items={stats?.tasks.chapters.map((c) => ({ name: c.title, done: c.solved ?? 0, total: c.total })) ?? []}
                loading={statsLoading}
              />
            </motion.div>
            <motion.div variants={staggerChild}>
              <TrackCard
                icon={<FolderGit2 size={14} />}
                title="Проекты"
                done={stats?.projects.solved_steps ?? 0}
                total={stats?.projects.total_steps ?? 0}
                items={stats?.projects.projects.map((p) => ({ name: p.title, done: p.solved, total: p.total })) ?? []}
                loading={statsLoading}
              />
            </motion.div>
          </div>
        </motion.div>
      </Container>

      {/* Danger zone */}
      <Container className="pb-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
          <div className="gp-divider mb-8" />
          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <Eyebrow marker={false}>Опасная зона</Eyebrow>
              <h3 className="mt-3 font-medium" style={{ fontSize: 20, color: 'var(--gp-ink)', letterSpacing: '-0.015em' }}>
                Удаление аккаунта
              </h3>
              <p className="mt-2 text-[13.5px]" style={{ color: 'var(--gp-ink-3)', lineHeight: 1.55 }}>
                Удалит профиль и весь твой прогресс. Действие нельзя отменить.
              </p>
            </div>
            <div className="md:col-span-8">
              {!confirmDelete ? (
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} iconLeft={<AlertTriangle size={13} style={{ color: 'var(--gp-danger)' }} />}>
                  <span style={{ color: 'var(--gp-danger)' }}>Удалить аккаунт</span>
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg p-5"
                  style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-danger)' }}
                >
                  <div className="text-[14px] font-medium" style={{ color: 'var(--gp-ink)' }}>Подтверди удаление</div>
                  <p className="mt-1 text-[13px]" style={{ color: 'var(--gp-ink-3)', lineHeight: 1.55 }}>
                    Чтобы подтвердить, введи слово <span className="gp-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--gp-surface-muted)', border: '1px solid var(--gp-border)', color: 'var(--gp-ink)' }}>удалить</span>.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="удалить"
                    className="mt-4 w-full max-w-[260px] px-3 py-2 rounded-md text-[14px] outline-none gp-mono"
                    style={{ background: 'var(--gp-bg)', border: '1px solid var(--gp-border-strong)', color: 'var(--gp-ink)' }}
                  />
                  {deleteError && <div className="mt-2 text-[12.5px]" style={{ color: 'var(--gp-danger)' }}>{deleteError}</div>}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="primary"
                      onClick={handleDelete}
                      loading={deleting}
                      style={{ background: 'var(--gp-danger)' } as React.CSSProperties}
                    >
                      Подтвердить удаление
                    </Button>
                    <Button variant="ghost" onClick={() => { setConfirmDelete(false); setDeleteConfirmText(''); setDeleteError(null); }}>
                      Отмена
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function safeRatio(a: number, b: number) {
  if (!b) return 0;
  return Math.max(0, Math.min(1, a / b));
}

function describe(v: number) {
  if (v === 0) return 'Только начинаем';
  if (v < 0.25) return 'Уверенный старт';
  if (v < 0.5) return 'Идём ровно';
  if (v < 0.75) return 'Большая часть пути';
  if (v < 1) return 'Финишная прямая';
  return 'Путь пройден';
}

function TrackCard({
  icon, title, done, total, items, loading,
}: {
  icon: React.ReactNode;
  title: string;
  done: number;
  total: number;
  items: { name: string; done: number; total: number }[];
  loading: boolean;
}) {
  const ratio = safeRatio(done, total);
  return (
    <div className="gp-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink-2)' }}>
            {icon}
          </span>
          <div>
            <div className="text-[15px] font-medium" style={{ color: 'var(--gp-ink)' }}>{title}</div>
            <div className="text-[12px] gp-mono mt-0.5" style={{ color: 'var(--gp-ink-4)' }}>
              {loading ? <span className="inline-block w-12 h-3 gp-skel" /> : `${done} из ${total}`}
            </div>
          </div>
        </div>
        <div className="text-[13px] gp-mono" style={{ color: ratio === 1 ? 'var(--gp-success)' : 'var(--gp-ink-3)' }}>
          {loading ? '—' : `${Math.round(ratio * 100)}%`}
        </div>
      </div>
      <div className="mt-4">
        <ProgressTrack value={ratio} tone={ratio === 1 ? 'success' : 'ink'} height={3} />
      </div>
      {!loading && items.length > 0 && (
        <ul className="mt-5 grid gap-2.5 list-none p-0 m-0">
          {items.map((it) => {
            const r = safeRatio(it.done, it.total);
            return (
              <li key={it.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <span className="text-[13px] truncate" style={{ color: 'var(--gp-ink-2)' }}>{it.name}</span>
                <div className="w-[120px] h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--gp-surface-strong)' }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${r * 100}%`,
                      background: r === 1 ? 'var(--gp-success)' : 'var(--gp-ink)',
                    }}
                  />
                </div>
                <span className="text-[11px] gp-mono w-12 text-right" style={{ color: 'var(--gp-ink-4)' }}>
                  {it.done}/{it.total}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
