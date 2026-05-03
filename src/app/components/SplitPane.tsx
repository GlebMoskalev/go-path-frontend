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
        width: '1px',
        cursor: 'col-resize',
        background: 'var(--gp-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        transition: 'background 0.15s ease',
      }
    : {
        height: '1px',
        cursor: 'row-resize',
        background: 'var(--gp-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        transition: 'background 0.15s ease',
      };

  // Generous hit area centered on the visible 1px line
  const gutterHoverIndicator: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        top: 0,
        left: '-5px',
        bottom: 0,
        width: '11px',
      }
    : {
        position: 'absolute',
        left: 0,
        top: '-5px',
        right: 0,
        height: '11px',
      };

  // The visible "grip" pill that shows on hover
  const gripStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '3px',
        height: '28px',
        borderRadius: '2px',
        background: 'var(--gp-ink-4)',
        opacity: 0,
        transition: 'opacity 0.15s ease',
        pointerEvents: 'none',
      }
    : {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        height: '3px',
        width: '28px',
        borderRadius: '2px',
        background: 'var(--gp-ink-4)',
        opacity: 0,
        transition: 'opacity 0.15s ease',
        pointerEvents: 'none',
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
          e.currentTarget.style.background = 'var(--gp-border-strong)';
          const grip = e.currentTarget.querySelector('[data-grip]') as HTMLElement | null;
          if (grip) grip.style.opacity = '0.6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--gp-border)';
          const grip = e.currentTarget.querySelector('[data-grip]') as HTMLElement | null;
          if (grip) grip.style.opacity = '0';
        }}
      >
        <div style={gutterHoverIndicator} />
        <div data-grip style={gripStyle} />
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
