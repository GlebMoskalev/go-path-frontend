import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  defaultValue?: string;
  language?: string;
  height?: string;
}

export function CodeEditor({ value, onChange, defaultValue, language = 'go', height = '360px' }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const { resolved } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (defaultValue) onChange(defaultValue);
  };

  const handleBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme('go-path-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c792ea' },
        { token: 'string', foreground: '10B981' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'type', foreground: '00ADD8' },
        { token: 'function', foreground: '00ADD8' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
      },
    });

    monaco.editor.defineTheme('go-path-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8B95A5', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7C3AED' },
        { token: 'string', foreground: '067D17' },
        { token: 'number', foreground: '1750EB' },
        { token: 'type', foreground: '0068A8' },
        { token: 'function', foreground: '0068A8' },
      ],
      colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#1E293B',
      },
    });
  };

  const monacoTheme = resolved === 'dark' ? 'go-path-dark' : 'go-path-light';

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
        style={{
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <Editor
          height="100%"
          language={language}
          theme={monacoTheme}
          value={value}
          onChange={(val) => onChange(val ?? '')}
          beforeMount={handleBeforeMount}
          loading={null}
          options={{
            minimap: { enabled: false },
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 1.65,
            tabSize: 4,
            insertSpaces: true,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 10,
            renderLineHighlight: 'line',
          }}
        />
      </div>
    </div>
  );
}
