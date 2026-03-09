import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Circle, Search, SlidersHorizontal } from 'lucide-react';
import { fetchTaskChapters, type Difficulty, type TaskChapter } from '../api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ProgressBar } from '../components/ProgressBar';

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
      <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Задачи
          </h1>
          <p style={{ fontSize: '15px', color: '#94A3B8' }}>
            Практические задания с автоматической проверкой
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Поиск задач..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: '#141824',
                border: '1px solid #1E2A3A',
                borderRadius: '8px',
                color: '#E2E8F0',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'Manrope, sans-serif',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#00ADD8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1E2A3A')}
            />
          </div>

          {/* Difficulty filter */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <SlidersHorizontal size={14} style={{ color: '#94A3B8' }} />
            {difficultyFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: filter === f.value ? '#00ADD8' : '#1E2A3A',
                  background: filter === f.value ? 'rgba(0,173,216,0.1)' : 'transparent',
                  color: filter === f.value ? '#00ADD8' : '#94A3B8',
                  fontSize: '12px',
                  fontWeight: filter === f.value ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredChapters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
                Ничего не найдено
              </div>
              <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                Попробуйте изменить фильтры или поисковый запрос
              </div>
            </div>
          ) : (
            filteredChapters.map((chapter) => {
              const solved = chapter.solved_count || 0;
              const pct = chapter.tasks.length > 0 ? (solved / chapter.tasks.length) * 100 : 0;

              return (
                <div
                  key={chapter.slug}
                  style={{
                    background: '#141824',
                    border: '1px solid #1E2A3A',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Chapter header */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E2A3A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          Раздел {chapter.order}
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                          {chapter.title}
                        </h2>
                        <p style={{ fontSize: '13px', color: '#94A3B8' }}>{chapter.description}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#00ADD8', letterSpacing: '-0.02em' }}>
                          {solved}/{chapter.tasks.length}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>решено</div>
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
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#1A2035')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {task.solved ? (
                            <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                          ) : (
                            <Circle size={18} style={{ color: '#253047', flexShrink: 0 }} />
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0', marginBottom: '2px' }}>
                              {task.title}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#94A3B8',
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
