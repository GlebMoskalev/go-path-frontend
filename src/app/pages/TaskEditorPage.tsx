import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import {
  ChevronRight, ChevronLeft, Play, Sparkles, Check, AlertCircle, History,
  XCircle, ChevronDown, FileText, RotateCcw, Loader2, Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchTask, submitTask, analyzeTask, analyzeErrorTask, fetchTaskChapters,
  type TaskDetail, type TaskChapter,
} from '../api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CodeEditor } from '../components/CodeEditor';
import { TestResults, type TestResult } from '../components/TestResults';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { SplitPane } from '../components/SplitPane';
import { useAuth } from '../context/AuthContext';
import { useGopherMood } from '../context/GopherMoodContext';
import { Button } from '../design';
import { dur, ease } from '../design/motion';
import { cn } from '../components/ui/utils';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface NavItem { href: string; title: string; }
interface TaskNav { prev: NavItem | null; next: NavItem | null; }

function buildTaskNav(chapters: TaskChapter[], chapterSlug: string, taskSlug: string): TaskNav {
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const chIdx = sorted.findIndex((c) => c.slug === chapterSlug);
  if (chIdx === -1) return { prev: null, next: null };

  const chapter = sorted[chIdx];
  const tasks = [...chapter.tasks].sort((a, b) => a.order - b.order);
  const tIdx = tasks.findIndex((t) => t.slug === taskSlug);
  if (tIdx === -1) return { prev: null, next: null };

  let prev: NavItem | null = null;
  let next: NavItem | null = null;

  if (tIdx > 0) {
    const p = tasks[tIdx - 1];
    prev = { href: `/tasks/${chapterSlug}/${p.slug}`, title: p.title };
  } else if (chIdx > 0) {
    const prevCh = sorted[chIdx - 1];
    const prevTasks = [...prevCh.tasks].sort((a, b) => a.order - b.order);
    if (prevTasks.length > 0) {
      const p = prevTasks[prevTasks.length - 1];
      prev = { href: `/tasks/${prevCh.slug}/${p.slug}`, title: p.title };
    }
  }

  if (tIdx < tasks.length - 1) {
    const n = tasks[tIdx + 1];
    next = { href: `/tasks/${chapterSlug}/${n.slug}`, title: n.title };
  } else if (chIdx < sorted.length - 1) {
    const nextCh = sorted[chIdx + 1];
    const nextTasks = [...nextCh.tasks].sort((a, b) => a.order - b.order);
    if (nextTasks.length > 0) {
      const n = nextTasks[0];
      next = { href: `/tasks/${nextCh.slug}/${n.slug}`, title: n.title };
    }
  }

  return { prev, next };
}

export function TaskEditorPage() {
  const { chapterId, taskId } = useParams<{ chapterId: string; taskId: string }>();
  const { user } = useAuth();
  const { setMood } = useGopherMood();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiMode, setAiMode] = useState<'solution' | 'error' | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'ai'>('tests');
  const [nav, setNav] = useState<TaskNav>({ prev: null, next: null });

  const [selectedSubmissionIdx, setSelectedSubmissionIdx] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openHints, setOpenHints] = useState<number[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const lastSubmittedCodeRef = useRef<string | null>(null);

  // Close history on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!chapterId || !taskId) return;
    let cancelled = false;
    setIsLoading(true);

    const taskPromise = fetchTask(chapterId, taskId).then((data) => {
      if (cancelled) return;
      setTask(data);
      setSubmitted(data.solved || false);
      setAiRecommendation('');
      setSelectedSubmissionIdx(null);
      lastSubmittedCodeRef.current = null;
      if (data.submissions && data.submissions.length > 0) {
        const latest = data.submissions[0];
        setCode(latest.code);
        setSelectedSubmissionIdx(0);
        if (latest.result && latest.result.tests) {
          setTestResults(latest.result.tests.map((t) => ({ id: t.name, name: t.name, passed: t.passed, output: t.output, expected: '' })));
        } else if (latest.result?.error) {
          setTestResults([{ id: 'error', name: 'Ошибка компиляции', passed: false, output: latest.result.error, expected: '' }]);
        } else {
          setTestResults([]);
        }
        if (latest.passed) lastSubmittedCodeRef.current = latest.code;
      } else {
        setCode(data.template);
        setTestResults([]);
      }
    });

    const chaptersPromise = fetchTaskChapters().then((chapters) => {
      if (cancelled) return;
      setNav(buildTaskNav(chapters, chapterId, taskId));
    });

    Promise.all([taskPromise, chaptersPromise])
      .catch((err) => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [chapterId, taskId]);

  const submissions = useMemo(() => task?.submissions || [], [task]);

  const handleSelectSubmission = (idx: number) => {
    const sub = submissions[idx];
    if (!sub) return;
    setCode(sub.code);
    setSelectedSubmissionIdx(idx);
    setHistoryOpen(false);
    if (sub.result && sub.result.tests) {
      setTestResults(sub.result.tests.map((t) => ({ id: t.name, name: t.name, passed: t.passed, output: t.output, expected: '' })));
    } else if (sub.result?.error) {
      setTestResults([{ id: 'error', name: 'Ошибка компиляции', passed: false, output: sub.result.error, expected: '' }]);
    } else {
      setTestResults([]);
    }
    lastSubmittedCodeRef.current = sub.passed ? sub.code : null;
    setActiveTab('tests');
  };

  const handleUseTemplate = () => {
    if (!task) return;
    setCode(task.template);
    setSelectedSubmissionIdx(null);
    setTestResults([]);
    setHistoryOpen(false);
    lastSubmittedCodeRef.current = null;
  };

  const toggleHint = (index: number) => {
    setOpenHints((prev) => prev.includes(index) ? prev.filter((h) => h !== index) : [...prev, index]);
  };

  const handleSubmit = async () => {
    if (!chapterId || !taskId) return;
    setIsRunning(true);
    setActiveTab('tests');
    try {
      const result = await submitTask(chapterId, taskId, code);
      const results: TestResult[] = (result.tests || []).map((t) => ({
        id: t.name, name: t.name, passed: t.passed, output: t.output, expected: '',
      }));
      if (result.error && results.length === 0) {
        results.push({ id: 'error', name: 'Ошибка компиляции', passed: false, output: result.error, expected: '' });
      }
      setTestResults(results);
      if (result.passed) {
        setSubmitted(true);
        lastSubmittedCodeRef.current = code;
        setMood('happy');
      } else {
        setMood('sad');
      }
      setSelectedSubmissionIdx(null);
      fetchTask(chapterId, taskId)
        .then((data) => { setTask(data); if (data.submissions?.length) setSelectedSubmissionIdx(0); })
        .catch(() => {});
    } catch (error) {
      setTestResults([{ id: 'error', name: 'Ошибка', passed: false, output: error instanceof Error ? error.message : 'Произошла ошибка', expected: '' }]);
      setMood('sad');
    } finally {
      setIsRunning(false);
    }
  };

  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);
  const hasFailed = testResults.length > 0 && testResults.some((r) => !r.passed);
  const codeChanged = allPassed && lastSubmittedCodeRef.current !== null && code !== lastSubmittedCodeRef.current;
  const aiEnabled = (allPassed && !codeChanged) || hasFailed;

  const handleGetAI = async () => {
    if (!chapterId || !taskId) return;
    setIsLoadingAI(true);
    setActiveTab('ai');
    try {
      if (allPassed && !codeChanged) {
        setAiMode('solution');
        const result = await analyzeTask(chapterId, taskId, code);
        setAiRecommendation(result.recommendation);
      } else if (hasFailed) {
        setAiMode('error');
        const errorText = testResults.filter((r) => !r.passed).map((r) => r.output).join('\n');
        const result = await analyzeErrorTask(chapterId, taskId, code, errorText);
        setAiRecommendation(result.analysis);
      }
    } catch {
      setAiRecommendation('Не удалось получить рекомендации. Попробуйте позже.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // ⌘+Enter / Ctrl+Enter to submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning && user) handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, user, code, chapterId, taskId]);

  if (isLoading) return <EditorSkeleton />;

  if (!task) {
    return (
      <div className="min-h-[calc(100vh-60px)] grid place-items-center" style={{ background: 'var(--gp-bg)' }}>
        <div className="text-center">
          <p className="gp-eyebrow">404 · Задача не найдена</p>
          <h2 className="gp-display mt-3" style={{ fontSize: '32px' }}>Задача не <em>найдена</em>.</h2>
          <Link to="/tasks" className="mt-6 inline-flex items-center gap-2 text-[14px] underline underline-offset-4" style={{ color: 'var(--gp-ink)' }}>
            <ChevronLeft size={14} /> К задачам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: 'var(--gp-bg)', height: 'calc(100vh - 60px)' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 h-12 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--gp-border)', background: 'var(--gp-surface)' }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 text-[12.5px]">
          <Link to="/tasks" className="no-underline hover:underline underline-offset-4 flex-shrink-0" style={{ color: 'var(--gp-ink-3)' }}>
            Задачи
          </Link>
          <ChevronRight size={12} style={{ color: 'var(--gp-ink-4)' }} />
          <span className="truncate" style={{ color: 'var(--gp-ink-3)' }}>{task.chapter_title}</span>
          <ChevronRight size={12} style={{ color: 'var(--gp-ink-4)' }} />
          <span className="truncate font-medium" style={{ color: 'var(--gp-ink)' }}>{task.title}</span>
        </div>

        {/* Status + difficulty */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <DifficultyBadge difficulty={task.difficulty} variant="glyph" />
          {submitted && (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--gp-success)' }}>
              <Check size={12} strokeWidth={2.5} /> Решена
            </span>
          )}
        </div>

        {/* Right: prev/next */}
        <div className="ml-auto flex items-center gap-1">
          <NavArrowButton item={nav.prev} direction="prev" />
          <NavArrowButton item={nav.next} direction="next" />
        </div>
      </div>

      {/* Body — split panes */}
      <SplitPane direction="horizontal" defaultSize={42} minSize={22} maxSize={70} style={{ flex: 1 }}>
        {/* Left: description + hints */}
        <div className="h-full overflow-y-auto" style={{ background: 'var(--gp-bg)' }}>
          <div className="px-8 py-7 max-w-[680px]">
            <div className="gp-eyebrow flex items-center gap-2">
              <FileText size={11} /> Условие
            </div>
            <h1 className="gp-display mt-2" style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.2 }}>
              {task.title}
            </h1>
            <div className="gp-divider mt-5 mb-7" />
            <MarkdownRenderer content={task.description} />

            {task.hints && task.hints.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={14} style={{ color: 'var(--gp-warning)' }} />
                  <span className="gp-eyebrow">Подсказки</span>
                  <span className="text-[11px] gp-mono ml-1" style={{ color: 'var(--gp-ink-4)' }}>{task.hints.length}</span>
                </div>
                <div className="grid gap-2">
                  {task.hints.map((hint, index) => {
                    const isOpen = openHints.includes(index);
                    return (
                      <div
                        key={index}
                        className="rounded-md overflow-hidden"
                        style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-border)' }}
                      >
                        <button
                          onClick={() => toggleHint(index)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
                          style={{ background: isOpen ? 'var(--gp-surface-muted)' : 'transparent' }}
                          onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = 'var(--gp-surface-muted)'; }}
                          onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span className="text-[11px] gp-mono w-6" style={{ color: 'var(--gp-ink-4)' }}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="flex-1 text-[13px] font-medium" style={{ color: 'var(--gp-ink)' }}>
                            Подсказка
                          </span>
                          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: dur.fast }} style={{ color: 'var(--gp-ink-4)' }}>
                            <ChevronDown size={13} />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: dur.base, ease: ease.emphasized }}
                              className="overflow-hidden"
                              style={{ borderTop: '1px solid var(--gp-border)' }}
                            >
                              <div className="px-3 py-3 text-[13.5px]" style={{ color: 'var(--gp-ink-2)', lineHeight: 1.6 }}>
                                {hint}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: editor + tests */}
        <SplitPane direction="vertical" defaultSize={58} minSize={20} maxSize={85} style={{ height: '100%' }}>
          {/* Top: editor */}
          <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--gp-bg)' }}>
            {/* Editor toolbar */}
            <div
              className="flex items-center gap-2 px-3 h-10 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--gp-border)', background: 'var(--gp-surface)' }}
            >
              <span className="gp-mono text-[11.5px] flex items-center gap-1.5" style={{ color: 'var(--gp-ink-3)' }}>
                <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gp-accent)' }} />
                main.go
              </span>

              {submissions.length > 0 && (
                <SubmissionPicker
                  submissions={submissions}
                  selectedIdx={selectedSubmissionIdx}
                  open={historyOpen}
                  onOpen={() => setHistoryOpen((v) => !v)}
                  onSelect={handleSelectSubmission}
                  onUseTemplate={handleUseTemplate}
                  refEl={historyRef}
                />
              )}

              <div className="ml-auto flex items-center gap-1">
                <IconButton onClick={handleUseTemplate} title="Сбросить к шаблону" icon={<RotateCcw size={13} />} />
              </div>
            </div>

            {/* Code editor */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor key={`${chapterId}-${taskId}`} value={code} onChange={setCode} defaultValue={task.template} height="100%" completions={task.completions} />
            </div>

            {/* Submit bar */}
            <div
              className="flex items-center gap-2 px-3 h-12 flex-shrink-0"
              style={{ borderTop: '1px solid var(--gp-border)', background: 'var(--gp-surface)' }}
            >
              <Button
                size="sm"
                variant="primary"
                onClick={handleSubmit}
                disabled={isRunning || !user}
                loading={isRunning}
                iconLeft={!isRunning ? <Play size={12} /> : undefined}
                title={!user ? 'Войди, чтобы отправить решение' : undefined}
              >
                {isRunning ? 'Проверяется' : 'Отправить'}
              </Button>

              <span className="hidden lg:inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--gp-ink-4)' }}>
                <kbd
                  className="gp-mono px-1.5 py-0.5 rounded text-[10px]"
                  style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink-3)', border: '1px solid var(--gp-border)' }}
                >⌘ ⏎</kbd>
              </span>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleGetAI}
                disabled={!aiEnabled || isLoadingAI}
                loading={isLoadingAI}
                iconLeft={!isLoadingAI ? <Sparkles size={12} /> : undefined}
                title={
                  codeChanged ? 'Код изменён — отправь решение заново' :
                  allPassed ? 'AI-разбор решения' :
                  hasFailed ? 'AI-анализ ошибок' :
                  'Отправь решение для AI-анализа'
                }
              >
                {isLoadingAI ? 'Анализ' : hasFailed ? 'Разбор ошибок' : 'AI-разбор'}
              </Button>

              <AnimatePresence>
                {allPassed && !codeChanged && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: dur.base, ease: ease.emphasized }}
                    className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: 'var(--gp-success)' }}
                  >
                    <Check size={12} strokeWidth={2.5} /> Все тесты пройдены
                  </motion.span>
                )}
                {codeChanged && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="ml-auto inline-flex items-center gap-1.5 text-[12px]"
                    style={{ color: 'var(--gp-warning)' }}
                  >
                    <AlertCircle size={12} /> Код изменён, отправь заново
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom: tests / AI */}
          <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--gp-bg)' }}>
            <div
              className="flex items-center gap-1 px-3 h-10 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--gp-border)', background: 'var(--gp-surface)' }}
            >
              <TabButton active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} count={testResults.length}>
                Тесты
              </TabButton>
              <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>
                AI-разбор
              </TabButton>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3.5">
              {activeTab === 'tests' && <TestResults results={testResults} isRunning={isRunning} />}
              {activeTab === 'ai' && (
                <AIPanel
                  loading={isLoadingAI}
                  recommendation={aiRecommendation}
                  mode={aiMode}
                  hint={
                    !aiEnabled
                      ? 'Сначала отправь решение — после прогона тестов AI разберёт код или ошибки.'
                      : codeChanged
                      ? 'Код изменился. Отправь решение заново, чтобы получить актуальный разбор.'
                      : null
                  }
                />
              )}
            </div>
          </div>
        </SplitPane>
      </SplitPane>
    </div>
  );
}

/* ------------- Sub-components ------------- */

function NavArrowButton({ item, direction }: { item: NavItem | null; direction: 'prev' | 'next' }) {
  const isPrev = direction === 'prev';
  const Icon = isPrev ? ChevronLeft : ChevronRight;

  if (!item) {
    return (
      <span className="w-8 h-8 inline-flex items-center justify-center rounded-md opacity-40" style={{ color: 'var(--gp-ink-4)' }}>
        <Icon size={14} />
      </span>
    );
  }

  return (
    <Link
      to={item.href}
      title={item.title}
      className="w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors no-underline"
      style={{ color: 'var(--gp-ink-3)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gp-surface-muted)'; e.currentTarget.style.color = 'var(--gp-ink)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gp-ink-3)'; }}
    >
      <Icon size={14} />
    </Link>
  );
}

function IconButton({ onClick, title, icon }: { onClick: () => void; title: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-7 h-7 inline-flex items-center justify-center rounded-md transition-colors"
      style={{ color: 'var(--gp-ink-3)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gp-surface-muted)'; e.currentTarget.style.color = 'var(--gp-ink)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gp-ink-3)'; }}
    >
      {icon}
    </button>
  );
}

function TabButton({
  active, onClick, children, count,
}: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-2.5 h-7 inline-flex items-center gap-1.5 rounded text-[12.5px] transition-colors',
      )}
      style={{
        color: active ? 'var(--gp-ink)' : 'var(--gp-ink-3)',
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--gp-ink)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--gp-ink-3)'; }}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span
          className="text-[10.5px] gp-mono px-1 rounded"
          style={{
            background: active ? 'var(--gp-ink)' : 'var(--gp-surface-muted)',
            color: active ? 'var(--gp-bg)' : 'var(--gp-ink-3)',
          }}
        >
          {count}
        </span>
      )}
      {active && (
        <motion.span
          layoutId="editor-tab-active"
          className="absolute left-2 right-2 -bottom-[5px] h-px"
          style={{ background: 'var(--gp-ink)' }}
          transition={{ duration: dur.base, ease: ease.emphasized }}
        />
      )}
    </button>
  );
}

interface SubmissionPickerProps {
  submissions: NonNullable<TaskDetail['submissions']>;
  selectedIdx: number | null;
  open: boolean;
  onOpen: () => void;
  onSelect: (idx: number) => void;
  onUseTemplate: () => void;
  refEl: React.RefObject<HTMLDivElement | null>;
}

function SubmissionPicker({
  submissions, selectedIdx, open, onOpen, onSelect, onUseTemplate, refEl,
}: SubmissionPickerProps) {
  const current = selectedIdx !== null ? submissions[selectedIdx] : null;

  return (
    <div ref={refEl} className="relative">
      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 h-7 px-2 rounded text-[11.5px] transition-colors max-w-[220px]"
        style={{
          background: open ? 'var(--gp-surface-muted)' : 'transparent',
          color: 'var(--gp-ink-2)',
          border: '1px solid',
          borderColor: open ? 'var(--gp-border)' : 'transparent',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'var(--gp-surface-muted)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <History size={11.5} style={{ color: 'var(--gp-ink-4)' }} />
        {current ? (
          <>
            {current.passed
              ? <Check size={10} strokeWidth={2.5} style={{ color: 'var(--gp-success)' }} />
              : <XCircle size={10} style={{ color: 'var(--gp-danger)' }} />}
            <span className="gp-mono truncate">{formatDate(current.created_at)}</span>
          </>
        ) : (
          <span style={{ color: 'var(--gp-ink-3)' }}>Шаблон</span>
        )}
        <ChevronDown size={11} style={{ color: 'var(--gp-ink-4)' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: dur.base, ease: ease.emphasized }}
            className="absolute top-[calc(100%+6px)] left-0 z-30 w-[300px] max-h-[280px] overflow-y-auto rounded-lg"
            style={{
              background: 'var(--gp-surface)',
              border: '1px solid var(--gp-border)',
              boxShadow: 'var(--gp-shadow-lg)',
            }}
          >
            <div className="p-1">
              <button
                onClick={onUseTemplate}
                className="w-full flex items-center gap-2 px-2 py-2 rounded text-[12px] text-left transition-colors"
                style={{
                  background: selectedIdx === null ? 'var(--gp-surface-muted)' : 'transparent',
                  color: 'var(--gp-ink-2)',
                }}
                onMouseEnter={(e) => { if (selectedIdx !== null) e.currentTarget.style.background = 'var(--gp-surface-muted)'; }}
                onMouseLeave={(e) => { if (selectedIdx !== null) e.currentTarget.style.background = 'transparent'; }}
              >
                <RotateCcw size={11} style={{ color: 'var(--gp-ink-4)' }} />
                Шаблон задачи
              </button>
              <div className="h-px my-1" style={{ background: 'var(--gp-border)' }} />
              {submissions.map((sub, idx) => (
                <button
                  key={sub.id}
                  onClick={() => onSelect(idx)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded text-left transition-colors"
                  style={{ background: selectedIdx === idx ? 'var(--gp-surface-muted)' : 'transparent' }}
                  onMouseEnter={(e) => { if (selectedIdx !== idx) e.currentTarget.style.background = 'var(--gp-surface-muted)'; }}
                  onMouseLeave={(e) => { if (selectedIdx !== idx) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      background: sub.passed ? 'var(--gp-success-soft)' : 'var(--gp-danger-soft)',
                      color: sub.passed ? 'var(--gp-success)' : 'var(--gp-danger)',
                    }}
                  >
                    {sub.passed ? <Check size={9} strokeWidth={2.5} /> : <XCircle size={9} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] gp-mono" style={{ color: 'var(--gp-ink-2)' }}>{formatDate(sub.created_at)}</span>
                    <span className="block text-[10.5px]" style={{ color: sub.passed ? 'var(--gp-success)' : 'var(--gp-danger)' }}>
                      {sub.passed ? 'Все тесты пройдены' : 'Тесты не пройдены'}
                    </span>
                  </span>
                  {idx === 0 && (
                    <span className="text-[9px] gp-mono px-1 rounded" style={{ background: 'var(--gp-ink)', color: 'var(--gp-bg)', flexShrink: 0 }}>
                      LATEST
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIPanel({
  loading, recommendation, mode, hint,
}: { loading: boolean; recommendation: string; mode: 'solution' | 'error' | null; hint: string | null }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 size={18} className="animate-spin mx-auto mb-3" style={{ color: 'var(--gp-ink)' }} />
        <div className="gp-eyebrow">{mode === 'error' ? 'Анализируем ошибки' : 'Анализируем решение'}</div>
      </div>
    );
  }

  if (recommendation) {
    return (
      <div
        className="rounded-lg p-5"
        style={{
          background: 'var(--gp-surface)',
          border: '1px solid var(--gp-border)',
          boxShadow: 'var(--gp-shadow-xs)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md"
            style={{
              background: mode === 'error' ? 'var(--gp-danger-soft)' : 'var(--gp-accent-soft)',
              color: mode === 'error' ? 'var(--gp-danger)' : 'var(--gp-accent)',
            }}
          >
            {mode === 'error' ? <AlertCircle size={13} /> : <Sparkles size={13} />}
          </span>
          <span className="gp-eyebrow">
            {mode === 'error' ? 'Разбор ошибок' : 'Разбор решения'}
          </span>
        </div>
        <div className="gp-prose">
          <MarkdownRenderer content={recommendation} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12 max-w-[360px] mx-auto">
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-md mb-3"
        style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink-3)' }}
      >
        <Sparkles size={15} />
      </span>
      <div className="gp-eyebrow">AI-разбор</div>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--gp-ink-3)', lineHeight: 1.5 }}>
        {hint ?? 'После прогона тестов появится разбор кода или ошибок.'}
      </p>
    </div>
  );
}

/* ------------- Skeleton ------------- */
function EditorSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
      <div className="h-12 border-b" style={{ borderColor: 'var(--gp-border)', background: 'var(--gp-surface)' }} />
      <div className="flex-1 grid grid-cols-2">
        <div className="border-r p-8 space-y-3" style={{ borderColor: 'var(--gp-border)' }}>
          <div className="h-4 w-24 gp-skel" />
          <div className="h-7 w-3/4 gp-skel" />
          <div className="h-3 w-full gp-skel mt-6" />
          <div className="h-3 w-full gp-skel" />
          <div className="h-3 w-2/3 gp-skel" />
        </div>
        <div className="grid grid-rows-[auto_1fr_auto_220px]">
          <div className="h-10 border-b" style={{ borderColor: 'var(--gp-border)', background: 'var(--gp-surface)' }} />
          <div className="gp-skel m-3" style={{ borderRadius: 8 }} />
          <div className="h-12 border-t" style={{ borderColor: 'var(--gp-border)', background: 'var(--gp-surface)' }} />
          <div className="border-t p-3 space-y-2" style={{ borderColor: 'var(--gp-border)' }}>
            <div className="h-9 gp-skel" />
            <div className="h-9 gp-skel" />
            <div className="h-9 gp-skel" />
          </div>
        </div>
      </div>
    </div>
  );
}
