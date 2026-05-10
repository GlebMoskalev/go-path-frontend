import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, ArrowRight, BookOpen, Code2, Brain, FolderGit2, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchUserStats, type UserStats } from '../api';
import { Button, Container, Eyebrow, ProgressRing, ProgressTrack, fadeUp, scaleIn, staggerParent, staggerChild } from '../design';
import { dur, ease } from '../design/motion';
import { CodeBlock } from '../components/CodeBlock';

const SAMPLE = `package main

import (
    "fmt"
    "sync"
)

func processOrder(wg *sync.WaitGroup, id int) {
    defer wg.Done()
    fmt.Printf("Заказ #%d обработан\\n", id)
}

func main() {
    var wg sync.WaitGroup
    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go processOrder(&wg, i)
    }
    wg.Wait()
    fmt.Println("Все заказы обработаны")
}`;

const PATH = [
  { num: '01', to: '/theory',   title: 'Теория',   sub: 'Структурированные уроки с навигацией по главам.', icon: <BookOpen size={16} /> },
  { num: '02', to: '/tasks',    title: 'Задачи',   sub: 'Практика в редакторе с автопроверкой и AI-разбором.', icon: <Code2 size={16} /> },
  { num: '03', to: '/quiz',     title: 'Квизы',    sub: 'Короткие проверки знаний с мгновенной обратной связью.', icon: <Brain size={16} /> },
  { num: '04', to: '/projects', title: 'Проекты',  sub: 'Многошаговые проекты — от REST API до CLI-инструментов.', icon: <FolderGit2 size={16} /> },
];

export function HomePage() {
  const { user, login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setAuthError(error);
      window.history.replaceState({}, '', window.location.pathname);
      const t = setTimeout(() => setAuthError(null), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="relative" style={{ background: 'var(--gp-bg)' }}>
      {/* Auth error toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: dur.base, ease: ease.emphasized }}
            className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[60] w-[min(92%,520px)]"
          >
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-lg"
              style={{
                background: 'var(--gp-surface)',
                border: '1px solid var(--gp-danger)',
                boxShadow: 'var(--gp-shadow-lg)',
              }}
            >
              <XCircle size={18} style={{ color: 'var(--gp-danger)', marginTop: 2, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium" style={{ color: 'var(--gp-ink)' }}>Ошибка авторизации</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--gp-ink-3)' }}>{authError}</div>
              </div>
              <button onClick={() => setAuthError(null)} aria-label="Закрыть" className="opacity-60 hover:opacity-100">
                <XCircle size={14} style={{ color: 'var(--gp-ink-3)' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {user ? <DashboardHero /> : <MarketingHero onLogin={login} />}

      <PathIndex authed={!!user} />

      <CodeShowcase />

      {!user && <FinalCTA onLogin={login} />}

      <FooterMark />
    </div>
  );
}

/* -------------------------------------------------- */
/* Hero — unauthenticated · editorial / magazine vibe */
/* -------------------------------------------------- */
function MarketingHero({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="pt-14 sm:pt-20 md:pt-28 pb-14 sm:pb-20 md:pb-28">
      <Container>
        <motion.div initial="hidden" animate="visible" variants={staggerParent(0.08)}>
          <motion.div variants={staggerChild} className="flex items-center gap-3">
            <Eyebrow>Vol. 01 · 2026</Eyebrow>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--gp-ink-4)' }}>
              <span className="gp-path-line-h w-8" />
              Интерактивная платформа
            </span>
          </motion.div>

          <motion.h1
            variants={staggerChild}
            className="gp-display mt-5 sm:mt-6 max-w-[16ch]"
            style={{ fontSize: 'clamp(34px, 7vw, 84px)' }}
          >
            Go,&nbsp;
            <em>проложенный</em>
            <br />
            ясной&nbsp;тропой.
          </motion.h1>

          <motion.p
            variants={staggerChild}
            className="mt-5 sm:mt-7 max-w-[58ch] text-[15px] sm:text-[17px] md:text-[18px]"
            style={{ color: 'var(--gp-ink-2)', lineHeight: 1.55 }}
          >
            Обучение Go в одном месте — теория, задачи, квизы и проекты. Без шумной геймификации:
            спокойная типографика, продуманные шаги, обратная связь, которой можно доверять.
          </motion.p>

          <motion.div variants={staggerChild} className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3">
            <Button size="lg" variant="primary" onClick={onLogin} iconRight={<ArrowRight size={15} />}>
              Начать путь
            </Button>
            <Link to="/theory" className="no-underline">
              <Button size="lg" variant="ghost" iconRight={<ArrowUpRight size={15} />}>
                Открыть теорию
              </Button>
            </Link>
            <span className="text-[12px] sm:ml-1 w-full sm:w-auto" style={{ color: 'var(--gp-ink-4)' }}>
              Бесплатно · Google OAuth
            </span>
          </motion.div>
        </motion.div>
      </Container>

      {/* Subtle hairline + dotted "path" — single-use motif */}
      <Container className="mt-14 sm:mt-20">
        <div className="flex items-center gap-4">
          <span className="text-[11px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
            ↓ путь
          </span>
          <span className="flex-1 gp-path-line-h" />
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------- */
/* Hero — authenticated · personal dashboard          */
/* -------------------------------------------------- */
function DashboardHero() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const theoryRatio = stats ? safeRatio(stats.theory.completed_lessons, stats.theory.total_lessons) : 0;
  const tasksRatio = stats ? safeRatio(stats.tasks.solved_tasks, stats.tasks.total_tasks) : 0;
  const projectsRatio = stats ? safeRatio(stats.projects.solved_steps, stats.projects.total_steps) : 0;
  const overall = (theoryRatio + tasksRatio + projectsRatio) / 3;

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <section className="pt-10 sm:pt-14 md:pt-20 pb-10 sm:pb-12">
      <Container>
        <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)}>
          <motion.div variants={staggerChild}>
            <Eyebrow>Сегодня · продолжаем путь</Eyebrow>
          </motion.div>

          <motion.h1
            variants={staggerChild}
            className="gp-display mt-5"
            style={{ fontSize: 'clamp(28px, 4.6vw, 56px)' }}
          >
            С возвращением,&nbsp;
            <em>{firstName || 'друг'}</em>.
          </motion.h1>

          <motion.p variants={staggerChild} className="mt-4 max-w-[62ch] text-[15px] sm:text-[16px]" style={{ color: 'var(--gp-ink-3)' }}>
            Маленькие шаги — большой прогресс. Возьми сегодня по уроку из каждого раздела.
          </motion.p>

          <motion.div variants={staggerChild} className="mt-8 sm:mt-12 grid gap-4 md:grid-cols-12">
            {/* Overall ring */}
            <div className="md:col-span-4 gp-card p-5 sm:p-6 flex items-center gap-4 sm:gap-5">
              <div className="flex-shrink-0">
                <ProgressRing value={overall} size={76} stroke={5} tone="ink">
                  <span className="text-[14px] font-medium gp-mono" style={{ color: 'var(--gp-ink)' }}>
                    {Math.round(overall * 100)}%
                  </span>
                </ProgressRing>
              </div>
              <div className="min-w-0">
                <div className="text-[12px]" style={{ color: 'var(--gp-ink-3)' }}>Общий прогресс</div>
                <div className="mt-1 text-[18px] sm:text-[20px] font-medium" style={{ color: 'var(--gp-ink)', letterSpacing: '-0.01em' }}>
                  {loading ? <span className="inline-block w-24 h-5 gp-skel" /> : describeOverall(overall)}
                </div>
                <div className="mt-1 text-[12px]" style={{ color: 'var(--gp-ink-4)' }}>
                  По теории, задачам и проектам
                </div>
              </div>
            </div>

            {/* Per-track tracks */}
            <div className="md:col-span-8 gp-card p-5 sm:p-6 grid gap-4 sm:gap-5">
              <TrackRow
                to="/theory"
                title="Теория"
                value={theoryRatio}
                done={stats?.theory.completed_lessons ?? 0}
                total={stats?.theory.total_lessons ?? 0}
                icon={<BookOpen size={14} />}
                loading={loading}
              />
              <span className="gp-path-line-h" />
              <TrackRow
                to="/tasks"
                title="Задачи"
                value={tasksRatio}
                done={stats?.tasks.solved_tasks ?? 0}
                total={stats?.tasks.total_tasks ?? 0}
                icon={<Code2 size={14} />}
                loading={loading}
              />
              <span className="gp-path-line-h" />
              <TrackRow
                to="/projects"
                title="Проекты"
                value={projectsRatio}
                done={stats?.projects.solved_steps ?? 0}
                total={stats?.projects.total_steps ?? 0}
                icon={<FolderGit2 size={14} />}
                loading={loading}
              />
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function TrackRow({
  to, title, value, done, total, icon, loading,
}: { to: string; title: string; value: number; done: number; total: number; icon: React.ReactNode; loading: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-3 sm:gap-5 no-underline">
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
        style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink-2)' }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-[14px] font-medium transition-colors group-hover:underline underline-offset-4" style={{ color: 'var(--gp-ink)' }}>
            {title}
          </span>
          <span className="text-[12px] gp-mono flex-shrink-0" style={{ color: 'var(--gp-ink-3)' }}>
            {loading ? <span className="inline-block w-12 h-3 gp-skel" /> : `${done}/${total}`}
          </span>
        </div>
        <ProgressTrack value={value} tone={value === 1 ? 'success' : 'ink'} />
      </div>
      <ArrowUpRight size={14} className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--gp-ink-3)' }} />
    </Link>
  );
}

function describeOverall(v: number) {
  if (v === 0) return 'Только начинаем';
  if (v < 0.25) return 'Уверенный старт';
  if (v < 0.5) return 'Идём ровно';
  if (v < 0.75) return 'Большая часть пути';
  if (v < 1) return 'Финишная прямая';
  return 'Путь пройден';
}

function safeRatio(a: number, b: number) {
  if (!b) return 0;
  return Math.max(0, Math.min(1, a / b));
}

/* -------------------------------------------------- */
/* Path index — table-of-contents style               */
/* -------------------------------------------------- */
function PathIndex({ authed }: { authed: boolean }) {
  return (
    <section className="py-14 sm:py-20 md:py-24" style={{ borderTop: '1px solid var(--gp-border)' }}>
      <Container>
        <div className="grid md:grid-cols-12 gap-8 md:gap-10">
          <div className="md:col-span-4">
            <Eyebrow marker={false}>Содержание</Eyebrow>
            <h2 className="gp-display mt-4" style={{ fontSize: 'clamp(24px, 3.6vw, 44px)' }}>
              Четыре <em>опоры</em> курса.
            </h2>
            <p className="mt-4 text-[14px] sm:text-[15px] max-w-[42ch]" style={{ color: 'var(--gp-ink-3)' }}>
              {authed
                ? 'Каждый раздел — самостоятельный, но они работают лучше вместе. Перемещайся свободно.'
                : 'Каждый формат отвечает за свою сторону обучения и усиливает остальные.'}
            </p>
          </div>

          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerParent(0.07)}
            className="md:col-span-8 list-none p-0 m-0 grid"
            style={{ borderTop: '1px solid var(--gp-border)' }}
          >
            {PATH.map((p) => (
              <motion.li key={p.to} variants={staggerChild} style={{ borderBottom: '1px solid var(--gp-border)' }}>
                <Link
                  to={p.to}
                  className="group flex items-center gap-3 sm:gap-6 py-4 sm:py-6 no-underline transition-colors"
                  style={{ color: 'var(--gp-ink)' }}
                >
                  <span
                    className="text-[12px] gp-mono w-6 sm:w-8 flex-shrink-0"
                    style={{ color: 'var(--gp-ink-4)' }}
                  >
                    {p.num}
                  </span>
                  <span className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="inline-flex w-8 h-8 items-center justify-center rounded-md flex-shrink-0"
                      style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink-2)' }}
                    >
                      {p.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] sm:text-[18px] font-medium" style={{ letterSpacing: '-0.01em' }}>
                        {p.title}
                      </span>
                      <span className="block text-[12.5px] sm:text-[13px] mt-0.5 truncate" style={{ color: 'var(--gp-ink-3)' }}>
                        {p.sub}
                      </span>
                    </span>
                  </span>
                  <span
                    className="hidden md:inline-flex items-center gap-2 text-[12px] transition-transform group-hover:-translate-x-1 flex-shrink-0"
                    style={{ color: 'var(--gp-ink-3)' }}
                  >
                    Открыть <ArrowUpRight size={13} />
                  </span>
                </Link>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------- */
/* Code showcase — printed page feeling               */
/* -------------------------------------------------- */
function CodeShowcase() {
  return (
    <section className="py-12 sm:py-16 md:py-24" style={{ borderTop: '1px solid var(--gp-border)' }}>
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="grid md:grid-cols-12 gap-8 md:gap-10 items-start"
        >
          <div className="md:col-span-5">
            <Eyebrow>Пример</Eyebrow>
            <h2 className="gp-display mt-4" style={{ fontSize: 'clamp(22px, 3.4vw, 40px)' }}>
              Конкурентность <em>с первых строк</em>.
            </h2>
            <p className="mt-4 text-[14px] sm:text-[15px] max-w-[42ch]" style={{ color: 'var(--gp-ink-3)' }}>
              Каждый урок сопровождается работающим кодом, который ты запускаешь и меняешь сам — без копирования из учебника.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[12px]" style={{ color: 'var(--gp-ink-4)' }}>
              <Sparkles size={13} /> Подсветка, объяснение, AI-разбор кода
            </div>
          </div>
          <motion.div variants={scaleIn} className="md:col-span-7 min-w-0">
            <div className="overflow-x-auto">
              <CodeBlock filename="goroutine_example.go" language="go" code={SAMPLE} />
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------- */
/* Final CTA — quiet, single button                   */
/* -------------------------------------------------- */
function FinalCTA({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="py-16 sm:py-24 md:py-32" style={{ borderTop: '1px solid var(--gp-border)' }}>
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="max-w-[720px]"
        >
          <Eyebrow>Готов?</Eyebrow>
          <h2 className="gp-display mt-4" style={{ fontSize: 'clamp(26px, 4.4vw, 56px)' }}>
            Один <em>клик</em> до первого урока.
          </h2>
          <p className="mt-4 text-[14px] sm:text-[15px] max-w-[48ch]" style={{ color: 'var(--gp-ink-3)' }}>
            Войди через Google — и продолжишь ровно с того места, где остановишься. Никакой регистрации, никаких форм.
          </p>
          <div className="mt-7 sm:mt-8">
            <Button size="lg" variant="primary" onClick={onLogin} iconRight={<ArrowRight size={15} />}>
              Войти и начать
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------- */
/* Footer — minimal mark                              */
/* -------------------------------------------------- */
function FooterMark() {
  return (
    <footer style={{ borderTop: '1px solid var(--gp-border)' }} className="py-8 sm:py-10">
      <Container className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gp-accent)' }} />
          <span className="text-[13px] font-medium" style={{ color: 'var(--gp-ink-2)' }}>Go Path</span>
          <span className="text-[12px] sm:ml-2" style={{ color: 'var(--gp-ink-4)' }}>
            © 2026 · Интерактивная платформа изучения Go
          </span>
        </div>
        <nav className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {PATH.map((p) => (
            <Link key={p.to} to={p.to} className="text-[13px] no-underline transition-colors hover:underline underline-offset-4" style={{ color: 'var(--gp-ink-3)' }}>
              {p.title}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
