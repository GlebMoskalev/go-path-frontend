import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { darkTheme, lightTheme } from './syntaxThemes';

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  filename?: string;
}

export function CodeBlock({ code, language = 'go', showCopy = true, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { resolved } = useTheme();
  const theme = resolved === 'dark' ? darkTheme : lightTheme;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: 'var(--go-code-bg)',
        border: '1px solid var(--go-code-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid var(--go-code-border)',
          background: 'var(--go-code-header)',
        }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: 'var(--go-code-muted)',
        }}>
          {filename || language}
        </span>
        {showCopy && (
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: '1px solid var(--go-code-border)',
              borderRadius: '6px',
              color: copied ? 'var(--go-green)' : 'var(--go-code-muted)',
              cursor: 'pointer',
              padding: '3px 8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        )}
      </div>

      <SyntaxHighlighter
        language={language}
        style={theme as any}
        customStyle={{ margin: 0, borderRadius: 0, background: 'var(--go-code-bg)' }}
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{
          color: 'var(--go-code-line-num)',
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
