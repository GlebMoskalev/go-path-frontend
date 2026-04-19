import type React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

function parseInlineCode(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/`([^`]+)`/);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={`${keyPrefix}c${i}`}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.88em',
          background: 'var(--go-surface-2)',
          border: '1px solid var(--go-border)',
          borderRadius: '5px',
          padding: '1px 6px',
          color: 'var(--go-cyan)',
        }}
      >
        {part}
      </code>
    ) : (
      part
    )
  );
}

function parseItalic(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/\*([^*]+)\*/);
  return parts.flatMap((part, i) =>
    i % 2 === 1
      ? [<em key={`${keyPrefix}i${i}`} style={{ fontStyle: 'italic' }}>{parseInlineCode(part, `${keyPrefix}i${i}-`)}</em>]
      : parseInlineCode(part, `${keyPrefix}${i}-`)
  );
}

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/);
  return parts.flatMap((part, i) =>
    i % 2 === 1
      ? [<strong key={`b${i}`} style={{ color: 'var(--go-text)', fontWeight: 700 }}>{parseItalic(part, `b${i}-`)}</strong>]
      : parseItalic(part, `${i}-`)
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'go';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <div key={`code-${i}`} style={{ margin: '20px 0' }}>
          <CodeBlock code={codeLines.join('\n')} language={lang} />
        </div>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: '28px', fontWeight: 800, color: 'var(--go-text)', marginTop: '8px', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {parseBold(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: '20px', fontWeight: 700, color: 'var(--go-text)', marginTop: '28px', marginBottom: '10px', letterSpacing: '-0.01em' }}>
          {parseBold(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: '16px', fontWeight: 700, color: 'var(--go-text-secondary)', marginTop: '20px', marginBottom: '8px' }}>
          {parseBold(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (line.trim() === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--go-border)', margin: '24px 0' }} />);
      i++;
      continue;
    }

    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const headerCells = line.split('|').filter(c => c.trim());
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').filter(c => c.trim()));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '16px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--go-border)' }}>
                {headerCells.map((cell, ci) => (
                  <th key={ci} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--go-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid var(--go-border)' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '8px 12px', color: 'var(--go-text-secondary)' }}>
                      {parseBold(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '12px 0', paddingLeft: '20px', listStyle: 'none' }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ color: 'var(--go-text-secondary)', marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--go-cyan)', marginTop: '2px', flexShrink: 0 }}>—</span>
              <span>{parseBold(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '8px' }} />);
      i++;
      continue;
    }

    elements.push(
      <p key={i} style={{ color: 'var(--go-text-secondary)', lineHeight: '1.75', marginBottom: '4px' }}>
        {parseBold(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}
