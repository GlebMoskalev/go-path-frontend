import { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Check, Circle } from 'lucide-react';
import type { TheoryChapter } from '../../api';
import { cn } from '../ui/utils';
import { dur, ease } from '../../design/motion';

interface Props {
  chapters: TheoryChapter[];
  activeChapter?: string;
  activeLesson?: string;
  className?: string;
  onLessonClick?: () => void;
}

/**
 * A calm, collapsible chapter tree. Used in the lesson reader as a slim
 * navigator and in mobile drawer.
 */
export function TheoryTOC({ chapters, activeChapter, activeLesson, className, onLessonClick }: Props) {
  // Default: only the active chapter expanded; if no active, expand the first.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const init = new Set<string>();
    if (activeChapter) init.add(activeChapter);
    else if (chapters[0]) init.add(chapters[0].slug);
    return init;
  });

  const toggle = (slug: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  return (
    <nav className={cn('text-[13px]', className)} aria-label="Содержание">
      <div
        className="px-1 pb-3 mb-2 border-b"
        style={{ borderColor: 'var(--gp-border)' }}
      >
        <span className="gp-eyebrow">Содержание</span>
      </div>

      <ol className="list-none p-0 m-0">
        {chapters.map((chapter, idx) => {
          const completed = chapter.progress?.completed ?? 0;
          const total = chapter.lessons.length;
          const open = expanded.has(chapter.slug);
          const isActive = chapter.slug === activeChapter;

          return (
            <li key={chapter.slug} className="mb-1">
              <button
                onClick={() => toggle(chapter.slug)}
                className="group w-full flex items-start gap-2.5 py-2 px-2 text-left rounded-md transition-colors"
                style={{
                  background: open ? 'var(--gp-surface-muted)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!open) e.currentTarget.style.background = 'var(--gp-surface-muted)';
                }}
                onMouseLeave={(e) => {
                  if (!open) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  className="text-[10px] gp-mono mt-0.5 w-4 flex-shrink-0"
                  style={{ color: 'var(--gp-ink-4)' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className="block leading-snug font-medium"
                    style={{ color: isActive ? 'var(--gp-ink)' : 'var(--gp-ink-2)' }}
                  >
                    {chapter.title}
                  </span>
                  <span className="block text-[11px] mt-0.5 gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
                    {completed}/{total}
                  </span>
                </span>
                <motion.span
                  animate={{ rotate: open ? 90 : 0 }}
                  transition={{ duration: dur.fast }}
                  className="mt-1 flex-shrink-0"
                  style={{ color: 'var(--gp-ink-4)' }}
                >
                  <ChevronRight size={13} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.ol
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: dur.base, ease: ease.emphasized }}
                    className="overflow-hidden list-none p-0 m-0 ml-6 border-l"
                    style={{ borderColor: 'var(--gp-border)' }}
                  >
                    {chapter.lessons.map((lesson) => {
                      const isCurrent = activeLesson === lesson.slug && isActive;
                      return (
                        <li key={lesson.slug}>
                          <Link
                            to={`/theory/${chapter.slug}/${lesson.slug}`}
                            onClick={onLessonClick}
                            className="group flex items-center gap-2 pl-3 pr-2 py-1.5 no-underline transition-colors"
                            style={{
                              color: isCurrent ? 'var(--gp-ink)' : 'var(--gp-ink-3)',
                              background: isCurrent ? 'var(--gp-surface-muted)' : 'transparent',
                              borderRadius: '0 6px 6px 0',
                              fontWeight: isCurrent ? 500 : 400,
                              position: 'relative',
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) {
                                e.currentTarget.style.color = 'var(--gp-ink)';
                                e.currentTarget.style.background = 'var(--gp-surface-muted)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) {
                                e.currentTarget.style.color = 'var(--gp-ink-3)';
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            {isCurrent && (
                              <span
                                className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-px h-4"
                                style={{ background: 'var(--gp-ink)' }}
                              />
                            )}
                            {lesson.completed ? (
                              <Check size={11} style={{ color: 'var(--gp-success)', flexShrink: 0 }} strokeWidth={2.5} />
                            ) : (
                              <Circle size={9} style={{ color: 'var(--gp-ink-5)', flexShrink: 0 }} />
                            )}
                            <span className="text-[12.5px] leading-snug truncate">{lesson.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </motion.ol>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
