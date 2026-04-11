import { useState, useRef, useEffect } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor, Position } from 'monaco-editor';
import { Copy, Check, RotateCcw, AlignLeft, X, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { Completion, CompletionSymbol } from '../api';
import { formatCode, formatProjectCode } from '../api';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  defaultValue?: string;
  language?: string;
  height?: string;
  completions?: Completion[];
  projectSlug?: string;
  stepSlug?: string;
}

export function CodeEditor({ value, onChange, defaultValue, language = 'go', height = '360px', completions, projectSlug, stepSlug }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const helpBtnRef = useRef<HTMLButtonElement>(null);
  const { resolved } = useTheme();
  const monacoRef = useRef<Monaco | null>(null);
  const disposablesRef = useRef<Array<{ dispose: () => void }>>([]);
  const completionsRef = useRef(completions);
  completionsRef.current = completions;

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

    const formatPromise = projectSlug && stepSlug
      ? formatProjectCode(projectSlug, stepSlug, value)
      : formatCode(value);

    formatPromise
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

    const getShortName = (fullName: string): string => {
      const slashIdx = fullName.lastIndexOf('/');
      return slashIdx >= 0 ? fullName.substring(slashIdx + 1) : fullName;
    };

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
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const match = /(\w+)\.\w*$/.exec(textUntilPosition);
        if (match && match.index > 0 && textUntilPosition[match.index - 1] === '.') {
          return { suggestions: [] };
        }
        if (!match) {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = pkgList.map((pkg) => {
            const shortName = getShortName(pkg.name);
            return {
              label: shortName,
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: shortName,
              detail: pkg.name !== shortName ? pkg.name : pkg.doc,
              documentation: pkg.doc,
              range,
            };
          });

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
      provideHover: (model: editor.ITextModel, position: Position) => {
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
          const shortName = getShortName(pkg.name);
          const symbolsList = pkg.symbols
            .map((s) => `- \`${s.name}\` (${s.kind})`)
            .join('\n');

          const title = pkg.name !== shortName 
            ? `**${shortName}** (\`${pkg.name}\`)` 
            : `**${shortName}**`;

          return {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: word.endColumn,
            },
            contents: [
              {
                value: `${title}\n\n${pkg.doc}\n\n**Exports:**\n${symbolsList}`,
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

  useEffect(() => {
    if (!isMounted || !monacoRef.current) return;
    const monaco = monacoRef.current;

    const GO_BUILTINS = [
      { label: 'append', kind: monaco.languages.CompletionItemKind.Function, detail: 'func append(slice []Type, elems ...Type) []Type' },
      { label: 'len', kind: monaco.languages.CompletionItemKind.Function, detail: 'func len(v Type) int' },
      { label: 'cap', kind: monaco.languages.CompletionItemKind.Function, detail: 'func cap(v Type) int' },
      { label: 'make', kind: monaco.languages.CompletionItemKind.Function, detail: 'func make(t Type, size ...int) Type' },
      { label: 'new', kind: monaco.languages.CompletionItemKind.Function, detail: 'func new(Type) *Type' },
      { label: 'copy', kind: monaco.languages.CompletionItemKind.Function, detail: 'func copy(dst, src []Type) int' },
      { label: 'delete', kind: monaco.languages.CompletionItemKind.Function, detail: 'func delete(m map[K]V, key K)' },
      { label: 'close', kind: monaco.languages.CompletionItemKind.Function, detail: 'func close(c chan<- Type)' },
      { label: 'panic', kind: monaco.languages.CompletionItemKind.Function, detail: 'func panic(v any)' },
      { label: 'recover', kind: monaco.languages.CompletionItemKind.Function, detail: 'func recover() any' },
      { label: 'println', kind: monaco.languages.CompletionItemKind.Function, detail: 'func println(args ...Type)' },
      { label: 'print', kind: monaco.languages.CompletionItemKind.Function, detail: 'func print(args ...Type)' },
      { label: 'nil', kind: monaco.languages.CompletionItemKind.Constant, detail: 'nil' },
      { label: 'true', kind: monaco.languages.CompletionItemKind.Constant, detail: 'bool' },
      { label: 'false', kind: monaco.languages.CompletionItemKind.Constant, detail: 'bool' },
      { label: 'iota', kind: monaco.languages.CompletionItemKind.Constant, detail: 'const iota' },
      { label: 'error', kind: monaco.languages.CompletionItemKind.Interface, detail: 'interface{ Error() string }' },
      { label: 'string', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'string' },
      { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'int' },
      { label: 'int64', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'int64' },
      { label: 'int32', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'int32' },
      { label: 'float64', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'float64' },
      { label: 'float32', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'float32' },
      { label: 'bool', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'bool' },
      { label: 'byte', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'alias for uint8' },
      { label: 'rune', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'alias for int32' },
      { label: 'any', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'alias for interface{}' },
      { label: 'uint', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'uint' },
      { label: 'struct', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'struct type' },
      { label: 'interface', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'interface type' },
      { label: 'map', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'map type' },
      { label: 'chan', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'channel type' },
      { label: 'func', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'function' },
      { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'return statement' },
      { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'if statement' },
      { label: 'else', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'else clause' },
      { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'for loop' },
      { label: 'range', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'range clause' },
      { label: 'switch', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'switch statement' },
      { label: 'case', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'case clause' },
      { label: 'default', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'default clause' },
      { label: 'select', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'select statement' },
      { label: 'defer', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'defer statement' },
      { label: 'go', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'goroutine' },
      { label: 'var', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'variable declaration' },
      { label: 'const', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'constant declaration' },
      { label: 'type', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'type declaration' },
      { label: 'package', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'package declaration' },
      { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'import declaration' },
      { label: 'break', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'break statement' },
      { label: 'continue', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'continue statement' },
      { label: 'fallthrough', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'fallthrough statement' },
      { label: 'goto', kind: monaco.languages.CompletionItemKind.Keyword, detail: 'goto statement' },
    ];

    const GO_SNIPPETS = [
      { label: 'iferr', insert: 'if err != nil {\n\t${1:return err}\n}', detail: 'if err != nil { ... }' },
      { label: 'ifelse', insert: 'if ${1:condition} {\n\t$2\n} else {\n\t$0\n}', detail: 'if ... else ...' },
      { label: 'fori', insert: 'for ${1:i} := ${2:0}; ${1:i} < ${3:n}; ${1:i}++ {\n\t$0\n}', detail: 'for i := 0; i < n; i++ { }' },
      { label: 'forr', insert: 'for ${1:_}, ${2:v} := range ${3:slice} {\n\t$0\n}', detail: 'for _, v := range ... { }' },
      { label: 'switchcase', insert: 'switch ${1:expr} {\ncase ${2:val}:\n\t$0\ndefault:\n}', detail: 'switch ... case ...' },
      { label: 'gofunc', insert: 'go func() {\n\t$0\n}()', detail: 'go func() { }()' },
      { label: 'deferfunc', insert: 'defer func() {\n\t$0\n}()', detail: 'defer func() { }()' },
    ];

    interface StructInfo { name: string; fields: { name: string; type: string }[] }
    interface MethodInfo {
      receiverType: string;
      name: string;
      params: string;
      returnTypes: string[];
      signature: string;
      doc: string;
    }

    function parseStructs(code: string): StructInfo[] {
      const structs: StructInfo[] = [];
      const re = /type\s+(\w+)\s+struct\s*\{([^}]*)\}/g;
      let m;
      while ((m = re.exec(code)) !== null) {
        const fields: { name: string; type: string }[] = [];
        for (const line of m[2].split('\n')) {
          const t = line.trim();
          if (!t || t.startsWith('//')) continue;
          const fm = t.match(/^(\w+)\s+([\S]+)/);
          if (fm) fields.push({ name: fm[1], type: fm[2] });
        }
        structs.push({ name: m[1], fields });
      }
      return structs;
    }

    function parseMethods(code: string): MethodInfo[] {
      const methods: MethodInfo[] = [];
      const re = /(?:\/\/\s*(.+)\n\s*)?func\s+\(\s*\w+\s+\*?(\w+)\s*\)\s+(\w+)\s*\(([^)]*)\)\s*([^{]*)/g;
      let m;
      while ((m = re.exec(code)) !== null) {
        const doc = m[1] ? m[1].trim() : '';
        const receiverType = m[2];
        const name = m[3];
        const params = m[4].trim();
        const retStr = m[5].trim();
        const returnTypes: string[] = [];
        if (retStr) {
          const parenMatch = retStr.match(/^\(([^)]*)\)/);
          if (parenMatch) {
            returnTypes.push(...parenMatch[1].split(',').map(t => t.trim()).filter(Boolean));
          } else {
            returnTypes.push(retStr.split(/\s/)[0]);
          }
        }
        const retPart = retStr ? ' ' + retStr : '';
        const sig = `func (${receiverType}) ${name}(${params})${retPart}`;
        methods.push({ receiverType, name, params, returnTypes, signature: sig, doc });
      }
      return methods;
    }

    function parseFileSymbols(code: string) {
      const syms: { name: string; kind: number; detail: string }[] = [];
      const seen = new Set<string>();
      const add = (n: string, k: number, d: string) => { if (!seen.has(n) && n !== '_') { seen.add(n); syms.push({ name: n, kind: k, detail: d }); } };
      let m;
      const typeRe = /type\s+(\w+)\s+/g;
      while ((m = typeRe.exec(code)) !== null) add(m[1], monaco.languages.CompletionItemKind.Struct, `type ${m[1]}`);
      const funcRe = /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/g;
      while ((m = funcRe.exec(code)) !== null) if (m[1] !== 'main') add(m[1], monaco.languages.CompletionItemKind.Function, `func ${m[1]}(...)`);
      const constBlockRe = /(const|var)\s*\(\s*([\s\S]*?)\s*\)/g;
      while ((m = constBlockRe.exec(code)) !== null) {
        const kind = m[1] === 'const' ? monaco.languages.CompletionItemKind.Constant : monaco.languages.CompletionItemKind.Variable;
        for (const line of m[2].split('\n')) { const lm = line.trim().match(/^(\w+)/); if (lm) add(lm[1], kind, `${m[1]} ${lm[1]}`); }
      }
      const constRe = /^const\s+(\w+)/gm;
      while ((m = constRe.exec(code)) !== null) add(m[1], monaco.languages.CompletionItemKind.Constant, `const ${m[1]}`);
      const varRe = /^var\s+(\w+)/gm;
      while ((m = varRe.exec(code)) !== null) add(m[1], monaco.languages.CompletionItemKind.Variable, `var ${m[1]}`);
      return syms;
    }

    function parseParams(str: string): { name: string; type: string }[] {
      if (!str.trim()) return [];
      const parts = str.split(',').map(s => s.trim());
      const parsed: { name: string; type: string }[] = [];
      for (const p of parts) {
        const m = p.match(/^(\w+)\s+([\S].*)$/);
        parsed.push(m ? { name: m[1], type: m[2] } : { name: p, type: '' });
      }
      for (let i = parsed.length - 2; i >= 0; i--) {
        if (!parsed[i].type && parsed[i + 1].type) parsed[i].type = parsed[i + 1].type;
      }
      return parsed.filter(p => p.name && p.name !== '_');
    }

    function findFuncBraceIndex(code: string, offset: number): number {
      let depth = 0;
      for (let i = offset - 1; i >= 0; i--) {
        if (code[i] === '}') { depth++; continue; }
        if (code[i] !== '{') continue;
        if (depth > 0) { depth--; continue; }
        const before = code.substring(Math.max(0, i - 500), i);
        const fm = before.match(/func\s+(?:\(\s*\w+\s+\*?[\w.]+\s*\)\s+)?\w+\s*\([^)]*\)[^{]*$/);
        if (fm) return i;
      }
      return -1;
    }

    function findEnclosingFunc(code: string, offset: number) {
      const before = code.substring(Math.max(0, offset - 501), offset - 1);
      const fm = before.match(/func\s+(?:\(\s*(\w+)\s+(\*?[\w.]+)\s*\)\s+)?(\w+)\s*\(([^)]*)\)[^{]*$/);
      if (!fm) return null;
      return {
        receiver: fm[1] ? { name: fm[1], type: fm[2].replace(/^\*/, '') } : undefined,
        params: parseParams(fm[4]),
        bodyCode: code.substring(offset, offset),
      };
    }

    function parseLocalVars(bodyCode: string): { name: string; type: string }[] {
      const vars: { name: string; type: string }[] = [];
      const seen = new Set<string>();
      let m;
      const shortRe = /([\w][\w\s,]*?)\s*:=/g;
      while ((m = shortRe.exec(bodyCode)) !== null) {
        const names = m[1].split(',').map(n => n.trim()).filter(Boolean);
        const rhs = bodyCode.substring(m.index + m[0].length).trimStart();
        const tm = rhs.match(/^&?([\w][\w.]*)\s*([{(])/);
        let inferredType = '';
        if (tm) {
          if (tm[2] === '{') {
            inferredType = tm[1];
          } else if (tm[2] === '(' && !tm[1].includes('.')) {
            inferredType = tm[1];
          }
        }
        for (const name of names) {
          if (name !== '_' && !seen.has(name)) {
            seen.add(name);
            vars.push({ name, type: inferredType });
          }
        }
      }

      const varRe = /var\s+(\w+)\s+([\S]+)/g;
      while ((m = varRe.exec(bodyCode)) !== null) {
        if (m[1] !== '_' && !seen.has(m[1])) { seen.add(m[1]); vars.push({ name: m[1], type: m[2].replace(/^\*/, '') }); }
      }

      const rangeRe = /for\s+(\w+)\s*(?:,\s*(\w+))?\s*:=\s*range/g;
      while ((m = rangeRe.exec(bodyCode)) !== null) {
        for (const n of [m[1], m[2]]) {
          if (n && n !== '_' && !seen.has(n)) { seen.add(n); vars.push({ name: n, type: '' }); }
        }
      }

      return vars;
    }

    function resolveVarType(
      varName: string,
      funcInfo: ReturnType<typeof findEnclosingFunc>,
      localVars: { name: string; type: string }[],
    ): string | null {
      if (funcInfo?.receiver?.name === varName) return funcInfo.receiver.type;
      const param = funcInfo?.params.find(p => p.name === varName);
      if (param) return param.type.replace(/^\*/, '');
      const lv = localVars.find(v => v.name === varName);
      if (lv?.type) return lv.type.replace(/^\*/, '');
      return null;
    }

    function normalizeGoType(t: string): string {
      return t.replace(/^(\*|\[\])+/, '').trim();
    }

    function getFieldType(rootType: string, fieldName: string, structs: StructInfo[]): string | null {
      const fields = getFieldsForType(rootType, structs);
      if (!fields) return null;
      const f = fields.find((x) => x.name === fieldName);
      return f ? normalizeGoType(f.type) : null;
    }

    function resolveMemberChainType(
      parts: string[],
      funcInfo: ReturnType<typeof findEnclosingFunc>,
      localVars: { name: string; type: string }[],
      structs: StructInfo[],
    ): string | null {
      if (parts.length === 0) return null;
      let t: string | null = resolveVarType(parts[0], funcInfo, localVars);
      if (!t) return null;
      for (let i = 1; i < parts.length; i++) {
        const ft = getFieldType(t, parts[i], structs);
        if (!ft) return null;
        t = ft;
      }
      return t;
    }

    function getFieldsForType(typeName: string, structs: StructInfo[]): { name: string; type: string; doc?: string }[] | null {
      const dotIdx = typeName.indexOf('.');
      if (dotIdx >= 0) {
        const pkgShort = typeName.substring(0, dotIdx);
        const symName = typeName.substring(dotIdx + 1);
        const pkgs = completionsRef.current;
        if (!pkgs) return null;
        const pkg = pkgs.find(p => { const si = p.name.lastIndexOf('/'); return (si >= 0 ? p.name.substring(si + 1) : p.name) === pkgShort; });
        const sym = pkg?.symbols.find(s => s.name === symName);
        return sym?.fields ?? null;
      }
      return structs.find(s => s.name === typeName)?.fields ?? null;
    }

    function parseFuncReturnTypes(funcType: string): string[] {
      if (!funcType.startsWith('func')) return [];
      const firstParen = funcType.indexOf('(');
      if (firstParen < 0) return [];
      let depth = 0;
      let paramEnd = -1;
      for (let i = firstParen; i < funcType.length; i++) {
        if (funcType[i] === '(') depth++;
        if (funcType[i] === ')') { depth--; if (depth === 0) { paramEnd = i; break; } }
      }
      if (paramEnd < 0) return [];
      const afterParams = funcType.substring(paramEnd + 1).trim();
      if (!afterParams) return [];
      if (afterParams.startsWith('(')) {
        const closeParen = afterParams.lastIndexOf(')');
        if (closeParen < 0) return [];
        return afterParams.substring(1, closeParen).split(',').map(t => t.trim()).filter(Boolean);
      }
      return [afterParams];
    }

    function resolveMethodReturnType(
      chainExpr: string,
      funcInfo: ReturnType<typeof findEnclosingFunc>,
      localVars: { name: string; type: string }[],
      structs: StructInfo[],
    ): string[] | null {
      const parts = chainExpr.split('.').filter(p => p.length > 0);
      if (parts.length < 2) return null;
      const methodName = parts[parts.length - 1];
      const objParts = parts.slice(0, -1);
      const objType = resolveMemberChainType(objParts, funcInfo, localVars, structs);
      if (!objType) return null;
      const fields = getFieldsForType(objType, structs);
      if (!fields) return null;
      const field = fields.find(f => f.name === methodName);
      if (!field) return null;
      if (field.type.startsWith('func')) {
        return parseFuncReturnTypes(field.type);
      }
      return [field.type];
    }

    function resolveLocalVarTypesFromCalls(
      bodyCode: string,
      localVars: { name: string; type: string }[],
      funcInfo: ReturnType<typeof findEnclosingFunc>,
      structs: StructInfo[],
    ): void {
      const re = /([\w][\w\s,]*?)\s*:=\s*/g;
      let cm;
      while ((cm = re.exec(bodyCode)) !== null) {
        const names = cm[1].split(',').map(n => n.trim()).filter(Boolean);
        const hasUnresolved = names.some(n => n !== '_' && localVars.find(v => v.name === n && !v.type));
        if (!hasUnresolved) continue;
        const rhs = bodyCode.substring(cm.index + cm[0].length).trimStart();
        const callMatch = rhs.match(/^([\w]+(?:\.[\w]+)+)\s*\(/);
        if (!callMatch) continue;
        const returnTypes = resolveMethodReturnType(callMatch[1], funcInfo, localVars, structs);
        if (!returnTypes) continue;
        for (let i = 0; i < names.length && i < returnTypes.length; i++) {
          if (names[i] === '_') continue;
          const lv = localVars.find(v => v.name === names[i]);
          if (lv && !lv.type) {
            lv.type = returnTypes[i].replace(/^\*/, '');
          }
        }
      }
    }

    function getStructLiteralCtx(code: string, offset: number): { typeName: string; isFieldName: boolean } | null {
      let depth = 0;
      for (let i = offset - 1; i >= 0; i--) {
        if (code[i] === '}') { depth++; continue; }
        if (code[i] !== '{') continue;
        if (depth > 0) { depth--; continue; }
        const lineStart = code.lastIndexOf('\n', i);
        const lineCtx = code.substring(Math.max(0, lineStart), i);
        if (/\b(?:func|if|else|for|switch|select|type|interface)\b/.test(lineCtx)) return null;
        const before = code.substring(Math.max(0, i - 300), i).trimEnd();
        const tm = before.match(/&?([\w.]+)$/);
        if (!tm) return null;
        const inside = code.substring(i + 1, offset);
        let d2 = 0, lastComma = -1;
        for (let j = inside.length - 1; j >= 0; j--) {
          if (inside[j] === '}') d2++;
          if (inside[j] === '{') d2--;
          if (d2 === 0 && inside[j] === ',') { lastComma = j; break; }
        }
        return { typeName: tm[1], isFieldName: !inside.substring(lastComma + 1).includes(':') };
      }
      return null;
    }

    const localProvider = monaco.languages.registerCompletionItemProvider('go', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        try {
          const code = model.getValue();
          const offset = model.getOffsetAt(position);
          const structs = parseStructs(code);
          const codeMethods = parseMethods(code);
          const fileSymbols = parseFileSymbols(code);
          const localVars: { name: string; type: string }[] = [];

          let funcInfo: ReturnType<typeof findEnclosingFunc> = null;
          const funcBraceIdx = findFuncBraceIndex(code, offset);
          if (funcBraceIdx >= 0) {
            funcInfo = findEnclosingFunc(code, funcBraceIdx + 1);
            if (funcInfo) {
              funcInfo.bodyCode = code.substring(funcBraceIdx + 1, offset);
              localVars.push(...parseLocalVars(funcInfo.bodyCode));
              resolveLocalVarTypesFromCalls(funcInfo.bodyCode, localVars, funcInfo, structs);
            }
          }

          const lineText = model.getValueInRange({
            startLineNumber: position.lineNumber, startColumn: 1,
            endLineNumber: position.lineNumber, endColumn: position.column,
          });

          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
            startColumn: word.startColumn, endColumn: word.endColumn,
          };

          const chainMatch = lineText.match(/([\w.]+)\.\w*$/);
          if (chainMatch) {
            const parts = chainMatch[1].split('.').filter((p: string) => p.length > 0);
            const typeName = resolveMemberChainType(parts, funcInfo, localVars, structs);
            if (!typeName) return { suggestions: [] };
            const fields = getFieldsForType(typeName, structs);
            // Also find methods defined on this type in the user's code
            const normalType = normalizeGoType(typeName);
            const typeMethods = codeMethods.filter(m => m.receiverType === normalType);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chainSuggestions: any[] = [];
            if (fields) {
              chainSuggestions.push(...fields.map(f => {
                const isFunc = f.type.startsWith('func');
                return {
                  label: f.name,
                  kind: isFunc ? monaco.languages.CompletionItemKind.Method : monaco.languages.CompletionItemKind.Field,
                  insertText: f.name,
                  detail: f.type,
                  documentation: f.doc,
                  range,
                  sortText: isFunc ? '1_' + f.name : '0_' + f.name,
                };
              }));
            }
            // Add locally defined methods for this type
            const fieldNames = new Set(chainSuggestions.map(s => s.label as string));
            for (const mth of typeMethods) {
              if (!fieldNames.has(mth.name)) {
                const retPart = mth.returnTypes.length > 0
                  ? mth.returnTypes.length > 1 ? ' (' + mth.returnTypes.join(', ') + ')' : ' ' + mth.returnTypes[0]
                  : '';
                chainSuggestions.push({
                  label: mth.name,
                  kind: monaco.languages.CompletionItemKind.Method,
                  insertText: mth.name,
                  detail: 'func(' + mth.params + ')' + retPart,
                  documentation: mth.doc || undefined,
                  range,
                  sortText: '1_' + mth.name,
                });
              }
            }
            if (chainSuggestions.length === 0) return { suggestions: [] };
            return { suggestions: chainSuggestions };
          }

          const structCtx = getStructLiteralCtx(code, offset);
          if (structCtx?.isFieldName) {
            const fields = getFieldsForType(structCtx.typeName, structs);
            if (fields) {
              return {
                suggestions: fields.map(f => ({
                  label: f.name, kind: monaco.languages.CompletionItemKind.Field,
                  insertText: f.name + ': ', detail: f.type, range,
                  sortText: '0_' + f.name,
                })),
              };
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const suggestions: any[] = [];
          const seen = new Set<string>();

          if (funcInfo?.receiver) {
            const r = funcInfo.receiver;
            if (!seen.has(r.name)) { seen.add(r.name); suggestions.push({ label: r.name, kind: monaco.languages.CompletionItemKind.Variable, insertText: r.name, detail: r.type, sortText: '0_' + r.name, range }); }
          }
          for (const p of funcInfo?.params ?? []) {
            if (!seen.has(p.name)) { seen.add(p.name); suggestions.push({ label: p.name, kind: monaco.languages.CompletionItemKind.Variable, insertText: p.name, detail: p.type, sortText: '0_' + p.name, range }); }
          }
          for (const v of localVars) {
            if (!seen.has(v.name)) { seen.add(v.name); suggestions.push({ label: v.name, kind: monaco.languages.CompletionItemKind.Variable, insertText: v.name, detail: v.type || 'variable', sortText: '0_' + v.name, range }); }
          }
          for (const s of fileSymbols) {
            if (!seen.has(s.name)) { seen.add(s.name); suggestions.push({ label: s.name, kind: s.kind, insertText: s.name, detail: s.detail, sortText: '1_' + s.name, range }); }
          }
          for (const b of GO_BUILTINS) {
            if (!seen.has(b.label)) { seen.add(b.label); suggestions.push({ label: b.label, kind: b.kind, insertText: b.label, detail: b.detail, sortText: '2_' + b.label, range }); }
          }
          for (const sn of GO_SNIPPETS) {
            suggestions.push({
              label: sn.label, kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: sn.insert,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: sn.detail, sortText: '3_' + sn.label, range,
            });
          }

          return { suggestions };
        } catch (e) {
          console.error('[CodeEditor] local completion error:', e);
          return { suggestions: [] };
        }
      },
    });

    const localHoverProvider = monaco.languages.registerHoverProvider('go', {
      provideHover: (model: editor.ITextModel, position: Position) => {
        try {
          const code = model.getValue();
          const offset = model.getOffsetAt(position);
          const line = model.getLineContent(position.lineNumber);
          const word = model.getWordAtPosition(position);
          if (!word) return null;

          const structs = parseStructs(code);
          const codeMethods = parseMethods(code);
          const localVars: { name: string; type: string }[] = [];
          let funcInfo: ReturnType<typeof findEnclosingFunc> = null;
          const funcBraceIdx = findFuncBraceIndex(code, offset);
          if (funcBraceIdx >= 0) {
            funcInfo = findEnclosingFunc(code, funcBraceIdx + 1);
            if (funcInfo) {
              funcInfo.bodyCode = code.substring(funcBraceIdx + 1, offset);
              localVars.push(...parseLocalVars(funcInfo.bodyCode));
              resolveLocalVarTypesFromCalls(funcInfo.bodyCode, localVars, funcInfo, structs);
            }
          }

          const hoverRange = {
            startLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: word.endColumn,
          };

          const beforeWord = line.substring(0, word.startColumn - 1);
          const dotMatch = beforeWord.match(/([\w.]+)\.\s*$/);

          if (dotMatch) {
            const parts = dotMatch[1].split('.').filter((p: string) => p.length > 0);
            const objType = resolveMemberChainType(parts, funcInfo, localVars, structs);
            if (!objType) return null;
            const normalType = normalizeGoType(objType);

            // First check locally defined methods on this type
            const localMethod = codeMethods.find(m => m.receiverType === normalType && m.name === word.word);
            if (localMethod) {
              let content = '```go\n' + localMethod.signature + '\n```';
              if (localMethod.doc) content += '\n\n' + localMethod.doc;
              // Show return type struct fields
              const mainRet = localMethod.returnTypes.find(t => t !== 'error');
              if (mainRet) {
                const retFields = getFieldsForType(normalizeGoType(mainRet), structs);
                if (retFields && retFields.length > 0) {
                  content += '\n\nReturns `' + normalizeGoType(mainRet) + '`:\n';
                  content += retFields.map(f => '- `' + f.name + '` `' + f.type + '`' + (f.doc ? ' — ' + f.doc : '')).join('\n');
                }
              }
              return { range: hoverRange, contents: [{ value: content }] };
            }

            // Then check fields/methods from completions
            const fields = getFieldsForType(objType, structs);
            if (!fields) return null;
            const field = fields.find(f => f.name === word.word);
            if (!field) return null;

            let content = '';
            if (field.type.startsWith('func')) {
              content = '```go\nfunc ' + word.word + field.type.substring(4) + '\n```';
              if (field.doc) content += '\n\n' + field.doc;
              const retTypes = parseFuncReturnTypes(field.type);
              const mainRet = retTypes.find(t => t !== 'error');
              if (mainRet) {
                const retFields = getFieldsForType(normalizeGoType(mainRet), structs);
                if (retFields && retFields.length > 0) {
                  content += '\n\nReturns `' + normalizeGoType(mainRet) + '`:\n';
                  content += retFields.map(f => '- `' + f.name + '` `' + f.type + '`' + (f.doc ? ' — ' + f.doc : '')).join('\n');
                }
              }
            } else {
              content = '```go\n' + word.word + ' ' + field.type + '\n```';
              if (field.doc) content += '\n\n' + field.doc;
              const subFields = getFieldsForType(normalizeGoType(field.type), structs);
              if (subFields && subFields.length > 0) {
                const hasMethodFields = subFields.some(f => f.type.startsWith('func'));
                content += '\n\n' + (hasMethodFields ? 'Fields / Methods' : 'Fields') + ':\n';
                content += subFields.map(f => '- `' + f.name + '` `' + f.type + '`' + (f.doc ? ' — ' + f.doc : '')).join('\n');
              }
            }

            return { range: hoverRange, contents: [{ value: content }] };
          }

          // Check if hovering on a variable, parameter, or receiver
          const varType = resolveVarType(word.word, funcInfo, localVars);
          if (varType) {
            let rawType = varType;
            if (funcInfo?.receiver?.name === word.word) {
              rawType = '*' + funcInfo.receiver.type;
            } else {
              const param = funcInfo?.params.find(p => p.name === word.word);
              if (param) { rawType = param.type; }
            }

            let content = '```go\n' + word.word + ' ' + rawType + '\n```';
            const fields = getFieldsForType(varType, structs);
            if (fields && fields.length > 0) {
              const normalFields = fields.filter(f => !f.type.startsWith('func'));
              const methodFields = fields.filter(f => f.type.startsWith('func'));
              if (normalFields.length > 0) {
                content += '\n\nFields:\n';
                content += normalFields.map(f => '- `' + f.name + '` `' + f.type + '`' + (f.doc ? ' — ' + f.doc : '')).join('\n');
              }
              if (methodFields.length > 0) {
                content += '\n\nMethods:\n';
                content += methodFields.map(f => '- `' + f.name + '` `' + f.type + '`' + (f.doc ? ' — ' + f.doc : '')).join('\n');
              }
            }

            return { range: hoverRange, contents: [{ value: content }] };
          }

          return null;
        } catch (e) {
          console.error('[CodeEditor] local hover error:', e);
          return null;
        }
      },
    });

    return () => {
      localProvider.dispose();
      localHoverProvider.dispose();
    };
  }, [isMounted]);

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
          <button
            ref={helpBtnRef}
            onClick={() => setShowHelp(!showHelp)}
            style={{
              background: showHelp ? 'rgba(0, 173, 216, 0.18)' : 'transparent',
              border: `1px solid ${showHelp ? 'rgba(0, 173, 216, 0.5)' : 'rgba(0, 173, 216, 0.35)'}`,
              borderRadius: '5px',
              color: 'var(--go-cyan)',
              cursor: 'pointer',
              padding: '1px 7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.02em',
            }}
            title="Возможности редактора"
          >
            IDE <HelpCircle size={11} style={{ marginLeft: '2px' }} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {language === 'go' && (
            <button
              onClick={handleFormat}
              disabled={isFormatting}
              style={{
                background: 'rgba(0, 173, 216, 0.1)',
                border: '1px solid rgba(0, 173, 216, 0.3)',
                borderRadius: '6px',
                color: 'var(--go-cyan)',
                cursor: isFormatting ? 'not-allowed' : 'pointer',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Форматировать (gofmt)"
            >
              <AlignLeft size={12} />
              Формат
            </button>
          )}
          {defaultValue && (
            <button
              onClick={handleReset}
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                color: 'var(--go-amber)',
                cursor: 'pointer',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: 600,
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
          <div style={{ width: '1px', height: '16px', background: 'var(--go-code-border)', opacity: 0.6 }} />
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: '1px solid var(--go-code-border)',
              borderRadius: '6px',
              color: copied ? 'var(--go-green)' : 'var(--go-code-muted)',
              cursor: 'pointer',
              padding: '3px 10px',
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
            fixedOverflowWidgets: true,
            wordBasedSuggestions: 'off',
            suggest: {
              showWords: false,
              filterGraceful: false,
            },
          }}
        />
      </div>

      {showHelp && (
        <>
          <div onClick={() => setShowHelp(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div
            style={(() => {
              const TOOLTIP_WIDTH = 320;
              const MARGIN = 8;
              const rect = helpBtnRef.current?.getBoundingClientRect();
              if (!rect) return { position: 'fixed' as const, top: 0, left: 0 };

              const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
              const spaceAbove = rect.top - MARGIN;
              const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow;

              const maxH = Math.min(
                openUpward ? spaceAbove : spaceBelow,
                window.innerHeight - 80
              );

              const left = Math.min(rect.left, window.innerWidth - TOOLTIP_WIDTH - MARGIN);

              return {
                position: 'fixed' as const,
                ...(openUpward
                  ? { bottom: window.innerHeight - rect.top + MARGIN }
                  : { top: rect.bottom + MARGIN }),
                left: Math.max(MARGIN, left),
                width: `${TOOLTIP_WIDTH}px`,
                maxHeight: `${maxH}px`,
                overflowY: 'auto' as const,
                background: 'var(--go-surface)',
                border: '1px solid var(--go-border)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                zIndex: 1000,
                padding: '14px 16px 20px',
                fontSize: '12px',
                lineHeight: '1.6',
                color: 'var(--go-text-secondary)',
              };
            })()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--go-text)' }}>Возможности редактора</span>
              <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', color: 'var(--go-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              <div style={{ background: 'var(--go-surface-2)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--go-text)', marginBottom: '8px', fontSize: '12px' }}>⌨️ Автодополнение</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    { kbd: 'Ctrl+Space', desc: 'открыть список подсказок в любом месте' },
                    { kbd: 'fmt.', desc: 'все функции и типы пакета' },
                    { kbd: 's.', desc: 'поля структуры через точку' },
                    { kbd: 'MyStruct{}', desc: 'имена полей при инициализации' },
                  ].map(({ kbd, desc }) => (
                    <div key={kbd} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: '8px' }}>
                      <code style={{ background: 'var(--go-border)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--go-cyan)', whiteSpace: 'nowrap', display: 'block' }}>{kbd}</code>
                      <span style={{ fontSize: '11px', color: 'var(--go-muted)' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--go-surface-2)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--go-text)', marginBottom: '8px', fontSize: '12px' }}>📦 Контекст кода</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    { kbd: 'func f(x T)', desc: 'параметр x виден внутри функции' },
                    { kbd: 'x := ...', desc: 'переменная доступна после объявления' },
                    { kbd: 'func (s *S)', desc: 'receiver s доступен в методе' },
                    { kbd: 'type / func', desc: 'типы и функции видны глобально' },
                  ].map(({ kbd, desc }) => (
                    <div key={kbd} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: '8px' }}>
                      <code style={{ background: 'var(--go-border)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--go-text-secondary)', whiteSpace: 'nowrap', display: 'block' }}>{kbd}</code>
                      <span style={{ fontSize: '11px', color: 'var(--go-muted)' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--go-surface-2)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--go-text)', marginBottom: '8px', fontSize: '12px' }}>✂️ Сниппеты</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    ['iferr', 'if err != nil { return err }'],
                    ['fori', 'for i := 0; i < n; i++ { }'],
                    ['forr', 'for _, v := range slice { }'],
                    ['ifelse', 'if cond { } else { }'],
                    ['gofunc', 'go func() { }()'],
                    ['deferfunc', 'defer func() { }()'],
                    ['switchcase', 'switch expr { case val: }'],
                  ].map(([kw, desc]) => (
                    <div key={kw} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: '8px' }}>
                      <code style={{ background: 'var(--go-border)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--go-amber)', whiteSpace: 'nowrap', display: 'block' }}>{kw}</code>
                      <span style={{ fontSize: '11px', color: 'var(--go-muted)' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--go-surface-2)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--go-text)', marginBottom: '4px', fontSize: '12px' }}>🔍 Hover-документация</div>
                <div style={{ fontSize: '11px', color: 'var(--go-muted)' }}>
                  Наведите курсор на символ — появится тип, сигнатура и описание из документации пакета
                </div>
              </div>

              {completions && completions.length > 0 && (
                <div style={{ background: 'var(--go-surface-2)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--go-text)', marginBottom: '8px', fontSize: '12px' }}>📚 Доступные пакеты</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {completions.map((pkg) => {
                      const short = pkg.name.lastIndexOf('/');
                      const label = short >= 0 ? pkg.name.substring(short + 1) : pkg.name;
                      return (
                        <code key={pkg.name} style={{
                          background: 'rgba(0,173,216,0.1)',
                          border: '1px solid rgba(0,173,216,0.25)',
                          borderRadius: '4px',
                          padding: '2px 7px',
                          fontSize: '10px',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--go-cyan)',
                          whiteSpace: 'nowrap',
                        }}>
                          {label}
                        </code>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
