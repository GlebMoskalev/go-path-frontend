import { useState, useRef, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check, RotateCcw } from 'lucide-react';

const goTheme: Record<string, React.CSSProperties> = {
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
    background: 'transparent',
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
    padding: '0',
    margin: '0',
    overflow: 'visible',
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

  const lines = value.split('\n');
  const lineCount = lines.length;

  return (
    <div
      style={{
        background: '#0D1117',
        border: '1px solid #1E2A3A',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid #1E2A3A',
          background: '#141824',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', opacity: 0.7 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', opacity: 0.7 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', opacity: 0.7 }} />
          <span style={{ marginLeft: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#94A3B8' }}>
            main.go
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {defaultValue && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid #253047',
                borderRadius: '5px',
                color: '#94A3B8',
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
        </div>
      </div>

      {/* Editor area */}
      <div
        ref={editorWrapRef}
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Line numbers */}
        <div
          className="line-numbers"
          style={{
            padding: '16px 0',
            minWidth: '44px',
            textAlign: 'right',
            paddingRight: '12px',
            paddingLeft: '8px',
            background: '#0D1117',
            borderRight: '1px solid #1A2035',
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
                color: '#2d3748',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code area with highlight overlay */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Syntax-highlighted layer (behind textarea) */}
          <div
            className="highlight-layer"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              padding: '16px',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <SyntaxHighlighter
              language={language}
              style={goTheme as any}
              customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent',
                border: 'none',
                overflow: 'visible',
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

          {/* Editable textarea (transparent text, visible caret) */}
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
              caretColor: '#00ADD8',
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
