import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronRight, ChevronDown, Clock, CheckCircle2, BookOpen, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTheoryChapters, type TheoryChapter } from '../api';
import { ProgressBar } from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { AnimatedSection, StaggerContainer, StaggerItem } from '../components/AnimatedSection';

export function TheoryPage() {
  const { user } = useAuth();
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['01-basics']);
  const [chapters, setChapters] = useState<TheoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTheoryChapters()
      .then(setChapters)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const toggleChapter = (slug: string) => {
    setExpandedChapters((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: 'var(--go-bg)' }}>
        <div style={{ fontSize: '14px', color: 'var(--go-muted)' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', background: 'var(--go-bg)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '280px',
          flexShrink: 0,
          borderRight: '1px solid var(--go-border)',
          background: 'var(--go-surface)',
          position: 'sticky',
          top: '56px',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          padding: '16px 0',
        }}
        className="hidden md:block"
      >
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--go-border)', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--go-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Разделы теории
          </span>
        </div>

        {chapters.map((chapter) => {
          const completed = chapter.progress?.completed ?? 0;
          const isExpanded = expandedChapters.includes(chapter.slug);

          return (
            <div key={chapter.slug}>
              <button
                onClick={() => toggleChapter(chapter.slug)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--go-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
                >
                  <ChevronRight size={14} style={{ color: 'var(--go-muted)' }} />
                </motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--go-text-secondary)', marginBottom: '2px' }}>
                    {chapter.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--go-muted)' }}>
                    {completed}/{chapter.lessons.length} уроков
                  </div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ overflow: 'hidden', paddingLeft: '16px' }}
                  >
                    {chapter.lessons.map((lesson) => (
                      <Link
                        key={lesson.slug}
                        to={`/theory/${chapter.slug}/${lesson.slug}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          marginBottom: '2px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--go-surface-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 size={13} style={{ color: 'var(--go-green)', flexShrink: 0 }} />
                        ) : (
                          <div
                            style={{
                              width: '13px',
                              height: '13px',
                              borderRadius: '50%',
                              border: '1.5px solid var(--go-border-2)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span style={{ fontSize: '13px', color: lesson.completed ? 'var(--go-text-secondary)' : 'var(--go-muted)', lineHeight: '1.4' }}>
                          {lesson.title}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px 40px 80px', maxWidth: '900px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
          <span style={{ fontSize: '13px', color: 'var(--go-muted)' }}>Теория</span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Теория
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--go-muted)', marginBottom: '40px' }}>
          Структурированные уроки по языку Go от основ до продвинутых тем
        </p>

        {/* Chapters */}
        <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {chapters.map((chapter) => {
            const completed = chapter.progress?.completed ?? 0;
            const pct = chapter.lessons.length > 0 ? (completed / chapter.lessons.length) * 100 : 0;

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
                  <div
                    style={{
                      padding: '24px',
                      borderBottom: '1px solid var(--go-border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--go-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Раздел {chapter.order}
                        </span>
                        {completed === chapter.lessons.length && (
                          <span style={{ fontSize: '11px', color: 'var(--go-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Завершён
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--go-text)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                        {chapter.title}
                      </h2>
                      <p style={{ fontSize: '14px', color: 'var(--go-muted)' }}>{chapter.description}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: pct === 100 ? 'var(--go-green)' : 'var(--go-cyan)', letterSpacing: '-0.02em' }}>
                        {Math.round(pct)}%
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--go-muted)', marginTop: '2px' }}>
                        {completed}/{chapter.lessons.length}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ padding: '0 24px' }}>
                    <ProgressBar value={pct} color={pct === 100 ? 'var(--go-green)' : 'var(--go-cyan)'} height={3} />
                  </div>

                  {/* Lessons grid */}
                  <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    {chapter.lessons.map((lesson) => (
                      <Link
                        key={lesson.slug}
                        to={`/theory/${chapter.slug}/${lesson.slug}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '10px',
                            border: `1px solid ${lesson.completed ? 'var(--go-green-muted)' : 'var(--go-border)'}`,
                            background: lesson.completed ? 'var(--go-green-muted)' : 'var(--go-bg)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = lesson.completed ? 'var(--go-green)' : 'var(--go-cyan)';
                            (e.currentTarget as HTMLElement).style.background = 'var(--go-surface)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = lesson.completed ? 'var(--go-green-muted)' : 'var(--go-border)';
                            (e.currentTarget as HTMLElement).style.background = lesson.completed ? 'var(--go-green-muted)' : 'var(--go-bg)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: 'var(--go-subtle)', fontWeight: 600 }}>
                              Урок {lesson.order}
                            </span>
                            {lesson.completed ? (
                              <CheckCircle2 size={14} style={{ color: 'var(--go-green)' }} />
                            ) : (
                              <BookOpen size={14} style={{ color: 'var(--go-subtle)' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--go-text-secondary)', lineHeight: '1.4' }}>
                            {lesson.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--go-muted)', lineHeight: '1.4' }}>
                            {lesson.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </main>
    </div>
  );
}
