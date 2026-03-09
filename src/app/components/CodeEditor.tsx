import { useState, useRef, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { editorDarkTheme, editorLightTheme } from './syntaxThemes';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  defaultValue?: string;
  language?: string;
  height?: string;
}

export function CodeEditor({ value, onChange, defaultValue, language = 'go', height = '360px' }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const { resolved } = useTheme();
  const theme = resolved === 'dark' ? editorDarkTheme : editorLightTheme;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (defaultValue) onChange(defaultValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newVal = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      });
    }
  };

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const wrapper = editorWrapRef.current;
    if (!textarea || !wrapper) return;
    const highlight = wrapper.querySelector('.highlight-layer') as HTMLElement;
    const lineNums = wrapper.querySelector('.line-numbers') as HTMLElement;
    if (highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
    if (lineNums) {
      lineNums.scrollTop = textarea.scrollTop;
    }
  }, []);

  const lineCount = value.split('\n').length;

  return (
    <div
      style={{
        background: 'var(--go-code-bg)',
        border: '1px solid var(--go-code-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height,
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
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', opacity: 0.7 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', opacity: 0.7 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', opacity: 0.7 }} />
          <span style={{ marginLeft: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--go-code-muted)' }}>
            main.go
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {defaultValue && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid var(--go-code-border)',
                borderRadius: '6px',
                color: 'var(--go-code-muted)',
                cursor: 'pointer',
                padding: '3px 8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Сбросить"
            >
              <RotateCcw size={12} />
              Сброс
            </button>
          )}
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
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
      </div>

      <div
        ref={editorWrapRef}
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="line-numbers"
          style={{
            padding: '16px 0',
            minWidth: '44px',
            textAlign: 'right',
            paddingRight: '12px',
            paddingLeft: '8px',
            background: 'var(--go-code-bg)',
            borderRight: '1px solid var(--go-code-border)',
            userSelect: 'none',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13.5px',
                lineHeight: '1.65',
                color: 'var(--go-code-line-num)',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div
            className="highlight-layer"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              padding: '16px',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <SyntaxHighlighter
              language={language}
              style={theme as any}
              customStyle={{
                margin: 0, padding: 0, background: 'transparent',
                border: 'none', overflow: 'visible',
              }}
              codeTagProps={{
                style: {
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '13.5px',
                  lineHeight: '1.65',
                  background: 'transparent',
                },
              }}
              showLineNumbers={false}
              wrapLongLines={false}
            >
              {value + '\n'}
            </SyntaxHighlighter>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'transparent',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '13.5px',
              lineHeight: '1.65',
              padding: '16px',
              caretColor: 'var(--go-cyan)',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              wordBreak: 'normal',
              tabSize: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
}
