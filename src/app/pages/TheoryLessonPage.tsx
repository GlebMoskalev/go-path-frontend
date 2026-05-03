import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, List, X, Maximize2, Minimize2, Sparkles,
} from 'lucide-react';
import {
  fetchTheoryLesson, fetchTheoryChapters, completeTheoryLesson,
  type TheoryLesson, type TheoryChapter,
} from '../api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useAuth } from '../context/AuthContext';
import { Button, Container } from '../design';
import { dur, ease } from '../design/motion';
import { TheoryTOC } from '../components/theory/TheoryTOC';

interface NavItem { href: string; label: string; title: string; }
interface LessonNav { prev: NavItem | null; next: NavItem | null; }

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
    next = { href: '/theory', label: 'Теория завершена', title: 'Все уроки' };
  }
  return { prev, next };
}

export function TheoryLessonPage() {
  const { chapterId, lessonId } = useParams<{ chapterId: string; lessonId: string }>();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<TheoryLesson | null>(null);
  const [chapters, setChapters] = useState<TheoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Reading progress (smoothed)
  const articleRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: articleRef, offset: ['start 60px', 'end end'] });
  const smoothedProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 22, mass: 0.5 });

  useEffect(() => {
    if (!chapterId || !lessonId) return;
    setIsLoading(true);
    setCompleteError(null);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    const lessonPromise = fetchTheoryLesson(chapterId, lessonId).then((data) => {
      setLesson(data);
      setIsCompleted(data.completed ?? false);
    });
    const chaptersPromise = fetchTheoryChapters().then(setChapters);

    Promise.all([lessonPromise, chaptersPromise])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [chapterId, lessonId]);

  const nav = useMemo(() => {
    if (!chapterId || !lessonId || !chapters.length) return { prev: null, next: null };
    return buildNav(chapters, chapterId, lessonId);
  }, [chapters, chapterId, lessonId]);

  const handleComplete = async () => {
    if (!chapterId || !lessonId || isCompleting || isCompleted) return;
    setIsCompleting(true);
    setCompleteError(null);
    try {
      await completeTheoryLesson(chapterId, lessonId);
      setIsCompleted(true);
      // Optimistically reflect the change in TOC + chapter progress
      setChapters((prev) =>
        prev.map((ch) => {
          if (ch.slug !== chapterId) return ch;
          let alreadyCompleted = false;
          const lessons = ch.lessons.map((l) => {
            if (l.slug !== lessonId) return l;
            alreadyCompleted = !!l.completed;
            return { ...l, completed: true };
          });
          const prevProgress = ch.progress ?? { total: ch.lessons.length, completed: 0 };
          const progress = alreadyCompleted
            ? prevProgress
            : { ...prevProgress, completed: Math.min(prevProgress.total, prevProgress.completed + 1) };
          return { ...ch, lessons, progress };
        })
      );
      setLesson((prev) => (prev ? { ...prev, completed: true } : prev));
    } catch {
      setCompleteError('Не удалось отметить урок. Попробуйте позже.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) return <ReaderSkeleton />;

  if (!lesson) {
    return (
      <div className="min-h-[calc(100vh-60px)] grid place-items-center" style={{ background: 'var(--gp-bg)' }}>
        <div className="text-center">
          <p className="gp-eyebrow">404 · Урок не найден</p>
          <h2 className="gp-display mt-3" style={{ fontSize: '32px' }}>
            Этого <em>урока</em> нет.
          </h2>
          <Link to="/theory" className="mt-6 inline-flex items-center gap-2 text-[14px] underline underline-offset-4" style={{ color: 'var(--gp-ink)' }}>
            <ArrowLeft size={14} /> К теории
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ background: 'var(--gp-bg)', minHeight: 'calc(100vh - 60px)' }}>
      {/* Sticky reading progress bar */}
      <motion.div
        className="fixed left-0 right-0 z-40 h-px origin-left"
        style={{
          top: 60,
          background: 'var(--gp-ink)',
          scaleX: smoothedProgress,
        }}
        aria-hidden
      />

      {/* Reader toolbar (sticky) */}
      <div
        className="sticky z-30 backdrop-blur-md"
        style={{
          top: 60,
          background: 'var(--gp-header-bg)',
          borderBottom: '1px solid var(--gp-border)',
        }}
      >
        <Container className="h-12 flex items-center justify-between gap-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0 text-[12.5px]">
            <Link to="/theory" className="no-underline hover:underline underline-offset-4 flex-shrink-0" style={{ color: 'var(--gp-ink-3)' }}>
              Теория
            </Link>
            <ChevronRight size={12} style={{ color: 'var(--gp-ink-4)' }} />
            <span className="truncate" style={{ color: 'var(--gp-ink-3)' }}>{lesson.chapter_title}</span>
            <ChevronRight size={12} style={{ color: 'var(--gp-ink-4)' }} />
            <span className="truncate font-medium" style={{ color: 'var(--gp-ink)' }}>{lesson.title}</span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <ToolbarButton
              onClick={() => setFocusMode((v) => !v)}
              title={focusMode ? 'Выйти из режима чтения' : 'Режим чтения'}
              icon={focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              active={focusMode}
            />
            <ToolbarButton
              onClick={() => setTocOpen(true)}
              title="Содержание"
              icon={<List size={14} />}
            />
          </div>
        </Container>
      </div>

      {/* Layout */}
      <div className="relative">
        <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-10 pb-24">
          {/* Mini rail on xl+ when not in focus mode */}
          <aside
            className={`hidden ${focusMode ? '' : 'xl:block xl:col-span-1'}`}
            aria-hidden={focusMode}
          >
            <div className="sticky top-[124px] flex justify-center">
              <TheoryRail
                chapters={chapters}
                activeChapter={chapterId}
                activeLesson={lessonId}
                onOpen={() => setTocOpen(true)}
              />
            </div>
          </aside>

          {/* Article */}
          <article
            ref={articleRef}
            className={`col-span-1 lg:col-span-12 ${focusMode ? 'xl:col-span-12 mx-auto max-w-[720px]' : 'xl:col-span-11 max-w-[820px]'}`}
          >
            {/* Lesson header */}
            <div className={focusMode ? 'mx-auto max-w-[680px]' : ''}>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--gp-ink-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <span>Урок · {String(lesson.order).padStart(2, '0')}</span>
                <span className="gp-path-line-h flex-1 max-w-[120px]" />
                {isCompleted && (
                  <span className="inline-flex items-center gap-1" style={{ color: 'var(--gp-success)' }}>
                    <Check size={11} strokeWidth={2.5} /> Прочитано
                  </span>
                )}
              </div>
              <h1 className="gp-display mt-4" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.15 }}>
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="mt-4 text-[16px]" style={{ color: 'var(--gp-ink-3)', lineHeight: 1.6, maxWidth: '60ch' }}>
                  {lesson.description}
                </p>
              )}
              <div className="gp-divider mt-8" />
            </div>

            {/* Content — reading-friendly typography */}
            <div className={`gp-prose mt-10 ${focusMode ? 'mx-auto max-w-[680px]' : ''}`}>
              <MarkdownRenderer content={lesson.content} />
            </div>

            {/* Foot — read confirmation + next */}
            <div className={`mt-16 ${focusMode ? 'mx-auto max-w-[680px]' : ''}`}>
              {user && !isCompleted && (
                <div
                  className="rounded-xl p-5 flex items-start gap-4"
                  style={{
                    background: 'var(--gp-surface)',
                    border: '1px solid var(--gp-border)',
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0"
                    style={{
                      background: 'var(--gp-surface-muted)',
                      color: 'var(--gp-ink-3)',
                    }}
                  >
                    <Sparkles size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-medium" style={{ color: 'var(--gp-ink)' }}>
                      Дочитал до конца?
                    </div>
                    <div className="text-[13px] mt-0.5" style={{ color: 'var(--gp-ink-3)' }}>
                      Отметь его, чтобы прогресс по разделу обновился.
                    </div>
                    {completeError && (
                      <div className="mt-2 text-[12.5px]" style={{ color: 'var(--gp-danger)' }}>{completeError}</div>
                    )}
                  </div>
                  <Button onClick={handleComplete} loading={isCompleting} variant="primary" size="sm">
                    Отметить
                  </Button>
                </div>
              )}

              {/* Prev / next */}
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <NavCard item={nav.prev} direction="prev" fallback={{ href: '/theory', label: 'К списку', title: 'Все разделы' }} />
                <NavCard item={nav.next} direction="next" />
              </div>
            </div>
          </article>
        </Container>
      </div>

      {/* TOC drawer (mobile + non-xl viewports + when explicitly opened) */}
      <AnimatePresence>
        {tocOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur.base }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.32)' }}
              onClick={() => setTocOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: dur.slow, ease: ease.emphasized }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[min(360px,90vw)] flex flex-col"
              style={{ background: 'var(--gp-surface)', borderLeft: '1px solid var(--gp-border)' }}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b" style={{ borderColor: 'var(--gp-border)' }}>
                <span className="text-[13px] font-medium" style={{ color: 'var(--gp-ink)' }}>Содержание</span>
                <button
                  onClick={() => setTocOpen(false)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md"
                  style={{ color: 'var(--gp-ink-3)' }}
                  aria-label="Закрыть"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <TheoryTOC chapters={chapters} activeChapter={chapterId} activeLesson={lessonId} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarButton({
  onClick, title, icon, active,
}: { onClick: () => void; title: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors"
      style={{
        background: active ? 'var(--gp-surface-muted)' : 'transparent',
        color: active ? 'var(--gp-ink)' : 'var(--gp-ink-3)',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--gp-surface-muted)'; e.currentTarget.style.color = 'var(--gp-ink)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gp-ink-3)'; } }}
    >
      {icon}
    </button>
  );
}

function NavCard({
  item, direction, fallback,
}: { item: NavItem | null; direction: 'prev' | 'next'; fallback?: NavItem }) {
  const display = item ?? fallback ?? null;
  if (!display) return <div />;

  const isPrev = direction === 'prev';
  return (
    <Link
      to={display.href}
      className="group p-4 rounded-lg no-underline transition-colors flex items-center gap-3"
      style={{
        background: 'var(--gp-surface)',
        border: '1px solid var(--gp-border)',
        textAlign: isPrev ? 'left' : 'right',
        flexDirection: isPrev ? 'row' : 'row-reverse',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gp-border-strong)';
        e.currentTarget.style.background = 'var(--gp-surface-muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gp-border)';
        e.currentTarget.style.background = 'var(--gp-surface)';
      }}
    >
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 transition-transform group-hover:scale-105"
        style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink-2)' }}
      >
        {isPrev ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px]" style={{ color: 'var(--gp-ink-4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {display.label}
        </span>
        <span className="block text-[14px] font-medium truncate mt-0.5" style={{ color: 'var(--gp-ink)' }}>
          {display.title}
        </span>
      </span>
    </Link>
  );
}

/* ---------- Mini rail ---------- */
function TheoryRail({
  chapters, activeChapter, activeLesson, onOpen,
}: {
  chapters: TheoryChapter[];
  activeChapter?: string;
  activeLesson?: string;
  onOpen: () => void;
}) {
  const sorted = useMemo(() => [...chapters].sort((a, b) => a.order - b.order), [chapters]);

  return (
    <nav
      aria-label="Содержание (мини)"
      className="flex flex-col items-center gap-2 py-2"
    >
      <button
        onClick={onOpen}
        title="Открыть содержание"
        aria-label="Открыть содержание"
        className="w-7 h-7 inline-flex items-center justify-center rounded-md transition-colors mb-1"
        style={{ color: 'var(--gp-ink-3)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gp-surface-muted)'; e.currentTarget.style.color = 'var(--gp-ink)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gp-ink-3)'; }}
      >
        <List size={13} />
      </button>

      <ol className="list-none p-0 m-0 flex flex-col items-center gap-2">
        {sorted.map((ch, idx) => (
          <RailChapter
            key={ch.slug}
            chapter={ch}
            idx={idx}
            isActive={ch.slug === activeChapter}
            activeLesson={ch.slug === activeChapter ? activeLesson : undefined}
            onClick={onOpen}
          />
        ))}
      </ol>
    </nav>
  );
}

function RailChapter({
  chapter, idx, isActive, activeLesson, onClick,
}: {
  chapter: TheoryChapter;
  idx: number;
  isActive: boolean;
  activeLesson?: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const total = chapter.lessons.length;
  const completed = chapter.progress?.completed ?? 0;
  const ratio = total > 0 ? completed / total : 0;
  const allDone = total > 0 && completed >= total;
  const sortedLessons = useMemo(
    () => [...chapter.lessons].sort((a, b) => a.order - b.order),
    [chapter.lessons]
  );
  const lessonIdx = activeLesson
    ? sortedLessons.findIndex((l) => l.slug === activeLesson)
    : -1;

  // Bar dimensions — active chapter is a bit larger and gets per-lesson dots
  const barW = isActive ? 6 : 3;
  const segH = isActive ? 14 : 6;
  const barH = Math.max(24, total * segH);

  const fillColor = allDone ? 'var(--gp-success)' : isActive ? 'var(--gp-ink)' : 'var(--gp-ink-3)';

  const updateTipPos = () => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setTipPos({ top: r.top + r.height / 2, left: r.right + 12 });
  };

  const showTip = () => { updateTipPos(); setHover(true); };
  const hideTip = () => { setHover(false); };

  return (
    <li className="relative">
      <button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={showTip}
        onMouseLeave={hideTip}
        onFocus={showTip}
        onBlur={hideTip}
        aria-label={`${chapter.title} — ${completed} из ${total}`}
        className="relative block rounded-full overflow-hidden transition-all"
        style={{
          width: `${barW}px`,
          height: `${barH}px`,
          background: 'var(--gp-surface-strong)',
          opacity: hover || isActive ? 1 : 0.85,
        }}
      >
        {/* progress fill (top → bottom) */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: `${ratio * 100}%`,
            background: fillColor,
            transition: 'height 0.35s ease',
          }}
        />
        {/* per-lesson dots in the active chapter */}
        {isActive && total > 1 && (
          <span aria-hidden className="absolute inset-0 flex flex-col items-center justify-around py-1">
            {sortedLessons.map((l, i) => {
              const isCurrent = i === lessonIdx;
              return (
                <span
                  key={l.slug}
                  style={{
                    width: isCurrent ? '5px' : '3px',
                    height: isCurrent ? '5px' : '3px',
                    borderRadius: '50%',
                    background: isCurrent
                      ? 'var(--gp-bg)'
                      : l.completed
                        ? 'var(--gp-bg)'
                        : 'var(--gp-ink-4)',
                    opacity: isCurrent ? 1 : l.completed ? 0.9 : 0.5,
                    boxShadow: isCurrent ? '0 0 0 2px var(--gp-ink)' : 'none',
                  }}
                />
              );
            })}
          </span>
        )}
      </button>

      {/* Tooltip — rendered via portal to escape any parent stacking context */}
      {hover && tipPos && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur.fast }}
          className="pointer-events-none whitespace-nowrap rounded-md px-3 py-2"
          style={{
            position: 'fixed',
            top: tipPos.top,
            left: tipPos.left,
            transform: 'translateY(-50%)',
            zIndex: 9999,
            background: 'var(--gp-surface)',
            border: '1px solid var(--gp-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="gp-mono text-[10px]" style={{ color: 'var(--gp-ink-4)' }}>
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-[12.5px] font-medium" style={{ color: 'var(--gp-ink)' }}>
              {chapter.title}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
            {completed}/{total} прочитано{isActive ? ' · текущий' : ''}
          </div>
        </motion.div>,
        document.body
      )}
    </li>
  );
}

/* ---------- Skeleton ---------- */
function ReaderSkeleton() {
  return (
    <div className="min-h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
      <div className="h-12 border-b" style={{ borderColor: 'var(--gp-border)' }} />
      <Container className="grid lg:grid-cols-12 gap-12 pt-10 pb-24">
        <aside className="hidden xl:flex xl:col-span-1 flex-col items-center gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="gp-skel" style={{ width: '4px', height: i === 2 ? '48px' : '28px', borderRadius: 9999 }} />
          ))}
        </aside>
        <div className="lg:col-span-9 xl:col-span-11 max-w-[820px]">
          <div className="h-3 w-24 gp-skel" />
          <div className="h-10 w-3/4 gp-skel mt-4" />
          <div className="h-3 w-full gp-skel mt-4" />
          <div className="h-3 w-2/3 gp-skel mt-2" />
          <div className="space-y-3 mt-12">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-3 w-full gp-skel" />)}
          </div>
        </div>
      </Container>
    </div>
  );
}
