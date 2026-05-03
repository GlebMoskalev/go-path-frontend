import { forwardRef } from 'react';
import { cn } from '../components/ui/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive, as: Tag = 'div', ...rest },
  ref,
) {
  const Component = Tag as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cn('gp-card', interactive && 'gp-card-interactive', className)}
      {...rest}
    />
  );
});
