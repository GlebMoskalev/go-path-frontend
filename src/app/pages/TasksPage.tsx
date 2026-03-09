import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Circle, Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchTaskChapters, type Difficulty, type TaskChapter } from '../api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ProgressBar } from '../components/ProgressBar';
import { AnimatedSection, StaggerContainer, StaggerItem } from '../components/AnimatedSection';

const difficultyFilters: { label: string; value: Difficulty | 'all' }[] = [
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
      .then(setChapters)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredChapters = chapters.map((ch) => ({
    ...ch,
    tasks: ch.tasks.filter((t) => {
      const matchesDiff = filter === 'all' || t.difficulty === filter;
      const matchesSearch = search === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      return matchesDiff && matchesSearch;
    }),
  })).filter((ch) => ch.tasks.length > 0);

  if (isLoading) {
    return (
      <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--go-muted)' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <AnimatedSection variant="fadeUp">
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Задачи
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--go-muted)' }}>
              Практические задания с автоматической проверкой
            </p>
          </div>
        </AnimatedSection>

        {/* Filters */}
        <AnimatedSection variant="fadeUp" delay={0.05}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--go-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Поиск задач..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  background: 'var(--go-surface)',
                  border: '1px solid var(--go-border)',
                  borderRadius: '10px',
                  color: 'var(--go-text-secondary)',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'Manrope, sans-serif',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--go-cyan)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--go-border)')}
              />
            </div>

            {/* Difficulty filter */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <SlidersHorizontal size={14} style={{ color: 'var(--go-muted)' }} />
              {difficultyFilters.map((f) => {
                const isActive = filter === f.value;
                return (
                  <motion.button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    animate={{
                      borderColor: isActive ? 'var(--go-cyan)' : 'var(--go-border)',
                      background: isActive ? 'var(--go-cyan-muted)' : 'transparent',
                      color: isActive ? 'var(--go-cyan)' : 'var(--go-muted)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    {f.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* Chapters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredChapters.length === 0 ? (
            <AnimatedSection variant="fadeIn">
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--go-text)', marginBottom: '8px' }}>
                  Ничего не найдено
                </div>
                <div style={{ fontSize: '14px', color: 'var(--go-muted)' }}>
                  Попробуйте изменить фильтры или поисковый запрос
                </div>
              </div>
            </AnimatedSection>
          ) : (
            <StaggerContainer key={`${filter}-${search}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredChapters.map((chapter) => {
                const solved = chapter.solved_count || 0;
                const pct = chapter.tasks.length > 0 ? (solved / chapter.tasks.length) * 100 : 0;

                return (
                  <StaggerItem key={chapter.slug}>
                    <div
                      style={{
                        background: 'var(--go-surface)',
                        border: '1px solid var(--go-border)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Chapter header */}
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--go-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--go-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                              Раздел {chapter.order}
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--go-text)', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                              {chapter.title}
                            </h2>
                            <p style={{ fontSize: '13px', color: 'var(--go-muted)' }}>{chapter.description}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--go-cyan)', letterSpacing: '-0.02em' }}>
                              {solved}/{chapter.tasks.length}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--go-muted)' }}>решено</div>
                          </div>
                        </div>
                        <ProgressBar
                          value={pct}
                          total={chapter.tasks.length}
                          completed={solved}
                          showLabel
                          height={5}
                        />
                      </div>

                      {/* Task list */}
                      <div style={{ padding: '8px' }}>
                        {chapter.tasks.map((task) => (
                          <Link
                            key={task.slug}
                            to={`/tasks/${chapter.slug}/${task.slug}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--go-surface-2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              {task.solved ? (
                                <CheckCircle2 size={18} style={{ color: 'var(--go-green)', flexShrink: 0 }} />
                              ) : (
                                <Circle size={18} style={{ color: 'var(--go-border-2)', flexShrink: 0 }} />
                              )}

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--go-text-secondary)', marginBottom: '2px' }}>
                                  {task.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: 'var(--go-muted)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '500px',
                                  }}
                                >
                                  {task.description.replace(/^#[^\n]+\n/, '').replace(/```[\s\S]*?```/g, '[код]').trim().slice(0, 100)}
                                </div>
                              </div>

                              <DifficultyBadge difficulty={task.difficulty} size="sm" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>
      </div>
    </div>
  );
}
