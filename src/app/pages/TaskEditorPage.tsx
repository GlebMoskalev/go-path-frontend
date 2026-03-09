import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, Play, Sparkles, CheckCircle2, AlertCircle, History, XCircle, ChevronDown } from 'lucide-react';
import { fetchTask, submitTask, analyzeTask, type TaskDetail, type TaskSubmission } from '../api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CodeEditor } from '../components/CodeEditor';
import { TestResults, type TestResult } from '../components/TestResults';
import { DifficultyBadge } from '../components/DifficultyBadge';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskEditorPage() {
  const { chapterId, taskId } = useParams<{ chapterId: string; taskId: string }>();

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

  // Submissions history
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

        // Use the latest submission's code if available, otherwise use template
        if (data.submissions && data.submissions.length > 0) {
          const latest = data.submissions[0];
          setCode(latest.code);
          setSelectedSubmissionIdx(0);

          // Show test results from the latest submission
          if (latest.result && latest.result.tests) {
            setTestResults(latest.result.tests.map((t) => ({
              id: t.name,
              name: t.name,
              passed: t.passed,
              output: t.output,
              expected: '',
            })));
          } else if (latest.result?.error) {
            setTestResults([{
              id: 'error',
              name: 'Ошибка компиляции',
              passed: false,
              output: latest.result.error,
              expected: '',
            }]);
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

    // Show submission's test results
    if (sub.result && sub.result.tests) {
      setTestResults(sub.result.tests.map((t) => ({
        id: t.name,
        name: t.name,
        passed: t.passed,
        output: t.output,
        expected: '',
      })));
    } else if (sub.result?.error) {
      setTestResults([{
        id: 'error',
        name: 'Ошибка компиляции',
        passed: false,
        output: sub.result.error,
        expected: '',
      }]);
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
      
      const results: TestResult[] = (result.tests || []).map((t) => ({
        id: t.name,
        name: t.name,
        passed: t.passed,
        output: t.output,
        expected: '',
      }));

      if (result.error && results.length === 0) {
        results.push({
          id: 'error',
          name: 'Ошибка компиляции',
          passed: false,
          output: result.error,
          expected: '',
        });
      }
      
      setTestResults(results);
      
      if (result.passed) {
        setSubmitted(true);
        setShowAI(true);
      }

      // Refresh task to get updated submissions
      setSelectedSubmissionIdx(null);
      fetchTask(chapterId, taskId)
        .then((data) => {
          setTask(data);
          if (data.submissions && data.submissions.length > 0) {
            setSelectedSubmissionIdx(0);
          }
        })
        .catch(() => {});
    } catch (error) {
      console.error('Submit error:', error);
      setTestResults([{
        id: 'error',
        name: 'Ошибка',
        passed: false,
        output: error instanceof Error ? error.message : 'Произошла ошибка',
        expected: '',
      }]);
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
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiRecommendation('Не удалось получить рекомендации. Попробуйте позже.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: '#0F111A' }}>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Загрузка...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: '#0F111A' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: '#F1F5F9', marginBottom: '8px' }}>Задача не найдена</h2>
          <Link to="/tasks" style={{ color: '#00ADD8', textDecoration: 'none' }}>← К задачам</Link>
        </div>
      </div>
    );
  }

  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);

  return (
    <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid #1E2A3A', padding: '10px 24px', background: '#141824', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link to="/tasks" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Задачи
        </Link>
        <ChevronRight size={13} style={{ color: '#64748B' }} />
        <Link to="/tasks" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          {task.chapter_slug}
        </Link>
        <ChevronRight size={13} style={{ color: '#64748B' }} />
        <span style={{ fontSize: '13px', color: '#F1F5F9' }}>{task.title}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DifficultyBadge difficulty={task.difficulty} size="sm" />
          {submitted && (
            <span style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Решена
            </span>
          )}
        </div>
      </div>

      {/* Split layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 56px - 44px)', overflow: 'hidden' }}>
        {/* Left: Task description */}
        <div
          style={{
            width: '45%',
            flexShrink: 0,
            borderRight: '1px solid #1E2A3A',
            overflowY: 'auto',
            padding: '28px 28px 40px',
          }}
        >
          <MarkdownRenderer content={task.description} />
        </div>

        {/* Right: Editor + Tests */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Editor header with history */}
          {submissions.length > 0 && (
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid #1E2A3A',
              background: '#141824',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}>
              <History size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#94A3B8', flexShrink: 0 }}>
                Решения ({submissions.length})
              </span>

              {/* Dropdown */}
              <div ref={historyRef} style={{ position: 'relative', flex: 1 }}>
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#0F111A',
                    border: '1px solid #253047',
                    color: '#E2E8F0',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif',
                    width: '100%',
                    maxWidth: '360px',
                  }}
                >
                  {selectedSubmissionIdx !== null && submissions[selectedSubmissionIdx] ? (
                    <>
                      {submissions[selectedSubmissionIdx].passed ? (
                        <CheckCircle2 size={12} style={{ color: '#10B981', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={12} style={{ color: '#EF4444', flexShrink: 0 }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatDate(submissions[selectedSubmissionIdx].created_at)}
                      </span>
                      <span style={{ color: submissions[selectedSubmissionIdx].passed ? '#10B981' : '#EF4444', fontWeight: 600, flexShrink: 0 }}>
                        {submissions[selectedSubmissionIdx].passed ? 'Успешно' : 'Ошибка'}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>Шаблон задачи</span>
                  )}
                  <ChevronDown size={12} style={{ color: '#94A3B8', marginLeft: 'auto', flexShrink: 0 }} />
                </button>

                {historyOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '100%',
                    maxWidth: '360px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    background: '#141824',
                    border: '1px solid #253047',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 20,
                    padding: '4px',
                  }}>
                    {/* Template option */}
                    <button
                      onClick={handleUseTemplate}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: selectedSubmissionIdx === null ? '#1A2035' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#E2E8F0',
                        fontSize: '12px',
                        fontFamily: 'Manrope, sans-serif',
                        borderBottom: '1px solid #1E2A3A',
                        marginBottom: '4px',
                      }}
                      onMouseEnter={(e) => { if (selectedSubmissionIdx !== null) e.currentTarget.style.background = '#1A2035'; }}
                      onMouseLeave={(e) => { if (selectedSubmissionIdx !== null) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        background: '#253047', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '10px', color: '#94A3B8',
                      }}>
                        ↺
                      </div>
                      <span style={{ color: '#94A3B8' }}>Шаблон задачи</span>
                    </button>

                    {/* Submissions list */}
                    {submissions.map((sub, idx) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectSubmission(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: selectedSubmissionIdx === idx ? '#1A2035' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'Manrope, sans-serif',
                        }}
                        onMouseEnter={(e) => { if (selectedSubmissionIdx !== idx) e.currentTarget.style.background = '#1A2035'; }}
                        onMouseLeave={(e) => { if (selectedSubmissionIdx !== idx) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {sub.passed ? (
                          <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                        ) : (
                          <XCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', color: '#E2E8F0', marginBottom: '1px' }}>
                            {formatDate(sub.created_at)}
                          </div>
                          <div style={{ fontSize: '11px', color: sub.passed ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                            {sub.passed ? 'Все тесты пройдены' : 'Тесты не пройдены'}
                          </div>
                        </div>
                        {idx === 0 && (
                          <span style={{
                            fontSize: '10px',
                            color: '#94A3B8',
                            background: '#253047',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}>
                            Последнее
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editor */}
          <div style={{ flex: '0 0 60%', padding: '16px 16px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              defaultValue={task.template}
              height="100%"
            />
          </div>

          {/* Submit button */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1E2A3A', display: 'flex', gap: '8px', alignItems: 'center', background: '#141824', flexShrink: 0 }}>
            <button
              onClick={handleSubmit}
              disabled={isRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                background: isRunning ? '#253047' : '#00ADD8',
                border: 'none',
                color: isRunning ? '#94A3B8' : '#0F111A',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontFamily: 'Manrope, sans-serif',
              }}
              onMouseEnter={(e) => { if (!isRunning) (e.currentTarget.style.background = '#00C4F5'); }}
              onMouseLeave={(e) => { if (!isRunning) (e.currentTarget.style.background = '#00ADD8'); }}
            >
              <Play size={14} />
              {isRunning ? 'Проверяется...' : 'Отправить решение'}
            </button>

            {/* AI Analysis button */}
            <button
              onClick={handleGetAI}
              disabled={!allPassed || isLoadingAI}
              title={!allPassed ? 'AI-анализ доступен после успешного решения задачи' : 'AI-анализ вашего решения'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid',
                borderColor: allPassed ? '#F59E0B' : '#253047',
                color: allPassed ? '#F59E0B' : '#64748B',
                fontSize: '13px',
                fontWeight: 600,
                cursor: allPassed && !isLoadingAI ? 'pointer' : 'not-allowed',
                opacity: allPassed ? 1 : 0.5,
                fontFamily: 'Manrope, sans-serif',
              }}
              onMouseEnter={(e) => { if (allPassed && !isLoadingAI) (e.currentTarget.style.background = 'rgba(245,158,11,0.08)'); }}
              onMouseLeave={(e) => { if (allPassed && !isLoadingAI) (e.currentTarget.style.background = 'transparent'); }}
            >
              <Sparkles size={14} />
              {isLoadingAI ? 'Анализ...' : 'AI Анализ'}
            </button>

            {allPassed && (
              <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} />
                Все тесты пройдены!
              </span>
            )}
          </div>

          {/* Results panel */}
          <div style={{ flex: 1, borderTop: '1px solid #1E2A3A', overflowY: 'auto', background: '#0F111A' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1E2A3A', background: '#141824' }}>
              {[
                { id: 'tests', label: 'Тесты' },
                { id: 'ai', label: '✦ AI Анализ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab.id ? '#00ADD8' : 'transparent'}`,
                    color: activeTab === tab.id ? '#F1F5F9' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px' }}>
              {activeTab === 'tests' && (
                <TestResults results={testResults} isRunning={isRunning} />
              )}
              {activeTab === 'ai' && (
                <div>
                  {isLoadingAI ? (
                    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid #253047',
                          borderTopColor: '#F59E0B',
                          borderRadius: '50%',
                          margin: '0 auto 16px',
                        }}
                        className="animate-spin"
                      />
                      <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                        Анализируем ваше решение...
                      </div>
                    </div>
                  ) : aiRecommendation ? (
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '10px',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Sparkles size={16} style={{ color: '#F59E0B' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>AI-анализ решения</span>
                      </div>
                      <MarkdownRenderer content={aiRecommendation} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                      <AlertCircle size={32} style={{ color: '#64748B', marginBottom: '12px' }} />
                      <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                        {allPassed
                          ? 'Нажмите «AI Анализ» чтобы получить рекомендации'
                          : 'AI-анализ доступен после успешного решения задачи'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
