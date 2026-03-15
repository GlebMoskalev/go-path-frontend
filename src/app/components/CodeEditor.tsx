import { useState, useRef, useEffect } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { Copy, Check, RotateCcw, AlignLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { Completion, CompletionSymbol } from '../api';
import { formatCode } from '../api';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  defaultValue?: string;
  language?: string;
  height?: string;
  completions?: Completion[];
}

export function CodeEditor({ value, onChange, defaultValue, language = 'go', height = '360px', completions }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const { resolved } = useTheme();
  const monacoRef = useRef<Monaco | null>(null);
  const disposablesRef = useRef<Array<{ dispose: () => void }>>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (defaultValue) onChange(defaultValue);
  };

  const handleFormat = () => {
    if (isFormatting || language !== 'go') return;
    setIsFormatting(true);
    formatCode(value)
      .then((result) => {
        onChange(result.code);
        setIsFormatting(false);
      })
      .catch(() => {
        setIsFormatting(false);
      });
  };

  useEffect(() => {
    if (!isMounted || !monacoRef.current || !completions || completions.length === 0) return;

    const monaco = monacoRef.current;
    const pkgList = completions;

    disposablesRef.current.forEach((d) => d.dispose());
    disposablesRef.current = [];

    const findPackage = (name: string): Completion | undefined => {
      const suffix = '/' + name;
      for (let i = 0; i < pkgList.length; i++) {
        const pkgName = pkgList[i].name;
        if (pkgName === name || pkgName.indexOf(suffix) === pkgName.length - suffix.length) {
          return pkgList[i];
        }
      }
      return undefined;
    };

    const findSymbol = (pkg: Completion, symName: string): CompletionSymbol | undefined => {
      for (let i = 0; i < pkg.symbols.length; i++) {
        if (pkg.symbols[i].name === symName) {
          return pkg.symbols[i];
        }
      }
      return undefined;
    };

    const completionProvider = monaco.languages.registerCompletionItemProvider('go', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const match = textUntilPosition.match(/(\w+)\.\s*$/);
        if (!match) {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = pkgList.map((pkg) => ({
            label: pkg.name,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: pkg.name,
            detail: pkg.doc,
            documentation: pkg.doc,
            range,
          }));

          return { suggestions };
        }

        const pkgName = match[1];
        const pkg = findPackage(pkgName);

        if (!pkg) {
          return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = pkg.symbols.map((sym) => {
          let kind: number;
          switch (sym.kind) {
            case 'function':
              kind = monaco.languages.CompletionItemKind.Function;
              break;
            case 'type':
              kind = monaco.languages.CompletionItemKind.Class;
              break;
            case 'constant':
              kind = monaco.languages.CompletionItemKind.Constant;
              break;
            case 'variable':
              kind = monaco.languages.CompletionItemKind.Variable;
              break;
            default:
              kind = monaco.languages.CompletionItemKind.Property;
          }

          let documentation = sym.doc;
          if (sym.fields && sym.fields.length > 0) {
            const fieldsDoc = sym.fields
              .map((f) => `  ${f.name} ${f.type}  // ${f.doc}`)
              .join('\n');
            documentation = `${sym.doc}\n\nFields:\n${fieldsDoc}`;
          }

          return {
            label: sym.name,
            kind,
            insertText: sym.name,
            detail: sym.detail,
            documentation,
            range,
          };
        });

        return { suggestions };
      },
    });

    const hoverProvider = monaco.languages.registerHoverProvider('go', {
      provideHover: (model, position) => {
        const line = model.getLineContent(position.lineNumber);
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const beforeWord = line.substring(0, word.startColumn - 1);
        const dotMatch = beforeWord.match(/(\w+)\.\s*$/);

        if (dotMatch) {
          const pkgName = dotMatch[1];
          const pkg = findPackage(pkgName);
          if (!pkg) return null;

          const sym = findSymbol(pkg, word.word);
          if (!sym) return null;

          let contents = `**${sym.detail}**\n\n${sym.doc}`;

          if (sym.fields && sym.fields.length > 0) {
            contents += '\n\n**Fields/Methods:**\n';
            contents += sym.fields
              .map((f) => `- \`${f.name}\` *${f.type}* — ${f.doc}`)
              .join('\n');
          }

          return {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: word.endColumn,
            },
            contents: [{ value: contents }],
          };
        }

        const pkg = findPackage(word.word);
        if (pkg) {
          const symbolsList = pkg.symbols
            .map((s) => `- \`${s.name}\` (${s.kind})`)
            .join('\n');

          return {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: word.endColumn,
            },
            contents: [
              {
                value: `**${pkg.name}**\n\n${pkg.doc}\n\n**Exports:**\n${symbolsList}`,
              },
            ],
          };
        }

        return null;
      },
    });

    disposablesRef.current.push(completionProvider, hoverProvider);

    return () => {
      disposablesRef.current.forEach((d) => d.dispose());
      disposablesRef.current = [];
    };
  }, [isMounted, completions]);

  const handleBeforeMount = (monaco: Monaco) => {
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

  const handleMount = (_editor: unknown, monaco: Monaco) => {
    monacoRef.current = monaco;
    setIsMounted(true);
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
          {language === 'go' && (
            <button
              onClick={handleFormat}
              disabled={isFormatting}
              style={{
                background: 'none',
                border: '1px solid var(--go-code-border)',
                borderRadius: '6px',
                color: 'var(--go-code-muted)',
                cursor: isFormatting ? 'not-allowed' : 'pointer',
                padding: '3px 8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isFormatting ? 0.5 : 1,
              }}
              title="Форматировать (gofmt)"
            >
              <AlignLeft size={12} />
              {isFormatting ? 'Форматирование...' : 'Формат'}
            </button>
          )}
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
          onMount={handleMount}
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
