import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ChevronRight, BookOpen, Minus, Plus } from 'lucide-react';
import {
  fetchQuizChapters,
  fetchQuizQuestions,
  submitQuizAnswer,
  type QuizChapterInfo,
  type QuizQuestion,
  type QuizAnswerResult,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { AnimatedSection } from '../components/AnimatedSection';

type Phase = 'setup' | 'quiz' | 'result';

export function QuizPage() {
  const { user, login } = useAuth();

  const [chapters, setChapters] = useState<QuizChapterInfo[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(10);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult | null>(null);
  const [score, setScore] = useState(0);
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

  const toggleChapter = (slug: string) => {
    setSelectedChapters((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectAll = () => {
    setSelectedChapters(chapters.map((c) => c.slug));
  };

  const deselectAll = () => {
    setSelectedChapters([]);
  };

  const totalQuestions = chapters
    .filter((c) => selectedChapters.includes(c.slug))
    .reduce((sum, c) => sum + c.question_count, 0);

  const startQuiz = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    setShowAuthPrompt(false);
    setIsLoadingQuestions(true);
    try {
      const qs = await fetchQuizQuestions(
        selectedChapters.length === chapters.length ? undefined : selectedChapters,
        limit > 0 ? limit : undefined
      );
      if (qs.length === 0) return;
      setQuestions(qs);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setScore(0);
      setPhase('quiz');
    } catch (error) {
      console.error('Error loading quiz questions:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async (idx: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(idx);
    try {
      const result = await submitQuizAnswer(currentQuestion.id, idx);
      setAnswerResult(result);
      if (result.correct) {
        setScore((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Answer submission error:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
    } else {
      setPhase('result');
    }
  };

  const getOptionStyle = (optionIdx: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '14px 18px',
      borderRadius: '12px',
      border: '1px solid',
      cursor: selectedAnswer !== null ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      transition: 'all 0.15s',
      background: 'var(--go-surface)',
      borderColor: 'var(--go-border)',
    };

    if (!answerResult) return base;

    if (optionIdx === answerResult.correct_answer) {
      return { ...base, borderColor: 'var(--go-green)', background: 'var(--go-green-muted)' };
    }
    if (optionIdx === selectedAnswer && !answerResult.correct) {
      return { ...base, borderColor: 'var(--go-red)', background: 'rgba(220, 38, 38, 0.08)' };
    }
    return { ...base, opacity: 0.5 };
  };

  const optionLetters = ['А', 'Б', 'В', 'Г'];

  if (isLoadingChapters) {
    return (
      <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--go-muted)' }}>Загрузка...</div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px 80px' }}>
          <AnimatedSection variant="fadeUp">
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Квизы
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--go-muted)', marginBottom: '32px' }}>
              Проверьте знания Go — выберите главы и начните
            </p>
          </AnimatedSection>

          <AnimatedSection variant="fadeUp" delay={0.1}>
            <div
              style={{
                background: 'var(--go-surface)',
                border: '1px solid var(--go-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--go-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} style={{ color: 'var(--go-cyan)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--go-text)' }}>Выберите главы</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={selectAll}
                    style={{
                      fontSize: '12px',
                      color: 'var(--go-cyan)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    Выбрать все
                  </button>
                  <span style={{ color: 'var(--go-border-2)' }}>|</span>
                  <button
                    onClick={deselectAll}
                    style={{
                      fontSize: '12px',
                      color: 'var(--go-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    Снять все
                  </button>
                </div>
              </div>

              <div style={{ padding: '8px' }}>
                {chapters.map((chapter) => {
                  const isSelected = selectedChapters.includes(chapter.slug);
                  return (
                    <button
                      key={chapter.slug}
                      onClick={() => toggleChapter(chapter.slug)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isSelected ? 'var(--go-cyan-muted)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: '2px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--go-surface-2)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          border: '2px solid',
                          borderColor: isSelected ? 'var(--go-cyan)' : 'var(--go-border-2)',
                          background: isSelected ? 'var(--go-cyan)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 6L5 8L9 4" stroke="var(--go-bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--go-text)' : 'var(--go-muted)' }}>
                          {chapter.title}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '12px',
                          color: isSelected ? 'var(--go-cyan)' : 'var(--go-subtle)',
                          fontWeight: 600,
                          background: isSelected ? 'var(--go-cyan-muted)' : 'var(--go-surface-2)',
                          padding: '3px 10px',
                          borderRadius: '14px',
                        }}
                      >
                        {chapter.question_count} вопр.
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection variant="fadeUp" delay={0.2}>
            <div
              style={{
                background: 'var(--go-surface)',
                border: '1px solid var(--go-border)',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--go-text)', marginBottom: '4px' }}>
                  Кол-во вопросов
                </div>
                <div style={{ fontSize: '12px', color: 'var(--go-muted)' }}>
                  Доступно: {totalQuestions}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setLimit((prev) => Math.max(1, prev - 1))}
                  disabled={limit <= 1}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--go-border-2)',
                    background: 'var(--go-surface)',
                    color: limit <= 1 ? 'var(--go-subtle)' : 'var(--go-muted)',
                    cursor: limit <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (limit > 1) {
                      e.currentTarget.style.borderColor = 'var(--go-cyan)';
                      e.currentTarget.style.color = 'var(--go-cyan)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--go-border-2)';
                    e.currentTarget.style.color = limit <= 1 ? 'var(--go-subtle)' : 'var(--go-muted)';
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
                    if (val === '') {
                      setLimit(1);
                    } else {
                      const num = parseInt(val, 10);
                      const maxVal = totalQuestions > 0 ? totalQuestions : 100;
                      setLimit(Math.min(Math.max(1, num), maxVal));
                    }
                  }}
                  style={{
                    width: '56px',
                    padding: '6px 8px',
                    background: 'var(--go-surface)',
                    border: '1px solid var(--go-border-2)',
                    borderRadius: '8px',
                    color: 'var(--go-text)',
                    fontSize: '15px',
                    fontWeight: 700,
                    textAlign: 'center',
                    outline: 'none',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--go-cyan)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--go-border-2)')}
                />
                <button
                  onClick={() => {
                    const maxVal = totalQuestions > 0 ? totalQuestions : 100;
                    setLimit((prev) => Math.min(maxVal, prev + 1));
                  }}
                  disabled={totalQuestions > 0 && limit >= totalQuestions}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--go-border-2)',
                    background: 'var(--go-surface)',
                    color: totalQuestions > 0 && limit >= totalQuestions ? 'var(--go-subtle)' : 'var(--go-muted)',
                    cursor: totalQuestions > 0 && limit >= totalQuestions ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!(totalQuestions > 0 && limit >= totalQuestions)) {
                      e.currentTarget.style.borderColor = 'var(--go-cyan)';
                      e.currentTarget.style.color = 'var(--go-cyan)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--go-border-2)';
                    e.currentTarget.style.color = totalQuestions > 0 && limit >= totalQuestions ? 'var(--go-subtle)' : 'var(--go-muted)';
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={selectedChapters.length === 0 || isLoadingQuestions}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 28px',
                borderRadius: '12px',
                background: selectedChapters.length === 0 ? 'var(--go-border-2)' : 'var(--go-cyan)',
                border: 'none',
                color: selectedChapters.length === 0 ? 'var(--go-subtle)' : 'var(--go-bg)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: selectedChapters.length === 0 || isLoadingQuestions ? 'not-allowed' : 'pointer',
                fontFamily: 'Manrope, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (selectedChapters.length > 0 && !isLoadingQuestions)
                  e.currentTarget.style.background = 'var(--go-cyan-hover)';
              }}
              onMouseLeave={(e) => {
                if (selectedChapters.length > 0 && !isLoadingQuestions)
                  e.currentTarget.style.background = 'var(--go-cyan)';
              }}
            >
              {isLoadingQuestions ? 'Загрузка...' : 'Начать квиз'}
              <ChevronRight size={16} />
            </button>

            {showAuthPrompt && !user && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  marginTop: '16px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'var(--go-surface)',
                  border: '1px solid var(--go-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--go-text)', marginBottom: '4px' }}>
                    Требуется авторизация
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>
                    Войдите, чтобы начать квиз и отслеживать прогресс
                  </div>
                </div>
                <button
                  onClick={login}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: 'var(--go-cyan)',
                    border: 'none',
                    color: 'var(--go-bg)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--go-cyan-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--go-cyan)')}
                >
                  Войти через Google
                </button>
              </motion.div>
            )}
          </AnimatedSection>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <AnimatedSection variant="scaleIn">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.03em', marginBottom: '12px' }}>
              Квиз завершён!
            </h1>
          </AnimatedSection>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              background: 'var(--go-surface)',
              border: '1px solid var(--go-border)',
              borderRadius: '14px',
              padding: '32px',
              marginBottom: '32px',
              marginTop: '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ fontSize: '48px', fontWeight: 800, color: 'var(--go-cyan)', letterSpacing: '-0.03em', marginBottom: '8px' }}
            >
              {score} / {questions.length}
            </motion.div>
            <div style={{ fontSize: '16px', color: 'var(--go-muted)', marginBottom: '16px' }}>
              {pct}% правильных ответов
            </div>
            <div
              style={{
                height: '6px',
                background: 'var(--go-surface-2)',
                borderRadius: '3px',
                overflow: 'hidden',
                maxWidth: '300px',
                margin: '0 auto',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  height: '100%',
                  background: pct >= 80 ? 'var(--go-green)' : pct >= 50 ? 'var(--go-amber)' : 'var(--go-red)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </motion.div>

          <AnimatedSection variant="fadeUp" delay={0.5}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setPhase('setup');
                  setQuestions([]);
                  setScore(0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: '1px solid var(--go-border-2)',
                  color: 'var(--go-muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--go-cyan)';
                  e.currentTarget.style.color = 'var(--go-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--go-border-2)';
                  e.currentTarget.style.color = 'var(--go-muted)';
                }}
              >
                Выбрать главы
              </button>
              <button
                onClick={startQuiz}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'var(--go-cyan)',
                  border: 'none',
                  color: 'var(--go-bg)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--go-cyan-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--go-cyan)')}
              >
                Пройти снова
                <ChevronRight size={14} />
              </button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--go-muted)' }}>Вопрос не найден</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--go-muted)' }}>
              Вопрос {currentIndex + 1} из {questions.length}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--go-muted)' }}>
              {currentQuestion.chapter_slug}
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--go-surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'var(--go-cyan)',
                borderRadius: '4px',
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                background: 'var(--go-surface)',
                border: '1px solid var(--go-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '20px',
              }}
            >
              <div style={{ padding: '28px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--go-text)', lineHeight: '1.5' }}>
                  {currentQuestion.question}
                </p>
              </div>

              <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentQuestion.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedAnswer !== null}
                    style={getOptionStyle(idx)}
                    whileHover={selectedAnswer === null ? { scale: 1.01 } : undefined}
                    whileTap={selectedAnswer === null ? { scale: 0.99 } : undefined}
                    onMouseEnter={(e) => {
                      if (selectedAnswer === null) {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--go-border-2)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--go-surface-2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAnswer === null) {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--go-border)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--go-surface)';
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: answerResult
                          ? idx === answerResult.correct_answer ? 'var(--go-green)'
                          : idx === selectedAnswer ? 'var(--go-red)' : 'var(--go-border-2)'
                          : 'var(--go-border-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: answerResult
                          ? idx === answerResult.correct_answer ? 'var(--go-green)'
                          : idx === selectedAnswer ? 'var(--go-red)' : 'var(--go-muted)'
                          : 'var(--go-muted)',
                        flexShrink: 0,
                        background: answerResult
                          ? idx === answerResult.correct_answer ? 'var(--go-green-muted)'
                          : idx === selectedAnswer ? 'rgba(220, 38, 38, 0.08)' : 'transparent'
                          : 'transparent',
                      }}
                    >
                      {answerResult && idx === answerResult.correct_answer ? (
                        <CheckCircle2 size={14} style={{ color: 'var(--go-green)' }} />
                      ) : answerResult && idx === selectedAnswer && !answerResult.correct ? (
                        <XCircle size={14} style={{ color: 'var(--go-red)' }} />
                      ) : (
                        optionLetters[idx]
                      )}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--go-text-secondary)', textAlign: 'left', fontFamily: 'Manrope, sans-serif' }}>
                      {option}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {answerResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `1px solid ${answerResult.correct ? 'var(--go-green-muted)' : 'rgba(220, 38, 38, 0.08)'}`,
                  background: answerResult.correct ? 'var(--go-green-muted)' : 'rgba(220, 38, 38, 0.08)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {answerResult.correct ? (
                    <CheckCircle2 size={16} style={{ color: 'var(--go-green)' }} />
                  ) : (
                    <XCircle size={16} style={{ color: 'var(--go-red)' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 700, color: answerResult.correct ? 'var(--go-green)' : 'var(--go-red)' }}>
                    {answerResult.correct ? 'Правильно!' : 'Неправильно'}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--go-text-secondary)', lineHeight: '1.65', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {answerResult.explanation}
                </p>
              </motion.div>
            )}

            {selectedAnswer !== null && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleNext}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    background: 'var(--go-cyan)',
                    border: 'none',
                    color: 'var(--go-bg)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--go-cyan-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--go-cyan)')}
                >
                  {currentIndex < questions.length - 1 ? 'Следующий вопрос' : 'Завершить'}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
