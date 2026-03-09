import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import {
  ChevronRight, Play, Sparkles, CheckCircle2, AlertCircle,
  Lightbulb, ChevronDown
} from 'lucide-react';
import { fetchProjectStep, submitProjectStep, analyzeProjectStep, type ProjectStepDetail } from '../api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CodeEditor } from '../components/CodeEditor';
import { TestResults, type TestResult } from '../components/TestResults';
import { DifficultyBadge } from '../components/DifficultyBadge';

export function ProjectStepPage() {
  const { projectId, stepId } = useParams<{ projectId: string; stepId: string }>();

  const [step, setStep] = useState<ProjectStepDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'ai'>('tests');
  const [openHints, setOpenHints] = useState<number[]>([]);

  useEffect(() => {
    if (!projectId || !stepId) return;
    
    setIsLoading(true);
    fetchProjectStep(projectId, stepId)
      .then((data) => {
        setStep(data);
        setCode(data.template);
        setSubmitted(data.solved || false);
        setTestResults([]);
        setShowAI(false);
        setAiRecommendation('');
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [projectId, stepId]);

  const toggleHint = (index: number) => {
    setOpenHints((prev) => prev.includes(index) ? prev.filter((h) => h !== index) : [...prev, index]);
  };

  const handleSubmit = async () => {
    if (!projectId || !stepId) return;
    
    setIsRunning(true);
    setActiveTab('tests');
    
    try {
      const result = await submitProjectStep(projectId, stepId, code);
      
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
    if (!projectId || !stepId || !allPassed) return;
    
    setIsLoadingAI(true);
    setActiveTab('ai');
    
    try {
      const result = await analyzeProjectStep(projectId, stepId, code);
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

  if (!step) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: '#0F111A' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: '#F1F5F9', marginBottom: '8px' }}>Шаг не найден</h2>
          <Link to="/projects" style={{ color: '#00ADD8', textDecoration: 'none' }}>← К проектам</Link>
        </div>
      </div>
    );
  }

  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);

  return (
    <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid #1E2A3A', padding: '10px 24px', background: '#141824', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link to="/projects" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Проекты
        </Link>
        <ChevronRight size={13} style={{ color: '#64748B' }} />
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>{step.project_slug}</span>
        <ChevronRight size={13} style={{ color: '#64748B' }} />
        <span style={{ fontSize: '13px', color: '#F1F5F9' }}>{step.title}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            Шаг {step.order}
          </span>
          <DifficultyBadge difficulty={step.difficulty} size="sm" />
          {submitted && (
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Решён
            </span>
          )}
        </div>
      </div>

      {/* Split layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 56px - 44px)', overflow: 'hidden' }}>
        {/* Left: Description + Hints */}
        <div
          style={{
            width: '45%',
            flexShrink: 0,
            borderRight: '1px solid #1E2A3A',
            overflowY: 'auto',
            padding: '28px 28px 40px',
          }}
        >
          {/* File name */}
          {step.file && (
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '5px 10px', 
              borderRadius: '6px', 
              background: '#1A2035', 
              border: '1px solid #253047', 
              marginBottom: '16px' 
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#94A3B8' }}>
                📄 {step.file}
              </span>
            </div>
          )}

          <MarkdownRenderer content={step.description} />

          {/* Hints */}
          {step.hints && step.hints.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Lightbulb size={16} style={{ color: '#F59E0B' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                  Подсказки
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {step.hints.map((hint, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #1E2A3A',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#141824',
                    }}
                  >
                    <button
                      onClick={() => toggleHint(index)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        color: '#E2E8F0',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <span>Подсказка {index + 1}</span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: openHints.includes(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          color: '#94A3B8',
                        }}
                      />
                    </button>
                    {openHints.includes(index) && (
                      <div style={{ padding: '0 16px 16px', fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
                        {hint}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Editor + Tests */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Editor */}
          <div style={{ flex: '0 0 60%', padding: '16px 16px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              defaultValue={step.template}
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
                gap: '6px',
                padding: '9px 18px',
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
              {isRunning ? 'Проверка...' : 'Запустить тесты'}
            </button>

            <button
              onClick={handleGetAI}
              disabled={!allPassed || isLoadingAI}
              title={!allPassed ? 'AI-анализ доступен после успешного решения шага' : 'AI-анализ вашего решения'}
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
                    color: activeTab === tab.id ? '#00ADD8' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: 600,
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
                          : 'AI-анализ доступен после успешного решения шага'}
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
