import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check } from 'lucide-react';

const goTheme = {
  'code[class*="language-"]': {
    color: '#e2e8f0',
    background: 'none',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13.5px',
    lineHeight: '1.65',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#e2e8f0',
    background: '#0D1117',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13.5px',
    lineHeight: '1.65',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none',
    padding: '20px',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0',
  },
  comment: { color: '#64748b', fontStyle: 'italic' },
  prolog: { color: '#64748b' },
  doctype: { color: '#64748b' },
  cdata: { color: '#64748b' },
  punctuation: { color: '#94a3b8' },
  property: { color: '#00ADD8' },
  tag: { color: '#00ADD8' },
  boolean: { color: '#F59E0B' },
  number: { color: '#F59E0B' },
  constant: { color: '#F59E0B' },
  symbol: { color: '#F59E0B' },
  deleted: { color: '#EF4444' },
  selector: { color: '#10B981' },
  'attr-name': { color: '#10B981' },
  string: { color: '#10B981' },
  char: { color: '#10B981' },
  builtin: { color: '#10B981' },
  inserted: { color: '#10B981' },
  operator: { color: '#94a3b8' },
  entity: { color: '#F59E0B' },
  url: { color: '#00ADD8' },
  variable: { color: '#e2e8f0' },
  atrule: { color: '#00ADD8' },
  'attr-value': { color: '#10B981' },
  function: { color: '#00ADD8' },
  'class-name': { color: '#F59E0B' },
  keyword: { color: '#c792ea' },
  regex: { color: '#F59E0B' },
  important: { color: '#F59E0B', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  filename?: string;
}

export function CodeBlock({ code, language = 'go', showCopy = true, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: '#0D1117',
        border: '1px solid #1E2A3A',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid #1E2A3A',
          background: '#141824',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              color: '#94A3B8',
            }}
          >
            {filename || language}
          </span>
        </div>
        {showCopy && (
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: '1px solid #253047',
              borderRadius: '5px',
              color: copied ? '#10B981' : '#94A3B8',
              cursor: 'pointer',
              padding: '3px 8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        )}
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={goTheme as any}
        customStyle={{ margin: 0, borderRadius: 0, background: '#0D1117' }}
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{
          color: '#2d3748',
          paddingRight: '16px',
          minWidth: '36px',
          userSelect: 'none',
        }}
        wrapLongLines={false}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
