import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowRight, Minus, Plus } from 'lucide-react';
import {
  fetchQuizChapters,
  fetchQuizQuestions,
  submitQuizAnswer,
  type QuizChapterInfo,
  type QuizQuestion,
  type QuizAnswerResult,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useGopherMood } from '../context/GopherMoodContext';
import { MarkdownRenderer, parseBold } from '../components/MarkdownRenderer';
import { Button, Container, Eyebrow, ProgressRing, fadeUp, scaleIn, staggerParent, staggerChild } from '../design';
import { dur, ease } from '../design/motion';

type Phase = 'setup' | 'quiz' | 'result';

interface AnswerRecord { questionId: string; chosen: number; correct: boolean; }

export function QuizPage() {
  const { user, login } = useAuth();
  const { setMood } = useGopherMood();

  const [chapters, setChapters] = useState<QuizChapterInfo[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(10);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult | null>(null);
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    fetchQuizChapters()
      .then((data) => {
        setChapters(data);
        setSelectedChapters(data.map((c) => c.slug));
      })
      .catch(console.error)
      .finally(() => setIsLoadingChapters(false));
  }, []);

  const totalAvailable = useMemo(
    () => chapters.filter((c) => selectedChapters.includes(c.slug)).reduce((s, c) => s + c.question_count, 0),
    [chapters, selectedChapters]
  );

  useEffect(() => {
    if (totalAvailable > 0) setLimit((prev) => Math.min(prev || 10, totalAvailable));
    else setLimit(10);
  }, [totalAvailable]);

  const toggleChapter = (slug: string) =>
    setSelectedChapters((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  const selectAll = () => setSelectedChapters(chapters.map((c) => c.slug));
  const deselectAll = () => setSelectedChapters([]);

  const startQuiz = useCallback(async () => {
    if (!user) { setShowAuthPrompt(true); return; }
    setShowAuthPrompt(false);
    setIsLoadingQuestions(true);
    try {
      const qs = await fetchQuizQuestions(
        selectedChapters.length === chapters.length ? undefined : selectedChapters,
        limit > 0 ? limit : undefined
      );
      if (!qs.length) return;
      setQuestions(qs);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setHistory([]);
      setPhase('quiz');
    } catch (error) {
      console.error('Quiz load error:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [user, selectedChapters, chapters.length, limit]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(async (idx: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(idx);
    try {
      const result = await submitQuizAnswer(currentQuestion.id, currentQuestion.options[idx]);
      setAnswerResult(result);
      setHistory((prev) => [...prev, { questionId: currentQuestion.id, chosen: idx, correct: result.correct }]);
      setMood(result.correct ? 'happy' : 'sad');
    } catch (error) {
      console.error('Quiz submit error:', error);
    }
  }, [selectedAnswer, currentQuestion, setMood]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
    } else {
      setPhase('result');
    }
  }, [currentIndex, questions.length]);

  // Keyboard: 1–4 to choose, Enter to continue
  useEffect(() => {
    if (phase !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedAnswer !== null) { e.preventDefault(); handleNext(); return; }
      if (selectedAnswer !== null || !currentQuestion) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1 && idx < currentQuestion.options.length) handleAnswer(idx);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, selectedAnswer, currentQuestion, handleAnswer, handleNext]);

  const score = history.filter((h) => h.correct).length;

  if (isLoadingChapters) {
    return (
      <div className="min-h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
        <Container className="pt-14 space-y-3">
          <div className="h-3 w-20 gp-skel" />
          <div className="h-10 w-2/3 gp-skel" />
          <div className="h-3 w-1/2 gp-skel" />
        </Container>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <SetupPhase
        chapters={chapters}
        selected={selectedChapters}
        onToggle={toggleChapter}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        limit={limit}
        setLimit={setLimit}
        totalAvailable={totalAvailable}
        onStart={startQuiz}
        loading={isLoadingQuestions}
        showAuthPrompt={showAuthPrompt}
        onLogin={login}
        authed={!!user}
      />
    );
  }

  if (phase === 'result') {
    return (
      <ResultPhase
        score={score}
        total={questions.length}
        history={history}
        questions={questions}
        chapters={chapters}
        onRetry={() => startQuiz()}
        onSetup={() => { setPhase('setup'); setQuestions([]); setHistory([]); }}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <Container className="pt-20 text-center">
        <Eyebrow marker={false}>Вопрос не найден</Eyebrow>
      </Container>
    );
  }

  return (
    <QuizPhase
      index={currentIndex}
      total={questions.length}
      question={currentQuestion}
      selectedAnswer={selectedAnswer}
      result={answerResult}
      history={history}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  );
}

/* =================== SETUP =================== */

function SetupPhase({
  chapters, selected, onToggle, onSelectAll, onDeselectAll,
  limit, setLimit, totalAvailable, onStart, loading,
  showAuthPrompt, onLogin, authed,
}: {
  chapters: QuizChapterInfo[];
  selected: string[];
  onToggle: (slug: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  limit: number;
  setLimit: (n: number) => void;
  totalAvailable: number;
  onStart: () => void;
  loading: boolean;
  showAuthPrompt: boolean;
  onLogin: () => void;
  authed: boolean;
}) {
  return (
    <div className="min-h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
      <header className="pt-14 pb-10" style={{ borderBottom: '1px solid var(--gp-border)' }}>
        <Container>
          <motion.div initial="hidden" animate="visible" variants={staggerParent(0.06)}>
            <motion.div variants={staggerChild}>
              <Eyebrow>Раздел · 03</Eyebrow>
            </motion.div>
            <motion.h1 variants={staggerChild} className="gp-display mt-4" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
              Короткие <em>проверки</em>
              <br />
              знаний.
            </motion.h1>
            <motion.p variants={staggerChild} className="mt-5 max-w-[58ch] text-[16px]" style={{ color: 'var(--gp-ink-3)' }}>
              Выбери разделы и количество вопросов. Мгновенная обратная связь после каждого ответа.
              Управление с клавиатуры — <kbd className="gp-mono px-1.5 py-0.5 text-[11px] rounded" style={{ background: 'var(--gp-surface-muted)', border: '1px solid var(--gp-border)' }}>1</kbd>–<kbd className="gp-mono px-1.5 py-0.5 text-[11px] rounded" style={{ background: 'var(--gp-surface-muted)', border: '1px solid var(--gp-border)' }}>4</kbd> для ответа, <kbd className="gp-mono px-1.5 py-0.5 text-[11px] rounded" style={{ background: 'var(--gp-surface-muted)', border: '1px solid var(--gp-border)' }}>⏎</kbd> для перехода.
            </motion.p>
          </motion.div>
        </Container>
      </header>

      <Container className="py-12 grid md:grid-cols-12 gap-10">
        {/* Chapters */}
        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow marker={false}>Разделы</Eyebrow>
            <div className="flex items-center gap-3 text-[12px]">
              <button onClick={onSelectAll} className="hover:underline underline-offset-4" style={{ color: 'var(--gp-ink-2)' }}>Все</button>
              <span style={{ color: 'var(--gp-ink-5)' }}>·</span>
              <button onClick={onDeselectAll} className="hover:underline underline-offset-4" style={{ color: 'var(--gp-ink-3)' }}>Сбросить</button>
            </div>
          </div>

          <ul className="list-none p-0 m-0" style={{ borderTop: '1px solid var(--gp-border)' }}>
            {chapters.map((ch) => {
              const checked = selected.includes(ch.slug);
              return (
                <li key={ch.slug} style={{ borderBottom: '1px solid var(--gp-border)' }}>
                  <button
                    onClick={() => onToggle(ch.slug)}
                    className="w-full flex items-center gap-4 py-3.5 text-left transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gp-surface-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded flex-shrink-0 transition-colors"
                      style={{
                        background: checked ? 'var(--gp-ink)' : 'transparent',
                        border: `1.5px solid ${checked ? 'var(--gp-ink)' : 'var(--gp-border-strong)'}`,
                        color: 'var(--gp-bg)',
                      }}
                    >
                      {checked && <Check size={11} strokeWidth={2.5} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-medium" style={{ color: 'var(--gp-ink)' }}>{ch.title}</span>
                    </span>
                    <span className="text-[12px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
                      {ch.question_count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Setup card */}
        <aside className="md:col-span-4">
          <div className="md:sticky md:top-[88px] grid gap-4">
            <div className="gp-card p-5">
              <Eyebrow marker={false}>Количество вопросов</Eyebrow>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setLimit(Math.max(1, limit - 1))}
                  disabled={limit <= 1}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md transition-colors"
                  style={{
                    background: 'var(--gp-surface-muted)',
                    color: limit <= 1 ? 'var(--gp-ink-5)' : 'var(--gp-ink-2)',
                    cursor: limit <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={limit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val === '') setLimit(1);
                    else setLimit(Math.min(Math.max(1, parseInt(val, 10)), totalAvailable || 100));
                  }}
                  className="flex-1 text-center gp-mono text-[20px] outline-none bg-transparent"
                  style={{ color: 'var(--gp-ink)' }}
                />
                <button
                  onClick={() => setLimit(Math.min(totalAvailable || 100, limit + 1))}
                  disabled={totalAvailable > 0 && limit >= totalAvailable}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md transition-colors"
                  style={{
                    background: 'var(--gp-surface-muted)',
                    color: totalAvailable > 0 && limit >= totalAvailable ? 'var(--gp-ink-5)' : 'var(--gp-ink-2)',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="mt-3 text-[12px] gp-mono" style={{ color: 'var(--gp-ink-4)' }}>
                Доступно {totalAvailable}
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              onClick={onStart}
              loading={loading}
              disabled={selected.length === 0 || totalAvailable === 0}
              iconRight={<ArrowRight size={14} />}
            >
              Начать квиз
            </Button>

            {!authed && (
              <AnimatePresence>
                {showAuthPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-border)' }}
                  >
                    <div className="text-[13px] font-medium" style={{ color: 'var(--gp-ink)' }}>Нужна авторизация</div>
                    <div className="text-[12.5px] mt-1" style={{ color: 'var(--gp-ink-3)' }}>
                      Войди через Google, чтобы пройти квиз и сохранить прогресс.
                    </div>
                    <Button size="sm" variant="primary" className="mt-3" onClick={onLogin}>
                      Войти через Google
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </aside>
      </Container>
    </div>
  );
}

/* =================== QUIZ =================== */

const LETTERS = ['1', '2', '3', '4'];

function QuizPhase({
  index, total, question, selectedAnswer, result, history, onAnswer, onNext,
}: {
  index: number; total: number; question: QuizQuestion;
  selectedAnswer: number | null;
  result: QuizAnswerResult | null;
  history: AnswerRecord[];
  onAnswer: (idx: number) => void;
  onNext: () => void;
}) {
  const actionBarRef = useRef<HTMLDivElement>(null);

  // Auto-scroll explanation + "Continue" button into view after answering
  useEffect(() => {
    if (selectedAnswer === null) return;
    const el = actionBarRef.current;
    if (!el) return;
    // small delay so the entry animation has started and layout is stable
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 60);
    return () => clearTimeout(t);
  }, [selectedAnswer, result]);

  return (
    <div className="min-h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
      {/* Progress dots */}
      <div className="sticky z-30 backdrop-blur-md" style={{ top: 60, background: 'var(--gp-header-bg)', borderBottom: '1px solid var(--gp-border)' }}>
        <Container className="h-12 flex items-center gap-3">
          <span className="text-[11px] gp-mono flex-shrink-0" style={{ color: 'var(--gp-ink-4)' }}>
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-[3px] flex-1 min-w-0 overflow-x-auto">
            {Array.from({ length: total }).map((_, i) => {
              const past = history[i];
              const isCurrent = i === index;
              return (
                <span
                  key={i}
                  aria-hidden
                  className="h-[3px] rounded-full flex-1 max-w-[28px] min-w-[6px] transition-colors"
                  style={{
                    background:
                      past?.correct ? 'var(--gp-success)' :
                      past && !past.correct ? 'var(--gp-danger)' :
                      isCurrent ? 'var(--gp-ink)' : 'var(--gp-surface-strong)',
                    opacity: isCurrent || past ? 1 : 0.7,
                  }}
                />
              );
            })}
          </div>
          <span className="text-[11px] gp-mono flex-shrink-0" style={{ color: 'var(--gp-ink-4)' }}>
            {history.filter((h) => h.correct).length} ✓
          </span>
        </Container>
      </div>

      <Container className="pt-12 pb-24 max-w-[760px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: dur.slow, ease: ease.emphasized }}
          >
            <Eyebrow>Вопрос {index + 1}</Eyebrow>
            <div className="mt-3 text-[22px] md:text-[26px] font-medium" style={{ color: 'var(--gp-ink)', letterSpacing: '-0.015em', lineHeight: 1.3 }}>
              <MarkdownRenderer
                content={question.question}
                textStyle={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', lineHeight: 'inherit', margin: 0 }}
              />
            </div>

            <div className="mt-8 grid gap-2.5">
              {question.options.map((option, idx) => {
                const isChosen = selectedAnswer === idx;
                const isCorrect = result?.correct_answer === option;
                const isWrongChoice = result && isChosen && !result.correct;
                const dim = result && !isCorrect && !isChosen;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => onAnswer(idx)}
                    disabled={selectedAnswer !== null}
                    whileHover={selectedAnswer === null ? { y: -1 } : undefined}
                    whileTap={selectedAnswer === null ? { y: 0 } : undefined}
                    transition={{ duration: dur.fast }}
                    className="text-left flex items-start gap-4 px-5 py-4 rounded-lg transition-colors"
                    style={{
                      background:
                        isCorrect && result ? 'var(--gp-success-soft)' :
                        isWrongChoice ? 'var(--gp-danger-soft)' :
                        'var(--gp-surface)',
                      border: '1px solid',
                      borderColor:
                        isCorrect && result ? 'var(--gp-success)' :
                        isWrongChoice ? 'var(--gp-danger)' :
                        'var(--gp-border)',
                      opacity: dim ? 0.55 : 1,
                      cursor: selectedAnswer !== null ? 'default' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAnswer === null) e.currentTarget.style.borderColor = 'var(--gp-border-strong)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAnswer === null) e.currentTarget.style.borderColor = 'var(--gp-border)';
                    }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded gp-mono text-[12px] flex-shrink-0"
                      style={{
                        background:
                          isCorrect && result ? 'var(--gp-success)' :
                          isWrongChoice ? 'var(--gp-danger)' :
                          'var(--gp-surface-muted)',
                        color:
                          isCorrect && result ? '#fff' :
                          isWrongChoice ? '#fff' :
                          'var(--gp-ink-2)',
                        border: '1px solid',
                        borderColor:
                          isCorrect && result ? 'var(--gp-success)' :
                          isWrongChoice ? 'var(--gp-danger)' :
                          'var(--gp-border)',
                      }}
                    >
                      {result && isCorrect ? <Check size={12} strokeWidth={2.5} /> :
                        isWrongChoice ? <X size={12} strokeWidth={2.5} /> :
                        LETTERS[idx]}
                    </span>
                    <span className="text-[15px]" style={{ color: 'var(--gp-ink)', lineHeight: 1.55 }}>
                      {parseBold(option)}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: dur.base, ease: ease.emphasized }}
                  className="mt-6 rounded-lg p-5"
                  style={{
                    background: 'var(--gp-surface)',
                    border: '1px solid var(--gp-border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                      style={{
                        background: result.correct ? 'var(--gp-success-soft)' : 'var(--gp-danger-soft)',
                        color: result.correct ? 'var(--gp-success)' : 'var(--gp-danger)',
                      }}
                    >
                      {result.correct ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />}
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: result.correct ? 'var(--gp-success)' : 'var(--gp-danger)' }}>
                      {result.correct ? 'Верно' : 'Не верно'}
                    </span>
                  </div>
                  <div className="gp-prose text-[14px]" style={{ color: 'var(--gp-ink-2)', lineHeight: 1.65 }}>
                    <MarkdownRenderer content={result.explanation} textStyle={{ margin: 0 }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedAnswer !== null && (
              <div ref={actionBarRef} className="mt-8 flex justify-end items-center gap-3">
                <span className="text-[12px]" style={{ color: 'var(--gp-ink-4)' }}>
                  <kbd className="gp-mono px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--gp-surface-muted)', border: '1px solid var(--gp-border)' }}>⏎</kbd> чтобы продолжить
                </span>
                <Button variant="primary" onClick={onNext} iconRight={<ArrowRight size={13} />}>
                  {index < total - 1 ? 'Дальше' : 'Завершить'}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
}

/* =================== RESULT =================== */

function ResultPhase({
  score, total, history, questions, chapters, onRetry, onSetup,
}: {
  score: number;
  total: number;
  history: AnswerRecord[];
  questions: QuizQuestion[];
  chapters: QuizChapterInfo[];
  onRetry: () => void;
  onSetup: () => void;
}) {
  const ratio = total > 0 ? score / total : 0;
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  const questionChapterMap = useMemo(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => {
      const chapter = chapters.find((c) => c.slug === q.chapter_slug);
      map[q.id] = chapter?.title ?? q.chapter_slug;
    });
    return map;
  }, [questions, chapters]);
  const verdict =
    ratio >= 0.85 ? 'Отлично' :
    ratio >= 0.6 ? 'Хорошо' :
    ratio >= 0.3 ? 'Пробуй ещё' :
    'Стоит вернуться к теории';

  return (
    <div className="min-h-[calc(100vh-60px)]" style={{ background: 'var(--gp-bg)' }}>
      <Container className="pt-20 pb-24 max-w-[560px]">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerParent(0.06)}
          className="flex flex-col items-center text-center"
        >
          {/* Eyebrow */}
          <motion.div variants={staggerChild}>
            <Eyebrow>Квиз завершён</Eyebrow>
          </motion.div>

          {/* Progress ring */}
          <motion.div variants={scaleIn} className="mt-10">
            <ProgressRing
              value={ratio}
              size={160}
              stroke={7}
              tone={ratio >= 0.6 ? 'success' : 'ink'}
            >
              <span className="text-center">
                <span className="block gp-display" style={{ fontSize: 40, lineHeight: 1, color: 'var(--gp-ink)' }}>
                  {score}
                </span>
                <span className="block text-[12px] gp-mono mt-1" style={{ color: 'var(--gp-ink-4)' }}>
                  из {total}
                </span>
              </span>
            </ProgressRing>
          </motion.div>

          {/* Verdict */}
          <motion.h1 variants={staggerChild} className="gp-display mt-6" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            <em>{verdict}.</em>
          </motion.h1>

          {/* Stat cards */}
          <motion.div variants={fadeUp} className="mt-8 w-full grid grid-cols-3 gap-3">
            {[
              { label: 'Точность', value: `${Math.round(ratio * 100)}%`, color: ratio >= 0.6 ? 'var(--gp-success)' : 'var(--gp-danger)' },
              { label: 'Верно', value: String(score), color: 'var(--gp-ink)' },
              { label: 'Ошибки', value: String(total - score), color: total - score > 0 ? 'var(--gp-danger)' : 'var(--gp-ink-4)' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-lg py-4 px-3"
                style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-border)' }}
              >
                <div className="gp-eyebrow">{label}</div>
                <div className="gp-display mt-2" style={{ fontSize: 28, color }}>{value}</div>
              </div>
            ))}
          </motion.div>

          {/* Per-question dots */}
          <motion.div variants={fadeUp} className="mt-8 w-full">
            <div className="gp-eyebrow mb-3">Ход квиза</div>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {history.map((h, i) => (
                <span
                  key={i}
                  onMouseEnter={() => setHoveredDot(i)}
                  onMouseLeave={() => setHoveredDot(null)}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{
                      background: h.correct ? 'var(--gp-success)' : 'var(--gp-danger)',
                      opacity: h.correct ? 1 : 0.85,
                      transform: hoveredDot === i ? 'scale(1.4)' : 'scale(1)',
                      transition: 'transform 0.12s ease',
                    }}
                  />
                  {hoveredDot === i && questionChapterMap[h.questionId] && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 7px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: 'var(--gp-ink)',
                        color: 'var(--gp-bg)',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    >
                      {questionChapterMap[h.questionId]}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} className="mt-10 flex items-center gap-3 flex-wrap justify-center">
            <Button variant="primary" size="lg" onClick={onRetry} iconRight={<ArrowRight size={14} />}>
              Пройти ещё раз
            </Button>
            <Button variant="ghost" size="lg" onClick={onSetup}>
              Изменить разделы
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}
