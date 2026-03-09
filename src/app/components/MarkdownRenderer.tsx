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
          background: '#1A2035',
          border: '1px solid #253047',
          borderRadius: '4px',
          padding: '1px 6px',
          color: '#00ADD8',
        }}
      >
        {part}
      </code>
    ) : (
      part
    )
  );
}

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/);
  return parts.flatMap((part, i) =>
    i % 2 === 1
      ? [<strong key={`b${i}`} style={{ color: '#F1F5F9', fontWeight: 700 }}>{part}</strong>]
      : parseInlineCode(part, `${i}-`)
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'go';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={`code-${i}`} style={{ margin: '20px 0' }}>
          <CodeBlock code={codeLines.join('\n')} language={lang} />
        </div>
      );
      continue;
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: '28px', fontWeight: 800, color: '#F1F5F9', marginTop: '8px', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: '20px', fontWeight: 700, color: '#F1F5F9', marginTop: '28px', marginBottom: '10px', letterSpacing: '-0.01em' }}>
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0', marginTop: '20px', marginBottom: '8px' }}>
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // HR
    if (line.trim() === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #1E2A3A', margin: '24px 0' }} />);
      i++;
      continue;
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const headerCells = line.split('|').filter(c => c.trim());
      const rows: string[][] = [];
      i += 2; // skip header and separator
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').filter(c => c.trim()));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '16px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #253047' }}>
                {headerCells.map((cell, ci) => (
                  <th key={ci} style={{ padding: '8px 12px', textAlign: 'left', color: '#94A3B8', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid #1E2A3A' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '8px 12px', color: '#E2E8F0' }}>
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

    // Unordered list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '12px 0', paddingLeft: '20px', listStyle: 'none' }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ color: '#CBD5E1', marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: '#00ADD8', marginTop: '2px', flexShrink: 0 }}>—</span>
              <span>{parseBold(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '8px' }} />);
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} style={{ color: '#CBD5E1', lineHeight: '1.75', marginBottom: '4px' }}>
        {parseBold(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}