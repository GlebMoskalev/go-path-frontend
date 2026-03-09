import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  output?: string;
  expected?: string;
}

interface TestResultsProps {
  results: TestResult[];
  isRunning?: boolean;
}

function TestResultItem({ result }: { result: TestResult }) {
  const [open, setOpen] = useState(!result.passed);

  return (
    <div
      style={{
        border: '1px solid',
        borderColor: result.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: result.passed ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {result.passed ? (
          <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
        ) : (
          <XCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#E2E8F0' }}>
          {result.name}
        </span>
        {(result.output || result.expected) && (
          open
            ? <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
            : <ChevronRight size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
        )}
      </button>

      {open && (result.output || result.expected) && (
        <div
          style={{
            padding: '0 14px 12px',
            borderTop: '1px solid',
            borderColor: result.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          }}
        >
          {result.output && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Вывод
              </div>
              <pre
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: result.passed ? '#10B981' : '#EF4444',
                  background: '#0D1117',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  margin: 0,
                  overflow: 'auto',
                }}
              >
                {result.output}
              </pre>
            </div>
          )}
          {result.expected && !result.passed && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ожидалось
              </div>
              <pre
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: '#94A3B8',
                  background: '#0D1117',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  margin: 0,
                }}
              >
                {result.expected}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonTestItem() {
  return (
    <div
      style={{
        border: '1px solid #1E2A3A',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#1A2035', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ flex: 1, height: '12px', borderRadius: '4px', background: '#1A2035', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  );
}

export function TestResults({ results, isRunning = false }: TestResultsProps) {
  if (isRunning) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid #00ADD8',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Запуск тестов...
        </div>
        <SkeletonTestItem />
        <SkeletonTestItem />
        <SkeletonTestItem />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: '14px',
        }}
      >
        Нажмите «Отправить решение», чтобы запустить тесты
      </div>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const allPassed = passed === results.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderRadius: '8px',
          background: allPassed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${allPassed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          marginBottom: '2px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: allPassed ? '#10B981' : '#EF4444' }}>
          {allPassed ? '✓ Все тесты пройдены!' : `✗ Пройдено ${passed} из ${results.length}`}
        </span>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>
          {passed}/{results.length}
        </span>
      </div>

      {results.map((r) => (
        <TestResultItem key={r.id} result={r} />
      ))}
    </div>
  );
}
