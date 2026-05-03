import { cn } from '../components/ui/utils';

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  marker?: boolean;
}

export function Eyebrow({ marker = true, className, children, ...rest }: EyebrowProps) {
  return (
    <span className={cn('gp-eyebrow inline-flex items-center gap-2', className)} {...rest}>
      {marker && (
        <span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--gp-accent)' }}
        />
      )}
      {children}
    </span>
  );
}
