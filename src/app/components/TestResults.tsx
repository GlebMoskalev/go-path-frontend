import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

function TestResultItem({ result, index }: { result: TestResult; index: number }) {
  const [open, setOpen] = useState(!result.passed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      style={{
        border: '1px solid',
        borderColor: result.passed ? 'var(--go-green-muted)' : 'rgba(220, 38, 38, 0.15)',
        borderRadius: '10px',
        overflow: 'hidden',
        background: result.passed ? 'var(--go-green-muted)' : 'rgba(220, 38, 38, 0.04)',
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
          <CheckCircle2 size={16} style={{ color: 'var(--go-green)', flexShrink: 0 }} />
        ) : (
          <XCircle size={16} style={{ color: 'var(--go-red)', flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--go-text)' }}>
          {result.name}
        </span>
        {(result.output || result.expected) && (
          open
            ? <ChevronDown size={14} style={{ color: 'var(--go-subtle)', flexShrink: 0 }} />
            : <ChevronRight size={14} style={{ color: 'var(--go-subtle)', flexShrink: 0 }} />
        )}
      </button>

      <AnimatePresence>
        {open && (result.output || result.expected) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 14px 12px',
                borderTop: '1px solid var(--go-border)',
              }}
            >
              {result.output && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--go-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Вывод
                  </div>
                  <pre style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    color: result.passed ? 'var(--go-green)' : 'var(--go-red)',
                    background: 'var(--go-code-bg)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    margin: 0,
                    overflow: 'auto',
                  }}>
                    {result.output}
                  </pre>
                </div>
              )}
              {result.expected && !result.passed && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--go-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ожидалось
                  </div>
                  <pre style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    color: 'var(--go-code-muted)',
                    background: 'var(--go-code-bg)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    margin: 0,
                  }}>
                    {result.expected}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SkeletonTestItem() {
  return (
    <div style={{
      border: '1px solid var(--go-border)',
      borderRadius: '10px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--go-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ flex: 1, height: '12px', borderRadius: '4px', background: 'var(--go-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  );
}

export function TestResults({ results, isRunning = false }: TestResultsProps) {
  if (isRunning) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '13px', color: 'var(--go-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '14px',
            height: '14px',
            border: '2px solid var(--go-cyan)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
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
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--go-muted)', fontSize: '14px' }}>
        Нажмите «Отправить решение», чтобы запустить тесты
      </div>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const allPassed = passed === results.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderRadius: '10px',
        background: allPassed ? 'var(--go-green-muted)' : 'rgba(220, 38, 38, 0.06)',
        border: '1px solid',
        borderColor: allPassed ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.15)',
        marginBottom: '2px',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: allPassed ? 'var(--go-green)' : 'var(--go-red)' }}>
          {allPassed ? 'Все тесты пройдены!' : `Пройдено ${passed} из ${results.length}`}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--go-muted)' }}>
          {passed}/{results.length}
        </span>
      </div>

      {results.map((r, idx) => (
        <TestResultItem key={r.id} result={r} index={idx} />
      ))}
    </div>
  );
}
