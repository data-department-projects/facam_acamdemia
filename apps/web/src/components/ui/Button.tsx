/**
 * Composant Button réutilisable — charte FACAM (bleu, jaune accent).
 * Variantes : primary (bleu), accent (jaune), outline, ghost.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-facam-blue text-facam-white hover:bg-facam-dark focus-visible:ring-facam-blue shadow-facam',
        accent:
          'bg-facam-yellow text-facam-dark hover:brightness-105 focus-visible:ring-facam-yellow',
        secondary:
          'bg-[var(--facam-blue-tint)] text-facam-blue hover:bg-facam-blue hover:text-facam-white focus-visible:ring-facam-blue',
        outline:
          'border-2 border-facam-blue bg-transparent text-facam-blue hover:bg-facam-blue hover:text-facam-white focus-visible:ring-facam-blue',
        ghost: 'text-facam-blue hover:bg-facam-blue-tint focus-visible:ring-facam-blue',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
