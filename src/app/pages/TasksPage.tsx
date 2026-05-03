import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Search, Check, ArrowUpRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTaskChapters, type Difficulty, type TaskChapter } from '../api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { Container, Eyebrow, ProgressTrack, staggerParent, staggerChild } from '../design';

const filters: { label: string; value: Difficulty | 'all' }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Лёгкие', value: 'easy' },
  { label: 'Средние', value: 'medium' },
  { label: 'Сложные', value: 'hard' },
];

export function TasksPage() {
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const [search, setSearch] = useState('');
  const [chapters, setChapters] = useState<TaskChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTaskChapters()
      .then((data) => setChapters([...data].sort((a, b) => a.order - b.order)))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return chapters
      .map((ch) => ({
        ...ch,
        tasks: ch.tasks.filter((t) => {
          const matchesDiff = filter === 'all' || t.difficulty === filter;
          const matchesSearch =
            search === '' ||
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase());
          return matchesDiff && matchesSearch;
        }),
      }))
      .filter((ch) => ch.tasks.length > 0);
  }, [chapters, filter, search]);

  const totals = useMemo(() => {
    let total = 0;
    let solved = 0;
    chapters.forEach((c) => {
      total += c.tasks.length;
      solved += c.solved_count ?? 0;
    });
    return { total, solved, ratio: total ? solved / total : 0 };
  }, [chapters]);

  return (
    <div style={{ background: 'var(--gp-bg)', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <header className="pt-14 pb-10" style={{ borderBottom: '1px solid var(--gp-border)' }}>
        <Container>
          <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)} className="grid md:grid-cols-12 gap-10 items-end">
            <div className="md:col-span-7">
              <motion.div variants={staggerChild}>
                <Eyebrow>Раздел · 02</Eyebrow>
              </motion.div>
              <motion.h1 variants={staggerChild} className="gp-display mt-4" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
                <em>Задачи</em> с проверкой
                <br />
                в редакторе.
              </motion.h1>
              <motion.p variants={staggerChild} className="mt-5 max-w-[58ch] text-[16px]" style={{ color: 'var(--gp-ink-3)' }}>
                Пиши код, отправляй на тесты, читай AI-разбор. История решений сохраняется — возвращайся к любой попытке.
              </motion.p>
            </div>

            <motion.div variants={staggerChild} className="md:col-span-5">
              <div className="gp-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <Eyebrow marker={false}>Прогресс</Eyebrow>
                  <span className="text-[12px] gp-mono" style={{ color: 'var(--gp-ink-3)' }}>
                    {isLoading ? '—' : `${totals.solved} из ${totals.total}`}
                  </span>
                </div>
                <ProgressTrack value={totals.ratio} tone={totals.ratio === 1 ? 'success' : 'ink'} height={3} />
                <div className="mt-4 text-[12px]" style={{ color: 'var(--gp-ink-4)' }}>
                  Все задачи проверяются автотестами и сохраняют историю.
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </header>

      {/* Sticky filter bar */}
      <div
        className="sticky z-30 backdrop-blur-md"
        style={{
          top: 60,
          background: 'var(--gp-header-bg)',
          borderBottom: '1px solid var(--gp-border)',
        }}
      >
        <Container className="h-14 flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} />

          <div className="flex items-center gap-1.5 ml-auto">
            {filters.map((f) => (
              <FilterChip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}
              </FilterChip>
            ))}
          </div>
        </Container>
      </div>

      {/* Body */}
      <Container className="py-12">
        {isLoading ? (
          <ListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState onClear={() => { setFilter('all'); setSearch(''); }} />
        ) : (
          <motion.div
            key={`${filter}-${search}`}
            initial="hidden"
            animate="visible"
            variants={staggerParent(0.05)}
            className="grid gap-12"
          >
            {filtered.map((chapter, idx) => (
              <ChapterBlock key={chapter.slug} chapter={chapter} idx={idx + 1} />
            ))}
          </motion.div>
        )}
      </Container>
    </div>
  );
}

/* ---------------- Filter UI ---------------- */
function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-[420px]">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--gp-ink-4)' }}
      />
      <input
        type="text"
        placeholder="Поиск задачи..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-9 py-2 rounded-md text-[13px] outline-none transition-colors"
        style={{
          background: 'var(--gp-surface)',
          border: '1px solid var(--gp-border)',
          color: 'var(--gp-ink)',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gp-border-strong)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--gp-border)')}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Очистить"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
          style={{ color: 'var(--gp-ink-4)' }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[12px] transition-colors"
      style={{
        background: active ? 'var(--gp-ink)' : 'transparent',
        color: active ? 'var(--gp-bg)' : 'var(--gp-ink-3)',
        border: '1px solid',
        borderColor: active ? 'var(--gp-ink)' : 'var(--gp-border)',
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--gp-border-strong)';
          e.currentTarget.style.color = 'var(--gp-ink)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--gp-border)';
          e.currentTarget.style.color = 'var(--gp-ink-3)';
        }
      }}
    >
      {children}
    </button>
  );
}

/* ---------------- Chapter block ---------------- */
function ChapterBlock({ chapter, idx }: { chapter: TaskChapter; idx: number }) {
  const total = chapter.tasks.length;
  const solved = chapter.solved_count ?? 0;
  const ratio = total ? solved / total : 0;
  const done = ratio === 1;

  return (
    <motion.section variants={staggerChild} className="grid md:grid-cols-12 gap-8 md:gap-10">
      <div className="md:col-span-4">
        <div className="md:sticky md:top-[140px]">
          <div className="flex items-baseline gap-3">
            <span className="text-[12px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
              {String(idx).padStart(2, '0')}
            </span>
            <span className="flex-1 gp-path-line-h h-px self-center mt-1" />
            {done && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--gp-success)' }}>
                <Check size={11} strokeWidth={2.5} /> Завершён
              </span>
            )}
          </div>
          <h2 className="mt-3 font-medium" style={{ fontSize: '22px', letterSpacing: '-0.02em', color: 'var(--gp-ink)', lineHeight: 1.2 }}>
            {chapter.title}
          </h2>
          <p className="mt-2 text-[13.5px]" style={{ color: 'var(--gp-ink-3)', lineHeight: 1.55 }}>
            {chapter.description}
          </p>
          <div className="mt-4">
            <ProgressTrack value={ratio} tone={done ? 'success' : 'ink'} height={2} />
            <div className="mt-2 text-[11px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
              {solved}/{total} решено
            </div>
          </div>
        </div>
      </div>

      <ol className="md:col-span-8 list-none p-0 m-0" style={{ borderTop: '1px solid var(--gp-border)' }}>
        {chapter.tasks.map((task, i) => (
          <li key={task.slug} style={{ borderBottom: '1px solid var(--gp-border)' }}>
            <Link
              to={`/tasks/${chapter.slug}/${task.slug}`}
              className="group flex items-center gap-4 py-4 no-underline"
              style={{ color: 'var(--gp-ink)' }}
            >
              <span className="text-[11px] gp-mono w-7 flex-shrink-0" style={{ color: 'var(--gp-ink-4)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-shrink-0">
                {task.solved ? (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                    style={{ background: 'var(--gp-success-soft)', color: 'var(--gp-success)' }}
                  >
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="inline-block w-5 h-5 rounded-full border" style={{ borderColor: 'var(--gp-border-strong)' }} />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15.5px] font-medium leading-snug truncate group-hover:underline underline-offset-4" style={{ letterSpacing: '-0.005em' }}>
                  {task.title}
                </span>
                <span className="block text-[13px] mt-0.5 truncate" style={{ color: 'var(--gp-ink-3)' }}>
                  {task.description.replace(/^#[^\n]+\n/, '').replace(/```[\s\S]*?```/g, '[код]').trim().slice(0, 110)}
                </span>
              </span>
              <DifficultyBadge difficulty={task.difficulty} variant="glyph" />
              <ArrowUpRight size={14} style={{ color: 'var(--gp-ink-4)' }} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

/* ---------------- States ---------------- */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <Eyebrow marker={false}>Ничего не найдено</Eyebrow>
        <h3 className="gp-display mt-3" style={{ fontSize: '32px' }}>
          Пусто <em>в этой выборке</em>.
        </h3>
        <p className="mt-3 text-[14px]" style={{ color: 'var(--gp-ink-3)' }}>
          Попробуй другой запрос или сбрось фильтры.
        </p>
        <button
          onClick={onClear}
          className="mt-6 text-[13px] underline underline-offset-4"
          style={{ color: 'var(--gp-ink)' }}
        >
          Сбросить фильтры
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-12">
      {[0, 1].map((i) => (
        <div key={i} className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <div className="h-3 w-10 gp-skel" />
            <div className="h-6 w-3/4 gp-skel" />
            <div className="h-3 w-full gp-skel" />
            <div className="h-1 w-full gp-skel mt-4" />
          </div>
          <div className="md:col-span-8 space-y-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-4 py-3">
                <div className="h-3 w-6 gp-skel" />
                <div className="h-5 w-5 rounded-full gp-skel" />
                <div className="h-4 flex-1 gp-skel" />
                <div className="h-3 w-16 gp-skel" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
