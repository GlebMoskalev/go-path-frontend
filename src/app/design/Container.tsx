import { cn } from '../components/ui/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof React.JSX.IntrinsicElements;
}

export function Container({ className, as: Tag = 'div', ...rest }: ContainerProps) {
  const Component = Tag as React.ElementType;
  return <Component className={cn('gp-container', className)} {...rest} />;
}

export function NarrowContainer({ className, as: Tag = 'div', ...rest }: ContainerProps) {
  const Component = Tag as React.ElementType;
  return <Component className={cn('gp-container-narrow', className)} {...rest} />;
}
