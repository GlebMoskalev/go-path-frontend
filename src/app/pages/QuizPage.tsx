import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ChevronRight, BookOpen } from 'lucide-react';
import {
  fetchQuizChapters,
  fetchQuizQuestions,
  submitQuizAnswer,
  type QuizChapterInfo,
  type QuizQuestion,
  type QuizAnswerResult,
} from '../api';
import { useAuth } from '../context/AuthContext';

type Phase = 'setup' | 'quiz' | 'result';

export function QuizPage() {
  const { user, login } = useAuth();

  // Chapter selection
  const [chapters, setChapters] = useState<QuizChapterInfo[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(10);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);

  // Quiz
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('setup');

  useEffect(() => {
    if (!user) return;
    fetchQuizChapters()
      .then((data) => {
        setChapters(data);
        // Select all by default
        setSelectedChapters(data.map((c) => c.slug));
      })
      .catch(console.error)
      .finally(() => setIsLoadingChapters(false));
  }, [user]);

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
      borderRadius: '10px',
      border: '1px solid',
      cursor: selectedAnswer !== null ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      transition: 'all 0.15s',
      background: '#141824',
      borderColor: '#1E2A3A',
    };

    if (!answerResult) return base;

    if (optionIdx === answerResult.correct_answer) {
      return { ...base, borderColor: '#10B981', background: 'rgba(16,185,129,0.08)' };
    }
    if (optionIdx === selectedAnswer && !answerResult.correct) {
      return { ...base, borderColor: '#EF4444', background: 'rgba(239,68,68,0.08)' };
    }
    return { ...base, opacity: 0.5 };
  };

  const optionLetters = ['А', 'Б', 'В', 'Г'];

  // Not logged in
  if (!user) {
    return (
      <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: '#F1F5F9', marginBottom: '8px', fontSize: '22px', fontWeight: 700 }}>Требуется авторизация</h2>
          <p style={{ color: '#94A3B8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
            Войдите, чтобы проходить квизы и отслеживать свой прогресс
          </p>
          <button
            onClick={login}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '10px',
              background: '#00ADD8',
              border: 'none',
              color: '#0F111A',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#00C4F5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#00ADD8')}
          >
            Войти через Google
          </button>
        </div>
      </div>
    );
  }

  // Loading chapters
  if (isLoadingChapters) {
    return (
      <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Загрузка...</div>
      </div>
    );
  }

  // PHASE: setup — chapter selection
  if (phase === 'setup') {
    return (
      <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px 80px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Квизы
          </h1>
          <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '32px' }}>
            Проверьте знания Go — выберите главы и начните
          </p>

          {/* Chapter selection */}
          <div
            style={{
              background: '#141824',
              border: '1px solid #1E2A3A',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1E2A3A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} style={{ color: '#00ADD8' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9' }}>Выберите главы</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={selectAll}
                  style={{
                    fontSize: '12px',
                    color: '#00ADD8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  Выбрать все
                </button>
                <span style={{ color: '#253047' }}>|</span>
                <button
                  onClick={deselectAll}
                  style={{
                    fontSize: '12px',
                    color: '#94A3B8',
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
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(0,173,216,0.06)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#1A2035';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '5px',
                        border: '2px solid',
                        borderColor: isSelected ? '#00ADD8' : '#253047',
                        background: isSelected ? '#00ADD8' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M3 6L5 8L9 4" stroke="#0F111A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#F1F5F9' : '#94A3B8' }}>
                        {chapter.title}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '12px',
                        color: isSelected ? '#00ADD8' : '#64748B',
                        fontWeight: 600,
                        background: isSelected ? 'rgba(0,173,216,0.1)' : '#1A2035',
                        padding: '3px 10px',
                        borderRadius: '12px',
                      }}
                    >
                      {chapter.question_count} вопр.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Limit */}
          <div
            style={{
              background: '#141824',
              border: '1px solid #1E2A3A',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', marginBottom: '4px' }}>
                Кол-во вопросов
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                Доступно: {totalQuestions}
              </div>
            </div>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={totalQuestions || 100}
              style={{
                width: '80px',
                padding: '8px 12px',
                background: '#0F111A',
                border: '1px solid #253047',
                borderRadius: '8px',
                color: '#F1F5F9',
                fontSize: '14px',
                fontWeight: 600,
                textAlign: 'center',
                outline: 'none',
                fontFamily: 'Manrope, sans-serif',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#00ADD8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#253047')}
            />
          </div>

          {/* Start button */}
          <button
            onClick={startQuiz}
            disabled={selectedChapters.length === 0 || isLoadingQuestions}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '13px 28px',
              borderRadius: '10px',
              background: selectedChapters.length === 0 ? '#253047' : '#00ADD8',
              border: 'none',
              color: selectedChapters.length === 0 ? '#64748B' : '#0F111A',
              fontSize: '15px',
              fontWeight: 700,
              cursor: selectedChapters.length === 0 || isLoadingQuestions ? 'not-allowed' : 'pointer',
              fontFamily: 'Manrope, sans-serif',
            }}
            onMouseEnter={(e) => {
              if (selectedChapters.length > 0 && !isLoadingQuestions)
                e.currentTarget.style.background = '#00C4F5';
            }}
            onMouseLeave={(e) => {
              if (selectedChapters.length > 0 && !isLoadingQuestions)
                e.currentTarget.style.background = '#00ADD8';
            }}
          >
            {isLoadingQuestions ? 'Загрузка...' : 'Начать квиз'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // PHASE: result
  if (phase === 'result') {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: '12px' }}>
            Квиз завершён!
          </h1>

          <div
            style={{
              background: '#141824',
              border: '1px solid #1E2A3A',
              borderRadius: '14px',
              padding: '32px',
              marginBottom: '32px',
              marginTop: '24px',
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#00ADD8', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              {score} / {questions.length}
            </div>
            <div style={{ fontSize: '16px', color: '#94A3B8', marginBottom: '16px' }}>
              {pct}% правильных ответов
            </div>
            <div
              style={{
                height: '6px',
                background: '#1A2035',
                borderRadius: '3px',
                overflow: 'hidden',
                maxWidth: '300px',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

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
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid #253047',
                color: '#94A3B8',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ADD8';
                e.currentTarget.style.color = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#253047';
                e.currentTarget.style.color = '#94A3B8';
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
                borderRadius: '10px',
                background: '#00ADD8',
                border: 'none',
                color: '#0F111A',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#00C4F5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#00ADD8')}
            >
              Пройти снова
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PHASE: quiz
  if (!currentQuestion) {
    return (
      <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Вопрос не найден</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Progress */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              Вопрос {currentIndex + 1} из {questions.length}
            </span>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              {currentQuestion.chapter_slug}
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: '#1A2035', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#00ADD8',
                borderRadius: '4px',
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          style={{
            background: '#141824',
            border: '1px solid #1E2A3A',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '20px',
          }}
        >
          <div style={{ padding: '28px' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', lineHeight: '1.5' }}>
              {currentQuestion.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                style={getOptionStyle(idx)}
                onMouseEnter={(e) => {
                  if (selectedAnswer === null) {
                    (e.currentTarget as HTMLElement).style.borderColor = '#253047';
                    (e.currentTarget as HTMLElement).style.background = '#1A2035';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAnswer === null) {
                    (e.currentTarget as HTMLElement).style.borderColor = '#1E2A3A';
                    (e.currentTarget as HTMLElement).style.background = '#141824';
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
                      ? idx === answerResult.correct_answer ? '#10B981'
                      : idx === selectedAnswer ? '#EF4444' : '#253047'
                      : '#253047',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: answerResult
                      ? idx === answerResult.correct_answer ? '#10B981'
                      : idx === selectedAnswer ? '#EF4444' : '#94A3B8'
                      : '#94A3B8',
                    flexShrink: 0,
                    background: answerResult
                      ? idx === answerResult.correct_answer ? 'rgba(16,185,129,0.1)'
                      : idx === selectedAnswer ? 'rgba(239,68,68,0.1)' : 'transparent'
                      : 'transparent',
                  }}
                >
                  {answerResult && idx === answerResult.correct_answer ? (
                    <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                  ) : answerResult && idx === selectedAnswer && !answerResult.correct ? (
                    <XCircle size={14} style={{ color: '#EF4444' }} />
                  ) : (
                    optionLetters[idx]
                  )}
                </span>
                <span style={{ fontSize: '14px', color: '#E2E8F0', textAlign: 'left', fontFamily: 'Manrope, sans-serif' }}>
                  {option}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {answerResult && (
          <div
            style={{
              padding: '20px',
              borderRadius: '10px',
              border: `1px solid ${answerResult.correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              background: answerResult.correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {answerResult.correct ? (
                <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              ) : (
                <XCircle size={16} style={{ color: '#EF4444' }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: 700, color: answerResult.correct ? '#10B981' : '#EF4444' }}>
                {answerResult.correct ? 'Правильно!' : 'Неправильно'}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: '1.65', margin: 0, whiteSpace: 'pre-wrap' }}>
              {answerResult.explanation}
            </p>
          </div>
        )}

        {/* Next button */}
        {selectedAnswer !== null && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '8px',
                background: '#00ADD8',
                border: 'none',
                color: '#0F111A',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#00C4F5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#00ADD8')}
            >
              {currentIndex < questions.length - 1 ? 'Следующий вопрос' : 'Завершить'}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
