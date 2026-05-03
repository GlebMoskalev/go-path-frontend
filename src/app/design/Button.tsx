import { forwardRef } from 'react';
import { cn } from '../components/ui/utils';

type Variant = 'primary' | 'accent' | 'ghost' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

const sizeClass: Record<Size, string> = {
  sm: 'gp-btn-sm',
  md: '',
  lg: 'gp-btn-lg',
};

const variantClass: Record<Variant, string> = {
  primary: 'gp-btn-primary',
  accent: 'gp-btn-accent',
  ghost: 'gp-btn-ghost',
  subtle: 'gp-btn gp-btn-ghost border-transparent hover:bg-[var(--gp-surface-muted)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', iconLeft, iconRight, loading, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn('gp-btn', variantClass[variant], sizeClass[size], className)}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block w-3.5 h-3.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin"
        />
      ) : (
        iconLeft
      )}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
});
