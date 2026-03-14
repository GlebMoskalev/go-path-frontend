import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, Play, Sparkles, CheckCircle2, AlertCircle, History, XCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTask, submitTask, analyzeTask, type TaskDetail } from '../api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CodeEditor } from '../components/CodeEditor';
import { TestResults, type TestResult } from '../components/TestResults';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { SplitPane } from '../components/SplitPane';
import { useAuth } from '../context/AuthContext';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskEditorPage() {
  const { chapterId, taskId } = useParams<{ chapterId: string; taskId: string }>();
  const { user } = useAuth();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'ai'>('tests');

  const [selectedSubmissionIdx, setSelectedSubmissionIdx] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!chapterId || !taskId) return;
    setIsLoading(true);
    fetchTask(chapterId, taskId)
      .then((data) => {
        setTask(data);
        setSubmitted(data.solved || false);
        setShowAI(false);
        setAiRecommendation('');
        setSelectedSubmissionIdx(null);
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
        } else {
          setCode(data.template);
          setTestResults([]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [chapterId, taskId]);

  const submissions = task?.submissions || [];

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
    setActiveTab('tests');
  };

  const handleUseTemplate = () => {
    if (!task) return;
    setCode(task.template);
    setSelectedSubmissionIdx(null);
    setTestResults([]);
    setHistoryOpen(false);
  };

  const handleSubmit = async () => {
    if (!chapterId || !taskId) return;
    setIsRunning(true);
    setActiveTab('tests');
    try {
      const result = await submitTask(chapterId, taskId, code);
      const results: TestResult[] = (result.tests || []).map((t) => ({ id: t.name, name: t.name, passed: t.passed, output: t.output, expected: '' }));
      if (result.error && results.length === 0) {
        results.push({ id: 'error', name: 'Ошибка компиляции', passed: false, output: result.error, expected: '' });
      }
      setTestResults(results);
      if (result.passed) { setSubmitted(true); setShowAI(true); }
      setSelectedSubmissionIdx(null);
      fetchTask(chapterId, taskId).then((data) => { setTask(data); if (data.submissions?.length) setSelectedSubmissionIdx(0); }).catch(() => {});
    } catch (error) {
      setTestResults([{ id: 'error', name: 'Ошибка', passed: false, output: error instanceof Error ? error.message : 'Произошла ошибка', expected: '' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGetAI = async () => {
    if (!chapterId || !taskId || !allPassed) return;
    setIsLoadingAI(true);
    setActiveTab('ai');
    try {
      const result = await analyzeTask(chapterId, taskId, code);
      setAiRecommendation(result.recommendation);
    } catch {
      setAiRecommendation('Не удалось получить рекомендации. Попробуйте позже.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: 'var(--go-bg)' }}>
        <div style={{ fontSize: '14px', color: 'var(--go-muted)' }}>Загрузка...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: 'var(--go-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: 'var(--go-text)', marginBottom: '8px' }}>Задача не найдена</h2>
          <Link to="/tasks" style={{ color: 'var(--go-cyan)', textDecoration: 'none' }}>← К задачам</Link>
        </div>
      </div>
    );
  }

  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);

  return (
    <div style={{ background: 'var(--go-bg)', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid var(--go-border)', padding: '8px 16px', background: 'var(--go-surface)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
        <Link to="/tasks" style={{ fontSize: '13px', color: 'var(--go-muted)', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--go-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--go-muted)')}
        >Задачи</Link>
        <ChevronRight size={13} style={{ color: 'var(--go-subtle)' }} />
        <Link to="/tasks" style={{ fontSize: '13px', color: 'var(--go-muted)', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--go-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--go-muted)')}
        >{task.chapter_slug}</Link>
        <ChevronRight size={13} style={{ color: 'var(--go-subtle)' }} />
        <span style={{ fontSize: '13px', color: 'var(--go-text)' }}>{task.title}</span>
        <DifficultyBadge difficulty={task.difficulty} size="sm" />
        {submitted && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--go-green)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <CheckCircle2 size={13} /> Решена
          </span>
        )}
      </div>

      {/* Main resizable layout: description | code+tests */}
      <SplitPane direction="horizontal" defaultSize={40} minSize={20} maxSize={70} style={{ flex: 1 }}>
        {/* Left: Task description */}
        <div style={{ height: '100%', overflowY: 'auto', padding: '24px 24px 40px' }}>
          <MarkdownRenderer content={task.description} />
        </div>

        {/* Right: code (top) + tests (bottom) */}
        <SplitPane direction="vertical" defaultSize={55} minSize={20} maxSize={85} style={{ height: '100%' }}>
          {/* Top: editor + submission bar */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Submission history bar */}
            {submissions.length > 0 && (
              <div style={{
                padding: '6px 12px', borderBottom: '1px solid var(--go-border)',
                background: 'var(--go-surface)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
              }}>
                <History size={13} style={{ color: 'var(--go-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--go-muted)', flexShrink: 0 }}>Решения ({submissions.length})</span>
                <div ref={historyRef} style={{ position: 'relative', flex: 1 }}>
                  <button
                    onClick={() => setHistoryOpen(!historyOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px',
                      borderRadius: '6px', background: 'var(--go-bg)', border: '1px solid var(--go-border-2)',
                      color: 'var(--go-text-secondary)', fontSize: '11px', cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif', width: '100%', maxWidth: '320px',
                    }}
                  >
                    {selectedSubmissionIdx !== null && submissions[selectedSubmissionIdx] ? (
                      <>
                        {submissions[selectedSubmissionIdx].passed
                          ? <CheckCircle2 size={11} style={{ color: 'var(--go-green)', flexShrink: 0 }} />
                          : <XCircle size={11} style={{ color: 'var(--go-red)', flexShrink: 0 }} />
                        }
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(submissions[selectedSubmissionIdx].created_at)}</span>
                        <span style={{ color: submissions[selectedSubmissionIdx].passed ? 'var(--go-green)' : 'var(--go-red)', fontWeight: 600, flexShrink: 0 }}>
                          {submissions[selectedSubmissionIdx].passed ? 'Успешно' : 'Ошибка'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--go-muted)' }}>Шаблон задачи</span>
                    )}
                    <ChevronDown size={11} style={{ color: 'var(--go-muted)', marginLeft: 'auto', flexShrink: 0 }} />
                  </button>
                  <AnimatePresence>
                    {historyOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', maxWidth: '320px',
                          maxHeight: '240px', overflowY: 'auto', background: 'var(--go-surface)',
                          border: '1px solid var(--go-border-2)', borderRadius: '10px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 20, padding: '4px',
                        }}
                      >
                        <button
                          onClick={handleUseTemplate}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px',
                            borderRadius: '6px', background: selectedSubmissionIdx === null ? 'var(--go-surface-2)' : 'transparent',
                            border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--go-muted)',
                            fontSize: '11px', fontFamily: 'Manrope, sans-serif',
                            borderBottom: '1px solid var(--go-border)', marginBottom: '2px',
                          }}
                          onMouseEnter={(e) => { if (selectedSubmissionIdx !== null) e.currentTarget.style.background = 'var(--go-surface-2)'; }}
                          onMouseLeave={(e) => { if (selectedSubmissionIdx !== null) e.currentTarget.style.background = 'transparent'; }}
                        >↺ Шаблон задачи</button>
                        {submissions.map((sub, idx) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSelectSubmission(idx)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '6px 8px',
                              borderRadius: '6px', background: selectedSubmissionIdx === idx ? 'var(--go-surface-2)' : 'transparent',
                              border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif',
                            }}
                            onMouseEnter={(e) => { if (selectedSubmissionIdx !== idx) e.currentTarget.style.background = 'var(--go-surface-2)'; }}
                            onMouseLeave={(e) => { if (selectedSubmissionIdx !== idx) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {sub.passed
                              ? <CheckCircle2 size={12} style={{ color: 'var(--go-green)', flexShrink: 0 }} />
                              : <XCircle size={12} style={{ color: 'var(--go-red)', flexShrink: 0 }} />
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '11px', color: 'var(--go-text-secondary)' }}>{formatDate(sub.created_at)}</div>
                              <div style={{ fontSize: '10px', color: sub.passed ? 'var(--go-green)' : 'var(--go-red)', fontWeight: 600 }}>
                                {sub.passed ? 'Все тесты пройдены' : 'Тесты не пройдены'}
                              </div>
                            </div>
                            {idx === 0 && (
                              <span style={{ fontSize: '9px', color: 'var(--go-muted)', background: 'var(--go-border-2)', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>Последнее</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Code editor */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '8px 8px 0' }}>
              <CodeEditor value={code} onChange={setCode} defaultValue={task.template} height="100%" />
            </div>

            {/* Submit bar */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--go-border)', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--go-surface)', flexShrink: 0 }}>
              <button
                onClick={handleSubmit}
                disabled={isRunning || !user}
                title={!user ? 'Войдите, чтобы отправить решение' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px',
                  borderRadius: '8px', background: (isRunning || !user) ? 'var(--go-border-2)' : 'var(--go-cyan)',
                  border: 'none', color: (isRunning || !user) ? 'var(--go-muted)' : '#fff',
                  fontSize: '12px', fontWeight: 700, cursor: (isRunning || !user) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                }}
                onMouseEnter={(e) => { if (!isRunning && user) e.currentTarget.style.background = 'var(--go-cyan-hover)'; }}
                onMouseLeave={(e) => { if (!isRunning && user) e.currentTarget.style.background = 'var(--go-cyan)'; }}
              >
                <Play size={12} />
                {isRunning ? 'Проверяется...' : 'Отправить'}
              </button>

              <button
                onClick={handleGetAI}
                disabled={!allPassed || isLoadingAI}
                title={!allPassed ? 'AI-анализ доступен после успешного решения' : 'AI-анализ'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px',
                  borderRadius: '8px', background: 'transparent',
                  border: '1px solid', borderColor: allPassed ? 'var(--go-amber)' : 'var(--go-border-2)',
                  color: allPassed ? 'var(--go-amber)' : 'var(--go-subtle)',
                  fontSize: '12px', fontWeight: 600,
                  cursor: allPassed && !isLoadingAI ? 'pointer' : 'not-allowed',
                  opacity: allPassed ? 1 : 0.5, fontFamily: 'Manrope, sans-serif',
                }}
                onMouseEnter={(e) => { if (allPassed && !isLoadingAI) e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}
                onMouseLeave={(e) => { if (allPassed && !isLoadingAI) e.currentTarget.style.background = 'transparent'; }}
              >
                <Sparkles size={12} />
                {isLoadingAI ? 'Анализ...' : 'AI'}
              </button>

              {allPassed && (
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--go-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Все тесты пройдены!
                </span>
              )}
            </div>
          </div>

          {/* Bottom: Test results / AI */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--go-border)', background: 'var(--go-surface)', flexShrink: 0 }}>
              {[
                { id: 'tests', label: 'Тесты' },
                { id: 'ai', label: '✦ AI Анализ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'tests' | 'ai')}
                  style={{
                    padding: '7px 14px', background: 'none', border: 'none',
                    borderBottom: `2px solid ${activeTab === tab.id ? 'var(--go-cyan)' : 'transparent'}`,
                    color: activeTab === tab.id ? 'var(--go-text)' : 'var(--go-muted)',
                    fontSize: '12px', fontWeight: activeTab === tab.id ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                  }}
                >{tab.label}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {activeTab === 'tests' && <TestResults results={testResults} isRunning={isRunning} />}
              {activeTab === 'ai' && (
                <div>
                  {isLoadingAI ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <div style={{ width: '28px', height: '28px', border: '3px solid var(--go-border-2)', borderTopColor: 'var(--go-amber)', borderRadius: '50%', margin: '0 auto 12px' }} className="animate-spin" />
                      <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>Анализируем решение...</div>
                    </div>
                  ) : aiRecommendation ? (
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <Sparkles size={14} style={{ color: 'var(--go-amber)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--go-amber)' }}>AI-анализ решения</span>
                      </div>
                      <MarkdownRenderer content={aiRecommendation} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <AlertCircle size={28} style={{ color: 'var(--go-subtle)', marginBottom: '10px' }} />
                      <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>
                        {allPassed ? 'Нажмите «AI» чтобы получить рекомендации' : 'AI-анализ доступен после успешного решения'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SplitPane>
      </SplitPane>
    </div>
  );
}
