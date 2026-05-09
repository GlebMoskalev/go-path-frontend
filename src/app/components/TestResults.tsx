import { useState } from 'react';
import { Check, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dur, ease } from '../design/motion';

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

function TestRow({ result, index }: { result: TestResult; index: number }) {
  const [open, setOpen] = useState(!result.passed);
  const hasDetail = !!(result.output || result.expected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.base, delay: index * 0.04, ease: ease.standard }}
      className="rounded-md overflow-hidden"
      style={{
        background: 'var(--gp-surface)',
        border: '1px solid var(--gp-border)',
      }}
    >
      <button
        onClick={() => hasDetail && setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
        style={{ cursor: hasDetail ? 'pointer' : 'default' }}
      >
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
          style={{
            background: result.passed ? 'var(--gp-success-soft)' : 'var(--gp-danger-soft)',
            color: result.passed ? 'var(--gp-success)' : 'var(--gp-danger)',
          }}
        >
          {result.passed ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />}
        </span>
        <span className="flex-1 min-w-0 text-[13px] gp-mono truncate" style={{ color: 'var(--gp-ink)' }}>
          {result.name}
        </span>
        {hasDetail && (
          <span style={{ color: 'var(--gp-ink-4)' }} className="flex-shrink-0">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.emphasized }}
            className="overflow-hidden"
            style={{ borderTop: '1px solid var(--gp-border)' }}
          >
            <div className="px-3 py-3 grid gap-3">
              {result.output && (
                <DetailBlock label="Вывод" tone={result.passed ? 'ok' : 'fail'}>
                  {result.output}
                </DetailBlock>
              )}
              {result.expected && !result.passed && (
                <DetailBlock label="Ожидалось" tone="muted">
                  {result.expected}
                </DetailBlock>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailBlock({
  label,
  tone,
  children,
}: { label: string; tone: 'ok' | 'fail' | 'muted'; children: React.ReactNode }) {
  const color =
    tone === 'ok' ? 'var(--gp-success)' :
    tone === 'fail' ? 'var(--gp-danger)' :
    'var(--gp-ink-3)';
  return (
    <div>
      <div className="gp-eyebrow mb-1.5">{label}</div>
      <pre
        className="m-0 p-2.5 rounded text-[12px] gp-mono"
        style={{
          background: 'var(--gp-code-bg)',
          border: '1px solid var(--gp-code-border)',
          color,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          maxHeight: '320px',
          overflowY: 'auto',
        }}
      >
        {children}
      </pre>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      className="rounded-md flex items-center gap-2.5 px-3 py-2.5"
      style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-border)' }}
    >
      <span className="w-5 h-5 rounded-full gp-skel" />
      <span className="flex-1 h-3 gp-skel" />
    </div>
  );
}

export function TestResults({ results, isRunning = false }: TestResultsProps) {
  if (isRunning) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-[13px] mb-1" style={{ color: 'var(--gp-ink-3)' }}>
          <Loader2 size={13} className="animate-spin" style={{ color: 'var(--gp-ink)' }} />
          Запуск тестов…
        </div>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="gp-eyebrow">Тесты ещё не запускались</div>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--gp-ink-3)' }}>
          Нажми <span className="gp-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--gp-surface-muted)', color: 'var(--gp-ink)' }}>⌘ ⏎</span> или «Отправить», чтобы проверить решение.
        </p>
      </div>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const allPassed = passed === results.length;

  return (
    <div className="grid gap-2">
      {/* Summary */}
      <div
        className="flex items-center justify-between rounded-md px-3 py-2.5"
        style={{
          background: allPassed ? 'var(--gp-success-soft)' : 'var(--gp-danger-soft)',
          border: '1px solid',
          borderColor: allPassed ? 'var(--gp-success-soft)' : 'var(--gp-danger-soft)',
        }}
      >
        <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: allPassed ? 'var(--gp-success)' : 'var(--gp-danger)' }}>
          {allPassed ? <Check size={13} strokeWidth={2.5} /> : <X size={13} strokeWidth={2.5} />}
          {allPassed ? 'Все тесты пройдены' : `Пройдено ${passed} из ${results.length}`}
        </span>
        <span className="text-[12px] gp-mono" style={{ color: allPassed ? 'var(--gp-success)' : 'var(--gp-danger)' }}>
          {passed}/{results.length}
        </span>
      </div>

      {results.map((r, idx) => (
        <TestRow key={r.id} result={r} index={idx} />
      ))}
    </div>
  );
}
