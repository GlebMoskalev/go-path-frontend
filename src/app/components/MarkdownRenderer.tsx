import type React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  textStyle?: React.CSSProperties;
}

function parseInlineCode(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/`([^`]+)`/);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={`${keyPrefix}c${i}`}
        style={{
          fontFamily: "var(--gp-font-mono)",
          fontSize: '0.86em',
          background: 'var(--gp-surface-muted)',
          border: '1px solid var(--gp-border)',
          borderRadius: '4px',
          padding: '1px 6px',
          color: 'var(--gp-ink)',
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

export function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/);
  return parts.flatMap((part, i) =>
    i % 2 === 1
      ? [<strong key={`b${i}`} style={{ color: 'var(--go-text)', fontWeight: 700 }}>{parseItalic(part, `b${i}-`)}</strong>]
      : parseItalic(part, `${i}-`)
  );
}

export function MarkdownRenderer({ content, textStyle }: MarkdownRendererProps) {
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
        <h1 key={i} style={{ fontSize: '26px', fontWeight: 600, color: 'var(--gp-ink)', marginTop: '10px', marginBottom: '14px', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
          {parseBold(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: '19px', fontWeight: 600, color: 'var(--gp-ink)', marginTop: '28px', marginBottom: '10px', letterSpacing: '-0.018em', lineHeight: 1.25 }}>
          {parseBold(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--gp-ink)', marginTop: '20px', marginBottom: '8px', letterSpacing: '-0.01em' }}>
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
                    {parseBold(cell.trim())}
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
            <li key={ii} style={{ color: 'var(--gp-ink-2)', marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'flex-start', lineHeight: 1.65 }}>
              <span style={{ color: 'var(--gp-ink-4)', marginTop: '8px', flexShrink: 0, width: 4, height: 4, borderRadius: '50%', background: 'var(--gp-ink-4)' }} aria-hidden />
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
      <p key={i} style={{ color: 'var(--gp-ink-2)', lineHeight: 1.7, marginBottom: '6px', ...textStyle }}>
        {parseBold(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}
