import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Check, ArrowUpRight, MapPin, Flag } from 'lucide-react';
import { fetchProjects, type ProjectSummary } from '../api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { Container, Eyebrow, ProgressTrack, staggerParent, staggerChild } from '../design';
import { dur, ease } from '../design/motion';

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects()
      .then((data) => setProjects([...data].sort((a, b) => a.order - b.order)))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const totals = useMemo(() => {
    let total = 0;
    let solved = 0;
    projects.forEach((p) => {
      total += p.steps.length;
      solved += p.solved_count ?? 0;
    });
    return { total, solved, ratio: total ? solved / total : 0 };
  }, [projects]);

  return (
    <div style={{ background: 'var(--gp-bg)', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <header className="pt-14 pb-10" style={{ borderBottom: '1px solid var(--gp-border)' }}>
        <Container>
          <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)} className="grid md:grid-cols-12 gap-10 items-end">
            <div className="md:col-span-7">
              <motion.div variants={staggerChild}>
                <Eyebrow>Раздел · 04</Eyebrow>
              </motion.div>
              <motion.h1 variants={staggerChild} className="gp-display mt-4" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
                <em>Маршрут</em> по реальным
                <br />
                Go-проектам.
              </motion.h1>
              <motion.p variants={staggerChild} className="mt-5 max-w-[60ch] text-[16px]" style={{ color: 'var(--gp-ink-3)' }}>
                Каждый проект — это связанная цепочка шагов: от первой строки до работающего сервиса. Прогресс сохраняется, а возвращаться можно к любой точке маршрута.
              </motion.p>
            </div>

            <motion.div variants={staggerChild} className="md:col-span-5">
              <div className="gp-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <Eyebrow marker={false}>Шагов пройдено</Eyebrow>
                  <span className="text-[12px] gp-mono" style={{ color: 'var(--gp-ink-3)' }}>
                    {isLoading ? '—' : `${totals.solved} из ${totals.total}`}
                  </span>
                </div>
                <ProgressTrack value={totals.ratio} tone={totals.ratio === 1 ? 'success' : 'ink'} height={3} />
                <div className="mt-4 text-[12px]" style={{ color: 'var(--gp-ink-4)' }}>
                  Шаги выполняются в редакторе; AI помогает разобрать решение или ошибки.
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </header>

      {/* Roadmap */}
      <Container className="py-12">
        {isLoading ? (
          <RoadmapSkeleton />
        ) : (
          <motion.div initial="hidden" animate="visible" variants={staggerParent(0.08)} className="grid gap-12">
            {projects.map((p, idx) => (
              <ProjectRoadmap key={p.slug} project={p} idx={idx + 1} />
            ))}
          </motion.div>
        )}
      </Container>
    </div>
  );
}

function ProjectRoadmap({ project, idx }: { project: ProjectSummary; idx: number }) {
  const total = project.steps.length;
  const solved = project.solved_count ?? 0;
  const ratio = total ? solved / total : 0;
  const done = ratio === 1;
  const sortedSteps = [...project.steps].sort((a, b) => a.order - b.order);

  return (
    <motion.section variants={staggerChild}>
      {/* Project header */}
      <div className="grid md:grid-cols-12 gap-8 mb-6">
        <div className="md:col-span-4">
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
          <h2 className="mt-3 font-medium" style={{ fontSize: '24px', letterSpacing: '-0.025em', color: 'var(--gp-ink)', lineHeight: 1.15 }}>
            {project.title}
          </h2>
          <p className="mt-2 text-[14px]" style={{ color: 'var(--gp-ink-3)', lineHeight: 1.55 }}>
            {project.description}
          </p>
          <div className="mt-4">
            <ProgressTrack value={ratio} tone={done ? 'success' : 'ink'} height={2} />
            <div className="mt-2 text-[11px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
              {solved}/{total} шагов
            </div>
          </div>
        </div>

        {/* Roadmap on the right */}
        <div className="md:col-span-8 relative">
          {/* The dotted path itself — runs vertically through all stations */}
          <span
            aria-hidden
            className="absolute top-3 bottom-3 left-[14px]"
            style={{
              width: 1,
              backgroundImage: 'radial-gradient(circle, var(--gp-border-strong) 1px, transparent 1px)',
              backgroundSize: '1px 8px',
            }}
          />
          {/* Filled portion of the path = progress so far */}
          {ratio > 0 && (
            <motion.span
              aria-hidden
              className="absolute top-3 left-[14px]"
              initial={{ height: 0 }}
              whileInView={{ height: `calc(${ratio * 100}% - 24px)` }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: dur.page, ease: ease.emphasized, delay: 0.1 }}
              style={{ width: 1, background: done ? 'var(--gp-success)' : 'var(--gp-ink)' }}
            />
          )}

          <ol className="relative grid gap-1 list-none p-0 m-0">
            {sortedSteps.map((step, i) => (
              <Station
                key={step.slug}
                step={step}
                projectSlug={project.slug}
                index={i + 1}
                isFirst={i === 0}
                isLast={i === sortedSteps.length - 1}
              />
            ))}
          </ol>
        </div>
      </div>
    </motion.section>
  );
}

function Station({
  step, projectSlug, index, isFirst, isLast,
}: {
  step: ProjectSummary['steps'][number];
  projectSlug: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const solved = !!step.solved;

  return (
    <li>
      <Link
        to={`/projects/${projectSlug}/${step.slug}`}
        className="group relative flex items-center gap-4 py-3 pl-0 pr-2 no-underline rounded-md transition-colors"
        style={{ color: 'var(--gp-ink)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gp-surface-muted)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Station marker */}
        <span
          className="relative z-10 inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 transition-transform group-hover:scale-105"
          style={{
            background: solved ? 'var(--gp-success)' : 'var(--gp-bg)',
            color: solved ? '#fff' : 'var(--gp-ink-3)',
            border: solved ? '1px solid var(--gp-success)' : '1px solid var(--gp-border-strong)',
            boxShadow: solved ? 'none' : '0 0 0 4px var(--gp-bg)', // mask the dotted line behind unsolved markers
          }}
        >
          {isFirst && !solved ? (
            <MapPin size={12} />
          ) : isLast && !solved ? (
            <Flag size={11} />
          ) : solved ? (
            <Check size={12} strokeWidth={2.5} />
          ) : (
            <span className="text-[10px] gp-mono">{String(index).padStart(2, '0')}</span>
          )}
        </span>

        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium leading-snug truncate group-hover:underline underline-offset-4" style={{ letterSpacing: '-0.005em' }}>
            {step.title}
          </span>
          <span className="block text-[13px] mt-0.5 truncate" style={{ color: 'var(--gp-ink-3)' }}>
            {step.description}
          </span>
        </span>

        <DifficultyBadge difficulty={step.difficulty} variant="glyph" />
        <ArrowUpRight size={14} style={{ color: 'var(--gp-ink-4)' }} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </Link>
    </li>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="grid gap-12">
      {[0, 1].map((i) => (
        <div key={i} className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-3">
            <div className="h-3 w-10 gp-skel" />
            <div className="h-7 w-3/4 gp-skel" />
            <div className="h-3 w-full gp-skel" />
            <div className="h-1 w-full gp-skel mt-4" />
          </div>
          <div className="md:col-span-8 space-y-3 pl-2">
            {[0, 1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-4 py-3">
                <div className="w-7 h-7 rounded-full gp-skel" />
                <div className="h-4 flex-1 gp-skel" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
