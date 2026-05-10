import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Check, ArrowUpRight, BookOpen } from 'lucide-react';
import { fetchTheoryChapters, type TheoryChapter } from '../api';
import { Container, Eyebrow, ProgressTrack, staggerParent, staggerChild } from '../design';

export function TheoryPage() {
  const [chapters, setChapters] = useState<TheoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTheoryChapters()
      .then((data) => setChapters([...data].sort((a, b) => a.order - b.order)))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const totals = useMemo(() => {
    let lessons = 0;
    let completed = 0;
    chapters.forEach((c) => {
      lessons += c.lessons.length;
      completed += c.progress?.completed ?? 0;
    });
    return { lessons, completed, ratio: lessons ? completed / lessons : 0 };
  }, [chapters]);

  // Find first incomplete lesson — for the "Continue reading" CTA
  const continueAt = useMemo(() => {
    for (const c of chapters) {
      const lesson = c.lessons.find((l) => !l.completed);
      if (lesson) return { chapter: c, lesson };
    }
    return null;
  }, [chapters]);

  return (
    <div className="min-h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
      {/* Page header */}
      <header className="pt-10 sm:pt-14 pb-8 sm:pb-10" style={{ borderBottom: '1px solid var(--gp-border)' }}>
        <Container>
          <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)} className="grid md:grid-cols-12 gap-8 md:gap-10 items-end">
            <div className="md:col-span-7">
              <motion.div variants={staggerChild}>
                <Eyebrow>Раздел · 01</Eyebrow>
              </motion.div>
              <motion.h1
                variants={staggerChild}
                className="gp-display mt-4"
                style={{ fontSize: 'clamp(28px, 5vw, 60px)' }}
              >
                <em>Теория</em> Go,
                <br />
                от основ до конкурентности.
              </motion.h1>
              <motion.p variants={staggerChild} className="mt-4 sm:mt-5 max-w-[58ch] text-[14px] sm:text-[16px]" style={{ color: 'var(--gp-ink-3)' }}>
                Уроки выстроены последовательно. Читай по порядку или открывай интересующее — каждый урок самодостаточен и оставляет за собой пометку «прочитано».
              </motion.p>
            </div>

            {/* Stats column */}
            <motion.div variants={staggerChild} className="md:col-span-5">
              <div className="gp-card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <Eyebrow marker={false}>Прогресс</Eyebrow>
                  <span className="text-[12px] gp-mono" style={{ color: 'var(--gp-ink-3)' }}>
                    {isLoading ? '—' : `${totals.completed} из ${totals.lessons}`}
                  </span>
                </div>
                <ProgressTrack value={totals.ratio} tone={totals.ratio === 1 ? 'success' : 'ink'} height={3} />
                {continueAt ? (
                  <Link
                    to={`/theory/${continueAt.chapter.slug}/${continueAt.lesson.slug}`}
                    className="group mt-6 -mx-2 px-2 py-2 rounded-md no-underline flex items-start gap-3 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gp-surface-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      className="inline-flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0"
                      style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink-2)' }}
                    >
                      <BookOpen size={15} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px]" style={{ color: 'var(--gp-ink-4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Продолжить с
                      </span>
                      <span className="block text-[14px] font-medium truncate" style={{ color: 'var(--gp-ink)' }}>
                        {continueAt.lesson.title}
                      </span>
                      <span className="block text-[12px] truncate" style={{ color: 'var(--gp-ink-3)' }}>
                        {continueAt.chapter.title}
                      </span>
                    </span>
                    <ArrowUpRight size={14} style={{ color: 'var(--gp-ink-3)' }} className="mt-1.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                ) : !isLoading ? (
                  <div className="mt-6 text-[13px]" style={{ color: 'var(--gp-ink-3)' }}>
                    Все уроки прочитаны. Загляни в задачи или возьми проект.
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </header>

      {/* Chapters as table of contents */}
      <Container className="py-8 sm:py-12">
        {isLoading ? (
          <ChapterIndexSkeleton />
        ) : (
          <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)} className="grid gap-10 sm:gap-12">
            {chapters.map((chapter, idx) => (
              <ChapterSection key={chapter.slug} chapter={chapter} idx={idx + 1} />
            ))}
          </motion.div>
        )}
      </Container>
    </div>
  );
}

/* ---------- Chapter section: editorial TOC style ---------- */
function ChapterSection({ chapter, idx }: { chapter: TheoryChapter; idx: number }) {
  const completed = chapter.progress?.completed ?? 0;
  const total = chapter.lessons.length;
  const ratio = total ? completed / total : 0;
  const done = ratio === 1;

  return (
    <motion.section variants={staggerChild} className="grid md:grid-cols-12 gap-6 md:gap-10">
      {/* Chapter meta column */}
      <div className="md:col-span-4">
        <div className="md:sticky md:top-[88px]">
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
          <h2
            className="mt-3 font-medium"
            style={{ fontSize: '22px', letterSpacing: '-0.02em', color: 'var(--gp-ink)', lineHeight: 1.2 }}
          >
            {chapter.title}
          </h2>
          <p className="mt-2 text-[13.5px]" style={{ color: 'var(--gp-ink-3)', lineHeight: 1.55 }}>
            {chapter.description}
          </p>
          <div className="mt-4">
            <ProgressTrack value={ratio} tone={done ? 'success' : 'ink'} height={2} />
            <div className="mt-2 text-[11px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
              {completed}/{total} уроков
            </div>
          </div>
        </div>
      </div>

      {/* Lesson list */}
      <ol className="md:col-span-8 list-none p-0 m-0" style={{ borderTop: '1px solid var(--gp-border)' }}>
        {chapter.lessons.map((lesson, i) => (
          <li key={lesson.slug} style={{ borderBottom: '1px solid var(--gp-border)' }}>
            <Link
              to={`/theory/${chapter.slug}/${lesson.slug}`}
              className="group flex items-center gap-3 sm:gap-4 py-3.5 sm:py-4 no-underline"
              style={{ color: 'var(--gp-ink)' }}
            >
              <span
                className="text-[11px] gp-mono w-6 sm:w-7 flex-shrink-0"
                style={{ color: 'var(--gp-ink-4)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-shrink-0">
                {lesson.completed ? (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                    style={{ background: 'var(--gp-success-soft)', color: 'var(--gp-success)' }}
                  >
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                ) : (
                  <span
                    className="inline-block w-5 h-5 rounded-full border"
                    style={{ borderColor: 'var(--gp-border-strong)' }}
                  />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] sm:text-[15.5px] font-medium leading-snug truncate group-hover:underline underline-offset-4" style={{ letterSpacing: '-0.005em' }}>
                  {lesson.title}
                </span>
                <span className="block text-[12.5px] sm:text-[13px] mt-0.5 truncate" style={{ color: 'var(--gp-ink-3)' }}>
                  {lesson.description}
                </span>
              </span>
              <ArrowUpRight
                size={14}
                style={{ color: 'var(--gp-ink-4)' }}
                className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              />
            </Link>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

/* ---------- Skeleton ---------- */
function ChapterIndexSkeleton() {
  return (
    <div className="grid gap-12">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <div className="h-3 w-10 gp-skel" />
            <div className="h-6 w-3/4 gp-skel" />
            <div className="h-3 w-full gp-skel" />
            <div className="h-3 w-2/3 gp-skel" />
            <div className="h-1 w-full gp-skel mt-4" />
          </div>
          <div className="md:col-span-8 space-y-3">
            {[0, 1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-4 py-3">
                <div className="h-3 w-6 gp-skel" />
                <div className="h-5 w-5 rounded-full gp-skel" />
                <div className="h-4 flex-1 gp-skel" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

