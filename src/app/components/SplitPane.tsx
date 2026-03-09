import { useRef, useCallback, useState, useEffect } from 'react';

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  children: [React.ReactNode, React.ReactNode];
  style?: React.CSSProperties;
  className?: string;
}

export function SplitPane({
  direction,
  defaultSize = 50,
  minSize = 15,
  maxSize = 85,
  children,
  style,
  className,
}: SplitPaneProps) {
  const [size, setSize] = useState(defaultSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const isHorizontal = direction === 'horizontal';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [isHorizontal]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct: number;
      if (isHorizontal) {
        pct = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        pct = ((e.clientY - rect.top) / rect.height) * 100;
      }
      setSize(Math.min(maxSize, Math.max(minSize, pct)));
    };

    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isHorizontal, minSize, maxSize]);

  const gutterStyle: React.CSSProperties = isHorizontal
    ? {
        width: '5px',
        cursor: 'col-resize',
        background: 'var(--go-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        transition: 'background 0.15s',
      }
    : {
        height: '5px',
        cursor: 'row-resize',
        background: 'var(--go-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        transition: 'background 0.15s',
      };

  const gutterHoverIndicator: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '3px',
        height: '32px',
        borderRadius: '2px',
        background: 'var(--go-subtle)',
        opacity: 0.5,
      }
    : {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        height: '3px',
        width: '32px',
        borderRadius: '2px',
        background: 'var(--go-subtle)',
        opacity: 0.5,
      };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `${size}%`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {children[0]}
      </div>

      <div
        onMouseDown={handleMouseDown}
        style={gutterStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--go-cyan)';
          const dot = e.currentTarget.firstElementChild as HTMLElement;
          if (dot) dot.style.opacity = '0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--go-border)';
          const dot = e.currentTarget.firstElementChild as HTMLElement;
          if (dot) dot.style.opacity = '0.5';
        }}
      >
        <div style={gutterHoverIndicator} />
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {children[1]}
      </div>
    </div>
  );
}
