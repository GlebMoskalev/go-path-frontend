import { useParams, Link } from 'react-router';
import { ChevronRight, ChevronLeft, CheckCircle2, BookOpenCheck, BookOpen } from 'lucide-react';
import { fetchTheoryLesson, fetchTheoryChapters, completeTheoryLesson, type TheoryLesson, type TheoryChapter, type TheoryLessonSummary } from '../api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  href: string;
  label: string;
  title: string;
}

interface LessonNav {
  prev: NavItem | null;
  next: NavItem | null;
}

function buildNav(chapters: TheoryChapter[], chapterSlug: string, lessonSlug: string): LessonNav {
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const chIdx = sorted.findIndex((c) => c.slug === chapterSlug);
  if (chIdx === -1) return { prev: null, next: null };

  const chapter = sorted[chIdx];
  const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
  const lIdx = lessons.findIndex((l) => l.slug === lessonSlug);
  if (lIdx === -1) return { prev: null, next: null };

  let prev: NavItem | null = null;
  let next: NavItem | null = null;

  if (lIdx > 0) {
    const p = lessons[lIdx - 1];
    prev = { href: `/theory/${chapterSlug}/${p.slug}`, label: 'Предыдущий', title: p.title };
  } else if (chIdx > 0) {
    const prevCh = sorted[chIdx - 1];
    const prevLessons = [...prevCh.lessons].sort((a, b) => a.order - b.order);
    if (prevLessons.length > 0) {
      const p = prevLessons[prevLessons.length - 1];
      prev = { href: `/theory/${prevCh.slug}/${p.slug}`, label: prevCh.title, title: p.title };
    }
  }

  if (lIdx < lessons.length - 1) {
    const n = lessons[lIdx + 1];
    next = { href: `/theory/${chapterSlug}/${n.slug}`, label: 'Следующий', title: n.title };
  } else if (chIdx < sorted.length - 1) {
    const nextCh = sorted[chIdx + 1];
    const nextLessons = [...nextCh.lessons].sort((a, b) => a.order - b.order);
    if (nextLessons.length > 0) {
      const n = nextLessons[0];
      next = { href: `/theory/${nextCh.slug}/${n.slug}`, label: nextCh.title, title: n.title };
    }
  } else {
    next = { href: '/theory', label: 'Теория завершена!', title: 'Все уроки' };
  }

  return { prev, next };
}

export function TheoryLessonPage() {
  const { chapterId, lessonId } = useParams<{ chapterId: string; lessonId: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<TheoryLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [nav, setNav] = useState<LessonNav>({ prev: null, next: null });

  useEffect(() => {
    if (!chapterId || !lessonId) return;
    
    setIsLoading(true);
    setCompleteError(null);

    window.scrollTo(0, 0);

    const lessonPromise = fetchTheoryLesson(chapterId, lessonId).then((data) => {
      setLesson(data);
      setIsCompleted(data.completed ?? false);
    });

    const chaptersPromise = fetchTheoryChapters().then((chapters) => {
      setNav(buildNav(chapters, chapterId, lessonId));
    });

    Promise.all([lessonPromise, chaptersPromise])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [chapterId, lessonId]);

  const handleComplete = async () => {
    if (!chapterId || !lessonId || isCompleting || isCompleted) return;
    setIsCompleting(true);
    setCompleteError(null);
    try {
      await completeTheoryLesson(chapterId, lessonId);
      setIsCompleted(true);
    } catch {
      setCompleteError('Не удалось отметить урок. Попробуйте позже.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F111A' }}>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Загрузка...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F111A' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: '#F1F5F9', marginBottom: '8px' }}>Урок не найден</h2>
          <Link to="/theory" style={{ color: '#00ADD8', textDecoration: 'none' }}>← Вернуться к теории</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 48px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <Link to="/theory" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            Теория
          </Link>
          <ChevronRight size={13} style={{ color: '#64748B' }} />
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>{lesson.chapter_slug}</span>
          <ChevronRight size={13} style={{ color: '#64748B' }} />
          <span style={{ fontSize: '13px', color: '#F1F5F9' }}>{lesson.title}</span>
        </div>

        {/* Lesson header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Урок {lesson.order}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            {lesson.title}
          </h1>
          <p style={{ fontSize: '15px', color: '#94A3B8' }}>{lesson.description}</p>
        </div>

        {/* Content */}
        <MarkdownRenderer content={lesson.content} />

        {/* Complete button */}
        {user && (
          <div style={{ marginTop: '40px' }}>
            <button
              onClick={handleComplete}
              disabled={isCompleted || isCompleting}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px 24px',
                borderRadius: '10px',
                border: isCompleted ? '1px solid #10B98133' : '1px solid #00ADD833',
                background: isCompleted ? '#10B98112' : '#00ADD812',
                color: isCompleted ? '#10B981' : '#00ADD8',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isCompleted ? 'default' : 'pointer',
                opacity: isCompleting ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isCompleted && !isCompleting) {
                  (e.currentTarget as HTMLElement).style.background = '#00ADD820';
                  (e.currentTarget as HTMLElement).style.borderColor = '#00ADD8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCompleted && !isCompleting) {
                  (e.currentTarget as HTMLElement).style.background = '#00ADD812';
                  (e.currentTarget as HTMLElement).style.borderColor = '#00ADD833';
                }
              }}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 size={18} />
                  Урок прочитан
                </>
              ) : isCompleting ? (
                'Отмечаем...'
              ) : (
                <>
                  <BookOpenCheck size={18} />
                  Отметить как прочитанный
                </>
              )}
            </button>
            {completeError && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#EF4444', textAlign: 'center' }}>
                {completeError}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '32px', borderTop: '1px solid #1E2A3A' }}>
          {nav.prev ? (
            <Link
              to={nav.prev.href}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '10px',
                border: '1px solid #1E2A3A',
                background: '#141824',
                textDecoration: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#00ADD8';
                (e.currentTarget as HTMLElement).style.background = '#1A2035';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1E2A3A';
                (e.currentTarget as HTMLElement).style.background = '#141824';
              }}
            >
              <ChevronLeft size={16} style={{ color: '#00ADD8', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>{nav.prev.label}</div>
                <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nav.prev.title}</div>
              </div>
            </Link>
          ) : (
            <Link
              to="/theory"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '10px',
                border: '1px solid #1E2A3A',
                background: '#141824',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#00ADD8';
                (e.currentTarget as HTMLElement).style.background = '#1A2035';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1E2A3A';
                (e.currentTarget as HTMLElement).style.background = '#141824';
              }}
            >
              <ChevronLeft size={16} style={{ color: '#00ADD8', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Назад</div>
                <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>Все уроки</div>
              </div>
            </Link>
          )}

          {nav.next && (
            <Link
              to={nav.next.href}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '10px',
                border: '1px solid #1E2A3A',
                background: nav.next.href === '/theory' ? '#10B98112' : '#141824',
                textDecoration: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = nav.next!.href === '/theory' ? '#10B981' : '#00ADD8';
                (e.currentTarget as HTMLElement).style.background = nav.next!.href === '/theory' ? '#10B98120' : '#1A2035';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1E2A3A';
                (e.currentTarget as HTMLElement).style.background = nav.next!.href === '/theory' ? '#10B98112' : '#141824';
              }}
            >
              <div style={{ minWidth: 0, textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>{nav.next.label}</div>
                <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nav.next.title}</div>
              </div>
              {nav.next.href === '/theory' ? (
                <BookOpen size={16} style={{ color: '#10B981', flexShrink: 0 }} />
              ) : (
                <ChevronRight size={16} style={{ color: '#00ADD8', flexShrink: 0 }} />
              )}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
